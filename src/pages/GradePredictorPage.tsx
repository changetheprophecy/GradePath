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
  getCourseInternalSummary,
  getCourseMaxTotalMarks,
  getGradeFromMarks,
} from '../utils/calculations';
import { AssessmentComponent } from '../types/academic';

interface ScenarioRowConfig {
  id: string;
  label: string;
  targetMarks: number;
}

const SCENARIO_COLORS = ['#75B9DF', '#F29A9C', '#7955A1', '#A7D9AE', '#F6D36B', '#A88BC5'];

function buildInitialDraftMarks(assessments: AssessmentComponent[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const comp of assessments) {
    map[comp.id] =
      comp.obtainedMarks !== null
        ? comp.obtainedMarks
        : Math.round(comp.maxMarks * 0.75 * 2) / 2;
  }
  return map;
}

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

  const [draftMarks, setDraftMarks] = useState<Record<string, number>>(() =>
    activeCourse ? buildInitialDraftMarks(activeCourse.assessments) : {}
  );
  const [savedNotice, setSavedNotice] = useState(false);

  // Identify the primary scenario assessment (prefer 'final' exam component, fallback to last assessment)
  const scenarioComp = useMemo(() => {
    if (!activeCourse || activeCourse.assessments.length === 0) return null;
    return (
      activeCourse.assessments.find((a) => a.kind === 'final') ??
      activeCourse.assessments[activeCourse.assessments.length - 1]
    );
  }, [activeCourse]);

  const [scenarios, setScenarios] = useState<ScenarioRowConfig[]>([
    { id: 'sc-1', label: 'Conservative', targetMarks: 40 },
    { id: 'sc-2', label: 'Target', targetMarks: 52 },
    { id: 'sc-3', label: 'Stretch', targetMarks: 60 },
  ]);

  // Sync draft marks and scenario scale whenever the active course changes
  useEffect(() => {
    if (activeCourse) {
      setDraftMarks(buildInitialDraftMarks(activeCourse.assessments));
      setSavedNotice(false);
      const primary =
        activeCourse.assessments.find((a) => a.kind === 'final') ??
        activeCourse.assessments[activeCourse.assessments.length - 1];
      if (primary) {
        const max = primary.maxMarks;
        setScenarios([
          { id: 'sc-1', label: 'Conservative', targetMarks: Math.round(max * 0.6 * 2) / 2 },
          { id: 'sc-2', label: 'Target', targetMarks: Math.round(max * 0.75 * 2) / 2 },
          { id: 'sc-3', label: 'Stretch', targetMarks: Math.round(max * 0.88 * 2) / 2 },
        ]);
      }
    }
  }, [activeCourse?.id, activeCourse?.assessments.length]);

  const simulatedAssessments = useMemo(() => {
    if (!activeCourse) return [];
    return activeCourse.assessments.map((comp) => ({
      ...comp,
      obtainedMarks:
        draftMarks[comp.id] !== undefined
          ? Math.max(0, Math.min(comp.maxMarks, draftMarks[comp.id]))
          : comp.obtainedMarks ?? 0,
    }));
  }, [activeCourse, draftMarks]);

  const maxTotalMarks = useMemo(
    () => (activeCourse ? getCourseMaxTotalMarks(activeCourse) : 100),
    [activeCourse]
  );

  const predictedTotal = useMemo(() => {
    return Math.round(
      simulatedAssessments.reduce((sum, a) => sum + (a.obtainedMarks ?? 0), 0) * 100
    ) / 100;
  }, [simulatedAssessments]);

  const predictedPercentage = useMemo(() => {
    if (maxTotalMarks <= 0) return 0;
    return Math.round((predictedTotal / maxTotalMarks) * 10000) / 100;
  }, [predictedTotal, maxTotalMarks]);

  const predictedGrade = getGradeFromMarks(predictedPercentage, gradeScale);

  const internalSummary = useMemo(
    () => getCourseInternalSummary({ assessments: simulatedAssessments }),
    [simulatedAssessments]
  );

  const distributionFormula = useMemo(() => {
    if (!activeCourse || activeCourse.assessments.length === 0) return '—';
    const parts = activeCourse.assessments.map((a) => a.maxMarks);
    return `${parts.join(' + ')} = ${maxTotalMarks}`;
  }, [activeCourse, maxTotalMarks]);

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
            assessments: simulatedAssessments,
            totalMarksOverride: null,
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
    simulatedAssessments,
    courses,
    gradeScale,
    rules,
    predictedGrade.point,
    baselineCgpa.cgpa,
  ]);

  const otherMarksSum = useMemo(() => {
    if (!scenarioComp) return predictedTotal;
    return Math.round(
      simulatedAssessments
        .filter((a) => a.id !== scenarioComp.id)
        .reduce((sum, a) => sum + (a.obtainedMarks ?? 0), 0) * 100
    ) / 100;
  }, [simulatedAssessments, scenarioComp, predictedTotal]);

  const scenarioRows = useMemo(() => {
    if (!activeCourse || !scenarioComp) return [];
    return scenarios.map((sc) => {
      const clampedTarget = Math.max(0, Math.min(scenarioComp.maxMarks, sc.targetMarks));
      const total = Math.round((otherMarksSum + clampedTarget) * 100) / 100;
      const pct = maxTotalMarks > 0 ? Math.round((total / maxTotalMarks) * 10000) / 100 : 0;
      const grade = getGradeFromMarks(pct, gradeScale);
      const scenarioAssessments = simulatedAssessments.map((a) =>
        a.id === scenarioComp.id ? { ...a, obtainedMarks: clampedTarget } : a
      );
      const simulatedSemCourses = semesterCourses.map((c) =>
        c.id === activeCourse.id
          ? {
              ...c,
              assessments: scenarioAssessments,
              totalMarksOverride: null,
            }
          : c
      );
      const semRes = calculateSemesterGPA(simulatedSemCourses, gradeScale);
      const cgpaRes = calculateCumulativeCGPA(courses, gradeScale, rules, {
        [activeCourse.id]: grade.point,
      });
      return {
        ...sc,
        targetMarks: clampedTarget,
        total,
        pct,
        letter: grade.letter,
        point: grade.point,
        semGpa: semRes.gpa ?? 0,
        cgpa: cgpaRes.cgpa,
      };
    });
  }, [
    scenarios,
    activeCourse,
    scenarioComp,
    otherMarksSum,
    maxTotalMarks,
    gradeScale,
    simulatedAssessments,
    semesterCourses,
    courses,
    rules,
  ]);

  const handleComponentDraftChange = (comp: AssessmentComponent, rawNum: number) => {
    const safe = Number.isNaN(rawNum) ? 0 : Math.max(0, Math.min(comp.maxMarks, rawNum));
    setDraftMarks((prev) => ({
      ...prev,
      [comp.id]: Math.round(safe * 100) / 100,
    }));
  };

  const handleSaveToCourse = () => {
    if (!activeCourse) return;
    updateCourse(
      activeCourse.id,
      {
        assessments: simulatedAssessments,
        totalMarksOverride: null,
      },
      `Predicted marks saved for ${activeCourse.name}`
    );
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleResetToCourse = () => {
    if (!activeCourse) return;
    setDraftMarks(buildInitialDraftMarks(activeCourse.assessments));
  };

  const addScenario = () => {
    if (scenarios.length >= 6 || !scenarioComp) return;
    const step = Math.max(1, Math.round(scenarioComp.maxMarks * 0.08));
    setScenarios((prev) => [
      ...prev,
      {
        id: `sc-${Date.now()}`,
        label: `Scenario ${prev.length + 1}`,
        targetMarks: Math.min(
          scenarioComp.maxMarks,
          (prev[prev.length - 1]?.targetMarks ?? Math.round(scenarioComp.maxMarks * 0.7)) + step
        ),
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
          Grade Predictor uses your course&apos;s configured assessment structure and credit hours to project semester GPA and CGPA.
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
          Experiment with expected marks across every configured assessment component to forecast your course grade, percentage, semester GPA, and cumulative CGPA.
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-[#29232D]">
                  3. Expected Assessment Marks
                </span>
                {internalSummary.max > 0 && (
                  <span className="rounded-lg border-2 border-[#29232D] bg-[#FCE2DE] px-2.5 py-0.5 text-xs font-mono font-extrabold tabular-nums text-[#29232D]">
                    Internal: {internalSummary.obtained}/{internalSummary.max} (
                    {Math.round(internalSummary.percentage ?? 0)}%)
                  </span>
                )}
              </div>

              {internalSummary.max > 0 &&
                (internalSummary.percentage ?? 0) < rules.minInternalPercent && (
                  <div className="flex items-start gap-2 rounded-xl border-2 border-[#29232D] bg-[#FFF4D6] px-3 py-2.5 text-xs font-bold text-[#29232D]">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[#B45309]" />
                    <span>
                      Internal marks ({internalSummary.obtained}/{internalSummary.max},{' '}
                      {Math.round(internalSummary.percentage ?? 0)}%) are below the{' '}
                      {rules.minInternalPercent}% minimum required without a retake.
                    </span>
                  </div>
                )}

              {activeCourse.assessments.map((comp) => {
                const val = draftMarks[comp.id] ?? 0;
                const isRecorded = comp.obtainedMarks !== null;

                return (
                  <div key={comp.id}>
                    <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <label
                          htmlFor={`slider-${comp.id}`}
                          className="font-bold text-[#29232D] truncate"
                        >
                          {comp.name} (Max {comp.maxMarks})
                        </label>
                        <span
                          className={`rounded-md border border-[#29232D]/30 px-1.5 py-0.5 text-[10px] font-bold shrink-0 ${
                            isRecorded
                              ? 'bg-[#DDF3E0] text-[#29232D]'
                              : 'bg-[#FFF4D6] text-[#92400E]'
                          }`}
                        >
                          {isRecorded ? 'Recorded' : 'Expected'}
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={comp.maxMarks}
                        step="0.5"
                        value={val}
                        onChange={(e) =>
                          handleComponentDraftChange(comp, Number(e.target.value))
                        }
                        aria-label={`${comp.name} predicted score`}
                        className="w-16 rounded-lg border-2 border-[#29232D] px-2 py-0.5 text-right font-mono text-xs font-bold tabular-nums text-[#29232D]"
                      />
                    </div>
                    <input
                      id={`slider-${comp.id}`}
                      type="range"
                      min="0"
                      max={comp.maxMarks}
                      step="0.5"
                      value={val}
                      onChange={(e) =>
                        handleComponentDraftChange(comp, Number(e.target.value))
                      }
                      className="w-full accent-[#7955A1] cursor-pointer"
                    />
                  </div>
                );
              })}

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
                {distributionFormula}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="rounded-2xl border-2 border-[#29232D] bg-[#F5F3F2] p-3">
                <p className="text-[11px] font-bold text-[#29232D]/70">Predicted Total</p>
                <p className="mt-1 font-display text-2xl font-extrabold text-[#29232D] tabular-nums">
                  {predictedTotal}
                  <span className="text-xs font-semibold text-[#29232D]/60">
                    /{maxTotalMarks}
                  </span>
                </p>
                <p className="text-[11px] font-mono font-bold text-[#7955A1] tabular-nums">
                  {predictedPercentage.toFixed(1)}%
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
          {scenarioComp && (
            <section className="rounded-[22px] border-2 border-[#29232D] bg-white p-5 sm:p-6 shadow-[4px_4px_0_#29232D] space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-base font-extrabold text-[#29232D]">
                    {scenarioComp.name} Scenario Comparison
                  </h3>
                  <p className="text-xs font-medium text-[#29232D]/70 mt-0.5">
                    Compare how different scores in {scenarioComp.name} (/{scenarioComp.maxMarks}) impact your grade and cumulative CGPA
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
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">
                        {scenarioComp.name} (/{scenarioComp.maxMarks})
                      </th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">
                        Total (/{maxTotalMarks})
                      </th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Pct</th>
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
                            max={scenarioComp.maxMarks}
                            step="0.5"
                            value={row.targetMarks}
                            onChange={(e) => {
                              const val = Math.max(
                                0,
                                Math.min(
                                  scenarioComp.maxMarks,
                                  Number(e.target.value) || 0
                                )
                              );
                              setScenarios((prev) =>
                                prev.map((s) =>
                                  s.id === row.id ? { ...s, targetMarks: val } : s
                                )
                              );
                            }}
                            className="w-16 rounded-lg border-2 border-[#29232D] px-2 py-1 text-right font-mono font-bold tabular-nums text-[#29232D] focus:outline-none"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-[#29232D]">
                          {row.total}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-[#7955A1]">
                          {row.pct.toFixed(1)}%
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
                                {scenarioComp.name}: {d.targetMarks}/{scenarioComp.maxMarks} · {d.pct.toFixed(1)}% · Grade: {d.letter} ({d.point.toFixed(2)})
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
          )}
        </div>
      </div>
    </div>
  );
}
