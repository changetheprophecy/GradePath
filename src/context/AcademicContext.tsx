import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  AcademicRules,
  ActivityItem,
  AppPage,
  AssessmentTemplateComponent,
  AuthView,
  Course,
  GradeScaleEntry,
  NotificationItem,
  NotificationPreferences,
  Semester,
  StudentProfile,
  StudyResource,
} from '../types/academic';
import {
  calculateCumulativeCGPA,
  calculateSemesterGPA,
  DEFAULT_ACADEMIC_RULES,
  DEFAULT_ASSESSMENT_TEMPLATE,
  DEFAULT_GRADE_SCALE,
  getLetterFromPoint,
  migrateCourseAssessments,
} from '../utils/calculations';
import {
  DEFAULT_NOTIFICATION_PREFS,
  generateLocalNotifications,
  getBrowserNotificationStatus,
  sendBrowserNotification,
} from '../utils/notifications';
import {
  DEMO_ACTIVITIES,
  DEMO_COURSES,
  DEMO_PROFILE,
  DEMO_RESOURCES,
  DEMO_SEMESTERS,
} from '../data/seedData';

const STORAGE_KEY = 'gradepath_workspace_v1';

interface PersistedWorkspace {
  isAuthenticated: boolean;
  isDemoData: boolean;
  avatarChoiceSet?: boolean;
  profile: StudentProfile;
  semesters: Semester[];
  courses: Course[];
  resources: StudyResource[];
  activities: ActivityItem[];
  readNotificationIds: string[];
  dismissedNotificationIds: string[];
  notifiedBrowserIds: string[];
  notificationPrefs: NotificationPreferences;
  defaultAssessments: AssessmentTemplateComponent[];
  rules: AcademicRules;
  gradeScale: GradeScaleEntry[];
}

function loadInitialWorkspace(): PersistedWorkspace {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedWorkspace>;
      if (parsed && Array.isArray(parsed.semesters) && Array.isArray(parsed.courses)) {
        const rawProfile = parsed.profile ?? DEMO_PROFILE;
        const profile: StudentProfile =
          !parsed.avatarChoiceSet &&
          rawProfile.avatarUrl === '/src/assets/images/avatar_student_atasi_1795098737298.jpg'
            ? { ...rawProfile, avatarUrl: undefined }
            : rawProfile;

        const migratedCourses: Course[] = parsed.courses.map((c) => {
          const rawC = c as Partial<Course> & Record<string, unknown>;
          return {
            ...(c as Course),
            assessments: migrateCourseAssessments(rawC),
          };
        });

        const rawRules = parsed.rules as (Partial<AcademicRules> & { minInternalMarks?: number }) | undefined;
        const migratedRules: AcademicRules = {
          ...DEFAULT_ACADEMIC_RULES,
          ...(rawRules ?? {}),
          minInternalPercent:
            typeof rawRules?.minInternalPercent === 'number'
              ? rawRules.minInternalPercent
              : typeof rawRules?.minInternalMarks === 'number'
                ? Math.round((rawRules.minInternalMarks / 30) * 100)
                : DEFAULT_ACADEMIC_RULES.minInternalPercent,
        };

        const defaultAssessments =
          Array.isArray(parsed.defaultAssessments) && parsed.defaultAssessments.length > 0
            ? parsed.defaultAssessments
            : DEFAULT_ASSESSMENT_TEMPLATE;

        return {
          isAuthenticated: parsed.isAuthenticated ?? true,
          isDemoData: parsed.isDemoData ?? true,
          avatarChoiceSet: parsed.avatarChoiceSet ?? true,
          profile,
          semesters: parsed.semesters,
          courses: migratedCourses,
          resources: parsed.resources ?? DEMO_RESOURCES,
          activities: (parsed.activities ?? DEMO_ACTIVITIES).map((a) => ({
            ...a,
            detail: a.detail.replace(' (Fall 2026)', ''),
          })),
          readNotificationIds: Array.isArray(parsed.readNotificationIds)
            ? parsed.readNotificationIds
            : [],
          dismissedNotificationIds: Array.isArray(parsed.dismissedNotificationIds)
            ? parsed.dismissedNotificationIds
            : [],
          notifiedBrowserIds: Array.isArray(parsed.notifiedBrowserIds)
            ? parsed.notifiedBrowserIds
            : [],
          notificationPrefs: {
            ...DEFAULT_NOTIFICATION_PREFS,
            ...(parsed.notificationPrefs ?? {}),
          },
          defaultAssessments,
          rules: migratedRules,
          gradeScale: parsed.gradeScale ?? DEFAULT_GRADE_SCALE,
        };
      }
    }
  } catch {
    // Fallback to clean demo state if localStorage is unavailable or corrupt
  }

  return {
    isAuthenticated: true,
    isDemoData: true,
    avatarChoiceSet: true,
    profile: DEMO_PROFILE,
    semesters: DEMO_SEMESTERS,
    courses: DEMO_COURSES,
    resources: DEMO_RESOURCES,
    activities: DEMO_ACTIVITIES,
    readNotificationIds: [],
    dismissedNotificationIds: [],
    notifiedBrowserIds: [],
    notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
    defaultAssessments: DEFAULT_ASSESSMENT_TEMPLATE,
    rules: DEFAULT_ACADEMIC_RULES,
    gradeScale: DEFAULT_GRADE_SCALE,
  };
}

