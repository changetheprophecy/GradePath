import {
  AcademicRules,
  Course,
  GradeScaleEntry,
  ReplacementPolicy,
  Semester,
} from '../types/academic';

export const DEFAULT_GRADE_SCALE: GradeScaleEntry[] = [
  { minMarks: 80, maxMarks: 100, letter: 'A+', point: 4.0 },
  { minMarks: 75, maxMarks: 79, letter: 'A', point: 3.75 },
  { minMarks: 70, maxMarks: 74, letter: 'A-', point: 3.5 },
  { minMarks: 65, maxMarks: 69, letter: 'B+', point: 3.25 },
  { minMarks: 60, maxMarks: 64, letter: 'B', point: 3.0 },
  { minMarks: 55, maxMarks: 59, letter: 'B-', point: 2.75 },
  { minMarks: 50, maxMarks: 54, letter: 'C+', point: 2.5 },
  { minMarks: 45, maxMarks: 49, letter: 'C', point: 2.25 },
  { minMarks: 40, maxMarks: 44, letter: 'D', point: 2.0 },
  { minMarks: 0, maxMarks: 39, letter: 'F', point: 0.0 },
];

export const DEFAULT_ACADEMIC_RULES: AcademicRules = {
  improvementMaxPoint: 3.0,
  improvementBatchWindow: 1,
  retakeBatchWindow: 2,
  minInternalMarks: 12,
  replacementPolicy: 'replace_old',
};

export function clampMark(value: number | null, max: number): number | null {
  if (value === null || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(max, value));
}

export function getInternalMarks(course: Pick<Course, 'midterm1' | 'midterm2' | 'attendance'>): number {
  return (course.midterm1 ?? 0) + (course.midterm2 ?? 0) + (course.attendance ?? 0);
}

export function isCourseFullyMarked(
  course: Pick<Course, 'midterm1' | 'midterm2' | 'attendance' | 'finalExam' | 'totalMarksOverride'>
): boolean {
  if (course.totalMarksOverride !== null && course.totalMarksOverride !== undefined) {
    return true;
  }
  return (
    course.midterm1 !== null &&
    course.midterm2 !== null &&
    course.attendance !== null &&
    course.finalExam !== null
  );
}

export function hasFinalGrade(
  course: Pick<Course, 'finalExam' | 'totalMarksOverride'>
): boolean {
  return (
    course.finalExam !== null ||
    (course.totalMarksOverride !== null && course.totalMarksOverride !== undefined)
  );
}

export function calculateCourseTotalMarks(
  course: Pick<Course, 'midterm1' | 'midterm2' | 'attendance' | 'finalExam' | 'totalMarksOverride'>
): number | null {
  if (course.totalMarksOverride !== null && course.totalMarksOverride !== undefined) {
    return Math.round(course.totalMarksOverride * 100) / 100;
  }
  if (
    course.midterm1 === null &&
    course.midterm2 === null &&
    course.attendance === null &&
    course.finalExam === null
  ) {
    return null;
  }
  const total =
    (course.midterm1 ?? 0) +
    (course.midterm2 ?? 0) +
    (course.attendance ?? 0) +
    (course.finalExam ?? 0);
  return Math.round(total * 100) / 100;
}

export function getGradeFromMarks(
  totalMarks: number,
  gradeScale: GradeScaleEntry[] = DEFAULT_GRADE_SCALE
): { letter: string; point: number } {
  const rounded = Math.round(totalMarks);
  const sorted = [...gradeScale].sort((a, b) => b.minMarks - a.minMarks);
  for (const entry of sorted) {
    if (rounded >= entry.minMarks) {
      return { letter: entry.letter, point: entry.point };
    }
  }
  return { letter: 'F', point: 0.0 };
}

export function getLetterFromPoint(
  point: number,
  gradeScale: GradeScaleEntry[] = DEFAULT_GRADE_SCALE
): string {
  const match = gradeScale.find((g) => Math.abs(g.point - point) < 0.001);
  if (match) return match.letter;
  const sorted = [...gradeScale].sort((a, b) => Math.abs(a.point - point) - Math.abs(b.point - point));
  return sorted[0]?.letter ?? 'F';
}

export function getCourseOriginalGrade(
  course: Course,
  gradeScale: GradeScaleEntry[] = DEFAULT_GRADE_SCALE
): { totalMarks: number | null; letter: string | null; point: number | null } {
  if (!hasFinalGrade(course)) {
    return {
      totalMarks: calculateCourseTotalMarks(course),
      letter: null,
      point: null,
    };
  }
  const total = calculateCourseTotalMarks(course) ?? 0;
  const { letter, point } = getGradeFromMarks(total, gradeScale);
  return { totalMarks: total, letter, point };
}

