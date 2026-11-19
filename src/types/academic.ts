export type SemesterStatus = 'completed' | 'in_progress' | 'planned';

export type ReplacementPolicy = 'replace_old' | 'best_grade' | 'average_attempts';

export interface GradeScaleEntry {
  minMarks: number;
  maxMarks: number;
  letter: string;
  point: number;
}

export type AssessmentKind = 'midterm' | 'attendance' | 'final' | 'other';

export interface AssessmentComponent {
  id: string;
  name: string;
  kind: AssessmentKind;
  maxMarks: number;
  obtainedMarks: number | null;
}

export type AssessmentTemplateComponent = Omit<AssessmentComponent, 'obtainedMarks'>;

export interface AcademicRules {
  improvementMaxPoint: number; // Default GP cutoff per course from the previous semester (strictly below this GP is eligible, e.g., 3.00)
  improvementBatchWindow: number; // Number of subsequent semesters allowed for improvement (e.g., 1)
  retakeBatchWindow: number; // Number of subsequent semesters allowed for failed/retake courses (e.g., 2)
  minInternalPercent: number; // Minimum internal marks percentage (e.g., 40%) required to sit for final/improvement
  minInternalMarks?: number; // Legacy field kept optional for backwards migration
  replacementPolicy: ReplacementPolicy;
}

export interface Course {
  id: string;
  semesterId: string;
  code: string;
  name: string;
  credits: number;
  assessments: AssessmentComponent[];
  totalMarksOverride?: number | null; // Optional direct total marks override (out of configured total max marks)
  // Legacy optional fields kept only for migrating older saved workspaces
  midterm1?: number | null;
  midterm2?: number | null;
  attendance?: number | null;
  finalExam?: number | null;
  examFormSubmitted: boolean;
  upcomingExamDate?: string;
  improvementMaxPoint?: number | null; // Optional per-course improvement max point override for previous-semester eligibility
  improvedGradePoint?: number | null; // Recorded improvement grade point if retaken/improved later
  improvedLetterGrade?: string | null;
  improvedInSemesterNumber?: number | null;
}

export interface Semester {
  id: string;
  number: number;
  name: string;
  status: SemesterStatus;
  targetGpa?: number;
}

export type ResourceCategory =
  | 'Lecture Notes'
  | 'PDF Files'
  | 'Course Materials'
  | 'Past Exam Questions'
  | 'Reference Links';

export interface StudyResource {
  id: string;
  title: string;
  courseCode: string;
  category: ResourceCategory;
  url?: string;
  fileName?: string;
  fileSize?: string;
  notes?: string;
  bookmarked: boolean;
  completed?: boolean;
  reviewedAt?: string;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  type: 'marks' | 'semester' | 'cgpa' | 'improvement' | 'library';
}

export type NotificationCategory = 'exam' | 'missing_marks' | 'low_internal' | 'system';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  severity: 'info' | 'warning' | 'success';
  category: NotificationCategory;
  targetPage?: AppPage;
  targetSemesterId?: string;
  courseId?: string;
  urgent?: boolean;
}

export interface NotificationPreferences {
  enabled: boolean;
  examAlertsEnabled: boolean;
  missingMarksAlertsEnabled: boolean;
  examLeadDays: number;
  browserNotificationsEnabled: boolean;
}

export interface StudentProfile {
  fullName: string;
  email: string;
  university: string;
  department: string;
  studentId: string;
  currentSemester: number;
  avatarUrl?: string;
}

export type AppPage =
  | 'dashboard'
  | 'semesters'
  | 'semester-detail'
  | 'predictor'
  | 'improvement'
  | 'marks'
  | 'library'
  | 'settings';

export type AuthView = 'login' | 'signup' | 'forgot-password';
