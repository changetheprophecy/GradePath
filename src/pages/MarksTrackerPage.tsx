import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useAcademic } from '../context/AcademicContext';
import {
  getCourseInternalSummary,
  getCourseOriginalGrade,
  hasFinalGrade,
  isCourseFullyMarked,
} from '../utils/calculations';
import { AssessmentComponent, Course } from '../types/academic';
import { CourseModal } from '../components/CourseModal';

type MarksFilter = 'all' | 'missing' | 'complete' | 'risk';

interface FocusedInput {
  courseId: string;
  compId: string;
  value: string;
  error?: string;
}

export function MarksTrackerPage() {
  const {
    semesters,
    courses,
    gradeScale,
    rules,
    addCourse,
    updateCourse,
  } = useAcademic();

  const sortedSemesters = useMemo(
    () => [...semesters].sort((a, b) => b.number - a.number),
    [semesters]
  );

  const [semesterFilter, setSemesterFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<MarksFilter>('all');
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [focusedInput, setFocusedInput] = useState<FocusedInput | null>(null);

  const enriched = useMemo(() => {
    return courses
      .map((course) => {
        const sem = semesters.find((s) => s.id === course.semesterId);
        const { totalMarks, maxMarks, percentage, letter, point } = getCourseOriginalGrade(
          course,
          gradeScale
        );
        const internal = getCourseInternalSummary(course);
        const comps = course.assessments ?? [];
        const enteredCount = comps.filter((a) => a.obtainedMarks !== null).length;
        const totalCompCount = comps.length;

        const lowInternal =
          internal.max > 0 &&
          internal.hasAnyEntered &&
          (internal.percentage ?? 0) < rules.minInternalPercent;
        const formMissing = !course.examFormSubmitted;
        const isComplete = isCourseFullyMarked(course);
        const isRisk = lowInternal || formMissing || point === 0;

        let statusLabel = 'Pending Marks';
        if (isRisk) {
          statusLabel = lowInternal
            ? `Low Internal (${Math.round(internal.percentage ?? 0)}% < ${rules.minInternalPercent}%)`
            : formMissing
              ? 'Form Missing'
              : 'Failed (Retake)';
        } else if (isComplete) {
          statusLabel = 'Complete';
        } else if (!hasFinalGrade(course) && enteredCount === totalCompCount - 1) {
          statusLabel = 'Pending Final';
        }

        return {
          course,
          sem,
          totalMarks,
          maxMarks,
          percentage,
          letter,
          point,
          enteredCount,
          totalCompCount,
          isComplete,
          isRisk,
          statusLabel,
        };
      })
      .sort((a, b) => (b.sem?.number ?? 0) - (a.sem?.number ?? 0));
  }, [courses, semesters, gradeScale, rules]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enriched.filter((item) => {
      if (semesterFilter !== 'all' && item.course.semesterId !== semesterFilter) {
        return false;
      }
      if (statusFilter === 'missing' && item.isComplete) return false;
      if (statusFilter === 'complete' && !item.isComplete) return false;
      if (statusFilter === 'risk' && !item.isRisk) return false;
      if (
        q &&
        !item.course.code.toLowerCase().includes(q) &&
        !item.course.name.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [enriched, semesterFilter, statusFilter, query]);

  const summary = useMemo(() => {
    const missing = enriched.filter((e) => !e.isComplete).length;
    const complete = enriched.filter((e) => e.isComplete).length;
    const risk = enriched.filter((e) => e.isRisk).length;
    return { total: enriched.length, missing, complete, risk };
  }, [enriched]);

  const handleMarkChange = (
    course: Course,
    comp: AssessmentComponent,
    raw: string
  ) => {
    if (raw.trim() === '') {
      setFocusedInput({ courseId: course.id, compId: comp.id, value: raw });
      const nextAssessments = course.assessments.map((a) =>
        a.id === comp.id ? { ...a, obtainedMarks: null } : a
      );
      updateCourse(course.id, { assessments: nextAssessments, totalMarksOverride: null }, undefined, {
        silentActivity: true,
      });
      return;
    }

    const num = Number(raw);
    if (Number.isNaN(num)) {
      setFocusedInput({ courseId: course.id, compId: comp.id, value: raw });
      return;
    }

    if (num < 0 || num > comp.maxMarks) {
      setFocusedInput({
        courseId: course.id,
        compId: comp.id,
        value: raw,
        error: `Max for ${comp.name} is ${comp.maxMarks}`,
      });
      return;
    }

    setFocusedInput({ courseId: course.id, compId: comp.id, value: raw });
    const rounded = Math.round(num * 100) / 100;
    const nextAssessments = course.assessments.map((a) =>
      a.id === comp.id ? { ...a, obtainedMarks: rounded } : a
    );
    updateCourse(course.id, { assessments: nextAssessments, totalMarksOverride: null });
  };

  const getInputValue = (course: Course, comp: AssessmentComponent) => {
    if (focusedInput && focusedInput.courseId === course.id && focusedInput.compId === comp.id) {
      return focusedInput.value;
    }
    return comp.obtainedMarks !== null ? String(comp.obtainedMarks) : '';
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[22px] border-2 border-[#29232D] bg-white p-5 sm:p-6 shadow-[4px_4px_0_#29232D] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#29232D]">
            Marks Tracker
          </h2>
          <p className="mt-1 text-sm font-medium text-[#29232D]/75">
            Enter marks across each course&apos;s configured assessment components and track percentages, grades, and missing scores.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingCourse(null);
            setModalOpen(true);
          }}
          disabled={semesters.length === 0}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-[#29232D] bg-[#7955A1] px-4 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_#29232D] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#29232D] disabled:opacity-50 transition-all whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Course
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-[20px] border-2 border-[#29232D] bg-white p-4 shadow-[3px_3px_0_#29232D]">
          <p className="text-xs font-extrabold uppercase tracking-wide text-[#29232D]/70">
            Tracked Courses
          </p>
          <p className="mt-1 font-display text-3xl font-extrabold text-[#29232D] tabular-nums">
            {summary.total}
          </p>
        </div>
        <div className="rounded-[20px] border-2 border-[#29232D] bg-[#DDF3E0] p-4 shadow-[3px_3px_0_#29232D]">
          <p className="text-xs font-extrabold uppercase tracking-wide text-[#29232D]/70">
            Complete Records
          </p>
          <p className="mt-1 font-display text-3xl font-extrabold text-[#29232D] tabular-nums">
            {summary.complete}
          </p>
        </div>
        <div className="rounded-[20px] border-2 border-[#29232D] bg-[#E5D8F3] p-4 shadow-[3px_3px_0_#29232D]">
          <p className="text-xs font-extrabold uppercase tracking-wide text-[#29232D]/70">
            Missing Marks
          </p>
          <p className="mt-1 font-display text-3xl font-extrabold text-[#29232D] tabular-nums">
            {summary.missing}
          </p>
        </div>
        <div className="rounded-[20px] border-2 border-[#29232D] bg-[#F8D0CC] p-4 shadow-[3px_3px_0_#29232D]">
          <p className="text-xs font-extrabold uppercase tracking-wide text-[#29232D]/70">
            Retake / Alerts
          </p>
          <p className="mt-1 font-display text-3xl font-extrabold text-[#29232D] tabular-nums">
            {summary.risk}
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1.5 rounded-2xl border-2 border-[#29232D] bg-white p-1.5 self-start">
          {(
            [
              { id: 'all', label: 'All Courses' },
              { id: 'missing', label: 'Missing Marks' },
              { id: 'risk', label: 'Alerts & Retakes' },
              { id: 'complete', label: 'Complete' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-[#F6D36B] text-[#29232D] border-2 border-[#29232D]'
                  : 'text-[#29232D]/75 hover:text-[#29232D] border-2 border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-60">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#29232D]/60" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter course code or name..."
              className="w-full rounded-xl border-2 border-[#29232D] bg-white pl-8 pr-3 py-2 text-xs font-bold text-[#29232D] focus:outline-none focus:ring-2 focus:ring-[#7955A1]/30"
            />
          </div>

          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            aria-label="Filter by semester"
            className="rounded-xl border-2 border-[#29232D] bg-white px-3 py-2 text-xs font-bold text-[#29232D] focus:outline-none"
          >
            <option value="all">All Semesters</option>
            {sortedSemesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic Editable Marks Table */}
      <div className="rounded-[22px] border-2 border-[#29232D] bg-white overflow-hidden shadow-[4px_4px_0_#29232D]">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-bold text-[#29232D]">No courses match your filters</p>
            <p className="mt-1 text-xs font-medium text-[#29232D]/70">
              Try clearing your search or switching the semester filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#29232D] bg-[#F5F3F2] text-[11px] font-extrabold uppercase tracking-wide text-[#29232D]">
                  <th className="py-3.5 px-4">Course</th>
                  <th className="py-3.5 px-3">Assessment Components (Obtained / Max)</th>
                  <th className="py-3.5 px-3 text-right whitespace-nowrap">Total</th>
                  <th className="py-3.5 px-3 text-right whitespace-nowrap">Grade / GP</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Completion &amp; Status</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#29232D]/10 text-xs">
                {filtered.map(
                  ({
                    course,
                    sem,
                    totalMarks,
                    maxMarks,
                    percentage,
                    letter,
                    point,
                    enteredCount,
                    totalCompCount,
                    isComplete,
                    isRisk,
                    statusLabel,
                  }) => {
                    const rowError =
                      focusedInput && focusedInput.courseId === course.id
                        ? focusedInput.error
                        : undefined;
                    const progressPct =
                      totalCompCount > 0 ? (enteredCount / totalCompCount) * 100 : 0;

                    return (
                      <tr key={course.id} className="hover:bg-[#FCE2DE]/30 align-top">
                        <td className="py-3.5 px-4 min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-[#7955A1]">
                              {course.code}
                            </span>
                            <span className="text-[#29232D]/30">·</span>
                            <span className="font-semibold text-[#29232D]/70">{sem?.name}</span>
                          </div>
                          <p className="mt-0.5 text-sm font-bold text-[#29232D]">
                            {course.name}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCourse(course);
                              setModalOpen(true);
                            }}
                            className="mt-2 inline-flex items-center gap-1 rounded-lg border border-[#29232D]/40 bg-white px-2 py-0.5 text-[11px] font-bold text-[#7955A1] hover:border-[#29232D] hover:bg-[#E5D8F3]"
                          >
                            <SlidersHorizontal className="h-3 w-3" />
                            Configure Assessments
                          </button>
                        </td>

                        <td className="py-3 px-3 min-w-[360px]">
                          <div className="flex flex-wrap items-center gap-2">
                            {course.assessments.map((comp) => {
                              const hasErr =
                                focusedInput?.courseId === course.id &&
                                focusedInput?.compId === comp.id &&
                                Boolean(focusedInput.error);
                              return (
                                <label
                                  key={comp.id}
                                  className={`inline-flex items-center gap-1.5 rounded-xl border-2 px-2.5 py-1.5 transition-colors ${
                                    hasErr
                                      ? 'border-[#B91C1C] bg-[#FEE2E2]'
                                      : 'border-[#29232D]/30 bg-white focus-within:border-[#29232D]'
                                  }`}
                                >
                                  <span className="text-[11px] font-extrabold text-[#29232D] whitespace-nowrap">
                                    {comp.name}
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    max={comp.maxMarks}
                                    step="0.5"
                                    value={getInputValue(course, comp)}
                                    placeholder="—"
                                    onFocus={() =>
                                      setFocusedInput({
                                        courseId: course.id,
                                        compId: comp.id,
                                        value:
                                          comp.obtainedMarks !== null
                                            ? String(comp.obtainedMarks)
                                            : '',
                                      })
                                    }
                                    onChange={(e) =>
                                      handleMarkChange(course, comp, e.target.value)
                                    }
                                    onBlur={() => setFocusedInput(null)}
                                    aria-label={`${course.code} ${comp.name}`}
                                    className="w-12 rounded-md border border-[#29232D]/25 bg-[#F5F3F2] px-1.5 py-0.5 text-right font-mono font-extrabold tabular-nums text-[#29232D] focus:bg-white focus:outline-none"
                                  />
                                  <span className="font-mono text-[11px] font-bold text-[#29232D]/55">
                                    /{comp.maxMarks}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                          {rowError && (
                            <p className="mt-1.5 text-[11px] font-extrabold text-[#B91C1C]">
                              {rowError}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                          <div className="font-extrabold text-[#29232D]">
                            {totalMarks !== null ? `${totalMarks}/${maxMarks}` : `—/${maxMarks}`}
                          </div>
                          {percentage !== null && (
                            <div className="text-[11px] font-bold text-[#7955A1] mt-0.5">
                              {percentage.toFixed(1)}%
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                          {letter && point !== null ? (
                            <span className="font-extrabold text-[#29232D]">
                              {letter} ({point.toFixed(2)})
                            </span>
                          ) : (
                            <span className="text-[#29232D]/50 font-semibold">Pending</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 min-w-[190px]">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="inline-flex items-center gap-1 font-bold text-[#29232D]">
                              {isRisk ? (
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#B45309]" />
                              ) : isComplete ? (
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#15803D]" />
                              ) : (
                                <Clock className="h-3.5 w-3.5 shrink-0 text-[#7955A1]" />
                              )}
                              {statusLabel}
                            </span>
                            <span className="font-mono text-[11px] font-bold text-[#29232D]/60 tabular-nums">
                              {enteredCount}/{totalCompCount}
                            </span>
                          </div>
                          <div className="h-2.5 w-full rounded-full border border-[#29232D] bg-[#F5F3F2] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isRisk
                                  ? 'bg-[#F29A9C]'
                                  : isComplete
                                    ? 'bg-[#A7D9AE]'
                                    : 'bg-[#F6D36B]'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CourseModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCourse(null);
        }}
        semesters={semesters}
        defaultSemesterId={sortedSemesters[0]?.id ?? ''}
        initial={editingCourse}
        onSave={(payload) => {
          if (editingCourse) {
            updateCourse(editingCourse.id, payload);
          } else {
            addCourse(payload);
          }
        }}
      />
    </div>
  );
}