export function resolveEffectiveGradePoint(
  originalPoint: number,
  improvedPoint: number | null | undefined,
  policy: ReplacementPolicy
): number {
  if (improvedPoint === null || improvedPoint === undefined) {
    return originalPoint;
  }
  switch (policy) {
    case 'replace_old':
      return improvedPoint;
    case 'best_grade':
      return Math.max(originalPoint, improvedPoint);
    case 'average_attempts':
      return Math.round(((originalPoint + improvedPoint) / 2) * 100) / 100;
    default:
      return improvedPoint;
  }
}

export function calculateSemesterGPA(
  semesterCourses: Course[],
  gradeScale: GradeScaleEntry[] = DEFAULT_GRADE_SCALE,
  options?: { useImproved?: boolean; policy?: ReplacementPolicy }
): {
  gpa: number | null;
  gradedCredits: number;
  totalCredits: number;
  qualityPoints: number;
} {
  let totalCredits = 0;
  let gradedCredits = 0;
  let qualityPoints = 0;

  for (const course of semesterCourses) {
    totalCredits += course.credits;
    const { point } = getCourseOriginalGrade(course, gradeScale);
    if (point !== null) {
      const effectivePoint =
        options?.useImproved && course.improvedGradePoint != null
          ? resolveEffectiveGradePoint(
              point,
              course.improvedGradePoint,
              options.policy ?? 'replace_old'
            )
          : point;
      gradedCredits += course.credits;
      qualityPoints += effectivePoint * course.credits;
    }
  }

  return {
    gpa: gradedCredits > 0 ? qualityPoints / gradedCredits : null,
    gradedCredits,
    totalCredits,
    qualityPoints,
  };
}

export function calculateCumulativeCGPA(
  courses: Course[],
  gradeScale: GradeScaleEntry[] = DEFAULT_GRADE_SCALE,
  rules: AcademicRules = DEFAULT_ACADEMIC_RULES,
  overrides?: Record<string, number>
): {
  cgpa: number;
  completedCredits: number;
  totalQualityPoints: number;
} {
  let completedCredits = 0;
  let totalQualityPoints = 0;

  for (const course of courses) {
    const { point } = getCourseOriginalGrade(course, gradeScale);
    const overridePoint = overrides?.[course.id];

    if (point !== null) {
      let effectivePoint = resolveEffectiveGradePoint(
        point,
        course.improvedGradePoint,
        rules.replacementPolicy
      );
      if (overridePoint !== undefined) {
        effectivePoint = resolveEffectiveGradePoint(
          point,
          overridePoint,
          rules.replacementPolicy
        );
      }
      completedCredits += course.credits;
      totalQualityPoints += effectivePoint * course.credits;
    } else if (overridePoint !== undefined) {
      completedCredits += course.credits;
      totalQualityPoints += overridePoint * course.credits;
    }
  }

  return {
    cgpa: completedCredits > 0 ? totalQualityPoints / completedCredits : 0,
    completedCredits,
    totalQualityPoints,
  };
}

export type ImprovementEligibilityStatus =
  | 'eligible_improvement'
  | 'retake_required'
  | 'already_improved'
  | 'window_expired'
  | 'not_needed'
  | 'in_progress';

export interface CourseImprovementEvaluation {
  course: Course;
  semesterNumber: number;
  semesterName: string;
  isPreviousSemester: boolean;
  improvementMaxPoint: number;
  originalLetter: string | null;
  originalPoint: number | null;
  effectivePoint: number | null;
  internalMarks: number;
  status: ImprovementEligibilityStatus;
  statusLabel: string;
  reason: string;
}