export type SurfaceMode = 'landing' | 'auth' | 'dashboard';

export interface LocalToastAlert {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'success';
  targetPage?: AppPage;
  targetSemesterId?: string;
}

interface AcademicContextValue {
  surfaceMode: SurfaceMode;
  setSurfaceMode: (mode: SurfaceMode) => void;
  openLanding: () => void;
  openAuth: (view?: AuthView) => void;
  enterDashboard: (page?: AppPage) => void;
  isAuthenticated: boolean;
  authView: AuthView;
  setAuthView: (view: AuthView) => void;
  isDemoData: boolean;
  activePage: AppPage;
  selectedSemesterId: string | null;
  navigateTo: (page: AppPage, semesterId?: string | null) => void;

  profile: StudentProfile;
  semesters: Semester[];
  courses: Course[];
  resources: StudyResource[];
  activities: ActivityItem[];
  notifications: NotificationItem[];
  notificationPrefs: NotificationPreferences;
  dismissedNotificationCount: number;
  toastAlert: LocalToastAlert | null;
  defaultAssessments: AssessmentTemplateComponent[];
  rules: AcademicRules;
  gradeScale: GradeScaleEntry[];

  // Derived metrics
  cgpaSummary: {
    cgpa: number;
    completedCredits: number;
    totalQualityPoints: number;
  };
  lastCompletedSemester: {
    semester: Semester | null;
    gpa: number | null;
  };

  // Auth actions
  login: (email: string) => void;
  signup: (payload: StudentProfile) => void;
  logout: () => void;

  // Academic CRUD
  addSemester: (semester: Omit<Semester, 'id'>) => Semester;
  updateSemester: (id: string, patch: Partial<Semester>) => void;
  setSemesterTargetGpa: (id: string, targetGpa: number) => void;
  deleteSemester: (id: string) => void;

  addCourse: (course: Omit<Course, 'id'>) => Course;
  updateCourse: (
    id: string,
    patch: Partial<Course>,
    activityMessage?: string,
    options?: { silentActivity?: boolean }
  ) => void;
  deleteCourse: (id: string) => void;
  applyImprovementToCourse: (courseId: string, newPoint: number, inSemesterNumber: number) => void;

  // Library CRUD
  addResource: (resource: Omit<StudyResource, 'id' | 'createdAt'>) => void;
  toggleBookmark: (id: string) => void;
  toggleResourceCompleted: (id: string) => void;
  markResourceReviewed: (id: string) => void;
  deleteResource: (id: string) => void;

  // Settings & Rules
  updateProfile: (patch: Partial<StudentProfile>) => void;
  updateRules: (patch: Partial<AcademicRules>) => void;
  updateGradeScale: (scale: GradeScaleEntry[]) => void;
  resetGradeScale: () => void;
  updateDefaultAssessments: (template: AssessmentTemplateComponent[]) => void;
  resetDefaultAssessments: () => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;
  restoreDismissedNotifications: () => void;
  updateNotificationPrefs: (patch: Partial<NotificationPreferences>) => void;
  dismissToast: () => void;
  triggerTestLocalNotification: () => { ok: boolean; message: string };

  // Workspace resets
  resetToDemoData: () => void;
  clearAllData: () => void;
}

