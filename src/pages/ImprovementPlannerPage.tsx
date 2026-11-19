import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  SlidersHorizontal,
  TrendingUp,
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
  evaluateCourseForImprovement,
  getLetterFromPoint,
  ImprovementEligibilityStatus,
} from '../utils/calculations';
import { ReplacementPolicy } from '../types/academic';

const TARGET_GRADE_OPTIONS = [4.0, 3.75, 3.5, 3.25, 3.0];

export function ImprovementPlannerPage() {
  const {
    profile,
    semesters,
    courses,
    gradeScale,
    rules,
    cgpaSummary,
    updateRules,
    applyImprovementToCourse,
    updateCourse,
  } = useAcademic();

  const [filterStatus, setFilterStatus] = useState<'actionable' | 'all' | ImprovementEligibilityStatus>('actionable');
  const [showRulesPanel, setShowRulesPanel] = useState(false);

  const currentSemNumber = useMemo(() => {
    const inProg = semesters.find((s) => s.status === 'in_progress');
    if (inProg) return inProg.number;
    return profile.currentSemester || Math.max(1, ...semesters.map((s) => s.number));
  }, [semesters, profile.currentSemester]);

  const evaluations = useMemo(() => {
    return courses
      .map((course) => {
        const sem = semesters.find((s) => s.id === course.semesterId);
        return evaluateCourseForImprovement(
          course,
          sem,
          currentSemNumber,
          gradeScale,
          rules
        );
      })
      .sort((a, b) => {
        const priority: Record<ImprovementEligibilityStatus, number> = {
          eligible_improvement: 0,
          retake_required: 1,
          window_expired: 2,
          already_improved: 3,
          in_progress: 4,
          not_needed: 5,
        };
        return priority[a.status] - priority[b.status] || a.semesterNumber - b.semesterNumber;
      });
  }, [courses, semesters, currentSemNumber, gradeScale, rules]);

  const actionableEvaluations = useMemo(
    () =>
      evaluations.filter(
        (e) =>
          e.status === 'eligible_improvement' ||
          e.status === 'retake_required' ||
          e.status === 'already_improved'
      ),
    [evaluations]
  );

  const filteredEvaluations = useMemo(() => {
    if (filterStatus === 'all') return evaluations;
    if (filterStatus === 'actionable') return actionableEvaluations;
    return evaluations.filter((e) => e.status === filterStatus);
  }, [evaluations, actionableEvaluations, filterStatus]);

  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => {
    const firstEligible =
      evaluations.find((e) => e.status === 'eligible_improvement') ??
      evaluations.find((e) => e.status === 'retake_required') ??
      evaluations[0];
    return firstEligible?.course.id ?? '';
  });

  const selectedEval = useMemo(
    () =>
      evaluations.find((e) => e.course.id === selectedCourseId) ??
      actionableEvaluations[0] ??
      evaluations[0] ??
      null,
    [evaluations, selectedCourseId, actionableEvaluations]
  );

  const [targetGradePoint, setTargetGradePoint] = useState<number>(3.75);

  const projectedSummary = useMemo(() => {
    if (!selectedEval) {
      return { cgpa: cgpaSummary.cgpa, diff: 0 };
    }
    const result = calculateCumulativeCGPA(courses, gradeScale, rules, {
      [selectedEval.course.id]: targetGradePoint,
    });
    return {
      cgpa: result.cgpa,
      diff: result.cgpa - cgpaSummary.cgpa,
    };
  }, [selectedEval, courses, gradeScale, rules, targetGradePoint, cgpaSummary.cgpa]);

  const comparisonChartData = useMemo(() => {
    if (!selectedEval) return [];
    const baseRow = {
      name: 'Current CGPA',
      cgpa: Number(cgpaSummary.cgpa.toFixed(3)),
      isProjected: false,
    };
    const projectedRow = {
      name: `Target (${getLetterFromPoint(targetGradePoint, gradeScale)})`,
      cgpa: Number(projectedSummary.cgpa.toFixed(3)),
      isProjected: true,
    };
    return [baseRow, projectedRow];
  }, [selectedEval, cgpaSummary.cgpa, projectedSummary.cgpa, targetGradePoint, gradeScale]);

  const sensitivityRows = useMemo(() => {
    if (!selectedEval) return [];
    return TARGET_GRADE_OPTIONS.map((gp) => {
      const sim = calculateCumulativeCGPA(courses, gradeScale, rules, {
        [selectedEval.course.id]: gp,
      });
      return {
        point: gp,
        letter: getLetterFromPoint(gp, gradeScale),
        cgpa: sim.cgpa,
        diff: sim.cgpa - cgpaSummary.cgpa,
      };
    });
  }, [selectedEval, courses, gradeScale, rules, cgpaSummary.cgpa]);

  const statusBadgeClass = (status: ImprovementEligibilityStatus) => {
    switch (status) {
      case 'eligible_improvement':
        return 'bg-[#E5D8F3] text-[#29232D]';
      case 'retake_required':
        return 'bg-[#F29A9C] text-[#29232D]';
      case 'already_improved':
        return 'bg-[#A7D9AE] text-[#29232D]';
      case 'window_expired':
        return 'bg-[#F5F3F2] text-[#29232D]/70';
      default:
        return 'bg-[#F5F3F2] text-[#29232D]/70';
    }
  };

  if (courses.length === 0) {
    return (
      <div className="rounded-[22px] border-2 border-[#29232D] bg-white px-6 py-14 text-center shadow-[4px_4px_0_#29232D]">
        <h2 className="font-display text-lg font-extrabold text-[#29232D]">
          No courses available for improvement planning
        </h2>
        <p className="mt-1 text-sm font-medium text-[#29232D]/70">
          Add completed courses with marks to identify improvement eligibility and simulate CGPA gains.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[22px] border-2 border-[#29232D] bg-white p-5 sm:p-6 shadow-[4px_4px_0_#29232D] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#29232D]">
            Improvement &amp; Retake Planner
          </h2>
          <p className="mt-1 text-sm font-medium text-[#29232D]/75">
            Identify eligible courses under university regulations and simulate weighted CGPA impact before registering.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowRulesPanel((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-xl border-2 border-[#29232D] px-4 py-2 text-xs font-bold transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto ${
            showRulesPanel
              ? 'bg-[#F6D36B] text-[#29232D]'
              : 'bg-[#FCE2DE] text-[#29232D] hover:bg-[#F8D0CC]'
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Configure Academic Rules
        </button>
      </div>

      {/* Configurable University Policy Panel */}
      {showRulesPanel && (
        <section className="rounded-[22px] border-2 border-[#29232D] bg-[#FFF4D6] p-5 sm:p-6 shadow-[4px_4px_0_#29232D]">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#29232D]/15">
            <div>
              <h3 className="font-display text-sm font-extrabold text-[#29232D]">
                University Improvement &amp; Retake Regulations
              </h3>
              <p className="text-xs font-medium text-[#29232D]/75 mt-0.5">
                Adjust thresholds and replacement policy to match your institution&apos;s academic handbook.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#29232D] mb-1.5">
                Improvement Threshold (&lt; GP)
              </label>
              <input
                type="number"
                step="0.25"
                min="2.0"
                max="4.0"
                value={rules.improvementMaxPoint}
                onChange={(e) =>
                  updateRules({ improvementMaxPoint: Number(e.target.value) || 3.0 })
                }
                className="w-full rounded-xl border-2 border-[#29232D] bg-white px-3 py-2 text-sm font-mono font-bold tabular-nums text-[#29232D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#29232D] mb-1.5">
                Improvement Window (Batches)
              </label>
              <input
                type="number"
                min="1"
                max="8"
                value={rules.improvementBatchWindow}
                onChange={(e) =>
                  updateRules({
                    improvementBatchWindow: Math.max(1, Number(e.target.value) || 1),
                  })
                }
                className="w-full rounded-xl border-2 border-[#29232D] bg-white px-3 py-2 text-sm font-mono font-bold tabular-nums text-[#29232D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#29232D] mb-1.5">
                Retake Window (Batches)
              </label>
              <input
                type="number"
                min="1"
                max="8"
                value={rules.retakeBatchWindow}
                onChange={(e) =>
                  updateRules({
                    retakeBatchWindow: Math.max(1, Number(e.target.value) || 2),
                  })
                }
                className="w-full rounded-xl border-2 border-[#29232D] bg-white px-3 py-2 text-sm font-mono font-bold tabular-nums text-[#29232D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#29232D] mb-1.5">
                Min Internal Marks (/30)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={rules.minInternalMarks}
                onChange={(e) =>
                  updateRules({
                    minInternalMarks: Math.max(0, Math.min(30, Number(e.target.value) || 0)),
                  })
                }
                className="w-full rounded-xl border-2 border-[#29232D] bg-white px-3 py-2 text-sm font-mono font-bold tabular-nums text-[#29232D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#29232D] mb-1.5">
                CGPA Replacement Policy
              </label>
              <select
                value={rules.replacementPolicy}
                onChange={(e) =>
                  updateRules({ replacementPolicy: e.target.value as ReplacementPolicy })
                }
                className="w-full rounded-xl border-2 border-[#29232D] bg-white px-3 py-2 text-sm font-bold text-[#29232D]"
              >
                <option value="replace_old">Replace Old Grade</option>
                <option value="best_grade">Best Grade Wins</option>
                <option value="average_attempts">Average of Attempts</option>
              </select>
            </div>
          </div>
        </section>
      )}

      {/* Main Split: Left Course Eligibility List, Right Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Course Eligibility Table (7 cols) */}
        <section className="lg:col-span-7 rounded-[22px] border-2 border-[#29232D] bg-white overflow-hidden shadow-[4px_4px_0_#29232D]">
          <div className="p-5 border-b-2 border-[#29232D]/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-extrabold text-[#29232D]">
                Course Eligibility Audit
              </h3>
              <p className="text-xs font-medium text-[#29232D]/70 mt-0.5">
                Click any course to simulate its impact on your cumulative CGPA
              </p>
            </div>

            <div className="inline-flex items-center gap-1 rounded-xl border-2 border-[#29232D] bg-[#F5F3F2] p-1 self-start">
              {(
                [
                  { id: 'actionable', label: 'Actionable' },
                  { id: 'eligible_improvement', label: 'Eligible' },
                  { id: 'retake_required', label: 'Retake' },
                  { id: 'all', label: 'All' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterStatus(tab.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors whitespace-nowrap ${
                    filterStatus === tab.id
                      ? 'bg-[#F6D36B] text-[#29232D] border border-[#29232D]'
                      : 'text-[#29232D]/75 hover:text-[#29232D]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y-2 divide-[#29232D]/10 max-h-[560px] overflow-y-auto">
            {filteredEvaluations.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm font-semibold text-[#29232D]/60">
                No courses match this filter under current university regulations.
              </p>
            ) : (
              filteredEvaluations.map((ev) => {
                const isSelected = selectedEval?.course.id === ev.course.id;
                return (
                  <button
                    key={ev.course.id}
                    type="button"
                    onClick={() => setSelectedCourseId(ev.course.id)}
                    className={`w-full text-left px-5 py-4 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                      isSelected ? 'bg-[#FCE2DE]' : 'hover:bg-[#F5F3F2]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-extrabold text-[#7955A1]">
                          {ev.course.code}
                        </span>
                        <span className="text-[#29232D]/30">·</span>
                        <span className="font-semibold text-[#29232D]/75">{ev.semesterName}</span>
                        <span className="text-[#29232D]/30">·</span>
                        <span className="font-mono font-semibold text-[#29232D]/75 tabular-nums">
                          {ev.course.credits} cr
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-extrabold text-[#29232D]">
                        {ev.course.name}
                      </p>
                      <p className="mt-1 text-xs font-medium text-[#29232D]/70 leading-relaxed">
                        {ev.reason}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                      <div className="text-right font-mono tabular-nums">
                        <span className="text-sm font-extrabold text-[#29232D]">
                          {ev.originalLetter ?? 'Pending'}
                        </span>
                        {ev.originalPoint !== null && (
                          <span className="ml-1.5 text-xs font-bold text-[#29232D]/65">
                            ({ev.originalPoint.toFixed(2)})
                          </span>
                        )}
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 rounded-lg border border-[#29232D] px-2 py-0.5 text-xs font-bold whitespace-nowrap ${statusBadgeClass(
                          ev.status
                        )}`}
                      >
                        {ev.status === 'eligible_improvement' && (
                          <TrendingUp className="h-3.5 w-3.5" />
                        )}
                        {ev.status === 'retake_required' && (
                          <AlertTriangle className="h-3.5 w-3.5" />
                        )}
                        {ev.status === 'already_improved' && (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        {ev.status === 'window_expired' && (
                          <Clock className="h-3.5 w-3.5" />
                        )}
                        {ev.statusLabel}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* CGPA Impact Simulator (5 cols) */}
        <section className="lg:col-span-5 rounded-[22px] border-2 border-[#29232D] bg-white p-5 sm:p-6 shadow-[4px_4px_0_#29232D] space-y-5">
          {selectedEval ? (
            <>
              <div className="pb-4 border-b-2 border-[#29232D]/10">
                <span className="inline-block rounded-lg border border-[#29232D] bg-[#E5D8F3] px-2 py-0.5 text-[11px] font-extrabold text-[#29232D]">
                  Selected for Simulation
                </span>
                <h3 className="mt-2 font-display text-base font-extrabold text-[#29232D]">
                  {selectedEval.course.code} — {selectedEval.course.name}
                </h3>
                <p className="mt-0.5 text-xs font-semibold text-[#29232D]/70">
                  {selectedEval.semesterName} · {selectedEval.course.credits} credits · Policy:{' '}
                  {rules.replacementPolicy === 'replace_old'
                    ? 'Replace Old Grade'
                    : rules.replacementPolicy === 'best_grade'
                      ? 'Best Grade Wins'
                      : 'Average of Attempts'}
                </p>
              </div>

              {/* Target Grade Picker */}
              <div>
                <label className="block text-xs font-extrabold text-[#29232D] mb-2">
                  Target Improvement Grade Point
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {TARGET_GRADE_OPTIONS.map((gp) => {
                    const letter = getLetterFromPoint(gp, gradeScale);
                    const active = Math.abs(targetGradePoint - gp) < 0.01;
                    return (
                      <button
                        key={gp}
                        type="button"
                        onClick={() => setTargetGradePoint(gp)}
                        className={`rounded-xl border-2 border-[#29232D] py-2 text-center transition-all ${
                          active
                            ? 'bg-[#7955A1] text-white shadow-[2px_2px_0_#29232D]'
                            : 'bg-white text-[#29232D] hover:bg-[#FCE2DE]'
                        }`}
                      >
                        <div className="text-xs font-extrabold font-mono">{letter}</div>
                        <div
                          className={`text-[11px] font-mono font-bold tabular-nums ${
                            active ? 'text-[#F6D36B]' : 'text-[#29232D]/65'
                          }`}
                        >
                          {gp.toFixed(2)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comparison Metrics */}
              <div className="rounded-2xl border-2 border-[#29232D] bg-[#FCE2DE] p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-bold text-[#29232D]/70">
                      Original Course Grade
                    </p>
                    <p className="mt-1 font-display text-lg font-extrabold text-[#29232D] tabular-nums">
                      {selectedEval.originalLetter ?? 'Pending'}{' '}
                      {selectedEval.effectivePoint !== null && (
                        <span className="text-sm font-bold text-[#29232D]/70">
                          ({selectedEval.effectivePoint.toFixed(2)})
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#29232D]/70">
                      Target Course Grade
                    </p>
                    <p className="mt-1 font-display text-lg font-extrabold text-[#7955A1] tabular-nums">
                      {getLetterFromPoint(targetGradePoint, gradeScale)}{' '}
                      <span className="text-sm font-bold text-[#7955A1]">
                        ({targetGradePoint.toFixed(2)})
                      </span>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t-2 border-[#29232D]/15 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold text-[#29232D]/70">Current CGPA</p>
                    <p className="font-display text-2xl font-extrabold text-[#29232D] tabular-nums">
                      {cgpaSummary.cgpa.toFixed(2)}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-[#29232D] shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold text-[#29232D]/70">Projected CGPA</p>
                    <p className="font-display text-2xl font-extrabold text-[#7955A1] tabular-nums">
                      {projectedSummary.cgpa.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-[#29232D]/70">CGPA Change</p>
                    <p
                      className={`inline-block rounded-lg border border-[#29232D] px-2 py-0.5 text-sm font-mono font-extrabold tabular-nums ${
                        projectedSummary.diff >= 0 ? 'bg-[#A7D9AE] text-[#29232D]' : 'bg-[#F6D36B] text-[#29232D]'
                      }`}
                    >
                      {projectedSummary.diff >= 0 ? '+' : ''}
                      {projectedSummary.diff.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Visual Comparison Chart */}
              <div className="h-[160px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comparisonChartData}
                    layout="vertical"
                    margin={{ top: 4, right: 20, left: 10, bottom: 4 }}
                  >
                    <CartesianGrid stroke="#29232D" strokeOpacity={0.12} strokeDasharray="4 4" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[2.0, 4.0]}
                      ticks={[2.0, 2.5, 3.0, 3.5, 4.0]}
                      tick={{ fill: '#29232D', fontSize: 11, fontWeight: 700 }}
                      axisLine={{ stroke: '#29232D' }}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={96}
                      tick={{ fill: '#29232D', fontSize: 12, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value: unknown) => [Number(value).toFixed(2), 'CGPA']}
                    />
                    <Bar dataKey="cgpa" radius={[0, 8, 8, 0]} barSize={26} stroke="#29232D" strokeWidth={2}>
                      {comparisonChartData.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={entry.isProjected ? '#7955A1' : '#F29A9C'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Sensitivity Table */}
              <div>
                <p className="text-xs font-extrabold text-[#29232D] mb-2">
                  Target Grade Impact Matrix
                </p>
                <div className="grid grid-cols-5 gap-1.5 text-center text-[11px] font-mono tabular-nums">
                  {sensitivityRows.map((row) => (
                    <div
                      key={row.point}
                      className="rounded-xl border-2 border-[#29232D] bg-[#F5F3F2] py-2 px-1"
                    >
                      <div className="font-extrabold text-[#29232D]">{row.letter}</div>
                      <div className="text-[#7955A1] font-extrabold mt-0.5">
                        {row.cgpa.toFixed(2)}
                      </div>
                      <div
                        className={`font-bold ${
                          row.diff >= 0 ? 'text-[#15803D]' : 'text-[#B45309]'
                        }`}
                      >
                        {row.diff >= 0 ? '+' : ''}
                        {row.diff.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t-2 border-[#29232D]/10 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    applyImprovementToCourse(
                      selectedEval.course.id,
                      targetGradePoint,
                      currentSemNumber
                    )
                  }
                  className="flex-1 rounded-xl border-2 border-[#29232D] bg-[#7955A1] px-4 py-2.5 text-xs font-bold text-white shadow-[3px_3px_0_#29232D] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#29232D] transition-all whitespace-nowrap"
                >
                  Apply Improvement ({getLetterFromPoint(targetGradePoint, gradeScale)}) to Record
                </button>
                {selectedEval.course.improvedGradePoint != null && (
                  <button
                    type="button"
                    onClick={() =>
                      updateCourse(
                        selectedEval.course.id,
                        {
                          improvedGradePoint: null,
                          improvedLetterGrade: null,
                          improvedInSemesterNumber: null,
                        },
                        `Cleared improvement override for ${selectedEval.course.code}`
                      )
                    }
                    className="rounded-xl border-2 border-[#29232D] bg-white px-3 py-2.5 text-xs font-bold text-[#29232D] hover:bg-[#FCE2DE] whitespace-nowrap"
                  >
                    Clear Override
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className="py-10 text-center text-sm font-semibold text-[#29232D]/60">
              Select a course on the left to simulate improvement outcomes.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