export function evaluateCourseForImprovement(
  course: Course,
  semester: Semester | undefined,
  currentSemesterNumber: number,
  gradeScale: GradeScaleEntry[] = DEFAULT_GRADE_SCALE,
  rules: AcademicRules = DEFAULT_ACADEMIC_RULES
): CourseImprovementEvaluation {
  const semesterNumber = semester?.number ?? 1;
  const semesterName = semester?.name ?? 'Semester';
  const batchesElapsed = Math.max(0, currentSemesterNumber - semesterNumber);
  const isPreviousSemester = batchesElapsed === 1;
  const maxPointThreshold = course.improvementMaxPoint ?? rules.improvementMaxPoint;
  const { letter, point } = getCourseOriginalGrade(course, gradeScale);
  const internalMarks = getInternalMarks(course);

  if (point === null) {
    if (!course.examFormSubmitted || internalMarks < rules.minInternalMarks) {
      const reasons: string[] = [];
      if (internalMarks < rules.minInternalMarks) {
        reasons.push(`Internal marks ${internalMarks}/30 (< ${rules.minInternalMarks} minimum)`);
      }
      if (!course.examFormSubmitted) {
        reasons.push('Exam form not submitted');
      }
      return {
        course,
        semesterNumber,
        semesterName,
        isPreviousSemester,
        improvementMaxPoint: maxPointThreshold,
        originalLetter: letter,
        originalPoint: point,
        effectivePoint: point,
        internalMarks,
        status: 'retake_required',
        statusLabel: 'Retake Required',
        reason: `${reasons.join(' · ')}. Must follow retake policy within ${rules.retakeBatchWindow} batches.`,
      };
    }
    return {
      course,
      semesterNumber,
      semesterName,
      isPreviousSemester,
      improvementMaxPoint: maxPointThreshold,
      originalLetter: null,
      originalPoint: null,
      effectivePoint: null,
      internalMarks,
      status: 'in_progress',
      statusLabel: 'In Progress',
      reason: 'Awaiting final examination marks.',
    };
  }

  const effectivePoint = resolveEffectiveGradePoint(
    point,
    course.improvedGradePoint,
    rules.replacementPolicy
  );

  if (course.improvedGradePoint !== null && course.improvedGradePoint !== undefined) {
    return {
      course,
      semesterNumber,
      semesterName,
      isPreviousSemester,
      improvementMaxPoint: maxPointThreshold,
      originalLetter: letter,
      originalPoint: point,
      effectivePoint,
      internalMarks,
      status: 'already_improved',
      statusLabel: 'Improved',
      reason: `Previously improved from ${point.toFixed(2)} to ${course.improvedGradePoint.toFixed(2)}.`,
    };
  }

  // Current in-progress semester courses are not yet from a previous semester
  if (batchesElapsed === 0 && semester?.status === 'in_progress') {
    return {
      course,
      semesterNumber,
      semesterName,
      isPreviousSemester,
      improvementMaxPoint: maxPointThreshold,
      originalLetter: letter,
      originalPoint: point,
      effectivePoint,
      internalMarks,
      status: 'in_progress',
      statusLabel: 'Current Semester',
      reason: `Current term course (${point.toFixed(2)} GP). Improvement eligibility applies once it becomes a previous semester.`,
    };
  }

  const hasAnyInternal =
    course.midterm1 !== null || course.midterm2 !== null || course.attendance !== null;
  const lowInternal =
    (hasAnyInternal || course.totalMarksOverride == null) &&
    internalMarks < rules.minInternalMarks;

  // Check failed or internal/form disqualifications first
  if (point === 0 || !course.examFormSubmitted || lowInternal) {
    if (batchesElapsed > rules.retakeBatchWindow) {
      return {
        course,
        semesterNumber,
        semesterName,
        isPreviousSemester,
        improvementMaxPoint: maxPointThreshold,
        originalLetter: letter,
        originalPoint: point,
        effectivePoint,
        internalMarks,
        status: 'window_expired',
        statusLabel: 'Window Expired',
        reason: `Retake window (${rules.retakeBatchWindow} batches) exceeded.`,
      };
    }

    const triggers: string[] = [];
    if (point === 0) triggers.push('Failed course (0.00)');
    if (lowInternal) {
      triggers.push(`Internal marks ${internalMarks}/30 < ${rules.minInternalMarks}`);
    }
    if (!course.examFormSubmitted) triggers.push('Exam form missing');

    return {
      course,
      semesterNumber,
      semesterName,
      isPreviousSemester,
      improvementMaxPoint: maxPointThreshold,
      originalLetter: letter,
      originalPoint: point,
      effectivePoint,
      internalMarks,
      status: 'retake_required',
      statusLabel: 'Retake Required',
      reason: `${triggers.join(' · ')}. Eligible for full retake within ${rules.retakeBatchWindow} batches.`,
    };
  }

  if (point < maxPointThreshold) {
    if (batchesElapsed <= rules.improvementBatchWindow) {
      return {
        course,
        semesterNumber,
        semesterName,
        isPreviousSemester,
        improvementMaxPoint: maxPointThreshold,
        originalLetter: letter,
        originalPoint: point,
        effectivePoint,
        internalMarks,
        status: 'eligible_improvement',
        statusLabel: 'Eligible for Improvement',
        reason: `${semesterName} course GP ${point.toFixed(2)} is below its ${maxPointThreshold.toFixed(2)} improvement max point (within ${rules.improvementBatchWindow}-semester window).`,
      };
    }
    return {
      course,
      semesterNumber,
      semesterName,
      isPreviousSemester,
      improvementMaxPoint: maxPointThreshold,
      originalLetter: letter,
      originalPoint: point,
      effectivePoint,
      internalMarks,
      status: 'window_expired',
      statusLabel: 'Window Expired',
      reason: `Grade point ${point.toFixed(2)} < ${maxPointThreshold.toFixed(2)}, but ${batchesElapsed} semesters elapsed (limit: ${rules.improvementBatchWindow}).`,
    };
  }

  return {
    course,
    semesterNumber,
    semesterName,
    isPreviousSemester,
    improvementMaxPoint: maxPointThreshold,
    originalLetter: letter,
    originalPoint: point,
    effectivePoint,
    internalMarks,
    status: 'not_needed',
    statusLabel: 'Above Threshold',
    reason: `Grade point ${point.toFixed(2)} meets or exceeds its ${maxPointThreshold.toFixed(2)} improvement max point.`,
  };
}

