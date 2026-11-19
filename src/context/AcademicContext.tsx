import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AcademicRules,
  ActivityItem,
  AppPage,
  AuthView,
  Course,
  GradeScaleEntry,
  NotificationItem,
  Semester,
  StudentProfile,
  StudyResource,
} from '../types/academic';
import {
  calculateCumulativeCGPA,
  calculateSemesterGPA,
  DEFAULT_ACADEMIC_RULES,
  DEFAULT_GRADE_SCALE,
  getLetterFromPoint,
} from '../utils/calculations';
import {
  DEMO_ACTIVITIES,
  DEMO_COURSES,
  DEMO_NOTIFICATIONS,
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
  notifications: NotificationItem[];
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

        return {
          isAuthenticated: parsed.isAuthenticated ?? true,
          isDemoData: parsed.isDemoData ?? true,
          avatarChoiceSet: parsed.avatarChoiceSet ?? true,
          profile,
          semesters: parsed.semesters,
          courses: parsed.courses,
          resources: parsed.resources ?? DEMO_RESOURCES,
          activities: (parsed.activities ?? DEMO_ACTIVITIES).map((a) => ({
            ...a,
            detail: a.detail.replace(' (Fall 2026)', ''),
          })),
          notifications: parsed.notifications ?? DEMO_NOTIFICATIONS,
          rules: parsed.rules ?? DEFAULT_ACADEMIC_RULES,
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
    notifications: DEMO_NOTIFICATIONS,
    rules: DEFAULT_ACADEMIC_RULES,
    gradeScale: DEFAULT_GRADE_SCALE,
  };
}

export type SurfaceMode = 'landing' | 'auth' | 'dashboard';

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
  deleteResource: (id: string) => void;

  // Settings & Rules
  updateProfile: (patch: Partial<StudentProfile>) => void;
  updateRules: (patch: Partial<AcademicRules>) => void;
  updateGradeScale: (scale: GradeScaleEntry[]) => void;
  resetGradeScale: () => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    } catch {
      // Ignore storage quota errors
    }
  }, [workspace]);

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
        patch.code !== undefined ||
        patch.name !== undefined ||
        patch.credits !== undefined ||
        patch.semesterId !== undefined ||
        patch.examFormSubmitted !== undefined ||
        patch.upcomingExamDate !== undefined;
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

  const markNotificationRead = (id: string) => {
    setWorkspace((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  };

  const markAllNotificationsRead = () => {
    setWorkspace((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  };

  const resetToDemoData = () => {
    setWorkspace((prev) => ({
      ...prev,
      isDemoData: true,
      profile: { ...DEMO_PROFILE },
      semesters: DEMO_SEMESTERS,
      courses: DEMO_COURSES,
      resources: DEMO_RESOURCES,
      activities: DEMO_ACTIVITIES,
      notifications: DEMO_NOTIFICATIONS,
      rules: DEFAULT_ACADEMIC_RULES,
      gradeScale: DEFAULT_GRADE_SCALE,
    }));
    navigateTo('dashboard');
  };

  const clearAllData = () => {
    setWorkspace((prev) => ({
      ...prev,
      isDemoData: false,
      semesters: [],
      courses: [],
      resources: [],
      activities: [],
      notifications: [],
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
        notifications: workspace.notifications,
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
        deleteResource,
        updateProfile,
        updateRules,
        updateGradeScale,
        resetGradeScale,
        markNotificationRead,
        markAllNotificationsRead,
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
