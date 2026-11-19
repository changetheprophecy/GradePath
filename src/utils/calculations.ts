import {
  AcademicRules,
  AssessmentComponent,
  AssessmentTemplateComponent,
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
  minInternalPercent: 40,
  replacementPolicy: 'replace_old',
};

export const DEFAULT_ASSESSMENT_TEMPLATE: AssessmentTemplateComponent[] = [
  { id: 'mid-1', name: 'Midterm 1', kind: 'midterm', maxMarks: 10 },
  { id: 'mid-2', name: 'Midterm 2', kind: 'midterm', maxMarks: 10 },
  { id: 'att', name: 'Attendance', kind: 'attendance', maxMarks: 10 },
  { id: 'final', name: 'Final Exam', kind: 'final', maxMarks: 70 },
];

export const ASSESSMENT_PRESETS: Array<{
  id: string;
  label: string;
  components: AssessmentTemplateComponent[];
}> = [
  {
    id: 'standard-10-10-10-70',
    label: '2 Midterms + Attend + Final (10/10/10/70)',
    components: [
      { id: 'mid-1', name: 'Midterm 1', kind: 'midterm', maxMarks: 10 },
      { id: 'mid-2', name: 'Midterm 2', kind: 'midterm', maxMarks: 10 },
      { id: 'att', name: 'Attendance', kind: 'attendance', maxMarks: 10 },
      { id: 'final', name: 'Final Exam', kind: 'final', maxMarks: 70 },
    ],
  },
  {
    id: 'balanced-15-15-10-10-50',
    label: '2 Mid + Attend + Assign + Final (15/15/10/10/50)',
    components: [
      { id: 'mid-1', name: 'Midterm 1', kind: 'midterm', maxMarks: 15 },
      { id: 'mid-2', name: 'Midterm 2', kind: 'midterm', maxMarks: 15 },
      { id: 'att', name: 'Attendance', kind: 'attendance', maxMarks: 10 },
      { id: 'assign', name: 'Assignment', kind: 'other', maxMarks: 10 },
      { id: 'final', name: 'Final Exam', kind: 'final', maxMarks: 50 },
    ],
  },
  {
    id: 'single-mid-20-10-10-60',
    label: '1 Midterm + Attend + Quiz + Final (20/10/10/60)',
    components: [
      { id: 'mid-1', name: 'Midterm', kind: 'midterm', maxMarks: 20 },
      { id: 'att', name: 'Attendance', kind: 'attendance', maxMarks: 10 },
      { id: 'quiz', name: 'Quizzes', kind: 'other', maxMarks: 10 },
      { id: 'final', name: 'Final Exam', kind: 'final', maxMarks: 60 },
    ],
  },
  {
    id: 'lab-continuous',
    label: 'Lab / Continuous Assessment (30/40/20/10)',
    components: [
      { id: 'lab', name: 'Lab Performance', kind: 'other', maxMarks: 30 },
      { id: 'proj', name: 'Project / Practical', kind: 'other', maxMarks: 40 },
      { id: 'viva', name: 'Presentation / Viva', kind: 'final', maxMarks: 20 },
      { id: 'att', name: 'Attendance', kind: 'attendance', maxMarks: 10 },
    ],
  },
];

export function createAssessmentsFromTemplate(
  template: AssessmentTemplateComponent[] = DEFAULT_ASSESSMENT_TEMPLATE
): AssessmentComponent[] {
  return template.map((comp, idx) => ({
    id: comp.id || `comp-${idx}-${Date.now()}`,
    name: comp.name,
    kind: comp.kind,
    maxMarks: comp.maxMarks,
    obtainedMarks: null,
  }));
}

export function clampMark(value: number | null | undefined, max: number): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return Math.round(Math.max(0, Math.min(max, value)) * 100) / 100;
}