export interface SemesterTargetProgress {
  targetGpa: number;
  currentGpa: number | null;
  confirmedGpa: number | null;
  isPaceEstimate: boolean;
  maxPossibleGpa: number | null;
  progressPercent: number;
  gapToGoal: number | null;
  isAchieved: boolean;
  isAchievable: boolean;
  totalCredits: number;
  finalizedCredits: number;
  finalizedCoursesCount: number;
  totalCoursesCount: number;
  neededRemainingAvgGp: number | null;
}

export function calculateSemesterTargetProgress(
  semesterCourses: Course[],
  targetGpa: number,
  gradeScale: GradeScaleEntry[] = DEFAULT_GRADE_SCALE
): SemesterTargetProgress {
  if (semesterCourses.length === 0) {
    return {
      targetGpa,
      currentGpa: null,
      confirmedGpa: null,
      isPaceEstimate: false,
      maxPossibleGpa: null,
      progressPercent: 0,
      gapToGoal: null,
      isAchieved: false,
      isAchievable: true,
      totalCredits: 0,
      finalizedCredits: 0,
      finalizedCoursesCount: 0,
      totalCoursesCount: 0,
      neededRemainingAvgGp: null,
    };
  }

  let totalCredits = 0;
  let finalizedCredits = 0;
  let finalizedCoursesCount = 0;
  let confirmedQualityPoints = 0;
  let paceCredits = 0;
  let paceQualityPoints = 0;
  let maxQualityPoints = 0;

  for (const course of semesterCourses) {
    totalCredits += course.credits;
    const { point } = getCourseOriginalGrade(course, gradeScale);

    if (point !== null) {
      finalizedCredits += course.credits;
      finalizedCoursesCount += 1;
      confirmedQualityPoints += point * course.credits;
      paceCredits += course.credits;
      paceQualityPoints += point * course.credits;
      maxQualityPoints += point * course.credits;
    } else {
      const m1 = course.midterm1;
      const m2 = course.midterm2;
      const att = course.attendance;
      const enteredScore = (m1 ?? 0) + (m2 ?? 0) + (att ?? 0);
      const enteredMax =
        (m1 !== null ? 10 : 0) + (m2 !== null ? 10 : 0) + (att !== null ? 10 : 0);

      if (enteredMax > 0) {
        const normalizedPct = (enteredScore / enteredMax) * 100;
        const paceGrade = getGradeFromMarks(normalizedPct, gradeScale);
        paceCredits += course.credits;
        paceQualityPoints += paceGrade.point * course.credits;
      }

      const maxPossibleMarks =
        enteredScore +
        (m1 === null ? 10 : 0) +
        (m2 === null ? 10 : 0) +
        (att === null ? 10 : 0) +
        70;
      const maxGrade = getGradeFromMarks(maxPossibleMarks, gradeScale);
      maxQualityPoints += maxGrade.point * course.credits;
    }
  }

  const confirmedGpa =
    finalizedCredits > 0 ? confirmedQualityPoints / finalizedCredits : null;
  const currentGpa = paceCredits > 0 ? paceQualityPoints / paceCredits : null;
  const maxPossibleGpa = totalCredits > 0 ? maxQualityPoints / totalCredits : null;
  const isPaceEstimate = finalizedCoursesCount < semesterCourses.length;

  const progressPercent =
    currentGpa !== null && targetGpa > 0
      ? Math.min(100, Math.max(0, (currentGpa / targetGpa) * 100))
      : 0;

  const gapToGoal = currentGpa !== null ? currentGpa - targetGpa : null;
  const isAchieved = currentGpa !== null && currentGpa >= targetGpa - 0.001;
  const isAchievable =
    maxPossibleGpa !== null ? maxPossibleGpa >= targetGpa - 0.001 : true;

  const remainingCredits = totalCredits - finalizedCredits;
  const neededRemainingAvgGp =
    remainingCredits > 0
      ? (targetGpa * totalCredits - confirmedQualityPoints) / remainingCredits
      : null;

  return {
    targetGpa,
    currentGpa,
    confirmedGpa,
    isPaceEstimate,
    maxPossibleGpa,
    progressPercent,
    gapToGoal,
    isAchieved,
    isAchievable,
    totalCredits,
    finalizedCredits,
    finalizedCoursesCount,
    totalCoursesCount: semesterCourses.length,
    neededRemainingAvgGp,
  };
}

