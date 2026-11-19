import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FolderPlus,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useAcademic } from '../context/AcademicContext';
import { calculateSemesterGPA } from '../utils/calculations';
import { SemesterModal } from '../components/SemesterModal';
import { SemesterStatus } from '../types/academic';

const STATUS_META: Record<
  SemesterStatus,
  { label: string; bgClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  completed: { label: 'Completed', bgClass: 'bg-[#A7D9AE]', icon: CheckCircle2 },
  in_progress: { label: 'In Progress', bgClass: 'bg-[#F6D36B]', icon: Clock },
  planned: { label: 'Planned', bgClass: 'bg-[#E5D8F3]', icon: Sparkles },
};

const CARD_TOP_ACCENTS = [
  'bg-[#F8D0CC]',
  'bg-[#E5D8F3]',
  'bg-[#FFF4D6]',
  'bg-[#DDF3E0]',
  'bg-[#DCEFF8]',
  'bg-[#FCE2DE]',
];

export function SemestersPage() {
  const { semesters, courses, gradeScale, navigateTo, addSemester } = useAcademic();
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | SemesterStatus>('all');

  const sortedSemesters = useMemo(
    () => [...semesters].sort((a, b) => a.number - b.number),
    [semesters]
  );

  const filtered = useMemo(
    () =>
      statusFilter === 'all'
        ? sortedSemesters
        : sortedSemesters.filter((s) => s.status === statusFilter),
    [sortedSemesters, statusFilter]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-[22px] border-2 border-[#29232D] bg-white p-5 sm:p-6 shadow-[4px_4px_0_#29232D] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#29232D]">
            Academic Semesters
          </h2>
          <p className="mt-1 text-sm font-medium text-[#29232D]/75">
            Select any semester to inspect its course breakdown, edit marks, or manage credits.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-[#29232D] bg-[#7955A1] px-4 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_#29232D] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_#29232D] transition-all whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Semester
        </button>
      </div>

      {/* Interactive Segmented Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1.5 rounded-2xl border-2 border-[#29232D] bg-white p-1.5">
          {(['all', 'completed', 'in_progress', 'planned'] as const).map((key) => {
            const label =
              key === 'all'
                ? 'All Semesters'
                : key === 'completed'
                  ? 'Completed'
                  : key === 'in_progress'
                    ? 'In Progress'
                    : 'Planned';
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                  statusFilter === key
                    ? 'bg-[#F6D36B] text-[#29232D] border-2 border-[#29232D]'
                    : 'text-[#29232D]/75 hover:text-[#29232D] border-2 border-transparent'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <span className="rounded-xl border-2 border-[#29232D] bg-white px-3 py-1.5 text-xs font-mono font-bold text-[#29232D] tabular-nums">
          {filtered.length} {filtered.length === 1 ? 'semester' : 'semesters'}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[22px] border-2 border-[#29232D] bg-white px-6 py-14 text-center shadow-[4px_4px_0_#29232D]">
          <FolderPlus className="mx-auto h-10 w-10 text-[#7955A1]" />
          <h3 className="mt-3 font-display text-lg font-extrabold text-[#29232D]">
            No semesters match this view
          </h3>
          <p className="mt-1 text-sm font-medium text-[#29232D]/70 max-w-md mx-auto">
            Create a semester to begin logging your courses, credits, and examination marks.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border-2 border-[#29232D] bg-[#7955A1] px-4 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_#29232D]"
          >
            <Plus className="h-4 w-4" />
            Add First Semester
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((sem, idx) => {
            const semCourses = courses.filter((c) => c.semesterId === sem.id);
            const { gpa, totalCredits, gradedCredits } = calculateSemesterGPA(
              semCourses,
              gradeScale
            );
            const statusInfo = STATUS_META[sem.status];
            const StatusIcon = statusInfo.icon;
            const headerTint = CARD_TOP_ACCENTS[idx % CARD_TOP_ACCENTS.length];

            return (
              <button
                key={sem.id}
                type="button"
                onClick={() => navigateTo('semester-detail', sem.id)}
                className="group text-left rounded-[22px] border-2 border-[#29232D] bg-white overflow-hidden shadow-[4px_4px_0_#29232D] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#29232D] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className={`${headerTint} px-5 py-4 border-b-2 border-[#29232D] flex items-center justify-between gap-2`}>
                    <h3 className="font-display text-lg font-extrabold text-[#29232D]">
                      {sem.name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg border-2 border-[#29232D] ${statusInfo.bgClass} px-2.5 py-0.5 text-xs font-bold text-[#29232D] whitespace-nowrap`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="p-5 grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#29232D]/60">
                        Semester GPA
                      </p>
                      <p className="mt-1 font-display text-2xl font-extrabold text-[#29232D] tabular-nums">
                        {gpa !== null ? gpa.toFixed(2) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#29232D]/60">
                        Credits
                      </p>
                      <p className="mt-1 font-display text-2xl font-extrabold text-[#29232D] tabular-nums">
                        {sem.status === 'completed' && gradedCredits > 0
                          ? gradedCredits
                          : totalCredits}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#29232D]/60">
                        Courses
                      </p>
                      <p className="mt-1 font-display text-2xl font-extrabold text-[#29232D] tabular-nums">
                        {semCourses.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3.5 border-t-2 border-[#29232D]/10 bg-[#F5F3F2] flex items-center justify-between text-xs font-extrabold text-[#7955A1] group-hover:bg-[#FCE2DE] transition-colors">
                  <span>View &amp; edit courses</span>
                  <ArrowRight className="h-4 w-4 text-[#29232D] transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <SemesterModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
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