const AcademicContext = createContext<AcademicContextValue | null>(null);

export function AcademicProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = useState<PersistedWorkspace>(() => loadInitialWorkspace());
  const [surfaceMode, setSurfaceMode] = useState<SurfaceMode>('landing');
  const [activePage, setActivePage] = useState<AppPage>('dashboard');
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [clockTick, setClockTick] = useState<number>(() => Date.now());
  const [toastAlert, setToastAlert] = useState<LocalToastAlert | null>(null);
  const shownSessionToastRef = useRef(false);

  const openLanding = () => {
    setSurfaceMode('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAuth = (view: AuthView = 'login') => {
    setAuthView(view);
    setSurfaceMode('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const enterDashboard = (page: AppPage = 'dashboard') => {
    setWorkspace((prev) => ({ ...prev, isAuthenticated: true }));
    setActivePage(page);
    setSurfaceMode('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const id = window.setInterval(() => setClockTick(Date.now()), 60000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    } catch {
      // Ignore storage quota errors
    }
  }, [workspace]);

  const notifications = useMemo(
    () =>
      generateLocalNotifications({
        courses: workspace.courses,
        semesters: workspace.semesters,
        rules: workspace.rules,
        prefs: workspace.notificationPrefs,
        readIds: workspace.readNotificationIds,
        dismissedIds: workspace.dismissedNotificationIds,
        now: new Date(clockTick),
      }),
    [
      workspace.courses,
      workspace.semesters,
      workspace.rules,
      workspace.notificationPrefs,
      workspace.readNotificationIds,
      workspace.dismissedNotificationIds,
      clockTick,
    ]
  );

  // Trigger a concise local summary toast on entering dashboard when unread alerts exist
  useEffect(() => {
    if (surfaceMode !== 'dashboard' || shownSessionToastRef.current) return;
    if (!workspace.notificationPrefs.enabled) return;

    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    shownSessionToastRef.current = true;
    const examCount = unread.filter((n) => n.category === 'exam').length;
    const missingCount = unread.filter(
      (n) => n.category === 'missing_marks' || n.category === 'low_internal'
    ).length;

    const parts: string[] = [];
    if (examCount > 0) parts.push(`${examCount} upcoming exam${examCount > 1 ? 's' : ''}`);
    if (missingCount > 0) parts.push(`${missingCount} missing-mark alert${missingCount > 1 ? 's' : ''}`);

    const firstTarget = unread[0];
    setToastAlert({
      id: `session-summary-${Date.now()}`,
      title: parts.length > 0 ? `Local Academic Alerts: ${parts.join(' & ')}` : firstTarget.title,
      description:
        unread.length === 1
          ? firstTarget.description
          : `Next up: ${firstTarget.title} (${firstTarget.time}).`,
      severity: unread.some((n) => n.severity === 'warning') ? 'warning' : 'info',
      targetPage: firstTarget.targetPage,
      targetSemesterId: firstTarget.targetSemesterId,
    });
  }, [surfaceMode, notifications, workspace.notificationPrefs.enabled]);

  // Dispatch native browser Notification for new urgent unread alerts when enabled & permitted
  useEffect(() => {
    if (
      !workspace.notificationPrefs.enabled ||
      !workspace.notificationPrefs.browserNotificationsEnabled ||
      getBrowserNotificationStatus() !== 'granted'
    ) {
      return;
    }

    const notifiedSet = new Set(workspace.notifiedBrowserIds);
    const pendingUrgent = notifications.filter(
      (n) => !n.read && n.urgent && !notifiedSet.has(n.id)
    );

    if (pendingUrgent.length === 0) return;

    const dispatchedIds: string[] = [];
    for (const item of pendingUrgent.slice(0, 3)) {
      if (sendBrowserNotification(item.title, `${item.time} · ${item.description}`, item.id)) {
        dispatchedIds.push(item.id);
      }
    }

    if (dispatchedIds.length > 0) {
      setWorkspace((prev) => ({
        ...prev,
        notifiedBrowserIds: Array.from(new Set([...prev.notifiedBrowserIds, ...dispatchedIds])),
      }));
    }
  }, [
    notifications,
    workspace.notificationPrefs.enabled,
    workspace.notificationPrefs.browserNotificationsEnabled,
    workspace.notifiedBrowserIds,
  ]);

  const navigateTo = (page: AppPage, semesterId?: string | null) => {
    setActivePage(page);
    if (semesterId !== undefined) {
      setSelectedSemesterId(semesterId);
    } else if (page !== 'semester-detail') {
      setSelectedSemesterId(null);
    }
  };

  const prependActivity = (
    prev: ActivityItem[],
    title: string,
    detail: string,
    type: ActivityItem['type']
  ): ActivityItem[] => {
    const item: ActivityItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      detail,
      timestamp: 'Just now',
      type,
    };
    return [item, ...prev].slice(0, 12);
  };

  const cgpaSummary = useMemo(
    () => calculateCumulativeCGPA(workspace.courses, workspace.gradeScale, workspace.rules),
    [workspace.courses, workspace.gradeScale, workspace.rules]
  );

  const lastCompletedSemester = useMemo(() => {
    const sorted = [...workspace.semesters].sort((a, b) => b.number - a.number);
    for (const sem of sorted) {
      const semCourses = workspace.courses.filter((c) => c.semesterId === sem.id);
      const { gpa } = calculateSemesterGPA(semCourses, workspace.gradeScale);
      if (sem.status === 'completed' && gpa !== null) {
        return { semester: sem, gpa };
      }
    }
    for (const sem of sorted) {
      const semCourses = workspace.courses.filter((c) => c.semesterId === sem.id);
      const { gpa } = calculateSemesterGPA(semCourses, workspace.gradeScale);
      if (gpa !== null) {
        return { semester: sem, gpa };
      }
    }
    return { semester: sorted[0] ?? null, gpa: null };
  }, [workspace.semesters, workspace.courses, workspace.gradeScale]);

  const login = (email: string) => {
    setWorkspace((prev) => ({
      ...prev,
      isAuthenticated: true,
      profile: {
        ...prev.profile,
        email: email.trim() || prev.profile.email,
      },
    }));
    setActivePage('dashboard');
    setSurfaceMode('dashboard');
  };

  const signup = (payload: StudentProfile) => {
    setWorkspace((prev) => ({
      ...prev,
      isAuthenticated: true,
      avatarChoiceSet: true,
      profile: {
        ...payload,
      },
      activities: prependActivity(
        prev.activities,
        'Student profile created',
        `Welcome to GradePath, ${payload.fullName}.`,
        'semester'
      ),
    }));
    setActivePage('dashboard');
    setSurfaceMode('dashboard');
  };

  const logout = () => {
    setWorkspace((prev) => ({ ...prev, isAuthenticated: false }));
    setAuthView('login');
    setSurfaceMode('auth');
  };

  const addSemester = (semester: Omit<Semester, 'id'>): Semester => {
    const newSem: Semester = {
      ...semester,
      id: `sem-${Date.now()}`,
    };
    setWorkspace((prev) => ({
      ...prev,
      semesters: [...prev.semesters, newSem].sort((a, b) => a.number - b.number),
      activities: prependActivity(
        prev.activities,
        'New semester added',
        `${newSem.name} added to academic plan.`,
        'semester'
      ),
    }));
    return newSem;
  };

  const updateSemester = (id: string, patch: Partial<Semester>) => {
    setWorkspace((prev) => ({
      ...prev,
      semesters: prev.semesters
        .map((s) => (s.id === id ? { ...s, ...patch } : s))
        .sort((a, b) => a.number - b.number),
    }));
  };

  const setSemesterTargetGpa = (id: string, targetGpa: number) => {
    const clamped = Math.round(Math.max(0, Math.min(4, targetGpa)) * 100) / 100;
    setWorkspace((prev) => ({
      ...prev,
      semesters: prev.semesters.map((s) =>
        s.id === id ? { ...s, targetGpa: clamped } : s
      ),
    }));
  };

  const deleteSemester = (id: string) => {
    setWorkspace((prev) => {
      const target = prev.semesters.find((s) => s.id === id);
      return {
        ...prev,
        semesters: prev.semesters.filter((s) => s.id !== id),
        courses: prev.courses.filter((c) => c.semesterId !== id),
        activities: target
          ? prependActivity(
              prev.activities,
              'Semester removed',
              `${target.name} and its courses were removed.`,
              'semester'
            )
          : prev.activities,
      };
    });
    if (selectedSemesterId === id) {
      navigateTo('semesters');
    }
  };

  const addCourse = (course: Omit<Course, 'id'>): Course => {
    const newCourse: Course = {
      ...course,
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    };
    setWorkspace((prev) => {
      const nextCourses = [...prev.courses, newCourse];
      const nextCgpa = calculateCumulativeCGPA(nextCourses, prev.gradeScale, prev.rules).cgpa;
      return {
        ...prev,
        courses: nextCourses,
        activities: prependActivity(
          prev.activities,
          `Course added: ${newCourse.code}`,
          `${newCourse.name} (${newCourse.credits} credits) · CGPA ${nextCgpa.toFixed(2)}.`,
          'semester'
        ),
      };
    });
    return newCourse;
  };

  const updateCourse = (
    id: string,
    patch: Partial<Course>,
    activityMessage?: string,
    options?: { silentActivity?: boolean }
  ) => {
    setWorkspace((prev) => {
      const nextCourses = prev.courses.map((c) => (c.id === id ? { ...c, ...patch } : c));
      if (options?.silentActivity) {
        return {
          ...prev,
          courses: nextCourses,
        };
      }
      const updated = nextCourses.find((c) => c.id === id);
      const nextCgpa = calculateCumulativeCGPA(nextCourses, prev.gradeScale, prev.rules).cgpa;
      const isMetadataEdit =
        patch.assessments === undefined &&
        patch.totalMarksOverride === undefined &&
        (patch.code !== undefined ||
          patch.name !== undefined ||
          patch.credits !== undefined ||
          patch.semesterId !== undefined ||
          patch.examFormSubmitted !== undefined ||
          patch.upcomingExamDate !== undefined);
      const defaultTitle = isMetadataEdit
        ? `Course updated: ${updated?.code ?? 'course'}`
        : `Marks updated for ${updated?.name ?? 'course'}`;
      const title = activityMessage ?? defaultTitle;
      const detail = updated
        ? `${updated.code} · ${updated.name} (${updated.credits} cr) · CGPA recalculated to ${nextCgpa.toFixed(2)}.`
        : `CGPA recalculated to ${nextCgpa.toFixed(2)}.`;
      return {
        ...prev,
        courses: nextCourses,
        activities: prependActivity(prev.activities, title, detail, 'marks'),
      };
    });
  };

  const deleteCourse = (id: string) => {
    setWorkspace((prev) => {
      const target = prev.courses.find((c) => c.id === id);
      const nextCourses = prev.courses.filter((c) => c.id !== id);
      const nextCgpa = calculateCumulativeCGPA(nextCourses, prev.gradeScale, prev.rules).cgpa;
      return {
        ...prev,
        courses: nextCourses,
        activities: target
          ? prependActivity(
              prev.activities,
              `Course removed: ${target.code}`,
              `CGPA recalculated to ${nextCgpa.toFixed(2)}.`,
              'cgpa'
            )
          : prev.activities,
      };
    });
  };

  const applyImprovementToCourse = (
    courseId: string,
    newPoint: number,
    inSemesterNumber: number
  ) => {
    setWorkspace((prev) => {
      const letter = getLetterFromPoint(newPoint, prev.gradeScale);
      const nextCourses = prev.courses.map((c) =>
        c.id === courseId
          ? {
              ...c,
              improvedGradePoint: newPoint,
              improvedLetterGrade: letter,
              improvedInSemesterNumber: inSemesterNumber,
            }
          : c
      );
      const target = nextCourses.find((c) => c.id === courseId);
      const nextCgpa = calculateCumulativeCGPA(nextCourses, prev.gradeScale, prev.rules).cgpa;
      return {
        ...prev,
        courses: nextCourses,
        activities: prependActivity(
          prev.activities,
          `Improvement recorded for ${target?.code ?? 'course'}`,
          `Target grade ${letter} (${newPoint.toFixed(2)}) applied · CGPA recalculated to ${nextCgpa.toFixed(2)}.`,
          'improvement'
        ),
      };
    });
  };

  const addResource = (resource: Omit<StudyResource, 'id' | 'createdAt'>) => {
    const newRes: StudyResource = {
      ...resource,
      id: `res-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setWorkspace((prev) => ({
      ...prev,
      resources: [newRes, ...prev.resources],
      activities: prependActivity(
        prev.activities,
        `Added to Study Library`,
        `${newRes.title} (${newRes.courseCode || 'General'}).`,
        'library'
      ),
    }));
  };

  const toggleBookmark = (id: string) => {
    setWorkspace((prev) => ({
      ...prev,
      resources: prev.resources.map((r) =>
        r.id === id ? { ...r, bookmarked: !r.bookmarked } : r
      ),
    }));
  };

  const toggleResourceCompleted = (id: string) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setWorkspace((prev) => {
      const target = prev.resources.find((r) => r.id === id);
      if (!target) return prev;
      const nextCompleted = !target.completed;
      return {
        ...prev,
        resources: prev.resources.map((r) =>
          r.id === id
            ? {
                ...r,
                completed: nextCompleted,
                reviewedAt: nextCompleted ? todayStr : undefined,
              }
            : r
        ),
        activities: nextCompleted
          ? prependActivity(
              prev.activities,
              `Reviewed ${target.category} topic`,
              `${target.title} (${target.courseCode || 'General'}) marked completed.`,
              'library'
            )
          : prev.activities,
      };
    });
  };

  const markResourceReviewed = (id: string) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setWorkspace((prev) => {
      const target = prev.resources.find((r) => r.id === id);
      if (!target || target.completed) return prev;
      return {
        ...prev,
        resources: prev.resources.map((r) =>
          r.id === id
            ? {
                ...r,
                completed: true,
                reviewedAt: todayStr,
              }
            : r
        ),
        activities: prependActivity(
          prev.activities,
          `Reviewed ${target.category} topic`,
          `${target.title} (${target.courseCode || 'General'}) opened and marked reviewed.`,
          'library'
        ),
      };
    });
  };

  const deleteResource = (id: string) => {
    setWorkspace((prev) => ({
      ...prev,
      resources: prev.resources.filter((r) => r.id !== id),
    }));
  };

  const updateProfile = (patch: Partial<StudentProfile>) => {
    setWorkspace((prev) => ({
      ...prev,
      avatarChoiceSet: true,
      profile: { ...prev.profile, ...patch },
    }));
  };

  const updateRules = (patch: Partial<AcademicRules>) => {
    setWorkspace((prev) => ({
      ...prev,
      rules: { ...prev.rules, ...patch },
      activities: prependActivity(
        prev.activities,
        'Academic rules updated',
        'Improvement eligibility and CGPA replacement policy recalculated.',
        'cgpa'
      ),
    }));
  };

  const updateGradeScale = (scale: GradeScaleEntry[]) => {
    setWorkspace((prev) => ({
      ...prev,
      gradeScale: [...scale].sort((a, b) => b.minMarks - a.minMarks),
    }));
  };

  const resetGradeScale = () => {
    setWorkspace((prev) => ({
      ...prev,
      gradeScale: DEFAULT_GRADE_SCALE,
    }));
  };

  const updateDefaultAssessments = (template: AssessmentTemplateComponent[]) => {
    setWorkspace((prev) => ({
      ...prev,
      defaultAssessments: template.length > 0 ? template : DEFAULT_ASSESSMENT_TEMPLATE,
    }));
  };

  const resetDefaultAssessments = () => {
    setWorkspace((prev) => ({
      ...prev,
      defaultAssessments: DEFAULT_ASSESSMENT_TEMPLATE,
    }));
  };

  const markNotificationRead = (id: string) => {
    setWorkspace((prev) => ({
      ...prev,
      readNotificationIds: prev.readNotificationIds.includes(id)
        ? prev.readNotificationIds
        : [...prev.readNotificationIds, id],
    }));
  };

  const markAllNotificationsRead = () => {
    const activeIds = notifications.map((n) => n.id);
    setWorkspace((prev) => ({
      ...prev,
      readNotificationIds: Array.from(new Set([...prev.readNotificationIds, ...activeIds])),
    }));
  };

  const dismissNotification = (id: string) => {
    setWorkspace((prev) => ({
      ...prev,
      dismissedNotificationIds: prev.dismissedNotificationIds.includes(id)
        ? prev.dismissedNotificationIds
        : [...prev.dismissedNotificationIds, id],
    }));
  };

  const restoreDismissedNotifications = () => {
    setWorkspace((prev) => ({
      ...prev,
      dismissedNotificationIds: [],
    }));
  };

  const updateNotificationPrefs = (patch: Partial<NotificationPreferences>) => {
    setWorkspace((prev) => ({
      ...prev,
      notificationPrefs: { ...prev.notificationPrefs, ...patch },
    }));
  };

  const dismissToast = () => {
    setToastAlert(null);
  };

  const triggerTestLocalNotification = (): { ok: boolean; message: string } => {
    const firstAlert = notifications[0];
    const title = firstAlert
      ? firstAlert.title
      : 'GradePath Local Alerts Active';
    const description = firstAlert
      ? `${firstAlert.time} · ${firstAlert.description}`
      : 'Upcoming exam dates and missing course marks will trigger alerts automatically.';

    setToastAlert({
      id: `test-toast-${Date.now()}`,
      title,
      description,
      severity: firstAlert?.severity ?? 'info',
      targetPage: firstAlert?.targetPage ?? 'marks',
      targetSemesterId: firstAlert?.targetSemesterId,
    });

    if (
      workspace.notificationPrefs.browserNotificationsEnabled &&
      getBrowserNotificationStatus() === 'granted'
    ) {
      const sent = sendBrowserNotification(title, description, `test-${Date.now()}`);
      if (sent) {
        return {
          ok: true,
          message: 'Test alert sent to both browser notifications and the in-app banner.',
        };
      }
    }

    return {
      ok: true,
      message: 'In-app local alert banner triggered.',
    };
  };

  const resetToDemoData = () => {
    shownSessionToastRef.current = false;
    setWorkspace((prev) => ({
      ...prev,
      isDemoData: true,
      profile: { ...DEMO_PROFILE },
      semesters: DEMO_SEMESTERS,
      courses: DEMO_COURSES,
      resources: DEMO_RESOURCES,
      activities: DEMO_ACTIVITIES,
      readNotificationIds: [],
      dismissedNotificationIds: [],
      notifiedBrowserIds: [],
      notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
      defaultAssessments: DEFAULT_ASSESSMENT_TEMPLATE,
      rules: DEFAULT_ACADEMIC_RULES,
      gradeScale: DEFAULT_GRADE_SCALE,
    }));
    navigateTo('dashboard');
  };

  const clearAllData = () => {
    setToastAlert(null);
    setWorkspace((prev) => ({
      ...prev,
      isDemoData: false,
      semesters: [],
      courses: [],
      resources: [],
      activities: [],
      readNotificationIds: [],
      dismissedNotificationIds: [],
      notifiedBrowserIds: [],
    }));
  };

  return (
    <AcademicContext.Provider
      value={{
        surfaceMode,
        setSurfaceMode,
        openLanding,
        openAuth,
        enterDashboard,
        isAuthenticated: workspace.isAuthenticated,
        authView,
        setAuthView,
        isDemoData: workspace.isDemoData,
        activePage,
        selectedSemesterId,
        navigateTo,
        profile: workspace.profile,
        semesters: workspace.semesters,
        courses: workspace.courses,
        resources: workspace.resources,
        activities: workspace.activities,
        notifications,
        notificationPrefs: workspace.notificationPrefs,
        dismissedNotificationCount: workspace.dismissedNotificationIds.length,
        toastAlert,
        defaultAssessments: workspace.defaultAssessments,
        rules: workspace.rules,
        gradeScale: workspace.gradeScale,
        cgpaSummary,
        lastCompletedSemester,
        login,
        signup,
        logout,
        addSemester,
        updateSemester,
        setSemesterTargetGpa,
        deleteSemester,
        addCourse,
        updateCourse,
        deleteCourse,
        applyImprovementToCourse,
        addResource,
        toggleBookmark,
        toggleResourceCompleted,
        markResourceReviewed,
        deleteResource,
        updateProfile,
        updateRules,
        updateGradeScale,
        resetGradeScale,
        updateDefaultAssessments,
        resetDefaultAssessments,
        markNotificationRead,
        markAllNotificationsRead,
        dismissNotification,
        restoreDismissedNotifications,
        updateNotificationPrefs,
        dismissToast,
        triggerTestLocalNotification,
        resetToDemoData,
        clearAllData,
      }}
    >
      {children}
    </AcademicContext.Provider>
  );
}

export function useAcademic() {
  const ctx = useContext(AcademicContext);
  if (!ctx) throw new Error('useAcademic must be used inside AcademicProvider');
  return ctx;
}
