import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Course, Semester } from '../types/academic';
import {
  calculateCourseTotalMarks,
  getGradeFromMarks,
  getInternalMarks,
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

function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const num = Number(trimmed);
  return Number.isNaN(num) ? null : num;
}

export function CourseModal({
  open,
  onClose,
  onSave,
  semesters,
  defaultSemesterId,
  initial,
}: CourseModalProps) {
  const { gradeScale, rules } = useAcademic();

  const [semesterId, setSemesterId] = useState(defaultSemesterId);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [credits, setCredits] = useState('3');
  const [midterm1, setMidterm1] = useState('');
  const [midterm2, setMidterm2] = useState('');
  const [attendance, setAttendance] = useState('');
  const [finalExam, setFinalExam] = useState('');
  const [manualTotal, setManualTotal] = useState('');
  const [totalOverridden, setTotalOverridden] = useState(false);
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
        setMidterm1(initial.midterm1 !== null ? String(initial.midterm1) : '');
        setMidterm2(initial.midterm2 !== null ? String(initial.midterm2) : '');
        setAttendance(initial.attendance !== null ? String(initial.attendance) : '');
        setFinalExam(initial.finalExam !== null ? String(initial.finalExam) : '');
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
        setMidterm1('');
        setMidterm2('');
        setAttendance('');
        setFinalExam('');
        setTotalOverridden(false);
        setManualTotal('');
        setExamFormSubmitted(true);
        setUpcomingExamDate('');
      }
      setError('');
    }
  }, [open, initial, defaultSemesterId, semesters]);

  if (!open) return null;

  const m1 = parseOptionalNumber(midterm1);
  const m2 = parseOptionalNumber(midterm2);
  const att = parseOptionalNumber(attendance);
  const fin = parseOptionalNumber(finalExam);
  const totOverride = totalOverridden ? parseOptionalNumber(manualTotal) : null;
  const previewTotal = calculateCourseTotalMarks({
    midterm1: m1,
    midterm2: m2,
    attendance: att,
    finalExam: fin,
    totalMarksOverride: totOverride,
  });
  const previewInternal = getInternalMarks({
    midterm1: m1,
    midterm2: m2,
    attendance: att,
  });
  const previewGrade =
    (fin !== null || totOverride !== null) && previewTotal !== null
      ? getGradeFromMarks(previewTotal, gradeScale)
      : null;

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
    if (m1 !== null && (m1 < 0 || m1 > 10)) {
      setError('Midterm 1 marks must be between 0 and 10.');
      return;
    }
    if (m2 !== null && (m2 < 0 || m2 > 10)) {
      setError('Midterm 2 marks must be between 0 and 10.');
      return;
    }
    if (att !== null && (att < 0 || att > 10)) {
      setError('Attendance marks must be between 0 and 10.');
      return;
    }
    if (fin !== null && (fin < 0 || fin > 70)) {
      setError('Final examination marks must be between 0 and 70.');
      return;
    }
    if (totOverride !== null && (totOverride < 0 || totOverride > 100)) {
      setError('Total marks must be between 0 and 100.');
      return;
    }

    let finalExamToSave = fin;
    let totalOverrideToSave: number | null = totOverride;
    if (
      totOverride !== null &&
      m1 !== null &&
      m2 !== null &&
      att !== null
    ) {
      const rem = Math.round((totOverride - (m1 + m2 + att)) * 10) / 10;
      if (rem >= 0 && rem <= 70) {
        finalExamToSave = rem;
        totalOverrideToSave = null;
      }
    }

    onSave({
      semesterId,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      credits: creditNum,
      midterm1: m1,
      midterm2: m2,
      attendance: att,
      finalExam: finalExamToSave,
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
      <div className="w-full max-w-lg rounded-[22px] border-2 border-[#29232D] bg-white p-6 shadow-[6px_6px_0_#29232D]">
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="rounded-xl border-2 border-[#29232D] bg-[#F8D0CC] px-3 py-2 text-xs font-bold text-[#29232D]">
              {error}
            </div>
          )}

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

          <div className="pt-2 border-t-2 border-[#29232D]/15">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-[#29232D]">
                Assessment Marks (Optional for ongoing courses)
              </span>
              <span className="text-xs font-mono font-bold tabular-nums text-[#7955A1]">
                Internal: {previewInternal}/30
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#29232D]/75 mb-1">Midterm 1 (/10)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={midterm1}
                  onChange={(e) => {
                    setMidterm1(e.target.value);
                    setTotalOverridden(false);
                  }}
                  placeholder="—"
                  className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm font-mono font-bold tabular-nums text-[#29232D] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#29232D]/75 mb-1">Midterm 2 (/10)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={midterm2}
                  onChange={(e) => {
                    setMidterm2(e.target.value);
                    setTotalOverridden(false);
                  }}
                  placeholder="—"
                  className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm font-mono font-bold tabular-nums text-[#29232D] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#29232D]/75 mb-1">Attendance (/10)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={attendance}
                  onChange={(e) => {
                    setAttendance(e.target.value);
                    setTotalOverridden(false);
                  }}
                  placeholder="—"
                  className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm font-mono font-bold tabular-nums text-[#29232D] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#29232D]/75 mb-1">Final (/70)</label>
                <input
                  type="number"
                  min="0"
                  max="70"
                  step="0.5"
                  value={finalExam}
                  onChange={(e) => {
                    setFinalExam(e.target.value);
                    setTotalOverridden(false);
                  }}
                  placeholder="—"
                  className="w-full rounded-xl border-2 border-[#29232D] px-3 py-2 text-sm font-mono font-bold tabular-nums text-[#29232D] focus:outline-none"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-[#7955A1] mb-1">Total (/100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
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
                  placeholder="—"
                  className="w-full rounded-xl border-2 border-[#7955A1] bg-[#FCE2DE]/40 px-3 py-2 text-sm font-mono font-extrabold tabular-nums text-[#29232D] focus:bg-white focus:outline-none"
                />
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

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-[#29232D] bg-[#FCE2DE] px-4 py-3 text-xs">
            <div className="font-semibold text-[#29232D]">
              Total Marks:{' '}
              <span className="font-mono font-extrabold tabular-nums">
                {previewTotal !== null ? `${previewTotal}/100` : '—'}
              </span>
              {previewInternal < rules.minInternalMarks && (m1 !== null || m2 !== null || att !== null) && (
                <span className="ml-2 text-[#B45309] font-bold">
                  · Below {rules.minInternalMarks} internal min
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
