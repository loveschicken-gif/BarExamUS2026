import {
  ProgressInsights,
  ProgressSnapshot,
  QuestionPerformance,
  QuizAttempt,
  QuizQuestionDetail,
  RuleId,
  TopicId,
} from '@/lib/types';

const STORAGE_KEY = 'bar-exam-progress';

export const defaultProgressSnapshot: ProgressSnapshot = {
  completedRuleIds: [],
  savedCaseIds: [],
  flaggedQuestionIds: [],
  quizAttempts: [],
  questionPerformance: {},
  correctCount: 0,
  incorrectCount: 0,
};

function dedupeIds<T extends string>(items: T[]): T[] {
  return [...new Set(items)];
}

export function normalizeProgressSnapshot(snapshot: Partial<ProgressSnapshot> | null | undefined): ProgressSnapshot {
  return {
    completedRuleIds: dedupeIds(snapshot?.completedRuleIds ?? []),
    savedCaseIds: dedupeIds(snapshot?.savedCaseIds ?? []),
    flaggedQuestionIds: dedupeIds(snapshot?.flaggedQuestionIds ?? []),
    quizAttempts: snapshot?.quizAttempts ?? [],
    questionPerformance: snapshot?.questionPerformance ?? {},
    correctCount: snapshot?.correctCount ?? 0,
    incorrectCount: snapshot?.incorrectCount ?? 0,
    lastReviewedAt: snapshot?.lastReviewedAt,
    lastTopicId: snapshot?.lastTopicId,
    lastRuleId: snapshot?.lastRuleId,
    lastQuestionId: snapshot?.lastQuestionId,
  };
}

export function readProgressSnapshot(): ProgressSnapshot {
  if (typeof window === 'undefined') {
    return defaultProgressSnapshot;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return defaultProgressSnapshot;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<ProgressSnapshot>;
    return normalizeProgressSnapshot(parsed);
  } catch {
    return defaultProgressSnapshot;
  }
}

export function writeProgressSnapshot(snapshot: ProgressSnapshot): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function markRuleCompleted(snapshot: ProgressSnapshot, ruleId: RuleId): ProgressSnapshot {
  return {
    ...snapshot,
    completedRuleIds: dedupeIds([...snapshot.completedRuleIds, ruleId]),
    lastRuleId: ruleId,
    lastReviewedAt: new Date().toISOString(),
  };
}

export function updateLastReviewed(snapshot: ProgressSnapshot, topicId?: TopicId, ruleId?: RuleId): ProgressSnapshot {
  return {
    ...snapshot,
    lastTopicId: topicId ?? snapshot.lastTopicId,
    lastRuleId: ruleId ?? snapshot.lastRuleId,
    lastReviewedAt: new Date().toISOString(),
  };
}

export function toggleFlaggedQuestion(snapshot: ProgressSnapshot, questionId: string): ProgressSnapshot {
  const flagged = snapshot.flaggedQuestionIds.includes(questionId)
    ? snapshot.flaggedQuestionIds.filter((item) => item !== questionId)
    : [...snapshot.flaggedQuestionIds, questionId];

  return {
    ...snapshot,
    flaggedQuestionIds: dedupeIds(flagged),
    lastQuestionId: questionId,
    lastReviewedAt: new Date().toISOString(),
  };
}

function buildQuestionPerformance(previous: QuestionPerformance | undefined, attempt: QuizAttempt): QuestionPerformance {
  const attempts = (previous?.attempts ?? 0) + 1;
  const correctCount = (previous?.correctCount ?? 0) + (attempt.isCorrect ? 1 : 0);
  const incorrectCount = (previous?.incorrectCount ?? 0) + (attempt.isCorrect ? 0 : 1);

  return {
    questionId: attempt.questionId,
    attempts,
    correctCount,
    incorrectCount,
    lastAttemptAt: attempt.answeredAt,
    lastSelectedAnswerIndex: attempt.selectedAnswerIndex,
    lastResult: attempt.isCorrect ? 'correct' : 'incorrect',
  };
}

export function recordQuizAttempt(
  snapshot: ProgressSnapshot,
  payload: {
    questionId: string;
    ruleId: RuleId;
    topicId: TopicId;
    selectedAnswerIndex: number;
    isCorrect: boolean;
  },
): ProgressSnapshot {
  const answeredAt = new Date().toISOString();
  const attempt: QuizAttempt = {
    ...payload,
    answeredAt,
  };
  const previousPerformance = snapshot.questionPerformance[payload.questionId];
  const nextPerformance = buildQuestionPerformance(previousPerformance, attempt);

  return {
    ...snapshot,
    quizAttempts: [...snapshot.quizAttempts, attempt],
    questionPerformance: {
      ...snapshot.questionPerformance,
      [payload.questionId]: nextPerformance,
    },
    correctCount: snapshot.correctCount + (payload.isCorrect ? 1 : 0),
    incorrectCount: snapshot.incorrectCount + (payload.isCorrect ? 0 : 1),
    lastReviewedAt: answeredAt,
    lastTopicId: payload.topicId,
    lastRuleId: payload.ruleId,
    lastQuestionId: payload.questionId,
  };
}

export function getProgressInsights(snapshot: ProgressSnapshot, questions: QuizQuestionDetail[]): ProgressInsights {
  const questionMap = new Map(questions.map((question) => [question.id, question]));
  const missedQuestionIds = Object.values(snapshot.questionPerformance)
    .filter((performance) => performance.incorrectCount > 0)
    .map((performance) => performance.questionId)
    .filter((questionId) => questionMap.has(questionId));

  const ruleStats = new Map<RuleId, { attempts: number; correct: number }>();
  const topicStats = new Map<TopicId, { attempts: number; correct: number }>();

  Object.values(snapshot.questionPerformance).forEach((performance) => {
    const question = questionMap.get(performance.questionId);

    if (!question) {
      return;
    }

    const ruleEntry = ruleStats.get(question.ruleId) ?? { attempts: 0, correct: 0 };
    ruleEntry.attempts += performance.attempts;
    ruleEntry.correct += performance.correctCount;
    ruleStats.set(question.ruleId, ruleEntry);

    const topicEntry = topicStats.get(question.topicId) ?? { attempts: 0, correct: 0 };
    topicEntry.attempts += performance.attempts;
    topicEntry.correct += performance.correctCount;
    topicStats.set(question.topicId, topicEntry);
  });

  const weakRuleIds = [...ruleStats.entries()]
    .filter(([, value]) => value.attempts > 0 && value.correct / value.attempts < 0.7)
    .sort((left, right) => left[1].correct / left[1].attempts - right[1].correct / right[1].attempts)
    .map(([ruleId]) => ruleId);

  const weakTopicIds = [...topicStats.entries()]
    .filter(([, value]) => value.attempts > 0 && value.correct / value.attempts < 0.7)
    .sort((left, right) => left[1].correct / left[1].attempts - right[1].correct / right[1].attempts)
    .map(([topicId]) => topicId);

  return {
    missedQuestionIds: dedupeIds(missedQuestionIds),
    flaggedQuestionIds: snapshot.flaggedQuestionIds.filter((questionId) => questionMap.has(questionId)),
    weakRuleIds,
    weakTopicIds,
    lastTopicId: snapshot.lastTopicId,
    lastRuleId: snapshot.lastRuleId,
    lastQuestionId: snapshot.lastQuestionId,
    lastReviewedAt: snapshot.lastReviewedAt,
  };
}
