import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  BookOpen,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileText,
  FolderOpen,
  Link2,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useAcademic } from '../context/AcademicContext';
import { ResourceCategory } from '../types/academic';

const CATEGORIES: ResourceCategory[] = [
  'Lecture Notes',
  'PDF Files',
  'Course Materials',
  'Past Exam Questions',
  'Reference Links',
];

const CATEGORY_TINTS: Record<ResourceCategory, string> = {
  'Lecture Notes': 'bg-[#FCE2DE]',
  'PDF Files': 'bg-[#FFF4D6]',
  'Course Materials': 'bg-[#E5D8F3]',
  'Past Exam Questions': 'bg-[#DDF3E0]',
  'Reference Links': 'bg-[#DCEFF8]',
};

const CATEGORY_RING_COLORS: Record<ResourceCategory, string> = {
  'Lecture Notes': '#F29A9C',
  'PDF Files': '#E5B324',
  'Course Materials': '#7955A1',
  'Past Exam Questions': '#4CAF72',
  'Reference Links': '#569EC9',
};

function CircularProgressRing({
  percentage,
  color,
  size = 64,
  strokeWidth = 7,
}: {
  percentage: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="#FFFFFF"
          stroke="#E8E4E1"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius + strokeWidth / 2}
          fill="transparent"
          stroke="#29232D"
          strokeWidth={1.5}
        />
      </svg>
      <span className="absolute font-display text-xs font-extrabold text-[#29232D] tabular-nums">
        {clamped}%
      </span>
    </div>
  );
}

