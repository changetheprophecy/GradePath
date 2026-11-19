import React, { useEffect, useState } from 'react';
import { Plus, RotateCcw, Trash2, X } from 'lucide-react';
import {
  AssessmentComponent,
  AssessmentKind,
  Course,
  Semester,
} from '../types/academic';
import {
  ASSESSMENT_PRESETS,
  calculateCoursePercentage,
  calculateCourseTotalMarks,
  createAssessmentsFromTemplate,
  getCourseInternalSummary,
  getCourseMaxTotalMarks,
  getGradeFromMarks,
  hasFinalGrade,
} from '../utils/calculations';
import { useAcademic } from '../context/AcademicContext';

interface CourseModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: Omit<Course, 'id'>) => void;
  semesters: Semester[];
  defaultSemesterId: string;
  initial?: Course | null;
}

interface ComponentDraft {
  id: string;
  name: string;
  kind: AssessmentKind;
  maxMarks: string;
  obtainedMarks: string;
}

function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const num = Number(trimmed);
  return Number.isNaN(num) ? null : num;
}

function toDrafts(list: AssessmentComponent[]): ComponentDraft[] {
  return list.map((a) => ({
    id: a.id,
    name: a.name,
    kind: a.kind,
    maxMarks: String(a.maxMarks),
    obtainedMarks: a.obtainedMarks !== null ? String(a.obtainedMarks) : '',
  }));
}

