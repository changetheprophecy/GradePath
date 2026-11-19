import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookPlus,
  Check,
  Edit3,
  Plus,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { useAcademic } from '../context/AcademicContext';
import {
  calculateCumulativeCGPA,
  calculateSemesterGPA,
  getCourseMaxTotalMarks,
  getCourseOriginalGrade,
} from '../utils/calculations';
import { AssessmentComponent, Course, SemesterStatus } from '../types/academic';
import { CourseModal } from '../components/CourseModal';
import { SemesterModal } from '../components/SemesterModal';

interface CourseDraft {
  code: string;
  name: string;
  credits: string;
}

interface FocusedMark {
  courseId: string;
  key: string; // component id or '__total__'
  value: string;
}

export function SemesterDetailPage() {
  const {
    semesters,
    courses,
    selectedSemesterId,
    gradeScale,
    rules,
    navigateTo,
    addCourse,
    updateCourse,
    deleteCourse,
    updateSemester,
    deleteSemester,
  } = useAcademic();

  const semester = useMemo(
    () => semesters.find((s) => s.id === selectedSemesterId) ?? semesters[0] ?? null,
    [semesters, selectedSemesterId]
  );

  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editSemModalOpen, setEditSemModalOpen] = useState(false);
  const [confirmDeleteSem, setConfirmDeleteSem] = useState(false);
  const [inlineEditing, setInlineEditing] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, CourseDraft>>({});
  const [focusedMark, setFocusedMark] = useState<FocusedMark | null>(null);

  const semCourses = useMemo(
    () => (semester ? courses.filter((c) => c.semesterId === semester.id) : []),
    [courses, semester]
  );

  useEffect(() => {
    setInlineEditing(false);
    setDrafts({});
    setFocusedMark(null);
    setConfirmDeleteSem(false);
  }, [semester?.id]);

  useEffect(() => {
    if (!inlineEditing) return;
    setDrafts((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const c of semCourses) {
        if (!next[c.id]) {
          next[c.id] = {
            code: c.code,
            name: c.name,
            credits: String(c.credits),
          };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [inlineEditing, semCourses]);

  const semStats = useMemo(
    () => calculateSemesterGPA(semCourses, gradeScale),
    [semCourses, gradeScale]
  );

  const cgpaAfter = useMemo(
    () => calculateCumulativeCGPA(courses, gradeScale, rules),
    [courses, gradeScale, rules]
  );

  if (!semester) {
    return (
      <div className="rounded-[22px] border-2 border-[#29232D] bg-white p-10 text-center shadow-[4px_4px_0_#29232D]">
        <p className="text-sm font-bold text-[#29232D]">Semester not found.</p>
        <button
          type="button"
          onClick={() => navigateTo('semesters')}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-[#29232D] bg-[#7955A1] px-4 py-2 text-sm font-bold text-white shadow-[3px_3px_0_#29232D]"
        >
          Back to Semesters
        </button>
      </div>
    );
  }

  const toggleInlineEditing = () => {
    if (!inlineEditing) {
      const initialDrafts: Record<string, CourseDraft> = {};
      for (const c of semCourses) {
        initialDrafts[c.id] = {
          code: c.code,
          name: c.name,
          credits: String(c.credits),
        };
      }
      setDrafts(initialDrafts);
      setInlineEditing(true);
    } else {
      setInlineEditing(false);
    }
  };

  const handleCodeChange = (course: Course, raw: string) => {
    setDrafts((prev) => ({
      ...prev,
      [course.id]: {
        ...(prev[course.id] ?? { code: course.code, name: course.name, credits: String(course.credits) }),
        code: raw,
      },
    }));
    const cleaned = raw.trim().toUpperCase();
    if (cleaned.length > 0 && cleaned !== course.code) {
      updateCourse(course.id, { code: cleaned }, undefined, { silentActivity: true });
    }
  };

  const handleCodeBlur = (course: Course) => {
    const draft = drafts[course.id];
    if (!draft) return;
    const cleaned = draft.code.trim().toUpperCase();
    setDrafts((prev) => ({
      ...prev,
      [course.id]: { ...draft, code: cleaned || course.code },
    }));
  };

  const handleNameChange = (course: Course, raw: string) => {
    setDrafts((prev) => ({
      ...prev,
      [course.id]: {
        ...(prev[course.id] ?? { code: course.code, name: course.name, credits: String(course.credits) }),
        name: raw,
      },
    }));
    const cleaned = raw.trim();
    if (cleaned.length > 0 && cleaned !== course.name) {
      updateCourse(course.id, { name: cleaned }, undefined, { silentActivity: true });
    }
  };

  const handleNameBlur = (course: Course) => {
    const draft = drafts[course.id];
    if (!draft) return;
    const cleaned = draft.name.trim();
    setDrafts((prev) => ({
      ...prev,
      [course.id]: { ...draft, name: cleaned || course.name },
    }));
  };

  const handleCreditsChange = (course: Course, raw: string) => {
    setDrafts((prev) => ({
      ...prev,
      [course.id]: {
        ...(prev[course.id] ?? { code: course.code, name: course.name, credits: String(course.credits) }),
        credits: raw,
      },
    }));
    const num = Number(raw);
    if (raw.trim() !== '' && !Number.isNaN(num) && num >= 0.5 && num <= 12) {
      updateCourse(course.id, { credits: num }, undefined, { silentActivity: true });
    }
  };

  const handleCreditsBlur = (course: Course) => {
    const draft = drafts[course.id];
    if (!draft) return;
    const num = Number(draft.credits);
    const valid = draft.credits.trim() !== '' && !Number.isNaN(num) && num >= 0.5 && num <= 12;
    setDrafts((prev) => ({
      ...prev,
      [course.id]: {
        ...draft,
        credits: valid ? String(num) : String(course.credits),
      },
    }));
  };

  const handleComponentFocus = (course: Course, comp: AssessmentComponent) => {
    setFocusedMark({
      courseId: course.id,
      key: comp.id,
      value: comp.obtainedMarks !== null ? String(comp.obtainedMarks) : '',
    });
  };

  const handleComponentChange = (
    course: Course,
    comp: AssessmentComponent,
    raw: string
  ) => {
    setFocusedMark({ courseId: course.id, key: comp.id, value: raw });
    if (raw.trim() === '') {
      const nextAssessments = course.assessments.map((a) =>
        a.id === comp.id ? { ...a, obtainedMarks: null } : a
      );
      updateCourse(
        course.id,
        { assessments: nextAssessments, totalMarksOverride: null },
        undefined,
        { silentActivity: true }
      );
      return;
    }
    const val = Number(raw);
    if (Number.isNaN(val)) return;
    const clamped = Math.round(Math.max(0, Math.min(comp.maxMarks, val)) * 100) / 100;
    const nextAssessments = course.assessments.map((a) =>
      a.id === comp.id ? { ...a, obtainedMarks: clamped } : a
    );
    updateCourse(
      course.id,
      { assessments: nextAssessments, totalMarksOverride: null },
      undefined,
      { silentActivity: true }
    );
  };

  const handleTotalFocus = (course: Course, currentTotal: number | null) => {
    setFocusedMark({
      courseId: course.id,
      key: '__total__',
      value: currentTotal !== null ? String(currentTotal) : '',
    });
  };

  const handleTotalChange = (course: Course, raw: string, maxTotal: number) => {
    setFocusedMark({ courseId: course.id, key: '__total__', value: raw });
    if (raw.trim() === '') {
      updateCourse(
        course.id,
        { totalMarksOverride: null },
        undefined,
        { silentActivity: true }
      );
      return;
    }
    const val = Number(raw);
    if (Number.isNaN(val)) return;
    const clamped = Math.round(Math.max(0, Math.min(maxTotal, val)) * 100) / 100;
    updateCourse(
      course.id,
      { totalMarksOverride: clamped },
      undefined,
      { silentActivity: true }
    );
  };

  const handleTotalBlur = (course: Course, maxTotal: number) => {
    if (focusedMark && focusedMark.courseId === course.id && focusedMark.key === '__total__') {
      const raw = focusedMark.value.trim();
      if (raw !== '') {
        const val = Number(raw);
        if (!Number.isNaN(val)) {
          const clamped = Math.round(Math.max(0, Math.min(maxTotal, val)) * 100) / 100;
          const finals = course.assessments.filter((a) => a.kind === 'final');
          const nonFinals = course.assessments.filter((a) => a.kind !== 'final');
          if (finals.length === 1 && nonFinals.every((a) => a.obtainedMarks !== null)) {
            const internalSum = nonFinals.reduce((s, a) => s + (a.obtainedMarks ?? 0), 0);
            const remFinal = Math.round((clamped - internalSum) * 100) / 100;
            if (remFinal >= 0 && remFinal <= finals[0].maxMarks) {
              const nextAssessments = course.assessments.map((a) =>
                a.id === finals[0].id ? { ...a, obtainedMarks: remFinal } : a
              );
              updateCourse(
                course.id,
                { assessments: nextAssessments, totalMarksOverride: null },
                undefined,
                { silentActivity: true }
              );
            }
          }
        }
      }
    }
    setFocusedMark(null);
  };

  const getComponentInputValue = (course: Course, comp: AssessmentComponent) => {
    if (focusedMark && focusedMark.courseId === course.id && focusedMark.key === comp.id) {
      return focusedMark.value;
    }
    return comp.obtainedMarks !== null ? String(comp.obtainedMarks) : '';
  };

  const getTotalInputValue = (course: Course, calculatedTotal: number | null) => {
    if (focusedMark && focusedMark.courseId === course.id && focusedMark.key === '__total__') {
      return focusedMark.value;
    }
    return calculatedTotal !== null ? String(calculatedTotal) : '';
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="rounded-[22px] border-2 border-[#29232D] bg-white p-5 sm:p-6 shadow-[4px_4px_0_#29232D] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigateTo('semesters')}
            className="mt-0.5 rounded-xl border-2 border-[#29232D] bg-[#FCE2DE] p-2 text-[#29232D] hover:bg-[#F8D0CC] transition-colors"
            aria-label="Back to semesters"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#29232D]">
              {semester.name}
            </h2>
            <p className="mt-1 text-xs font-medium text-[#29232D]/70">
              Edit assessment marks directly or click Edit to customize any course&apos;s mark distribution—GPA and CGPA recalculate live.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={semester.status}
            onChange={(e) =>
              updateSemester(semester.id, { status: e.target.value as SemesterStatus })
            }
            aria-label="Semester completion status"
            className="rounded-xl border-2 border-[#29232D] bg-[#F5F3F2] px-3 py-2 text-xs font-bold text-[#29232D] focus:bg-white focus:outline-none"
          >
            <option value="completed">Status: Completed</option>
            <option value="in_progress">Status: In Progress</option>
            <option value="planned">Status: Planned</option>
          </select>

          <button
            type="button"
            onClick={toggleInlineEditing}
            className={`inline-flex items-center gap-1.5 rounded-xl border-2 border-[#29232D] px-3.5 py-2 text-xs font-bold transition-colors whitespace-nowrap ${
              inlineEditing
                ? 'bg-[#F6D36B] text-[#29232D]'
                : 'bg-white text-[#29232D] hover:bg-[#FCE2DE]'
            }`}
          >
            {inlineEditing ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Done Editing Info
              </>
            ) : (
              <>
                <Edit3 className="h-3.5 w-3.5" />
                Edit Course Info
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setEditSemModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#29232D] bg-white px-3 py-2 text-xs font-bold text-[#29232D] hover:bg-[#F5F3F2] whitespace-nowrap"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Rename Semester
          </button>

          {!confirmDeleteSem ? (
            <button
              type="button"
              onClick={() => setConfirmDeleteSem(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#29232D] bg-[#FCE2DE] px-3 py-2 text-xs font-bold text-[#991B1B] hover:bg-[#F8D0CC] whitespace-nowrap"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#29232D] bg-[#F8D0CC] px-2.5 py-1.5 text-xs">
              <span className="text-[#29232D] font-bold">Confirm delete?</span>
              <button
                type="button"
                onClick={() => deleteSemester(semester.id)}
                className="font-extrabold text-[#991B1B] hover:underline"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteSem(false)}
                className="font-bold text-[#29232D] hover:underline ml-1"
              >
                No
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setEditingCourse(null);
              setCourseModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#29232D] bg-[#7955A1] px-3.5 py-2 text-xs font-bold text-white shadow-[3px_3px_0_#29232D] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#29232D] transition-all whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Course
          </button>
        </div>
      </div>

      {/* Semester Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-[20px] border-2 border-[#29232D] bg-[#F8D0CC] p-4 shadow-[3px_3px_0_#29232D]">
          <p className="text-xs font-extrabold uppercase tracking-wide text-[#29232D]/75">
            Semester GPA
          </p>
          <p className="mt-1.5 font-display text-3xl font-extrabold text-[#29232D] tabular-nums">
            {semStats.gpa !== null ? semStats.gpa.toFixed(2) : 'Pending'}
          </p>
        </div>
        <div className="rounded-[20px] border-2 border-[#29232D] bg-[#FBE8A6] p-4 shadow-[3px_3px_0_#29232D]">
          <p className="text-xs font-extrabold uppercase tracking-wide text-[#29232D]/75">
            Total Credits
          </p>
          <p className="mt-1.5 font-display text-3xl font-extrabold text-[#29232D] tabular-nums">
            {semStats.totalCredits}
          </p>
        </div>
        <div className="rounded-[20px] border-2 border-[#29232D] bg-[#E5D8F3] p-4 shadow-[3px_3px_0_#29232D]">
          <p className="text-xs font-extrabold uppercase tracking-wide text-[#29232D]/75">
            Courses Enrolled
          </p>
          <p className="mt-1.5 font-display text-3xl font-extrabold text-[#29232D] tabular-nums">
            {semCourses.length}
          </p>
        </div>
        <div className="rounded-[20px] border-2 border-[#29232D] bg-white p-4 shadow-[3px_3px_0_#29232D]">
          <p className="text-xs font-extrabold uppercase tracking-wide text-[#29232D]/75">
            Cumulative CGPA
          </p>
          <p className="mt-1.5 font-display text-3xl font-extrabold text-[#7955A1] tabular-nums">
            {cgpaAfter.completedCredits > 0 ? cgpaAfter.cgpa.toFixed(2) : '—'}
          </p>
        </div>
      </div>

      {inlineEditing && semCourses.length > 0 && (
        <div className="rounded-2xl border-2 border-[#29232D] bg-[#FFF4D6] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-[#29232D]">
          <span>
            Course info edit mode enabled — update course codes, names, credits, exam status, and marks directly below.
          </span>
          <button
            type="button"
            onClick={toggleInlineEditing}
            className="inline-flex items-center gap-1 rounded-xl border-2 border-[#29232D] bg-white px-3 py-1 text-xs font-extrabold hover:bg-[#FCE2DE] self-start sm:self-auto"
          >
            <Check className="h-3.5 w-3.5" />
            Finish Editing Info
          </button>
        </div>
      )}

      {/* Course Table */}
      <div className="rounded-[22px] border-2 border-[#29232D] bg-white overflow-hidden shadow-[4px_4px_0_#29232D]">
        {semCourses.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <BookPlus className="mx-auto h-10 w-10 text-[#7955A1]" />
            <h3 className="mt-3 font-display text-lg font-extrabold text-[#29232D]">
              No courses in {semester.name} yet
            </h3>
            <p className="mt-1 text-sm font-medium text-[#29232D]/70">
              Add your first course with a custom assessment structure to start tracking grades.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingCourse(null);
                setCourseModalOpen(true);
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border-2 border-[#29232D] bg-[#7955A1] px-4 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_#29232D]"
            >
              <Plus className="h-4 w-4" />
              Add Course
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#29232D] bg-[#F5F3F2] text-[11px] font-extrabold uppercase tracking-wide text-[#29232D]">
                  <th className="py-3.5 px-4 whitespace-nowrap">Code</th>
                  <th className="py-3.5 px-4">Course Name</th>
                  <th className="py-3.5 px-3 text-right whitespace-nowrap">Credits</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">Assessment Marks</th>
                  <th className="py-3.5 px-2 text-right whitespace-nowrap">Total</th>
                  <th className="py-3.5 px-3 text-right whitespace-nowrap">Grade</th>
                  <th className="py-3.5 px-3 text-right whitespace-nowrap">GP</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#29232D]/10 text-sm">
                {semCourses.map((course) => {
                  const maxTotal = getCourseMaxTotalMarks(course);
                  const { totalMarks, percentage, letter, point } = getCourseOriginalGrade(
                    course,
                    gradeScale
                  );
                  const draft = drafts[course.id];

                  return (
                    <tr
                      key={course.id}
                      className="hover:bg-[#FCE2DE]/35 transition-colors align-middle"
                    >
                      {inlineEditing ? (
                        <>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={draft?.code ?? course.code}
                              onChange={(e) => handleCodeChange(course, e.target.value)}
                              onBlur={() => handleCodeBlur(course)}
                              aria-label={`${course.code} Course Code`}
                              className="w-28 rounded-lg border-2 border-[#29232D] bg-white px-2.5 py-1.5 font-mono text-xs font-extrabold uppercase text-[#7955A1] focus:outline-none focus:ring-2 focus:ring-[#7955A1]/30"
                            />
                          </td>
                          <td className="py-2.5 px-3 min-w-[210px]">
                            <input
                              type="text"
                              value={draft?.name ?? course.name}
                              onChange={(e) => handleNameChange(course, e.target.value)}
                              onBlur={() => handleNameBlur(course)}
                              aria-label={`${course.code} Course Name`}
                              className="w-full rounded-lg border-2 border-[#29232D] bg-white px-2.5 py-1.5 text-xs font-bold text-[#29232D] focus:outline-none focus:ring-2 focus:ring-[#7955A1]/30"
                            />
                            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-[#29232D]/80">
                              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={course.examFormSubmitted}
                                  onChange={(e) =>
                                    updateCourse(
                                      course.id,
                                      { examFormSubmitted: e.target.checked },
                                      undefined,
                                      { silentActivity: true }
                                    )
                                  }
                                  className="h-3.5 w-3.5 rounded border border-[#29232D] accent-[#7955A1]"
                                />
                                <span>Exam form</span>
                              </label>
                              <input
                                type="date"
                                value={course.upcomingExamDate ?? ''}
                                onChange={(e) =>
                                  updateCourse(
                                    course.id,
                                    { upcomingExamDate: e.target.value || undefined },
                                    undefined,
                                    { silentActivity: true }
                                  )
                                }
                                aria-label={`${course.code} Final Exam Date`}
                                className="rounded-lg border border-[#29232D]/50 bg-[#F5F3F2] px-2 py-0.5 text-[11px] font-mono text-[#29232D] focus:border-[#29232D] focus:bg-white focus:outline-none"
                              />
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <input
                              type="number"
                              min="0.5"
                              max="12"
                              step="0.5"
                              value={draft?.credits ?? String(course.credits)}
                              onChange={(e) => handleCreditsChange(course, e.target.value)}
                              onBlur={() => handleCreditsBlur(course)}
                              aria-label={`${course.code} Credits`}
                              className="w-16 rounded-lg border-2 border-[#29232D] bg-white px-2 py-1.5 text-right font-mono text-xs font-bold tabular-nums text-[#29232D] focus:outline-none focus:ring-2 focus:ring-[#7955A1]/30"
                            />
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4 font-mono text-xs font-extrabold text-[#7955A1] whitespace-nowrap">
                            {course.code}
                          </td>
                          <td className="py-3 px-4 min-w-[170px]">
                            <div className="font-bold text-[#29232D]">{course.name}</div>
                            {course.improvedGradePoint != null && (
                              <div className="text-[11px] font-bold text-[#7955A1] mt-0.5">
                                Improved to {course.improvedLetterGrade} ({course.improvedGradePoint.toFixed(2)}) in Sem {course.improvedInSemesterNumber}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-[#29232D]">
                            {course.credits.toFixed(1)}
                          </td>
                        </>
                      )}

                      {/* Dynamic Assessment Component Inputs */}
                      <td className="py-2.5 px-3 min-w-[320px]">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {course.assessments.map((comp) => (
                            <label
                              key={comp.id}
                              className="inline-flex items-center gap-1 rounded-lg border-2 border-[#29232D]/25 bg-[#F5F3F2] px-2 py-1 focus-within:border-[#29232D] focus-within:bg-white"
                            >
                              <span className="text-[10px] font-extrabold text-[#29232D]/80 whitespace-nowrap">
                                {comp.name}
                              </span>
                              <input
                                type="number"
                                min="0"
                                max={comp.maxMarks}
                                step="0.5"
                                placeholder="—"
                                value={getComponentInputValue(course, comp)}
                                onFocus={() => handleComponentFocus(course, comp)}
                                onChange={(e) =>
                                  handleComponentChange(course, comp, e.target.value)
                                }
                                onBlur={() => setFocusedMark(null)}
                                aria-label={`${course.code} ${comp.name}`}
                                className="w-11 bg-transparent text-right font-mono text-xs font-extrabold tabular-nums text-[#29232D] focus:outline-none"
                              />
                              <span className="font-mono text-[10px] font-bold text-[#29232D]/50">
                                /{comp.maxMarks}
                              </span>
                            </label>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCourse(course);
                              setCourseModalOpen(true);
                            }}
                            title="Configure assessment components"
                            aria-label={`Configure ${course.code} assessments`}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#29232D]/40 bg-white px-2 py-1 text-[10px] font-bold text-[#7955A1] hover:border-[#29232D] hover:bg-[#E5D8F3]"
                          >
                            <SlidersHorizontal className="h-3 w-3" />
                          </button>
                        </div>
                      </td>

                      {/* Total Marks & Percentage */}
                      <td className="py-2.5 px-2 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max={maxTotal || undefined}
                            step="0.5"
                            placeholder="—"
                            value={getTotalInputValue(course, totalMarks)}
                            onFocus={() => handleTotalFocus(course, totalMarks)}
                            onChange={(e) => handleTotalChange(course, e.target.value, maxTotal)}
                            onBlur={() => handleTotalBlur(course, maxTotal)}
                            aria-label={`${course.code} Total Marks`}
                            title={`Edit Total Marks (/${maxTotal}) directly or via components`}
                            className="w-14 rounded-lg border-2 border-[#7955A1]/60 bg-[#FCE2DE]/50 px-1.5 py-1 text-right font-mono text-xs font-extrabold tabular-nums text-[#29232D] hover:border-[#7955A1] focus:border-[#7955A1] focus:bg-white focus:outline-none"
                          />
                          <span className="font-mono text-[11px] font-bold text-[#29232D]/60">
                            /{maxTotal}
                          </span>
                        </div>
                        {percentage !== null && (
                          <div className="text-[10px] font-mono font-bold text-[#7955A1] tabular-nums mt-0.5">
                            {percentage.toFixed(1)}%
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-extrabold">
                        {letter ? (
                          <span
                            className={`inline-block rounded-lg border border-[#29232D] px-2 py-0.5 text-xs ${
                              point === 0
                                ? 'bg-[#F29A9C] text-[#29232D]'
                                : point !== null && point < rules.improvementMaxPoint
                                  ? 'bg-[#F6D36B] text-[#29232D]'
                                  : 'bg-[#A7D9AE] text-[#29232D]'
                            }`}
                          >
                            {letter}
                          </span>
                        ) : (
                          <span className="text-[#29232D]/50 font-semibold">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-[#29232D]">
                        {point !== null ? point.toFixed(2) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCourse(course);
                              setCourseModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border-2 border-[#29232D] bg-white px-2.5 py-1 text-xs font-bold text-[#29232D] hover:bg-[#FCE2DE] transition-colors"
                            aria-label={`Edit ${course.code}`}
                          >
                            <Edit3 className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCourse(course.id)}
                            className="rounded-lg border-2 border-transparent p-1.5 text-[#29232D]/70 hover:border-[#29232D] hover:bg-[#F8D0CC] hover:text-[#991B1B] transition-colors"
                            aria-label={`Delete ${course.code}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CourseModal
        open={courseModalOpen}
        onClose={() => {
          setCourseModalOpen(false);
          setEditingCourse(null);
        }}
        semesters={semesters}
        defaultSemesterId={semester.id}
        initial={editingCourse}
        onSave={(payload) => {
          if (editingCourse) {
            updateCourse(editingCourse.id, payload);
            setDrafts((prev) => ({
              ...prev,
              [editingCourse.id]: {
                code: payload.code,
                name: payload.name,
                credits: String(payload.credits),
              },
            }));
          } else {
            addCourse(payload);
          }
        }}
      />

      <SemesterModal
        open={editSemModalOpen}
        onClose={() => setEditSemModalOpen(false)}
        initial={semester}
        suggestedNumber={semester.number}
        onSave={(payload) => updateSemester(semester.id, payload)}
      />
    </div>
  );
}