export function StudyLibraryPage() {
  const {
    resources,
    courses,
    addResource,
    toggleBookmark,
    toggleResourceCompleted,
    markResourceReviewed,
    deleteResource,
  } = useAcademic();

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ResourceCategory>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState(courses[0]?.code ?? '');
  const [category, setCategory] = useState<ResourceCategory>('Lecture Notes');
  const [url, setUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const availableCourseCodes = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => set.add(c.code));
    resources.forEach((r) => {
      if (r.courseCode) set.add(r.courseCode);
    });
    return Array.from(set).sort();
  }, [courses, resources]);

  const scopedByCourseResources = useMemo(() => {
    if (courseFilter === 'all') return resources;
    return resources.filter((res) => res.courseCode === courseFilter);
  }, [resources, courseFilter]);

  const categoryProgress = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const items = scopedByCourseResources.filter((r) => r.category === cat);
      const completedCount = items.filter((r) => Boolean(r.completed)).length;
      const totalCount = items.length;
      const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
      return {
        category: cat,
        completedCount,
        totalCount,
        percentage,
      };
    });
  }, [scopedByCourseResources]);

  const overallStats = useMemo(() => {
    const total = scopedByCourseResources.length;
    const completed = scopedByCourseResources.filter((r) => Boolean(r.completed)).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }, [scopedByCourseResources]);

  const filteredResources = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((res) => {
      if (categoryFilter !== 'all' && res.category !== categoryFilter) return false;
      if (courseFilter !== 'all' && res.courseCode !== courseFilter) return false;
      if (bookmarksOnly && !res.bookmarked) return false;
      if (reviewFilter === 'pending' && res.completed) return false;
      if (reviewFilter === 'completed' && !res.completed) return false;
      if (
        q &&
        !res.title.toLowerCase().includes(q) &&
        !res.courseCode.toLowerCase().includes(q) &&
        !(res.notes ?? '').toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [resources, query, categoryFilter, courseFilter, bookmarksOnly, reviewFilter]);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const kb = file.size / 1024;
    setFileSize(kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} KB`);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' '));
    }
  };

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Please provide a resource title.');
      return;
    }
    if (category === 'Reference Links' && !url.trim()) {
      setFormError('Please provide a reference URL.');
      return;
    }
    addResource({
      title: title.trim(),
      courseCode: courseCode.trim().toUpperCase() || 'GENERAL',
      category,
      url: url.trim() || undefined,
      fileName: fileName.trim() || undefined,
      fileSize: fileSize.trim() || undefined,
      notes: notes.trim() || undefined,
      bookmarked: false,
      completed: false,
    });
    setTitle('');
    setUrl('');
    setFileName('');
    setFileSize('');
    setNotes('');
    setFormError('');
    setUploadModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[22px] border-2 border-[#29232D] bg-white p-5 sm:p-6 shadow-[4px_4px_0_#29232D] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#29232D]">
              Study Library
            </h2>
            <span className="rounded-lg border-2 border-[#29232D] bg-[#DDF3E0] px-2.5 py-0.5 text-xs font-extrabold text-[#29232D] tabular-nums">
              {overallStats.completed}/{overallStats.total} reviewed ({overallStats.percentage}%)
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-[#29232D]/75">
            Organize lecture notes, PDFs, past exam papers, and track reviewed topics across every category.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setUploadModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-[#29232D] bg-[#7955A1] px-4 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_#29232D] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#29232D] transition-all whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Resource
        </button>
      </div>

      {/* Category Progress Rings */}
      <section aria-label="Category Review Progress" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {categoryProgress.map(({ category: cat, completedCount, totalCount, percentage }) => {
          const isSelected = categoryFilter === cat;
          const tint = CATEGORY_TINTS[cat];
          const ringColor = CATEGORY_RING_COLORS[cat];

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter((prev) => (prev === cat ? 'all' : cat))}
              className={`text-left rounded-[20px] border-2 border-[#29232D] p-4 transition-all flex flex-col items-center text-center ${
                isSelected
                  ? `${tint} shadow-[4px_4px_0_#29232D] -translate-y-0.5`
                  : 'bg-white shadow-[3px_3px_0_#29232D] hover:bg-[#FCE2DE]/40'
              }`}
            >
              <CircularProgressRing percentage={percentage} color={ringColor} />
              <p className="mt-3 font-display text-xs font-extrabold text-[#29232D] leading-snug">
                {cat}
              </p>
              <p className="mt-0.5 text-[11px] font-bold text-[#29232D]/70 tabular-nums">
                {totalCount === 0
                  ? 'No resources yet'
                  : `${completedCount} of ${totalCount} reviewed`}
              </p>
            </button>
          );
        })}
      </section>

      {/* Filters Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#29232D]/60" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes, PDFs, course codes..."
              className="w-full rounded-xl border-2 border-[#29232D] bg-white pl-10 pr-3 py-2 text-sm font-medium text-[#29232D] focus:outline-none focus:ring-2 focus:ring-[#7955A1]/30"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              aria-label="Filter by course"
              className="rounded-xl border-2 border-[#29232D] bg-white px-3 py-2 text-xs font-bold text-[#29232D] focus:outline-none"
            >
              <option value="all">All Courses</option>
              {availableCourseCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>

            <select
              value={reviewFilter}
              onChange={(e) =>
                setReviewFilter(e.target.value as 'all' | 'pending' | 'completed')
              }
              aria-label="Filter by review status"
              className="rounded-xl border-2 border-[#29232D] bg-white px-3 py-2 text-xs font-bold text-[#29232D] focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">To Review</option>
              <option value="completed">Reviewed</option>
            </select>

            <button
              type="button"
              onClick={() => setBookmarksOnly((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-xl border-2 border-[#29232D] px-3 py-2 text-xs font-bold transition-colors whitespace-nowrap ${
                bookmarksOnly
                  ? 'bg-[#F6D36B] text-[#29232D]'
                  : 'bg-white text-[#29232D] hover:bg-[#FCE2DE]'
              }`}
            >
              <Bookmark
                className={`h-3.5 w-3.5 ${bookmarksOnly ? 'fill-[#29232D] text-[#29232D]' : ''}`}
              />
              Bookmarked Only
            </button>
          </div>
        </div>

        {/* Category Segmented Tabs */}
        <div className="inline-flex flex-wrap items-center gap-1.5 rounded-2xl border-2 border-[#29232D] bg-white p-1.5">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
              categoryFilter === 'all'
                ? 'bg-[#F6D36B] text-[#29232D] border-2 border-[#29232D]'
                : 'text-[#29232D]/75 hover:text-[#29232D] border-2 border-transparent'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-[#F6D36B] text-[#29232D] border-2 border-[#29232D]'
                  : 'text-[#29232D]/75 hover:text-[#29232D] border-2 border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resource List */}
      {filteredResources.length === 0 ? (
        <div className="rounded-[22px] border-2 border-[#29232D] bg-white px-6 py-14 text-center shadow-[4px_4px_0_#29232D]">
          <FolderOpen className="mx-auto h-10 w-10 text-[#7955A1]" />
          <h3 className="mt-3 font-display text-lg font-extrabold text-[#29232D]">
            No study resources found
          </h3>
          <p className="mt-1 text-sm font-medium text-[#29232D]/70">
            Upload lecture notes, past papers, or reference links to keep everything organized by course.
          </p>
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border-2 border-[#29232D] bg-[#7955A1] px-4 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_#29232D]"
          >
            <Plus className="h-4 w-4" />
            Add First Resource
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredResources.map((res) => {
            const topTint = CATEGORY_TINTS[res.category] ?? 'bg-[#FCE2DE]';
            return (
              <article
                key={res.id}
                className="rounded-[22px] border-2 border-[#29232D] bg-white overflow-hidden shadow-[4px_4px_0_#29232D] flex flex-col justify-between"
              >
                <div>
                  <div className={`${topTint} px-5 py-3 border-b-2 border-[#29232D] flex items-center justify-between gap-2`}>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded-lg border border-[#29232D] bg-white px-2 py-0.5 font-mono font-extrabold text-[#7955A1]">
                        {res.courseCode}
                      </span>
                      <span className="font-bold text-[#29232D]">{res.category}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleBookmark(res.id)}
                        className="rounded-lg p-1.5 text-[#29232D] hover:bg-white/70 transition-colors"
                        aria-label={res.bookmarked ? 'Remove bookmark' : 'Bookmark resource'}
                      >
                        <Bookmark
                          className={`h-4 w-4 ${
                            res.bookmarked ? 'fill-[#7955A1] text-[#7955A1]' : ''
                          }`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteResource(res.id)}
                        className="rounded-lg p-1.5 text-[#29232D]/70 hover:bg-white/70 hover:text-[#991B1B] transition-colors"
                        aria-label={`Delete ${res.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-base font-extrabold text-[#29232D] leading-snug">
                        {res.title}
                      </h3>
                    </div>

                    {res.notes && (
                      <p className="mt-2 text-xs font-medium text-[#29232D]/75 leading-relaxed">
                        {res.notes}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => toggleResourceCompleted(res.id)}
                        className={`inline-flex items-center gap-1.5 rounded-xl border-2 border-[#29232D] px-3 py-1.5 text-xs font-bold transition-colors ${
                          res.completed
                            ? 'bg-[#A7D9AE] text-[#29232D]'
                            : 'bg-white text-[#29232D] hover:bg-[#FFF4D6]'
                        }`}
                      >
                        {res.completed ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#29232D]" />
                            Reviewed
                          </>
                        ) : (
                          <>
                            <Circle className="h-3.5 w-3.5 text-[#7955A1]" />
                            Mark Reviewed
                          </>
                        )}
                      </button>

                      {res.completed && res.reviewedAt && (
                        <span className="text-[11px] font-semibold text-[#29232D]/60 tabular-nums">
                          Reviewed {res.reviewedAt}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3.5 border-t-2 border-[#29232D]/10 bg-[#F5F3F2] flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-[#29232D]/80 min-w-0 font-semibold">
                    {res.url ? (
                      <>
                        <Link2 className="h-3.5 w-3.5 shrink-0 text-[#7955A1]" />
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => markResourceReviewed(res.id)}
                          className="inline-flex items-center gap-1 font-bold text-[#7955A1] hover:underline truncate"
                        >
                          Open reference
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </>
                    ) : res.fileName ? (
                      <>
                        <FileText className="h-3.5 w-3.5 shrink-0 text-[#7955A1]" />
                        <button
                          type="button"
                          onClick={() => markResourceReviewed(res.id)}
                          className="truncate font-mono text-[11px] font-bold hover:text-[#7955A1] text-left"
                          title="Click to mark as reviewed"
                        >
                          {res.fileName}
                        </button>
                        {res.fileSize && (
                          <span className="text-[#29232D]/60 shrink-0">({res.fileSize})</span>
                        )}
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-3.5 w-3.5 shrink-0 text-[#7955A1]" />
                        <span>Study note</span>
                      </>
                    )}
                  </div>
                  <span className="font-mono text-[11px] font-bold text-[#29232D]/60 shrink-0 tabular-nums">
                    {res.createdAt}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Upload / Add Resource Modal */}
      {uploadModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#29232D]/50 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resource-modal-title"
        >
          <div className="w-full max-w-lg rounded-[22px] border-2 border-[#29232D] bg-white p-6 shadow-[6px_6px_0_#29232D]">
            <div className="flex items-center justify-between border-b-2 border-[#29232D]/15 pb-4">
              <h3 id="resource-modal-title" className="font-display text-lg font-extrabold text-[#29232D]">
                Add Study Resource
              </h3>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="rounded-xl border-2 border-[#29232D] bg-[#FCE2DE] p-1.5 text-[#29232D] hover:bg-[#F8D0CC]"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="mt-5 space-y-4">
              {formError && (
                <div className="rounded-xl border-2 border-[#29232D] bg-[#F8D0CC] px-3 py-2 text-xs font-bold text-[#29232D]">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#29232D] mb-1.5">
                  Resource Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Dynamic Programming Lecture Slides"
                  className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm font-medium text-[#29232D] focus:outline-none focus:ring-2 focus:ring-[#7955A1]/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#29232D] mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ResourceCategory)}
                    className="w-full rounded-xl border-2 border-[#29232D] bg-white px-3 py-2 text-sm font-bold text-[#29232D] focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#29232D] mb-1.5">
                    Course Code
                  </label>
                  <input
                    type="text"
                    list="library-course-codes"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    placeholder="CSE 3201"
                    className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm font-mono font-bold uppercase text-[#29232D] focus:outline-none"
                  />
                  <datalist id="library-course-codes">
                    {availableCourseCodes.map((code) => (
                      <option key={code} value={code} />
                    ))}
                  </datalist>
                </div>
              </div>

              {category === 'Reference Links' ? (
                <div>
                  <label className="block text-xs font-bold text-[#29232D] mb-1.5">
                    Reference URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm text-[#29232D] focus:outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-[#29232D] mb-1.5">
                    Upload File (PDF, Notes, Slides)
                  </label>
                  <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#29232D] bg-[#FCE2DE]/50 px-4 py-4 text-xs font-bold text-[#29232D] hover:bg-[#FCE2DE] cursor-pointer transition-colors">
                    <Upload className="h-4 w-4 text-[#7955A1]" />
                    <span>
                      {fileName
                        ? `${fileName} (${fileSize})`
                        : 'Choose a file from your device'}
                    </span>
                    <input
                      type="file"
                      onChange={handleFilePick}
                      className="sr-only"
                    />
                  </label>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#29232D] mb-1.5">
                  Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key chapters, topics covered, or exam tips..."
                  className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm text-[#29232D] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t-2 border-[#29232D]/15">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="rounded-xl border-2 border-[#29232D] bg-white px-4 py-2 text-sm font-bold text-[#29232D] hover:bg-[#F5F3F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl border-2 border-[#29232D] bg-[#7955A1] px-4 py-2 text-sm font-bold text-white shadow-[3px_3px_0_#29232D] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#29232D] transition-all"
                >
                  Save Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
