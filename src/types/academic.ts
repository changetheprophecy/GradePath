export type SemesterStatus = 'completed' | 'in_progress' | 'planned';

export type ReplacementPolicy = 'replace_old' | 'best_grade' | 'average_attempts';

export interface GradeScaleEntry {
  minMarks: number;
  maxMarks: number;
  letter: string;
  point: number;
}

export interface AcademicRules {
  improvementMaxPoint: number; // Default GP cutoff per course from the previous semester (strictly below this GP is eligible, e.g., 3.00)
  improvementBatchWindow: number; // Number of subsequent semesters allowed for improvement (e.g., 1)
  retakeBatchWindow: number; // Number of subsequent semesters allowed for failed/retake courses (e.g., 2)
  minInternalMarks: number; // Minimum internal marks (M1 + M2 + Att) out of 30 required to sit for final/improvement (e.g., 12)
  replacementPolicy: ReplacementPolicy;
}

export interface Course {
  id: string;
  semesterId: string;
  code: string;
  name: string;
  credits: number;
  midterm1: number | null; // max 10
  midterm2: number | null; // max 10
  attendance: number | null; // max 10
  finalExam: number | null; // max 70
  totalMarksOverride?: number | null; // optional direct total marks (/100) override
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
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  type: 'marks' | 'semester' | 'cgpa' | 'improvement' | 'library';
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  severity: 'info' | 'warning' | 'success';
  targetPage?: AppPage;
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