export function CourseModal({
  open,
  onClose,
  onSave,
  semesters,
  defaultSemesterId,
  initial,
}: CourseModalProps) {
  const { gradeScale, rules, defaultAssessments, updateDefaultAssessments } =
    useAcademic();

  const [semesterId, setSemesterId] = useState(defaultSemesterId);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [credits, setCredits] = useState('3');
  const [compDrafts, setCompDrafts] = useState<ComponentDraft[]>([]);
  const [manualTotal, setManualTotal] = useState('');
  const [totalOverridden, setTotalOverridden] = useState(false);
  const [saveAsDefaultTemplate, setSaveAsDefaultTemplate] = useState(false);
  const [examFormSubmitted, setExamFormSubmitted] = useState(true);
  const [upcomingExamDate, setUpcomingExamDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (initial) {
        setSemesterId(initial.semesterId);
        setCode(initial.code);
        setName(initial.name);
        setCredits(String(initial.credits));
        setCompDrafts(toDrafts(initial.assessments));
        setTotalOverridden(
          initial.totalMarksOverride !== null && initial.totalMarksOverride !== undefined
        );
        setManualTotal(
          initial.totalMarksOverride !== null && initial.totalMarksOverride !== undefined
            ? String(initial.totalMarksOverride)
            : ''
        );
        setExamFormSubmitted(initial.examFormSubmitted);
        setUpcomingExamDate(initial.upcomingExamDate ?? '');
      } else {
        setSemesterId(defaultSemesterId || semesters[0]?.id || '');
        setCode('');
        setName('');
        setCredits('3');
        setCompDrafts(toDrafts(createAssessmentsFromTemplate(defaultAssessments)));
        setTotalOverridden(false);
        setManualTotal('');
        setExamFormSubmitted(true);
        setUpcomingExamDate('');
      }
      setSaveAsDefaultTemplate(false);
      setError('');
    }
  }, [open, initial, defaultSemesterId, semesters, defaultAssessments]);

  if (!open) return null;

  const parsedAssessments: AssessmentComponent[] = compDrafts.map((d, idx) => {
    const parsedMax = Number(d.maxMarks);
    const maxMarks = !Number.isNaN(parsedMax) && parsedMax > 0 ? parsedMax : 0;
    const obtained = parseOptionalNumber(d.obtainedMarks);
    return {
      id: d.id || `comp-${idx}`,
      name: d.name.trim() || `Assessment ${idx + 1}`,
      kind: d.kind,
      maxMarks,
      obtainedMarks: obtained,
    };
  });

  const totOverride = totalOverridden ? parseOptionalNumber(manualTotal) : null;
  const previewCourseShape = {
    assessments: parsedAssessments,
    totalMarksOverride: totOverride,
  };
  const previewMaxTotal = getCourseMaxTotalMarks(previewCourseShape);
  const previewTotal = calculateCourseTotalMarks(previewCourseShape);
  const previewPct = calculateCoursePercentage(previewCourseShape);
  const previewInternal = getCourseInternalSummary(previewCourseShape);
  const previewHasFinal = hasFinalGrade(previewCourseShape);
  const previewGrade =
    previewHasFinal && previewPct !== null
      ? getGradeFromMarks(previewPct, gradeScale)
      : null;

  const updateDraft = (idx: number, patch: Partial<ComponentDraft>) => {
    setCompDrafts((prev) => prev.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
    if (patch.obtainedMarks !== undefined || patch.maxMarks !== undefined) {
      setTotalOverridden(false);
    }
  };

  const addComponent = (
    presetName: string,
    kind: AssessmentKind,
    defaultMax: number
  ) => {
    let finalName = presetName;
    if (kind === 'midterm') {
      const existingMidCount = compDrafts.filter((c) => c.kind === 'midterm').length;
      finalName = `Midterm ${existingMidCount + 1}`;
    } else if (
      compDrafts.some((c) => c.name.toLowerCase() === presetName.toLowerCase())
    ) {
      const samePrefixCount = compDrafts.filter((c) =>
        c.name.toLowerCase().startsWith(presetName.toLowerCase())
      ).length;
      finalName = `${presetName} ${samePrefixCount + 1}`;
    }

    setCompDrafts((prev) => [
      ...prev,
      {
        id: `comp-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        name: finalName,
        kind,
        maxMarks: String(defaultMax),
        obtainedMarks: '',
      },
    ]);
    setTotalOverridden(false);
  };

  const removeComponent = (idx: number) => {
    if (compDrafts.length <= 1) return;
    setCompDrafts((prev) => prev.filter((_, i) => i !== idx));
    setTotalOverridden(false);
  };

  const applyTemplate = (
    template: Array<{ id: string; name: string; kind: AssessmentKind; maxMarks: number }>
  ) => {
    setCompDrafts(
      template.map((t, i) => ({
        id: `${t.id}-${i}`,
        name: t.name,
        kind: t.kind,
        maxMarks: String(t.maxMarks),
        obtainedMarks: '',
      }))
    );
    setTotalOverridden(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!semesterId) {
      setError('Please select a semester.');
      return;
    }
    if (!code.trim() || !name.trim()) {
      setError('Course code and course name are required.');
      return;
    }
    const creditNum = Number(credits);
    if (Number.isNaN(creditNum) || creditNum <= 0 || creditNum > 12) {
      setError('Credit hours must be between 0.5 and 12.');
      return;
    }
    if (compDrafts.length === 0) {
      setError('Add at least one assessment component.');
      return;
    }

    const finalAssessments: AssessmentComponent[] = [];
    for (let i = 0; i < compDrafts.length; i++) {
      const d = compDrafts[i];
      const compName = d.name.trim();
      if (!compName) {
        setError(`Assessment row #${i + 1} must have a name.`);
        return;
      }
      const maxNum = Number(d.maxMarks);
      if (Number.isNaN(maxNum) || maxNum <= 0) {
        setError(`"${compName}" total marks must be greater than 0.`);
        return;
      }
      const obtainedNum = parseOptionalNumber(d.obtainedMarks);
      if (obtainedNum !== null && (obtainedNum < 0 || obtainedNum > maxNum)) {
        setError(`"${compName}" obtained marks must be between 0 and ${maxNum}.`);
        return;
      }
      finalAssessments.push({
        id: d.id || `comp-${i}-${Date.now()}`,
        name: compName,
        kind: d.kind,
        maxMarks: Math.round(maxNum * 100) / 100,
        obtainedMarks: obtainedNum !== null ? Math.round(obtainedNum * 100) / 100 : null,
      });
    }

    const totalMax = finalAssessments.reduce((s, a) => s + a.maxMarks, 0);
    if (totOverride !== null && (totOverride < 0 || totOverride > totalMax)) {
      setError(`Total marks override must be between 0 and ${totalMax}.`);
      return;
    }

    let assessmentsToSave = finalAssessments;
    let totalOverrideToSave: number | null = totOverride;

    // If user typed a direct total override and all non-final components are entered + 1 final component exists,
    // sync the final component automatically when the remainder fits cleanly in [0, final.maxMarks]
    if (totOverride !== null) {
      const finals = finalAssessments.filter((a) => a.kind === 'final');
      const nonFinals = finalAssessments.filter((a) => a.kind !== 'final');
      if (finals.length === 1 && nonFinals.every((a) => a.obtainedMarks !== null)) {
        const internalSum = nonFinals.reduce((s, a) => s + (a.obtainedMarks ?? 0), 0);
        const rem = Math.round((totOverride - internalSum) * 100) / 100;
        if (rem >= 0 && rem <= finals[0].maxMarks) {
          assessmentsToSave = finalAssessments.map((a) =>
            a.id === finals[0].id ? { ...a, obtainedMarks: rem } : a
          );
          totalOverrideToSave = null;
        }
      }
    }

    if (saveAsDefaultTemplate) {
      updateDefaultAssessments(
        assessmentsToSave.map((a) => ({
          id: a.id,
          name: a.name,
          kind: a.kind,
          maxMarks: a.maxMarks,
        }))
      );
    }

    onSave({
      semesterId,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      credits: creditNum,
      assessments: assessmentsToSave,
      totalMarksOverride: totalOverrideToSave,
      examFormSubmitted,
      upcomingExamDate: upcomingExamDate.trim() || undefined,
      improvedGradePoint: initial?.improvedGradePoint ?? null,
      improvedLetterGrade: initial?.improvedLetterGrade ?? null,
      improvedInSemesterNumber: initial?.improvedInSemesterNumber ?? null,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#29232D]/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-modal-title"
    >
      <div className="my-auto w-full max-w-2xl rounded-[22px] border-2 border-[#29232D] bg-white p-5 sm:p-6 shadow-[6px_6px_0_#29232D] max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b-2 border-[#29232D]/15 pb-4">
          <h2 id="course-modal-title" className="font-display text-lg font-extrabold text-[#29232D]">
            {initial ? `Edit ${initial.code}` : 'Add Course'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border-2 border-[#29232D] bg-[#FCE2DE] p-1.5 text-[#29232D] hover:bg-[#F8D0CC] transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {error && (
            <div className="rounded-xl border-2 border-[#29232D] bg-[#F8D0CC] px-3 py-2 text-xs font-bold text-[#29232D]">
              {error}
            </div>
          )}

          {/* Basic Course Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#29232D] mb-1.5">
                Semester
              </label>
              <select
                value={semesterId}
                onChange={(e) => setSemesterId(e.target.value)}
                className="w-full rounded-xl border-2 border-[#29232D] bg-white px-3 py-2 text-sm font-semibold text-[#29232D] focus:outline-none focus:ring-2 focus:ring-[#7955A1]/30"
              >
                {semesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#29232D] mb-1.5">
                Credits
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm font-mono font-bold tabular-nums text-[#29232D] focus:outline-none focus:ring-2 focus:ring-[#7955A1]/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#29232D] mb-1.5">
                Course Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="CSE 3201"
                className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm font-mono font-bold uppercase text-[#29232D] focus:outline-none focus:ring-2 focus:ring-[#7955A1]/30"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#29232D] mb-1.5">
                Course Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Data Science"
                className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm font-medium text-[#29232D] focus:outline-none focus:ring-2 focus:ring-[#7955A1]/30"
              />
            </div>
          </div>

          {/* Dynamic Assessment Structure Builder */}
          <div className="pt-4 border-t-2 border-[#29232D]/15 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#29232D]">
                  Assessment Distribution &amp; Marks
                </h3>
                <p className="text-[11px] font-medium text-[#29232D]/70">
                  Configure midterms, attendance, assignments, quizzes, and final exam marks for this course.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  aria-label="Apply assessment preset"
                  defaultValue=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    if (val === '__default__') {
                      applyTemplate(defaultAssessments);
                    } else {
                      const preset = ASSESSMENT_PRESETS.find((p) => p.id === val);
                      if (preset) applyTemplate(preset.components);
                    }
                    e.target.value = '';
                  }}
                  className="rounded-xl border-2 border-[#29232D] bg-[#FFF4D6] px-2.5 py-1.5 text-[11px] font-bold text-[#29232D] focus:outline-none"
                >
                  <option value="">Load Preset Structure…</option>
                  <option value="__default__">My Default Template</option>
                  {ASSESSMENT_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Component Rows */}
            <div className="rounded-2xl border-2 border-[#29232D] bg-[#F5F3F2] p-3 space-y-2">
              <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-1 text-[10px] font-extrabold uppercase tracking-wide text-[#29232D]/70">
                <span className="col-span-5">Assessment Name</span>
                <span className="col-span-3">Type</span>
                <span className="col-span-2 text-right">Total Marks</span>
                <span className="col-span-2 text-right">Obtained</span>
              </div>

              {compDrafts.map((comp, idx) => (
                <div
                  key={comp.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center rounded-xl border border-[#29232D]/30 bg-white p-2"
                >
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      value={comp.name}
                      onChange={(e) => updateDraft(idx, { name: e.target.value })}
                      placeholder="Assessment name"
                      aria-label={`Assessment ${idx + 1} name`}
                      className="w-full rounded-lg border-2 border-[#29232D]/30 px-2.5 py-1.5 text-xs font-bold text-[#29232D] focus:border-[#29232D] focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <select
                      value={comp.kind}
                      onChange={(e) =>
                        updateDraft(idx, { kind: e.target.value as AssessmentKind })
                      }
                      aria-label={`Assessment ${idx + 1} type`}
                      className="w-full rounded-lg border-2 border-[#29232D]/30 bg-[#F5F3F2] px-2 py-1.5 text-xs font-bold text-[#29232D] focus:border-[#29232D] focus:outline-none"
                    >
                      <option value="midterm">Midterm</option>
                      <option value="attendance">Attendance</option>
                      <option value="other">Assignment / Quiz / Other</option>
                      <option value="final">Final Exam</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-1.5">
                    <span className="sm:hidden text-[11px] font-bold text-[#29232D]/65">Max:</span>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={comp.maxMarks}
                      onChange={(e) => updateDraft(idx, { maxMarks: e.target.value })}
                      aria-label={`${comp.name} total marks`}
                      className="w-full rounded-lg border-2 border-[#29232D]/30 px-2 py-1.5 text-right font-mono text-xs font-bold tabular-nums text-[#29232D] focus:border-[#29232D] focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-1">
                    <span className="sm:hidden text-[11px] font-bold text-[#29232D]/65">Got:</span>
                    <input
                      type="number"
                      min="0"
                      max={Number(comp.maxMarks) || undefined}
                      step="0.5"
                      value={comp.obtainedMarks}
                      onChange={(e) => updateDraft(idx, { obtainedMarks: e.target.value })}
                      placeholder="—"
                      aria-label={`${comp.name} obtained marks`}
                      className="w-full rounded-lg border-2 border-[#29232D] bg-[#FCE2DE]/30 px-2 py-1.5 text-right font-mono text-xs font-extrabold tabular-nums text-[#29232D] focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeComponent(idx)}
                      disabled={compDrafts.length <= 1}
                      className="rounded-lg p-1 text-[#29232D]/60 hover:bg-[#F8D0CC] hover:text-[#991B1B] disabled:opacity-30 shrink-0"
                      aria-label={`Remove ${comp.name}`}
                      title="Remove component"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Quick Add Component Buttons */}
              <div className="pt-1 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-extrabold text-[#29232D]/70 mr-1">
                  Add:
                </span>
                <button
                  type="button"
                  onClick={() => addComponent('Midterm', 'midterm', 15)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#29232D] bg-white px-2 py-1 text-[11px] font-bold text-[#29232D] hover:bg-[#E5D8F3]"
                >
                  <Plus className="h-3 w-3" /> Midterm
                </button>
                <button
                  type="button"
                  onClick={() => addComponent('Attendance', 'attendance', 10)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#29232D] bg-white px-2 py-1 text-[11px] font-bold text-[#29232D] hover:bg-[#DDF3E0]"
                >
                  <Plus className="h-3 w-3" /> Attendance
                </button>
                <button
                  type="button"
                  onClick={() => addComponent('Assignment', 'other', 10)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#29232D] bg-white px-2 py-1 text-[11px] font-bold text-[#29232D] hover:bg-[#FFF4D6]"
                >
                  <Plus className="h-3 w-3" /> Assignment
                </button>
                <button
                  type="button"
                  onClick={() => addComponent('Quiz', 'other', 10)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#29232D] bg-white px-2 py-1 text-[11px] font-bold text-[#29232D] hover:bg-[#DCEFF8]"
                >
                  <Plus className="h-3 w-3" /> Quiz
                </button>
                <button
                  type="button"
                  onClick={() => addComponent('Presentation', 'other', 10)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#29232D] bg-white px-2 py-1 text-[11px] font-bold text-[#29232D] hover:bg-[#FCE2DE]"
                >
                  <Plus className="h-3 w-3" /> Presentation
                </button>
                <button
                  type="button"
                  onClick={() => addComponent('Practical', 'other', 20)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#29232D] bg-white px-2 py-1 text-[11px] font-bold text-[#29232D] hover:bg-[#E5D8F3]"
                >
                  <Plus className="h-3 w-3" /> Practical
                </button>
                <button
                  type="button"
                  onClick={() => addComponent('Final Exam', 'final', 50)}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#29232D] bg-white px-2 py-1 text-[11px] font-bold text-[#29232D] hover:bg-[#F8D0CC]"
                >
                  <Plus className="h-3 w-3" /> Final Exam
                </button>
              </div>
            </div>

            {/* Direct Total Override & Template Option */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveAsDefaultTemplate}
                  onChange={(e) => setSaveAsDefaultTemplate(e.target.checked)}
                  className="h-4 w-4 rounded border-2 border-[#29232D] accent-[#7955A1]"
                />
                <span className="text-xs font-bold text-[#29232D]">
                  Save this distribution as my default template for new courses
                </span>
              </label>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-[#7955A1] whitespace-nowrap">
                  Direct Total (/{previewMaxTotal}):
                </label>
                <input
                  type="number"
                  min="0"
                  max={previewMaxTotal || undefined}
                  step="0.5"
                  value={
                    totalOverridden
                      ? manualTotal
                      : previewTotal !== null
                        ? String(previewTotal)
                        : ''
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    setManualTotal(val);
                    setTotalOverridden(val.trim() !== '');
                  }}
                  placeholder="Auto"
                  className="w-20 rounded-xl border-2 border-[#7955A1] bg-[#FCE2DE]/40 px-2.5 py-1 text-right font-mono text-xs font-extrabold tabular-nums text-[#29232D] focus:bg-white focus:outline-none"
                />
                {totalOverridden && (
                  <button
                    type="button"
                    onClick={() => {
                      setTotalOverridden(false);
                      setManualTotal('');
                    }}
                    className="rounded-lg border border-[#29232D] p-1 text-[#29232D] hover:bg-[#FCE2DE]"
                    title="Recalculate from components"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
            <div>
              <label className="block text-xs font-semibold text-[#29232D]/75 mb-1">
                Final Exam Date (Optional)
              </label>
              <input
                type="date"
                value={upcomingExamDate}
                onChange={(e) => setUpcomingExamDate(e.target.value)}
                className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm text-[#29232D] focus:outline-none"
              />
            </div>
            <label className="flex items-center gap-2.5 pt-4 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={examFormSubmitted}
                onChange={(e) => setExamFormSubmitted(e.target.checked)}
                className="h-4 w-4 rounded border-2 border-[#29232D] accent-[#7955A1]"
              />
              <span className="text-xs font-bold text-[#29232D]">
                Examination form submitted
              </span>
            </label>
          </div>

          {/* Live Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-[#29232D] bg-[#FCE2DE] px-4 py-3 text-xs">
            <div className="font-semibold text-[#29232D]">
              Total:{' '}
              <span className="font-mono font-extrabold tabular-nums">
                {previewTotal !== null
                  ? `${previewTotal}/${previewMaxTotal} (${previewPct?.toFixed(1) ?? '0.0'}%)`
                  : `0/${previewMaxTotal} configured`}
              </span>
              {previewInternal.max > 0 && (
                <span className="ml-2 text-[#29232D]/80 font-mono">
                  · Internal: {previewInternal.obtained}/{previewInternal.max}
                  {previewInternal.hasAnyEntered &&
                    (previewInternal.percentage ?? 0) < rules.minInternalPercent && (
                      <span className="ml-1 text-[#B45309] font-bold">
                        (&lt;{rules.minInternalPercent}% min)
                      </span>
                    )}
                </span>
              )}
            </div>
            <div className="font-semibold text-[#29232D]">
              Grade:{' '}
              <span className="font-mono font-extrabold text-[#7955A1] tabular-nums">
                {previewGrade
                  ? `${previewGrade.letter} (${previewGrade.point.toFixed(2)})`
                  : 'Pending Final'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t-2 border-[#29232D]/15">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border-2 border-[#29232D] bg-white px-4 py-2 text-sm font-bold text-[#29232D] hover:bg-[#F5F3F2] transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl border-2 border-[#29232D] bg-[#7955A1] px-4 py-2 text-sm font-bold text-white shadow-[3px_3px_0_#29232D] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#29232D] transition-all whitespace-nowrap"
            >
              {initial ? 'Save Course' : 'Add Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
