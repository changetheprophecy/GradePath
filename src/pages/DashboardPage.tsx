import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Award,
  BellRing,
  BookOpen,
  Calculator,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ClipboardEdit,
  ClipboardList,
  Plus,
  Target,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAcademic } from '../context/AcademicContext';
import {
  calculateCumulativeCGPA,
  calculateSemesterGPA,
  calculateSemesterTargetProgress,
  hasFinalGrade,
} from '../utils/calculations';
import { SemesterModal } from '../components/SemesterModal';
import { DashboardWelcomeIllustration } from '../components/Illustrations';

export function DashboardPage() {
  const {
    profile,
    semesters,
    courses,
    activities,
    notifications,
    gradeScale,
    rules,
    isDemoData,
    cgpaSummary,
    lastCompletedSemester,
    navigateTo,
    addSemester,
    setSemesterTargetGpa,
    markNotificationRead,
    dismissNotification,
  } = useAcademic();

  const [selectedSemFilter, setSelectedSemFilter] = useState<string>('all');
  const [targetSemId, setTargetSemId] = useState<string>('');
  const [semModalOpen, setSemModalOpen] = useState(false);

  const firstName = profile.fullName.trim().split(' ')[0] || 'Student';

  const sortedSemesters = useMemo(
    () => [...semesters].sort((a, b) => a.number - b.number),
    [semesters]
  );

  // Build semester-by-semester GPA and cumulative CGPA series
  const chartData = useMemo(() => {
    const cumulativeCourses: typeof courses = [];
    return sortedSemesters
      .map((sem) => {
        const semCourses = courses.filter((c) => c.semesterId === sem.id);
        const { gpa, gradedCredits, totalCredits } = calculateSemesterGPA(
          semCourses,
          gradeScale
        );
        cumulativeCourses.push(...semCourses);
        const cum = calculateCumulativeCGPA(cumulativeCourses, gradeScale, rules);
        return {
          id: sem.id,
          number: sem.number,
          name: sem.name,
          shortName: `Sem ${sem.number}`,
          gpa: gpa !== null ? Number(gpa.toFixed(2)) : null,
          cgpa: cum.completedCredits > 0 ? Number(cum.cgpa.toFixed(2)) : null,
          credits: gradedCredits > 0 ? gradedCredits : totalCredits,
          courseCount: semCourses.length,
        };
      })
      .filter((d) => d.gpa !== null);
  }, [sortedSemesters, courses, gradeScale, rules]);

  const selectedSemesterObj = useMemo(
    () => sortedSemesters.find((s) => s.id === selectedSemFilter) ?? null,
    [sortedSemesters, selectedSemFilter]
  );

  const selectedSemStats = useMemo(() => {
    if (!selectedSemesterObj) return null;
    const semCourses = courses.filter((c) => c.semesterId === selectedSemesterObj.id);
    const stats = calculateSemesterGPA(semCourses, gradeScale);
    return {
      ...stats,
      courseCount: semCourses.length,
    };
  }, [selectedSemesterObj, courses, gradeScale]);

  // Insights derived dynamically from course/semester records
  const insights = useMemo(() => {
    const completedWithGpa = chartData.filter((d) => d.gpa !== null) as Array<
      (typeof chartData)[number] & { gpa: number }
    >;

    const bestSem =
      completedWithGpa.length > 0
        ? completedWithGpa.reduce((best, cur) => (cur.gpa > best.gpa ? cur : best))
        : null;

    const lowestSem =
      completedWithGpa.length > 0
        ? completedWithGpa.reduce((low, cur) => (cur.gpa < low.gpa ? cur : low))
        : null;

    let trendDelta: number | null = null;
    let trendLabel = 'Not enough completed semesters';
    if (completedWithGpa.length >= 2) {
      const prev = completedWithGpa[completedWithGpa.length - 2];
      const last = completedWithGpa[completedWithGpa.length - 1];
      trendDelta = Number((last.gpa - prev.gpa).toFixed(2));
      if (trendDelta > 0) {
        trendLabel = `+${trendDelta.toFixed(2)} GPA vs ${prev.name}`;
      } else if (trendDelta < 0) {
        trendLabel = `${trendDelta.toFixed(2)} GPA vs ${prev.name}`;
      } else {
        trendLabel = `Steady at ${last.gpa.toFixed(2)} GPA`;
      }
    }

    const upcomingExams = courses
      .filter((c) => !hasFinalGrade(c) && c.upcomingExamDate)
      .sort((a, b) =>
        (a.upcomingExamDate ?? '').localeCompare(b.upcomingExamDate ?? '')
      );

    return { bestSem, lowestSem, trendDelta, trendLabel, upcomingExams };
  }, [chartData, courses]);

  const card2Value =
    selectedSemStats !== null
      ? selectedSemStats.gpa !== null
        ? selectedSemStats.gpa.toFixed(2)
        : 'Pending'
      : lastCompletedSemester.gpa !== null
        ? lastCompletedSemester.gpa.toFixed(2)
        : '—';

  const card2Label = selectedSemesterObj
    ? `${selectedSemesterObj.name} GPA`
    : 'Last Semester GPA';

  const card2Sub = selectedSemesterObj
    ? `${selectedSemStats?.courseCount ?? 0} courses`
    : lastCompletedSemester.semester
      ? lastCompletedSemester.semester.name
      : 'No completed semester yet';

  const card3Value =
    selectedSemStats !== null
      ? selectedSemStats.gradedCredits
      : cgpaSummary.completedCredits;

  const card3Label = selectedSemesterObj ? 'Semester Credits' : 'Completed Credits';

  const card4Value =
    selectedSemStats !== null ? selectedSemStats.courseCount : courses.length;

  const card4Label = selectedSemesterObj ? 'Semester Courses' : 'Total Courses';

  const activeTargetSemester = useMemo(() => {
    if (selectedSemesterObj) return selectedSemesterObj;
    const explicit = sortedSemesters.find((s) => s.id === targetSemId);
    if (explicit) return explicit;
    return (
      sortedSemesters.find((s) => s.status === 'in_progress') ??
      sortedSemesters[sortedSemesters.length - 1] ??
      null
    );
  }, [selectedSemesterObj, sortedSemesters, targetSemId]);

  const targetGpaValue = activeTargetSemester?.targetGpa ?? 3.5;

  const targetProgress = useMemo(() => {
    if (!activeTargetSemester) return null;
    const semCourses = courses.filter(
      (c) => c.semesterId === activeTargetSemester.id
    );
    return calculateSemesterTargetProgress(semCourses, targetGpaValue, gradeScale);
  }, [activeTargetSemester, courses, targetGpaValue, gradeScale]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner Card */}
      <section className="rounded-[22px] border-2 border-[#29232D] bg-white p-5 sm:p-6 shadow-[4px_4px_0_#29232D]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="hidden sm:block shrink-0 rounded-2xl border-2 border-[#29232D] bg-[#FCE2DE] p-2">
              <DashboardWelcomeIllustration className="h-24 w-40" />
            </div>
            <div>
              <h2 className="font-display text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#29232D]">
                Hey, {firstName}! Ready to make progress?
              </h2>
              <p className="mt-1 text-sm font-medium text-[#29232D]/75">
                Here&apos;s what&apos;s happening with your academic journey.
              </p>
              {isDemoData && (
                <p className="mt-2 inline-block rounded-lg border-2 border-[#29232D] bg-[#FFF4D6] px-2.5 py-1 text-xs font-bold text-[#29232D]">
                  Sample academic dataset active · Live weighted GPA recalculation enabled
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <label
              htmlFor="dashboard-semester-select"
              className="text-xs font-bold text-[#29232D]/70 whitespace-nowrap"
            >
              Scope
            </label>
            <select
              id="dashboard-semester-select"
              value={selectedSemFilter}
              onChange={(e) => setSelectedSemFilter(e.target.value)}
              className="rounded-xl border-2 border-[#29232D] bg-[#F5F3F2] px-3.5 py-2 text-sm font-bold text-[#29232D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7955A1]/30"
            >
              <option value="all">All Semesters (Cumulative)</option>
              {sortedSemesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {selectedSemesterObj && (
              <button
                type="button"
                onClick={() => navigateTo('semester-detail', selectedSemesterObj.id)}
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#29232D] bg-[#7955A1] px-3.5 py-2 text-xs font-bold text-white shadow-[2px_2px_0_#29232D] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all whitespace-nowrap"
              >
                Open
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setSemModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#29232D] bg-[#F6D36B] px-3.5 py-2 text-xs font-extrabold text-[#29232D] shadow-[2px_2px_0_#29232D] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Semester
            </button>
          </div>
        </div>
      </section>

      {/* Local Academic Alerts Strip (Upcoming Exams & Missing Marks) */}
      {notifications.length > 0 && (
        <section
          aria-label="Local Academic Alerts"
          className="rounded-[22px] border-2 border-[#29232D] bg-[#FFF4D6] p-4 sm:p-5 shadow-[4px_4px_0_#29232D]"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b-2 border-[#29232D]/15">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-[#29232D] bg-[#F6D36B] text-[#29232D]">
                <BellRing className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-display text-sm font-extrabold text-[#29232D]">
                  Local Reminders &amp; Alerts ({notifications.length})
                </h3>
                <p className="text-xs font-medium text-[#29232D]/75">
                  Automatically checks upcoming exam dates and missing midterm, attendance, or final marks.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('settings')}
              className="self-start sm:self-auto rounded-lg border-2 border-[#29232D] bg-white px-2.5 py-1 text-xs font-bold text-[#29232D] hover:bg-[#FCE2DE] whitespace-nowrap"
            >
              Alert Settings
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {notifications.slice(0, 6).map((alert) => {
              const IconComp =
                alert.category === 'exam'
                  ? CalendarClock
                  : alert.category === 'low_internal'
                    ? AlertTriangle
                    : ClipboardEdit;

              return (
                <div
                  key={alert.id}
                  className="flex items-start gap-2.5 rounded-xl border-2 border-[#29232D] bg-white p-3"
                >
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#29232D] ${
                      alert.category === 'exam'
                        ? 'bg-[#FCE2DE]'
                        : alert.severity === 'warning'
                          ? 'bg-[#F6D36B]'
                          : 'bg-[#E5D8F3]'
                    }`}
                  >
                    <IconComp className="h-3.5 w-3.5 text-[#29232D]" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      markNotificationRead(alert.id);
                      if (alert.targetPage) {
                        navigateTo(alert.targetPage, alert.targetSemesterId);
                      }
                    }}
                    className="min-w-0 flex-1 text-left group"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-extrabold text-[#29232D] truncate group-hover:text-[#7955A1]">
                        {alert.title}
                      </span>
                      <span className="rounded-md border border-[#29232D]/30 bg-[#F5F3F2] px-1.5 py-0.5 text-[10px] font-bold text-[#29232D] shrink-0">
                        {alert.time}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-medium text-[#29232D]/70 line-clamp-2">
                      {alert.description}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissNotification(alert.id)}
                    className="rounded-md p-0.5 text-[#29232D]/45 hover:bg-[#F8D0CC] hover:text-[#29232D]"
                    aria-label={`Dismiss ${alert.title}`}
                    title="Dismiss alert"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4 Colorful Overview Metric Cards */}
      <section aria-label="Academic Overview" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Peach Pink */}
        <div className="rounded-[20px] border-2 border-[#29232D] bg-[#F8D0CC] p-5 shadow-[4px_4px_0_#29232D]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wide text-[#29232D]/80">
              Current CGPA
            </span>
            <span className="rounded-lg border-2 border-[#29232D] bg-white px-2 py-0.5 text-[11px] font-mono font-bold text-[#29232D]">
              4.00 scale
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="font-display text-4xl font-extrabold tracking-tight text-[#29232D] tabular-nums">
              {cgpaSummary.completedCredits > 0 ? cgpaSummary.cgpa.toFixed(2) : '—'}
            </span>
            {insights.trendDelta !== null && (
              <span
                className={`inline-flex items-center gap-0.5 rounded-lg border border-[#29232D] px-1.5 py-0.5 text-xs font-bold tabular-nums ${
                  insights.trendDelta >= 0 ? 'bg-[#A7D9AE] text-[#29232D]' : 'bg-[#FFF4D6] text-[#29232D]'
                }`}
              >
                {insights.trendDelta >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {insights.trendDelta >= 0 ? '+' : ''}
                {insights.trendDelta.toFixed(2)}
              </span>
            )}
          </div>
          <p className="mt-2 text-xs font-semibold text-[#29232D]/75 tabular-nums">
            {cgpaSummary.totalQualityPoints.toFixed(2)} quality points earned
          </p>
        </div>

        {/* Card 2: Soft Purple Tint */}
        <div className="rounded-[20px] border-2 border-[#29232D] bg-[#E5D8F3] p-5 shadow-[4px_4px_0_#29232D]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wide text-[#29232D]/80">
              {card2Label}
            </span>
          </div>
          <div className="mt-3">
            <span className="font-display text-4xl font-extrabold tracking-tight text-[#29232D] tabular-nums">
              {card2Value}
            </span>
          </div>
          <p className="mt-2 text-xs font-semibold text-[#29232D]/75 truncate">{card2Sub}</p>
        </div>

        {/* Card 3: Warm Yellow */}
        <div className="rounded-[20px] border-2 border-[#29232D] bg-[#FBE8A6] p-5 shadow-[4px_4px_0_#29232D]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wide text-[#29232D]/80">
              {card3Label}
            </span>
          </div>
          <div className="mt-3">
            <span className="font-display text-4xl font-extrabold tracking-tight text-[#29232D] tabular-nums">
              {card3Value}
            </span>
          </div>
          <p className="mt-2 text-xs font-semibold text-[#29232D]/75">
            {selectedSemesterObj
              ? `Out of ${selectedSemStats?.totalCredits ?? 0} enrolled credits`
              : 'Graded credit hours completed'}
          </p>
        </div>

        {/* Card 4: White */}
        <div className="rounded-[20px] border-2 border-[#29232D] bg-white p-5 shadow-[4px_4px_0_#29232D]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wide text-[#29232D]/80">
              {card4Label}
            </span>
          </div>
          <div className="mt-3">
            <span className="font-display text-4xl font-extrabold tracking-tight text-[#29232D] tabular-nums">
              {card4Value}
            </span>
          </div>
          <p className="mt-2 text-xs font-semibold text-[#29232D]/75">
            {courses.filter((c) => !hasFinalGrade(c)).length} active in current term
          </p>
        </div>
      </section>

      {/* Target GPA Progress Card */}
      {activeTargetSemester && targetProgress && (
        <section
          aria-label="Target GPA"
          className="rounded-[22px] border-2 border-[#29232D] bg-white p-5 sm:p-6 shadow-[4px_4px_0_#29232D]"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b-2 border-[#29232D]/10">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#29232D] bg-[#F6D36B] text-[#29232D]">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-extrabold text-[#29232D]">
                  Target GPA Goal
                </h3>
                <p className="text-xs font-medium text-[#29232D]/70 mt-0.5">
                  Set a semester goal and track how close you are based on your current marks.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {!selectedSemesterObj && (
                <select
                  aria-label="Target GPA semester"
                  value={activeTargetSemester.id}
                  onChange={(e) => setTargetSemId(e.target.value)}
                  className="rounded-xl border-2 border-[#29232D] bg-white px-3 py-1.5 text-xs font-bold text-[#29232D] focus:outline-none"
                >
                  {sortedSemesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}

              <div className="inline-flex items-center gap-1 rounded-xl border-2 border-[#29232D] bg-[#F5F3F2] p-1">
                {[3.25, 3.5, 3.75, 4.0].map((preset) => {
                  const active = Math.abs(targetGpaValue - preset) < 0.01;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        setSemesterTargetGpa(activeTargetSemester.id, preset)
                      }
                      className={`rounded-lg px-2.5 py-1 text-xs font-mono font-bold tabular-nums transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-[#7955A1] text-white border border-[#29232D]'
                          : 'text-[#29232D]/75 hover:text-[#29232D]'
                      }`}
                    >
                      {preset.toFixed(2)}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5">
                <label
                  htmlFor="target-gpa-input"
                  className="text-xs font-bold text-[#29232D]/70 whitespace-nowrap"
                >
                  Goal
                </label>
                <input
                  id="target-gpa-input"
                  type="number"
                  min="0"
                  max="4"
                  step="0.05"
                  value={targetGpaValue}
                  onChange={(e) => {
                    const num = Number(e.target.value);
                    if (!Number.isNaN(num)) {
                      setSemesterTargetGpa(activeTargetSemester.id, num);
                    }
                  }}
                  className="w-20 rounded-xl border-2 border-[#29232D] bg-white px-2.5 py-1.5 text-right font-mono text-xs font-extrabold tabular-nums text-[#29232D] focus:outline-none focus:ring-2 focus:ring-[#7955A1]/30"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
              <div className="flex flex-wrap items-baseline gap-2.5">
                <span className="font-display text-3xl font-extrabold text-[#29232D] tabular-nums">
                  {targetProgress.currentGpa !== null
                    ? targetProgress.currentGpa.toFixed(2)
                    : '—'}
                </span>
                <span className="text-xs font-bold text-[#29232D]/70 font-mono tabular-nums">
                  / {targetProgress.targetGpa.toFixed(2)} target ({activeTargetSemester.name})
                </span>
                <span className="text-[#29232D]/30" aria-hidden="true">
                  ·
                </span>
                <span className="text-xs font-semibold text-[#7955A1]">
                  {targetProgress.isPaceEstimate
                    ? 'Pace from current marks'
                    : 'Confirmed semester GPA'}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg border-2 border-[#29232D] px-2.5 py-1 text-xs font-bold ${
                    targetProgress.isAchieved
                      ? 'bg-[#A7D9AE] text-[#29232D]'
                      : !targetProgress.isAchievable
                        ? 'bg-[#F6D36B] text-[#29232D]'
                        : 'bg-[#E5D8F3] text-[#29232D]'
                  }`}
                >
                  {targetProgress.isAchieved ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : !targetProgress.isAchievable ? (
                    <AlertCircle className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingUp className="h-3.5 w-3.5" />
                  )}
                  {targetProgress.currentGpa === null
                    ? 'No marks logged yet'
                    : targetProgress.isAchieved
                      ? 'Goal achieved'
                      : !targetProgress.isAchievable
                        ? 'Exceeds max possible GPA'
                        : 'Within reach'}
                </span>
                <span className="font-display text-base font-extrabold text-[#29232D] tabular-nums">
                  {Math.round(targetProgress.progressPercent)}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div
              className="h-4 w-full rounded-full border-2 border-[#29232D] bg-[#F5F3F2] overflow-hidden p-0.5"
              role="progressbar"
              aria-valuenow={Math.round(targetProgress.progressPercent)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progress toward ${targetProgress.targetGpa.toFixed(2)} Target GPA`}
            >
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  targetProgress.isAchieved
                    ? 'bg-[#A7D9AE]'
                    : !targetProgress.isAchievable
                      ? 'bg-[#F6D36B]'
                      : 'bg-[#7955A1]'
                }`}
                style={{ width: `${targetProgress.progressPercent}%` }}
              />
            </div>

            {/* Detail Breakdown & Actions */}
            <div className="pt-1 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs font-semibold text-[#29232D]/75">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono tabular-nums">
                {targetProgress.gapToGoal !== null && (
                  <span>
                    {targetProgress.gapToGoal >= 0
                      ? `+${targetProgress.gapToGoal.toFixed(2)} above goal`
                      : `${Math.abs(targetProgress.gapToGoal).toFixed(2)} GPA to go`}
                  </span>
                )}
                {targetProgress.maxPossibleGpa !== null && (
                  <>
                    <span className="text-[#29232D]/30" aria-hidden="true">
                      ·
                    </span>
                    <span>
                      Max possible: {targetProgress.maxPossibleGpa.toFixed(2)}
                    </span>
                  </>
                )}
                {targetProgress.neededRemainingAvgGp !== null &&
                  targetProgress.neededRemainingAvgGp > 0 && (
                    <>
                      <span className="text-[#29232D]/30" aria-hidden="true">
                        ·
                      </span>
                      <span className="font-sans">
                        Need{' '}
                        <span className="font-mono font-bold text-[#7955A1]">
                          {targetProgress.neededRemainingAvgGp.toFixed(2)}
                        </span>{' '}
                        avg GP across remaining{' '}
                        {targetProgress.totalCoursesCount -
                          targetProgress.finalizedCoursesCount}{' '}
                        courses
                      </span>
                    </>
                  )}
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <button
                  type="button"
                  onClick={() => navigateTo('marks')}
                  className="font-bold text-[#29232D] hover:text-[#7955A1] whitespace-nowrap"
                >
                  Update Marks →
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('predictor')}
                  className="font-bold text-[#7955A1] hover:text-[#29232D] whitespace-nowrap"
                >
                  Predict Finals →
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Chart + Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* CGPA Progress Chart */}
        <section className="lg:col-span-2 rounded-[22px] border-2 border-[#29232D] bg-white p-5 sm:p-6 shadow-[4px_4px_0_#29232D] flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b-2 border-[#29232D]/10">
            <div>
              <h3 className="font-display text-base font-extrabold text-[#29232D]">
                Semester GPA &amp; CGPA Trajectory
              </h3>
              <p className="text-xs font-medium text-[#29232D]/70 mt-0.5">
                Term-by-term weighted GPA progression across completed semesters
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-[#29232D] shrink-0">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-4 rounded-sm border border-[#29232D] bg-[#7955A1] inline-block" />
                Semester GPA
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-4 rounded-sm border border-[#29232D] bg-[#F29A9C] inline-block" />
                Cumulative CGPA
              </span>
            </div>
          </div>

          <div className="mt-5 h-[280px] w-full flex-1">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <p className="text-sm font-bold text-[#29232D]">
                  No completed semester GPA data yet
                </p>
                <p className="mt-1 text-xs text-[#29232D]/70">
                  Add final examination marks to a semester to visualize your GPA progression.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 16, left: -12, bottom: 4 }}
                >
                  <CartesianGrid stroke="#29232D" strokeOpacity={0.12} strokeDasharray="4 4" vertical={false} />
                  <XAxis
                    dataKey="shortName"
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
                      const d = payload[0].payload as (typeof chartData)[number];
                      return (
                        <div className="rounded-xl border-2 border-[#29232D] bg-white px-3.5 py-2.5 shadow-[3px_3px_0_#29232D] text-xs">
                          <p className="font-display font-extrabold text-[#29232D]">
                            {d.name}
                          </p>
                          <div className="mt-1.5 space-y-1 font-mono tabular-nums">
                            <p className="text-[#7955A1] font-bold">
                              Semester GPA: <span>{d.gpa?.toFixed(2)}</span>
                            </p>
                            {d.cgpa !== null && (
                              <p className="text-[#29232D] font-bold">
                                Cumulative CGPA: <span>{d.cgpa.toFixed(2)}</span>
                              </p>
                            )}
                            <p className="text-[#29232D]/70 font-sans font-semibold">
                              {d.credits} credits · {d.courseCount} courses
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cgpa"
                    name="Cumulative CGPA"
                    stroke="#F29A9C"
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ r: 4, fill: '#F29A9C', stroke: '#29232D', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: '#F29A9C', stroke: '#29232D', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="gpa"
                    name="Semester GPA"
                    stroke="#7955A1"
                    strokeWidth={3.5}
                    dot={{ r: 5, fill: '#F6D36B', stroke: '#29232D', strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: '#7955A1', stroke: '#29232D', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Academic Insights */}
        <section className="rounded-[22px] border-2 border-[#29232D] bg-white p-5 sm:p-6 shadow-[4px_4px_0_#29232D] flex flex-col justify-between">
          <div>
            <h3 className="font-display text-base font-extrabold text-[#29232D]">
              Academic Insights
            </h3>
            <p className="text-xs font-medium text-[#29232D]/70 mt-0.5">
              Key performance signals from your record
            </p>

            <div className="mt-5 divide-y-2 divide-[#29232D]/10">
              <div className="pb-3.5 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-[#29232D] bg-[#A7D9AE]">
                  <Award className="h-4 w-4 text-[#29232D]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#29232D]/65">Best Performing Semester</p>
                  <p className="mt-0.5 text-sm font-extrabold text-[#29232D] tabular-nums">
                    {insights.bestSem
                      ? `${insights.bestSem.name} · ${insights.bestSem.gpa.toFixed(2)} GPA`
                      : 'No completed semester yet'}
                  </p>
                </div>
              </div>

              <div className="py-3.5 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-[#29232D] bg-[#F6D36B]">
                  <AlertCircle className="h-4 w-4 text-[#29232D]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#29232D]/65">
                    Semester Requiring Improvement
                  </p>
                  <p className="mt-0.5 text-sm font-extrabold text-[#29232D] tabular-nums">
                    {insights.lowestSem
                      ? `${insights.lowestSem.name} · ${insights.lowestSem.gpa.toFixed(2)} GPA`
                      : 'No completed semester yet'}
                  </p>
                  {insights.lowestSem && (
                    <button
                      type="button"
                      onClick={() => navigateTo('improvement')}
                      className="mt-0.5 text-xs font-extrabold text-[#7955A1] hover:text-[#29232D]"
                    >
                      Simulate grade improvement →
                    </button>
                  )}
                </div>
              </div>

              <div className="py-3.5 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-[#29232D] bg-[#E5D8F3]">
                  <TrendingUp className="h-4 w-4 text-[#29232D]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#29232D]/65">Current Academic Trend</p>
                  <p className="mt-0.5 text-sm font-extrabold text-[#29232D] tabular-nums">
                    {insights.trendLabel}
                  </p>
                </div>
              </div>

              <div className="pt-3.5 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-[#29232D] bg-[#FCE2DE]">
                  <Calendar className="h-4 w-4 text-[#29232D]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#29232D]/65">Upcoming Examinations</p>
                  {insights.upcomingExams.length === 0 ? (
                    <p className="mt-0.5 text-sm font-semibold text-[#29232D]">
                      No upcoming finals scheduled
                    </p>
                  ) : (
                    <ul className="mt-1.5 space-y-1.5">
                      {insights.upcomingExams.slice(0, 3).map((c) => (
                        <li
                          key={c.id}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <button
                            type="button"
                            onClick={() => navigateTo('predictor')}
                            className="truncate font-bold text-[#29232D] hover:text-[#7955A1] text-left"
                          >
                            <span className="font-mono text-[#7955A1] mr-1.5">{c.code}</span>
                            {c.name}
                          </button>
                          <span className="font-mono font-semibold text-[#29232D]/70 shrink-0 tabular-nums">
                            {c.upcomingExamDate}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <section className="rounded-[22px] border-2 border-[#29232D] bg-white p-5 sm:p-6 shadow-[4px_4px_0_#29232D]">
          <h3 className="font-display text-base font-extrabold text-[#29232D]">Quick Actions</h3>
          <p className="text-xs font-medium text-[#29232D]/70 mt-0.5">
            Jump directly to planning and tracking workflows
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => navigateTo('predictor')}
              className="flex items-center justify-between rounded-2xl border-2 border-[#29232D] bg-[#FCE2DE] px-4 py-3 text-left shadow-[2px_2px_0_#29232D] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
            >
              <div className="flex items-center gap-3">
                <Calculator className="h-4 w-4 text-[#29232D] shrink-0" />
                <div>
                  <p className="text-sm font-extrabold text-[#29232D]">Predict My GPA</p>
                  <p className="text-xs font-semibold text-[#29232D]/70">Model expected final scores</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[#29232D]" />
            </button>

            <button
              type="button"
              onClick={() => navigateTo('improvement')}
              className="flex items-center justify-between rounded-2xl border-2 border-[#29232D] bg-[#E5D8F3] px-4 py-3 text-left shadow-[2px_2px_0_#29232D] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-[#29232D] shrink-0" />
                <div>
                  <p className="text-sm font-extrabold text-[#29232D]">Plan Improvements</p>
                  <p className="text-xs font-semibold text-[#29232D]/70">Simulate retake CGPA impact</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[#29232D]" />
            </button>

            <button
              type="button"
              onClick={() => navigateTo('marks')}
              className="flex items-center justify-between rounded-2xl border-2 border-[#29232D] bg-[#FFF4D6] px-4 py-3 text-left shadow-[2px_2px_0_#29232D] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
            >
              <div className="flex items-center gap-3">
                <ClipboardList className="h-4 w-4 text-[#29232D] shrink-0" />
                <div>
                  <p className="text-sm font-extrabold text-[#29232D]">Update Marks</p>
                  <p className="text-xs font-semibold text-[#29232D]/70">Edit midterm &amp; final scores</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[#29232D]" />
            </button>

            <button
              type="button"
              onClick={() => navigateTo('library')}
              className="flex items-center justify-between rounded-2xl border-2 border-[#29232D] bg-[#DDF3E0] px-4 py-3 text-left shadow-[2px_2px_0_#29232D] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="h-4 w-4 text-[#29232D] shrink-0" />
                <div>
                  <p className="text-sm font-extrabold text-[#29232D]">Explore Resources</p>
                  <p className="text-xs font-semibold text-[#29232D]/70">Browse study notes &amp; papers</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-[#29232D]" />
            </button>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="lg:col-span-2 rounded-[22px] border-2 border-[#29232D] bg-white p-5 sm:p-6 shadow-[4px_4px_0_#29232D]">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#29232D]/10">
            <div>
              <h3 className="font-display text-base font-extrabold text-[#29232D]">Recent Activity</h3>
              <p className="text-xs font-medium text-[#29232D]/70 mt-0.5">
                Live log of grade entries, semester additions, and recalculations
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('semesters')}
              className="rounded-xl border-2 border-[#29232D] bg-[#FCE2DE] px-3 py-1.5 text-xs font-bold text-[#29232D] hover:bg-[#F8D0CC] whitespace-nowrap"
            >
              View all semesters
            </button>
          </div>

          {activities.length === 0 ? (
            <p className="py-10 text-center text-sm font-semibold text-[#29232D]/60">
              No recent activity yet. Add a semester or update course marks to begin.
            </p>
          ) : (
            <ul className="divide-y-2 divide-[#29232D]/10 mt-1">
              {activities.slice(0, 6).map((act) => (
                <li
                  key={act.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#29232D]">{act.title}</p>
                    <p className="text-xs font-medium text-[#29232D]/70 mt-0.5">{act.detail}</p>
                  </div>
                  <span className="text-xs font-bold text-[#7955A1] whitespace-nowrap shrink-0">
                    {act.timestamp}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <SemesterModal
        open={semModalOpen}
        onClose={() => setSemModalOpen(false)}
        suggestedNumber={
          sortedSemesters.length > 0
            ? Math.max(...sortedSemesters.map((s) => s.number)) + 1
            : 1
        }
        onSave={(payload) => {
          const created = addSemester(payload);
          navigateTo('semester-detail', created.id);
        }}
      />
    </div>
  );
}
