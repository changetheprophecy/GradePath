import {
  AcademicRules,
  Course,
  NotificationItem,
  NotificationPreferences,
  Semester,
} from '../types/academic';
import { getCourseInternalSummary, hasFinalGrade, isCourseFullyMarked } from './calculations';

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  enabled: true,
  examAlertsEnabled: true,
  missingMarksAlertsEnabled: true,
  examLeadDays: 21,
  browserNotificationsEnabled: false,
};

export function parseLocalDate(dateStr: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const dt = new Date(year, month, day);
  if (
    dt.getFullYear() !== year ||
    dt.getMonth() !== month ||
    dt.getDate() !== day
  ) {
    return null;
  }
  return dt;
}

export function getDaysUntilDate(dateStr: string, now: Date = new Date()): number | null {
  const target = parseLocalDate(dateStr);
  if (!target) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function formatExamDateShort(dateStr: string): string {
  const dt = parseLocalDate(dateStr);
  if (!dt) return dateStr;
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatExamCountdown(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days > 1) return `In ${days} days`;
  if (days === -1) return 'Yesterday';
  return `${Math.abs(days)}d overdue`;
}

interface InternalAlertCandidate {
  priority: number;
  item: NotificationItem;
}

export function generateLocalNotifications(params: {
  courses: Course[];
  semesters: Semester[];
  rules: AcademicRules;
  prefs: NotificationPreferences;
  readIds: string[];
  dismissedIds: string[];
  now?: Date;
}): NotificationItem[] {
  const {
    courses,
    semesters,
    rules,
    prefs,
    readIds,
    dismissedIds,
    now = new Date(),
  } = params;

  if (!prefs.enabled) {
    return [];
  }

  const readSet = new Set(readIds);
  const dismissedSet = new Set(dismissedIds);
  const semMap = new Map(semesters.map((s) => [s.id, s]));
  const candidates: InternalAlertCandidate[] = [];

  for (const course of courses) {
    const sem = semMap.get(course.semesterId);
    const semName = sem?.name ?? 'Semester';

    // 1. Upcoming exam date alerts (when final grade is not yet recorded)
    let hasFutureScheduledExam = false;
    let examPassedWithoutFinal = false;

    if (course.upcomingExamDate && !hasFinalGrade(course)) {
      const daysLeft = getDaysUntilDate(course.upcomingExamDate, now);
      if (daysLeft !== null) {
        if (daysLeft >= 0) {
          hasFutureScheduledExam = true;
        } else {
          examPassedWithoutFinal = true;
        }

        if (prefs.examAlertsEnabled && daysLeft <= prefs.examLeadDays) {
          const id = `exam:${course.id}:${course.upcomingExamDate}`;
          if (!dismissedSet.has(id)) {
            const formattedDate = formatExamDateShort(course.upcomingExamDate);
            const countdown = formatExamCountdown(daysLeft);
            const isOverdue = daysLeft < 0;
            const isUrgent = isOverdue || daysLeft <= 7 || !course.examFormSubmitted;

            let title = `Upcoming Exam: ${course.code} ${course.name}`;
            let description = `${semName} · Scheduled for ${formattedDate}.`;
            let priority = 20 + Math.max(0, daysLeft);

            if (isOverdue) {
              title = `Exam Passed: ${course.code} ${course.name}`;
              description = `${semName} · Exam was ${formattedDate} and Final Exam (/70) is still empty. Enter your marks or update the date.`;
              priority = 0;
            } else if (daysLeft <= 1) {
              title = `Exam ${daysLeft === 0 ? 'Today' : 'Tomorrow'}: ${course.code} ${course.name}`;
              description = `${semName} · ${formattedDate}${
                !course.examFormSubmitted
                  ? ' · Exam form not marked submitted!'
                  : ' · Review your internal marks and target score.'
              }`;
              priority = 1 + daysLeft;
            } else if (!course.examFormSubmitted) {
              description = `${semName} · ${formattedDate} · Exam form is not marked submitted yet.`;
              priority = 5 + daysLeft;
            } else if (daysLeft <= 7) {
              description = `${semName} · ${formattedDate} · Final prep window active.`;
              priority = 8 + daysLeft;
            }

            candidates.push({
              priority,
              item: {
                id,
                title,
                description,
                time: countdown,
                read: readSet.has(id),
                severity: isOverdue || daysLeft <= 3 || !course.examFormSubmitted ? 'warning' : 'info',
                category: 'exam',
                targetPage: 'semester-detail',
                targetSemesterId: course.semesterId,
                courseId: course.id,
                urgent: isUrgent,
              },
            });
          }
        }
      }
    }

    // 2. Missing marks alerts
    if (prefs.missingMarksAlertsEnabled) {
      const comps = course.assessments ?? [];
      const hasAnyMark =
        comps.some((a) => a.obtainedMarks !== null) ||
        (course.totalMarksOverride !== null && course.totalMarksOverride !== undefined);

      // Skip planned semesters unless student already started entering marks or exam date is passed
      const shouldCheckMissing =
        sem?.status !== 'planned' || hasAnyMark || examPassedWithoutFinal;

      if (shouldCheckMissing && !isCourseFullyMarked(course)) {
        const missingComponents: string[] = [];
        let missingFinal = false;

        for (const comp of comps) {
          if (comp.obtainedMarks !== null) continue;
          if (comp.kind === 'final') {
            if (sem?.status === 'completed' || examPassedWithoutFinal || !hasFutureScheduledExam) {
              missingComponents.push(comp.name);
              missingFinal = true;
            }
          } else {
            missingComponents.push(comp.name);
          }
        }

        if (missingComponents.length > 0) {
          const id = `missing:${course.id}:${missingComponents.join(',')}`;
          if (!dismissedSet.has(id)) {
            const isCompletedSem = sem?.status === 'completed';
            const isUrgent = isCompletedSem || examPassedWithoutFinal || missingFinal;
            candidates.push({
              priority: isCompletedSem ? 12 : 35,
              item: {
                id,
                title: `Missing Marks: ${course.code} ${course.name}`,
                description: `${semName} · Missing ${missingComponents.join(', ')}. Update marks to keep GPA accurate.`,
                time: `${missingComponents.length} missing`,
                read: readSet.has(id),
                severity: isUrgent ? 'warning' : 'info',
                category: 'missing_marks',
                targetPage: 'semester-detail',
                targetSemesterId: course.semesterId,
                courseId: course.id,
                urgent: isUrgent,
              },
            });
          }
        }
      }

      // 3. Low internal marks warning (eligible/attendance risk before finals)
      const internal = getCourseInternalSummary(course);
      if (
        internal.max > 0 &&
        internal.allEntered &&
        (internal.percentage ?? 100) < rules.minInternalPercent &&
        !hasFinalGrade(course)
      ) {
        const pctRound = Math.round(internal.percentage ?? 0);
        const id = `low-internal:${course.id}:${internal.obtained}:${internal.max}:${rules.minInternalPercent}`;
        if (!dismissedSet.has(id)) {
          candidates.push({
            priority: 15,
            item: {
              id,
              title: `Low Internal Marks: ${course.code}`,
              description: `${course.name} (${semName}) internal score is ${internal.obtained}/${internal.max} (${pctRound}%), below the ${rules.minInternalPercent}% minimum rule.`,
              time: `${internal.obtained}/${internal.max}`,
              read: readSet.has(id),
              severity: 'warning',
              category: 'low_internal',
              targetPage: 'semester-detail',
              targetSemesterId: course.semesterId,
              courseId: course.id,
              urgent: true,
            },
          });
        }
      }
    }
  }

  candidates.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.item.title.localeCompare(b.item.title);
  });

  return candidates.map((c) => c.item);
}

export type BrowserNotificationSupportStatus =
  | 'granted'
  | 'default'
  | 'denied'
  | 'unsupported';

export function getBrowserNotificationStatus(): BrowserNotificationSupportStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationSupportStatus> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return getBrowserNotificationStatus();
  }
}

export function sendBrowserNotification(title: string, body: string, tag?: string): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }
  try {
    new Notification(title, {
      body,
      tag,
    });
    return true;
  } catch {
    return false;
  }
}