export function migrateCourseAssessments(
  rawCourse: Partial<Course> & Record<string, unknown>
): AssessmentComponent[] {
  if (Array.isArray(rawCourse.assessments) && rawCourse.assessments.length > 0) {
    return rawCourse.assessments.map((item, idx) => {
      const comp = item as Partial<AssessmentComponent>;
      const maxMarks =
        typeof comp.maxMarks === 'number' && !Number.isNaN(comp.maxMarks) && comp.maxMarks > 0
          ? Math.round(comp.maxMarks * 100) / 100
          : 10;
      const obtained =
        typeof comp.obtainedMarks === 'number' && !Number.isNaN(comp.obtainedMarks)
          ? clampMark(comp.obtainedMarks, maxMarks)
          : null;
      return {
        id: typeof comp.id === 'string' && comp.id ? comp.id : `comp-${idx}`,
        name: typeof comp.name === 'string' && comp.name.trim() ? comp.name.trim() : `Assessment ${idx + 1}`,
        kind:
          comp.kind === 'midterm' ||
          comp.kind === 'attendance' ||
          comp.kind === 'final' ||
          comp.kind === 'other'
            ? comp.kind
            : 'other',
        maxMarks,
        obtainedMarks: obtained,
      };
    });
  }

  return [
    {
      id: 'mid-1',
      name: 'Midterm 1',
      kind: 'midterm',
      maxMarks: 10,
      obtainedMarks: clampMark(rawCourse.midterm1 ?? null, 10),
    },
    {
      id: 'mid-2',
      name: 'Midterm 2',
      kind: 'midterm',
      maxMarks: 10,
      obtainedMarks: clampMark(rawCourse.midterm2 ?? null, 10),
    },
    {
      id: 'att',
      name: 'Attendance',
      kind: 'attendance',
      maxMarks: 10,
      obtainedMarks: clampMark(rawCourse.attendance ?? null, 10),
    },
    {
      id: 'final',
      name: 'Final Exam',
      kind: 'final',
      maxMarks: 70,
      obtainedMarks: clampMark(rawCourse.finalExam ?? null, 70),
    },
  ];
}

export function getCourseMaxTotalMarks(
  course: Pick<Course, 'assessments'>
): number {
  if (!course.assessments || course.assessments.length === 0) return 0;
  const total = course.assessments.reduce((sum, a) => sum + (Number(a.maxMarks) || 0), 0);
  return Math.round(total * 100) / 100;
}

export function getCourseInternalSummary(
  course: Pick<Course, 'assessments'>
): {
  obtained: number;
  max: number;
  percentage: number | null;
  hasAnyEntered: boolean;
  allEntered: boolean;
} {
  const internalComps = (course.assessments ?? []).filter((a) => a.kind !== 'final');
  if (internalComps.length === 0) {
    return {
      obtained: 0,
      max: 0,
      percentage: null,
      hasAnyEntered: false,
      allEntered: true,
    };
  }
  const obtained = Math.round(
    internalComps.reduce((sum, a) => sum + (a.obtainedMarks ?? 0), 0) * 100
  ) / 100;
  const max = Math.round(
    internalComps.reduce((sum, a) => sum + (Number(a.maxMarks) || 0), 0) * 100
  ) / 100;
  const hasAnyEntered = internalComps.some((a) => a.obtainedMarks !== null);
  const allEntered = internalComps.every((a) => a.obtainedMarks !== null);
  const percentage = max > 0 ? Math.round((obtained / max) * 10000) / 100 : null;

  return {
    obtained,
    max,
    percentage,
    hasAnyEntered,
    allEntered,
  };
}

export function isCourseFullyMarked(
  course: Pick<Course, 'assessments' | 'totalMarksOverride'>
): boolean {
  if (course.totalMarksOverride !== null && course.totalMarksOverride !== undefined) {
    return true;
  }
  return (
    course.assessments.length > 0 &&
    course.assessments.every((a) => a.obtainedMarks !== null)
  );
}

export function hasFinalGrade(
  course: Pick<Course, 'assessments' | 'totalMarksOverride'>
): boolean {
  if (course.totalMarksOverride !== null && course.totalMarksOverride !== undefined) {
    return true;
  }
  if (!course.assessments || course.assessments.length === 0) {
    return false;
  }
  const finals = course.assessments.filter((a) => a.kind === 'final');
  if (finals.length > 0) {
    return finals.every((a) => a.obtainedMarks !== null);
  }
  // If a course has no 'final' exam component (e.g., 100% continuous assessment),
  // it has a final grade once all configured assessments have obtained marks.
  return course.assessments.every((a) => a.obtainedMarks !== null);
}

export function calculateCourseTotalMarks(
  course: Pick<Course, 'assessments' | 'totalMarksOverride'>
): number | null {
  if (course.totalMarksOverride !== null && course.totalMarksOverride !== undefined) {
    return Math.round(course.totalMarksOverride * 100) / 100;
  }
  if (!course.assessments || course.assessments.every((a) => a.obtainedMarks === null)) {
    return null;
  }
  const total = course.assessments.reduce((sum, a) => sum + (a.obtainedMarks ?? 0), 0);
  return Math.round(total * 100) / 100;
}

export function calculateCoursePercentage(
  course: Pick<Course, 'assessments' | 'totalMarksOverride'>
): number | null {
  const total = calculateCourseTotalMarks(course);
  const maxMarks = getCourseMaxTotalMarks(course);
  if (total === null || maxMarks <= 0) return null;
  return Math.round((total / maxMarks) * 10000) / 100;
}

export function getGradeFromMarks(
  percentageScore: number,
  gradeScale: GradeScaleEntry[] = DEFAULT_GRADE_SCALE
): { letter: string; point: number } {
  const rounded = Math.round(percentageScore);
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
  const sorted = [...gradeScale].sort(
    (a, b) => Math.abs(a.point - point) - Math.abs(b.point - point)
  );
  return sorted[0]?.letter ?? 'F';
}

