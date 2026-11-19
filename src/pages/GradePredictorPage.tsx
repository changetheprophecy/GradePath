import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAcademic } from '../context/AcademicContext';
import {
  calculateCumulativeCGPA,
  calculateSemesterGPA,
  getGradeFromMarks,
} from '../utils/calculations';

interface FinalScenario {
  id: string;
  label: string;
  finalMarks: number;
}

const SCENARIO_COLORS = ['#75B9DF', '#F29A9C', '#7955A1', '#A7D9AE', '#F6D36B', '#A88BC5'];

export function GradePredictorPage() {
  const {
    semesters,
    courses,
    gradeScale,
    rules,
    updateCourse,
  } = useAcademic();

  const sortedSemesters = useMemo(
    () => [...semesters].sort((a, b) => a.number - b.number),
    [semesters]
  );

  const defaultSemester =
    sortedSemesters.find((s) => s.status === 'in_progress') ??
    sortedSemesters[sortedSemesters.length - 1] ??
    null;

  const [selectedSemId, setSelectedSemId] = useState<string>(defaultSemester?.id ?? '');

  const semesterCourses = useMemo(
    () => courses.filter((c) => c.semesterId === selectedSemId),
    [courses, selectedSemId]
  );

  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    semesterCourses[0]?.id ?? ''
  );

  useEffect(() => {
    if (!semesterCourses.some((c) => c.id === selectedCourseId)) {
      setSelectedCourseId(semesterCourses[0]?.id ?? '');
    }
  }, [semesterCourses, selectedCourseId]);

  const activeCourse = useMemo(
    () => semesterCourses.find((c) => c.id === selectedCourseId) ?? null,
    [semesterCourses, selectedCourseId]
  );

  const [mid1, setMid1] = useState<number>(8);
  const [mid2, setMid2] = useState<number>(8);
  const [attendance, setAttendance] = useState<number>(9);
  const [finalExam, setFinalExam] = useState<number>(50);
  const [savedNotice, setSavedNotice] = useState(false);

  const [scenarios, setScenarios] = useState<FinalScenario[]>([
    { id: 'sc-1', label: 'Conservative', finalMarks: 40 },
    { id: 'sc-2', label: 'Target', finalMarks: 52 },
    { id: 'sc-3', label: 'Stretch', finalMarks: 60 },
  ]);

  // Sync predictor sliders when switching courses
  useEffect(() => {
    if (activeCourse) {
      setMid1(activeCourse.midterm1 ?? 7);
      setMid2(activeCourse.midterm2 ?? 7);
      setAttendance(activeCourse.attendance ?? 8);
      setFinalExam(activeCourse.finalExam ?? 50);
      setSavedNotice(false);
    }
  }, [activeCourse]);

  const internalTotal = Math.round((mid1 + mid2 + attendance) * 10) / 10;
  const predictedTotal = Math.round((internalTotal + finalExam) * 10) / 10;
  const predictedGrade = getGradeFromMarks(predictedTotal, gradeScale);

  const baselineSemStats = useMemo(
    () => calculateSemesterGPA(semesterCourses, gradeScale),
    [semesterCourses, gradeScale]
  );

  const baselineCgpa = useMemo(
    () => calculateCumulativeCGPA(courses, gradeScale, rules),
    [courses, gradeScale, rules]
  );

  // Compute simulated semester GPA & cumulative CGPA with predicted course values
  const simulation = useMemo(() => {
    if (!activeCourse) {
      return { semGpa: null, cgpa: baselineCgpa.cgpa };
    }
    const simulatedSemCourses = semesterCourses.map((c) =>
      c.id === activeCourse.id
        ? {
            ...c,
            midterm1: mid1,
            midterm2: mid2,
            attendance,
            finalExam,
          }
        : c
    );
    const semRes = calculateSemesterGPA(simulatedSemCourses, gradeScale);
    const cgpaRes = calculateCumulativeCGPA(courses, gradeScale, rules, {
      [activeCourse.id]: predictedGrade.point,
    });
    return {
      semGpa: semRes.gpa,
      cgpa: cgpaRes.cgpa,
    };
  }, [
    activeCourse,
    semesterCourses,
    courses,
    gradeScale,
    rules,
    mid1,
    mid2,
    attendance,
    finalExam,
    predictedGrade.point,
    baselineCgpa.cgpa,
  ]);

  const scenarioRows = useMemo(() => {
    if (!activeCourse) return [];
    return scenarios.map((sc) => {
      const total = Math.round((internalTotal + sc.finalMarks) * 10) / 10;
      const grade = getGradeFromMarks(total, gradeScale);
      const simulatedSemCourses = semesterCourses.map((c) =>
        c.id === activeCourse.id
          ? {
              ...c,
              midterm1: mid1,
              midterm2: mid2,
              attendance,
              finalExam: sc.finalMarks,
            }
          : c
      );
      const semRes = calculateSemesterGPA(simulatedSemCourses, gradeScale);
      const cgpaRes = calculateCumulativeCGPA(courses, gradeScale, rules, {
        [activeCourse.id]: grade.point,
      });
      return {
        ...sc,
        total,
        letter: grade.letter,
        point: grade.point,
        semGpa: semRes.gpa ?? 0,
        cgpa: cgpaRes.cgpa,
      };
    });
  }, [
    scenarios,
    activeCourse,
    internalTotal,
    gradeScale,
    semesterCourses,
    courses,
    rules,
    mid1,
    mid2,
    attendance,
  ]);

  const handleSaveToCourse = () => {
    if (!activeCourse) return;
    updateCourse(
      activeCourse.id,
      {
        midterm1: mid1,
        midterm2: mid2,
        attendance,
        finalExam,
      },
      `Predicted marks saved for ${activeCourse.name}`
    );
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleResetToCourse = () => {
    if (!activeCourse) return;
    setMid1(activeCourse.midterm1 ?? 7);
    setMid2(activeCourse.midterm2 ?? 7);
    setAttendance(activeCourse.attendance ?? 8);
    setFinalExam(activeCourse.finalExam ?? 50);
  };

  const addScenario = () => {
    if (scenarios.length >= 6) return;
    setScenarios((prev) => [
      ...prev,
      {
        id: `sc-${Date.now()}`,
        label: `Scenario ${prev.length + 1}`,
        finalMarks: Math.min(70, (prev[prev.length - 1]?.finalMarks ?? 45) + 5),
      },
    ]);
  };

  if (sortedSemesters.length === 0 || courses.length === 0) {
    return (
      <div className="rounded-[22px] border-2 border-[#29232D] bg-white px-6 py-14 text-center shadow-[4px_4px_0_#29232D]">
        <h2 className="font-display text-lg font-extrabold text-[#29232D]">
          Add a semester and course to start predicting grades
        </h2>
        <p className="mt-1 text-sm font-medium text-[#29232D]/70">
          Grade Predictor uses your enrolled courses and credit hours to estimate semester GPA and cumulative CGPA.
        </p>
      </div>
    );
  }

  const cgpaDelta = simulation.cgpa - baselineCgpa.cgpa;

  return (
    <div className="space-y-6">
      <div className="rounded-[22px] border-2 border-[#29232D] bg-white p-5 sm:p-6 shadow-[4px_4px_0_#29232D]">
        <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#29232D]">
          Grade &amp; GPA Predictor
        </h2>
        <p className="mt-1 text-sm font-medium text-[#29232D]/75">
          Model expected midterm, attendance, and final examination marks to project your course grade, semester GPA, and cumulative CGPA.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Control Deck (5 cols) */}
        <section className="lg:col-span-5 rounded-[22px] border-2 border-[#29232D] bg-white p-5 sm:p-6 shadow-[4px_4px_0_#29232D] space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <div>
              <label
                htmlFor="predictor-semester"
                className="block text-xs font-extrabold text-[#29232D] mb-1.5"
              >
                1. Select Semester
              </label>
              <select
                id="predictor-semester"
                value={selectedSemId}
                onChange={(e) => setSelectedSemId(e.target.value)}
                className="w-full rounded-xl border-2 border-[#29232D] bg-[#F5F3F2] px-3 py-2.5 text-sm font-bold text-[#29232D] focus:bg-white focus:outline-none"
              >
                {sortedSemesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="predictor-course"
                className="block text-xs font-extrabold text-[#29232D] mb-1.5"
              >
                2. Select Course
              </label>
              <select
                id="predictor-course"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                disabled={semesterCourses.length === 0}
                className="w-full rounded-xl border-2 border-[#29232D] bg-[#F5F3F2] px-3 py-2.5 text-sm font-bold text-[#29232D] focus:bg-white focus:outline-none disabled:opacity-50"
              >
                {semesterCourses.length === 0 ? (
                  <option value="">No courses in this semester</option>
                ) : (
                  semesterCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name} ({c.credits} cr)
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {activeCourse && (
            <div className="pt-4 border-t-2 border-[#29232D]/15 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#29232D]">
                  3. Expected Assessment Marks
                </span>
                <span className="rounded-lg border-2 border-[#29232D] bg-[#FCE2DE] px-2.5 py-0.5 text-xs font-mono font-extrabold tabular-nums text-[#29232D]">
                  Internal: {internalTotal}/30
                </span>
              </div>

              {internalTotal < rules.minInternalMarks && (
                <div className="flex items-start gap-2 rounded-xl border-2 border-[#29232D] bg-[#FFF4D6] px-3 py-2.5 text-xs font-bold text-[#29232D]">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[#B45309]" />
                  <span>
                    Internal marks ({internalTotal}/30) are below the {rules.minInternalMarks}-mark minimum required to sit for the final exam without a retake.
                  </span>
                </div>
              )}

              {/* Midterm 1 */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="slider-m1" className="font-bold text-[#29232D]">
                    Midterm 1 (Max 10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={mid1}
                    onChange={(e) =>
                      setMid1(Math.max(0, Math.min(10, Number(e.target.value) || 0)))
                    }
                    className="w-16 rounded-lg border-2 border-[#29232D] px-2 py-0.5 text-right font-mono text-xs font-bold tabular-nums text-[#29232D]"
                  />
                </div>
                <input
                  id="slider-m1"
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={mid1}
                  onChange={(e) => setMid1(Number(e.target.value))}
                  className="w-full accent-[#7955A1] cursor-pointer"
                />
              </div>

              {/* Midterm 2 */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="slider-m2" className="font-bold text-[#29232D]">
                    Midterm 2 (Max 10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={mid2}
                    onChange={(e) =>
                      setMid2(Math.max(0, Math.min(10, Number(e.target.value) || 0)))
                    }
                    className="w-16 rounded-lg border-2 border-[#29232D] px-2 py-0.5 text-right font-mono text-xs font-bold tabular-nums text-[#29232D]"
                  />
                </div>
                <input
                  id="slider-m2"
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={mid2}
                  onChange={(e) => setMid2(Number(e.target.value))}
                  className="w-full accent-[#7955A1] cursor-pointer"
                />
              </div>

              {/* Attendance */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="slider-att" className="font-bold text-[#29232D]">
                    Attendance (Max 10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={attendance}
                    onChange={(e) =>
                      setAttendance(
                        Math.max(0, Math.min(10, Number(e.target.value) || 0))
                      )
                    }
                    className="w-16 rounded-lg border-2 border-[#29232D] px-2 py-0.5 text-right font-mono text-xs font-bold tabular-nums text-[#29232D]"
                  />
                </div>
                <input
                  id="slider-att"
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={attendance}
                  onChange={(e) => setAttendance(Number(e.target.value))}
                  className="w-full accent-[#7955A1] cursor-pointer"
                />
              </div>

              {/* Final Exam */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="slider-fin" className="font-bold text-[#29232D]">
                    Expected Final Exam (Max 70)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="70"
                    step="0.5"
                    value={finalExam}
                    onChange={(e) =>
                      setFinalExam(
                        Math.max(0, Math.min(70, Number(e.target.value) || 0))
                      )
                    }
                    className="w-16 rounded-lg border-2 border-[#29232D] px-2 py-0.5 text-right font-mono text-xs font-bold tabular-nums text-[#29232D]"
                  />
                </div>
                <input
                  id="slider-fin"
                  type="range"
                  min="0"
                  max="70"
                  step="0.5"
                  value={finalExam}
                  onChange={(e) => setFinalExam(Number(e.target.value))}
                  className="w-full accent-[#7955A1] cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t-2 border-[#29232D]/15 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSaveToCourse}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-[#29232D] bg-[#7955A1] px-4 py-2.5 text-xs font-bold text-white shadow-[3px_3px_0_#29232D] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#29232D] transition-all whitespace-nowrap"
                >
                  {savedNotice ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Saved to Course
                    </>
                  ) : (
                    'Apply Marks to Course'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleResetToCourse}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#29232D] bg-white px-3 py-2.5 text-xs font-bold text-[#29232D] hover:bg-[#FCE2DE] whitespace-nowrap"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right Output & Scenario Comparison (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Prediction Summary Metrics */}
          <section className="rounded-[22px] border-2 border-[#29232D] bg-white p-5 sm:p-6 shadow-[4px_4px_0_#29232D]">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b-2 border-[#29232D]/10">
              <div>
                <h3 className="font-display text-base font-extrabold text-[#29232D]">
                  {activeCourse
                    ? `${activeCourse.code} · ${activeCourse.name}`
                    : 'Prediction Output'}
                </h3>
                <p className="text-xs font-medium text-[#29232D]/70 mt-0.5">
                  Live weighted projection based on {activeCourse?.credits ?? 0} credit hours
                </p>
              </div>
              <span className="rounded-lg border-2 border-[#29232D] bg-[#FFF4D6] px-2.5 py-1 text-xs font-mono font-bold text-[#29232D]">
                10 + 10 + 10 + 70 = 100
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="rounded-2xl border-2 border-[#29232D] bg-[#F5F3F2] p-3">
                <p className="text-[11px] font-bold text-[#29232D]/70">Predicted Total</p>
                <p className="mt-1 font-display text-2xl font-extrabold text-[#29232D] tabular-nums">
                  {predictedTotal}
                  <span className="text-xs font-semibold text-[#29232D]/60">/100</span>
                </p>
              </div>

              <div className="rounded-2xl border-2 border-[#29232D] bg-[#F8D0CC] p-3">
                <p className="text-[11px] font-bold text-[#29232D]/70">Letter Grade</p>
                <p
                  className={`mt-1 font-display text-2xl font-extrabold ${
                    predictedGrade.point === 0
                      ? 'text-[#991B1B]'
                      : predictedGrade.point < rules.improvementMaxPoint
                        ? 'text-[#92400E]'
                        : 'text-[#29232D]'
                  }`}
                >
                  {predictedGrade.letter}
                </p>
              </div>

              <div className="rounded-2xl border-2 border-[#29232D] bg-[#FBE8A6] p-3">
                <p className="text-[11px] font-bold text-[#29232D]/70">Grade Point</p>
                <p className="mt-1 font-display text-2xl font-extrabold text-[#29232D] tabular-nums">
                  {predictedGrade.point.toFixed(2)}
                </p>
              </div>

              <div className="rounded-2xl border-2 border-[#29232D] bg-[#E5D8F3] p-3">
                <p className="text-[11px] font-bold text-[#29232D]/70">Est. Sem GPA</p>
                <p className="mt-1 font-display text-2xl font-extrabold text-[#29232D] tabular-nums">
                  {simulation.semGpa !== null ? simulation.semGpa.toFixed(2) : '—'}
                </p>
                {baselineSemStats.gpa !== null && (
                  <p className="text-[11px] text-[#29232D]/70 font-mono font-semibold tabular-nums">
                    Curr: {baselineSemStats.gpa.toFixed(2)}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border-2 border-[#29232D] bg-[#7955A1] p-3 text-white">
                <p className="text-[11px] font-bold text-white/80">Est. CGPA</p>
                <p className="mt-1 font-display text-2xl font-extrabold text-[#F6D36B] tabular-nums">
                  {simulation.cgpa.toFixed(2)}
                </p>
                <p className="text-[11px] font-mono font-bold text-white/90 tabular-nums">
                  {cgpaDelta >= 0 ? '+' : ''}
                  {cgpaDelta.toFixed(2)} vs curr
                </p>
              </div>
            </div>
          </section>

          {/* Scenario Comparison */}
          <section className="rounded-[22px] border-2 border-[#29232D] bg-white p-5 sm:p-6 shadow-[4px_4px_0_#29232D] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-base font-extrabold text-[#29232D]">
                  Final Exam Scenario Comparison
                </h3>
                <p className="text-xs font-medium text-[#29232D]/70 mt-0.5">
                  Compare how different final examination scores impact your grade and cumulative CGPA
                </p>
              </div>
              <button
                type="button"
                onClick={addScenario}
                disabled={scenarios.length >= 6}
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#29232D] bg-[#F6D36B] px-3 py-1.5 text-xs font-extrabold text-[#29232D] hover:bg-[#FCE2DE] disabled:opacity-40 whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Scenario
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#29232D] text-[11px] font-extrabold uppercase tracking-wide text-[#29232D]">
                    <th className="py-2.5 pr-3">Scenario</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Final (/70)</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Total (/100)</th>
                    <th className="py-2.5 px-3 text-right">Grade</th>
                    <th className="py-2.5 px-3 text-right">GP</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Sem GPA</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Est. CGPA</th>
                    <th className="py-2.5 pl-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-[#29232D]/10 text-xs">
                  {scenarioRows.map((row) => (
                    <tr key={row.id} className="hover:bg-[#FCE2DE]/30">
                      <td className="py-2.5 pr-3">
                        <input
                          type="text"
                          value={row.label}
                          onChange={(e) =>
                            setScenarios((prev) =>
                              prev.map((s) =>
                                s.id === row.id ? { ...s, label: e.target.value } : s
                              )
                            )
                          }
                          className="w-28 rounded-lg border-2 border-transparent hover:border-[#29232D]/40 focus:border-[#29232D] px-1.5 py-1 font-bold text-[#29232D] focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          max="70"
                          value={row.finalMarks}
                          onChange={(e) => {
                            const val = Math.max(
                              0,
                              Math.min(70, Number(e.target.value) || 0)
                            );
                            setScenarios((prev) =>
                              prev.map((s) =>
                                s.id === row.id ? { ...s, finalMarks: val } : s
                              )
                            );
                          }}
                          className="w-16 rounded-lg border-2 border-[#29232D] px-2 py-1 text-right font-mono font-bold tabular-nums text-[#29232D] focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-[#29232D]">
                        {row.total}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-[#29232D]">
                        {row.letter}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-[#29232D]">
                        {row.point.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-[#29232D]">
                        {row.semGpa.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold tabular-nums text-[#7955A1]">
                        {row.cgpa.toFixed(2)}
                      </td>
                      <td className="py-2.5 pl-2 text-right">
                        {scenarios.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setScenarios((prev) => prev.filter((s) => s.id !== row.id))
                            }
                            className="rounded-lg p-1 text-[#29232D]/60 hover:bg-[#F8D0CC] hover:text-[#991B1B]"
                            aria-label={`Remove ${row.label}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {scenarioRows.length > 0 && (
              <div className="h-[190px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={scenarioRows}
                    margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid stroke="#29232D" strokeOpacity={0.12} strokeDasharray="4 4" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#29232D', fontSize: 12, fontWeight: 700 }}
                      axisLine={{ stroke: '#29232D' }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[2.0, 4.0]}
                      ticks={[2.0, 2.5, 3.0, 3.5, 4.0]}
                      tick={{ fill: '#29232D', fontSize: 12, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => Number(v).toFixed(1)}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const d = payload[0].payload as (typeof scenarioRows)[number];
                        return (
                          <div className="rounded-xl border-2 border-[#29232D] bg-white px-3 py-2 shadow-[3px_3px_0_#29232D] text-xs font-mono tabular-nums">
                            <p className="font-display font-extrabold text-[#29232D]">{d.label}</p>
                            <p className="text-[#29232D]/80 font-semibold mt-1">
                              Final: {d.finalMarks}/70 · Grade: {d.letter} ({d.point.toFixed(2)})
                            </p>
                            <p className="text-[#7955A1] font-bold">
                              Sem GPA: {d.semGpa.toFixed(2)} · CGPA: {d.cgpa.toFixed(2)}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="cgpa" radius={[8, 8, 0, 0]} maxBarSize={48} stroke="#29232D" strokeWidth={2}>
                      {scenarioRows.map((_, idx) => (
                        <Cell
                          key={idx}
                          fill={SCENARIO_COLORS[idx % SCENARIO_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