export function getCourseOriginalGrade(
  course: Pick<Course, 'assessments' | 'totalMarksOverride'>,
  gradeScale: GradeScaleEntry[] = DEFAULT_GRADE_SCALE
): {
  totalMarks: number | null;
  maxMarks: number;
  percentage: number | null;
  letter: string | null;
  point: number | null;
} {
  const maxMarks = getCourseMaxTotalMarks(course);
  const totalMarks = calculateCourseTotalMarks(course);
  const percentage = calculateCoursePercentage(course);

  if (!hasFinalGrade(course) || maxMarks <= 0) {
    return {
      totalMarks,
      maxMarks,
      percentage,
      letter: null,
      point: null,
    };
  }

  const resolvedPercentage = percentage ?? 0;
  const { letter, point } = getGradeFromMarks(resolvedPercentage, gradeScale);
  return { totalMarks: totalMarks ?? 0, maxMarks, percentage: resolvedPercentage, letter, point };
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
  internalMaxMarks: number;
  internalPercent: number | null;
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
  const internal = getCourseInternalSummary(course);

  const lowInternal =
    internal.max > 0 &&
    (internal.hasAnyEntered || course.totalMarksOverride == null) &&
    (internal.percentage ?? 0) < rules.minInternalPercent;

  if (point === null) {
    if (!course.examFormSubmitted || (internal.allEntered && lowInternal)) {
      const reasons: string[] = [];
      if (internal.allEntered && lowInternal) {
        reasons.push(
          `Internal marks ${internal.obtained}/${internal.max} (${Math.round(
            internal.percentage ?? 0
          )}% < ${rules.minInternalPercent}% minimum)`
        );
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
        internalMarks: internal.obtained,
        internalMaxMarks: internal.max,
        internalPercent: internal.percentage,
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
      internalMarks: internal.obtained,
      internalMaxMarks: internal.max,
      internalPercent: internal.percentage,
      status: 'in_progress',
      statusLabel: 'In Progress',
      reason: 'Awaiting remaining assessment marks.',
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
      internalMarks: internal.obtained,
      internalMaxMarks: internal.max,
      internalPercent: internal.percentage,
      status: 'already_improved',
      statusLabel: 'Improved',
      reason: `Previously improved from ${point.toFixed(2)} to ${course.improvedGradePoint.toFixed(2)}.`,
    };
  }

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
      internalMarks: internal.obtained,
      internalMaxMarks: internal.max,
      internalPercent: internal.percentage,
      status: 'in_progress',
      statusLabel: 'Current Semester',
      reason: `Current term course (${point.toFixed(2)} GP). Improvement eligibility applies once it becomes a previous semester.`,
    };
  }

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
        internalMarks: internal.obtained,
        internalMaxMarks: internal.max,
        internalPercent: internal.percentage,
        status: 'window_expired',
        statusLabel: 'Window Expired',
        reason: `Retake window (${rules.retakeBatchWindow} batches) exceeded.`,
      };
    }

    const triggers: string[] = [];
    if (point === 0) triggers.push('Failed course (0.00)');
    if (lowInternal) {
      triggers.push(
        `Internal ${internal.obtained}/${internal.max} (${Math.round(
          internal.percentage ?? 0
        )}% < ${rules.minInternalPercent}%)`
      );
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
      internalMarks: internal.obtained,
      internalMaxMarks: internal.max,
      internalPercent: internal.percentage,
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
        internalMarks: internal.obtained,
        internalMaxMarks: internal.max,
        internalPercent: internal.percentage,
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
      internalMarks: internal.obtained,
      internalMaxMarks: internal.max,
      internalPercent: internal.percentage,
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
    internalMarks: internal.obtained,
    internalMaxMarks: internal.max,
    internalPercent: internal.percentage,
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
      const comps = course.assessments ?? [];
      const maxTotal = getCourseMaxTotalMarks(course);
      let enteredScore = 0;
      let enteredMax = 0;
      let unenteredMax = 0;

      for (const comp of comps) {
        if (comp.obtainedMarks !== null) {
          enteredScore += comp.obtainedMarks;
          enteredMax += comp.maxMarks;
        } else {
          unenteredMax += comp.maxMarks;
        }
      }

      if (enteredMax > 0) {
        const normalizedPct = (enteredScore / enteredMax) * 100;
        const paceGrade = getGradeFromMarks(normalizedPct, gradeScale);
        paceCredits += course.credits;
        paceQualityPoints += paceGrade.point * course.credits;
      }

      const maxPossibleMarks = enteredScore + unenteredMax;
      const maxPossiblePct = maxTotal > 0 ? (maxPossibleMarks / maxTotal) * 100 : 100;
      const maxGrade = getGradeFromMarks(maxPossiblePct, gradeScale);
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
