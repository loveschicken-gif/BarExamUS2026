import type {
  AnswerRecord,
  PersistedQuestionProgress,
  ProgressState,
  Question,
  QuizFilters,
  SessionRecord,
} from '@/src/types/civpro';
import { validators } from '@/src/lib/schema';

export const PROGRESS_STORAGE_KEY = 'barexamus2026.civpro.progress';
export const PROGRESS_STORAGE_VERSION = 2;
const MAX_RECENT_SESSIONS = 10;

const createQuestionProgress = (): PersistedQuestionProgress => ({
  attempts: 0,
  correctAttempts: 0,
  incorrectAttempts: 0,
  flagged: false,
});

export function createEmptyProgress(subject: string): ProgressState {
  return {
    version: PROGRESS_STORAGE_VERSION,
    subject,
    questionProgress: {},
    sessions: [],
    updatedAt: new Date().toISOString(),
  };
}

function normalizeQuestionProgress(input: unknown): Record<string, PersistedQuestionProgress> {
  if (!validators.isRecord(input)) {
    return {};
  }

  return Object.entries(input).reduce<Record<string, PersistedQuestionProgress>>((accumulator, [questionId, value]) => {
    if (!validators.isRecord(value)) {
      return accumulator;
    }

    accumulator[questionId] = {
      attempts: validators.isNumber(value.attempts) ? value.attempts : 0,
      correctAttempts: validators.isNumber(value.correctAttempts) ? value.correctAttempts : 0,
      incorrectAttempts: validators.isNumber(value.incorrectAttempts) ? value.incorrectAttempts : 0,
      flagged: typeof value.flagged === 'boolean' ? value.flagged : false,
      lastSeenAt: validators.isString(value.lastSeenAt) ? value.lastSeenAt : undefined,
    };

    return accumulator;
  }, {});
}

function normalizeSessions(input: unknown): SessionRecord[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.flatMap((entry) => {
    if (!validators.isRecord(entry)) {
      return [];
    }

    const filters = validators.isRecord(entry.filters) ? entry.filters : {};
    return [
      {
        id: validators.isString(entry.id) ? entry.id : crypto.randomUUID(),
        completedAt: validators.isString(entry.completedAt) ? entry.completedAt : new Date(0).toISOString(),
        questionIds: validators.isStringArray(entry.questionIds) ? entry.questionIds : [],
        attempted: validators.isNumber(entry.attempted) ? entry.attempted : 0,
        correct: validators.isNumber(entry.correct) ? entry.correct : 0,
        incorrect: validators.isNumber(entry.incorrect) ? entry.incorrect : 0,
        flaggedCount: validators.isNumber(entry.flaggedCount) ? entry.flaggedCount : 0,
        filters: {
          topicId: validators.isString(filters.topicId) ? filters.topicId : 'all',
          questionStatus:
            filters.questionStatus === 'unseen' || filters.questionStatus === 'missed' || filters.questionStatus === 'flagged'
              ? filters.questionStatus
              : 'all',
          setSize: validators.isNumber(filters.setSize) ? filters.setSize : 5,
          reviewedOnly: typeof filters.reviewedOnly === 'boolean' ? filters.reviewedOnly : true,
        },
        missedRuleIds: validators.isStringArray(entry.missedRuleIds) ? entry.missedRuleIds : [],
        missedTopicIds: validators.isStringArray(entry.missedTopicIds) ? entry.missedTopicIds : [],
        missedQuestionIds: validators.isStringArray(entry.missedQuestionIds) ? entry.missedQuestionIds : [],
      },
    ];
  });
}

function migrateLegacyProgress(input: unknown, subject: string): ProgressState {
  if (!validators.isRecord(input)) {
    return createEmptyProgress(subject);
  }

  const questionProgress = normalizeQuestionProgress(input.questionProgress ?? input.questions ?? {});
  const sessions = normalizeSessions(input.sessions ?? []);

  return {
    version: PROGRESS_STORAGE_VERSION,
    subject: validators.isString(input.subject) ? input.subject : subject,
    questionProgress,
    sessions: sessions.slice(0, MAX_RECENT_SESSIONS),
    updatedAt: validators.isString(input.updatedAt) ? input.updatedAt : new Date().toISOString(),
  };
}

export function loadProgress(subject: string): { progress: ProgressState; recoveredFromCorruption: boolean } {
  if (typeof window === 'undefined') {
    return { progress: createEmptyProgress(subject), recoveredFromCorruption: false };
  }

  const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
  if (!raw) {
    return { progress: createEmptyProgress(subject), recoveredFromCorruption: false };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const migrated = migrateLegacyProgress(parsed, subject);
    return { progress: migrated, recoveredFromCorruption: false };
  } catch {
    return { progress: createEmptyProgress(subject), recoveredFromCorruption: true };
  }
}

export function saveProgress(progress: ProgressState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    PROGRESS_STORAGE_KEY,
    JSON.stringify({
      ...progress,
      version: PROGRESS_STORAGE_VERSION,
      updatedAt: new Date().toISOString(),
    }),
  );
}

export function resetProgress(subject: string): ProgressState {
  const next = createEmptyProgress(subject);
  saveProgress(next);
  return next;
}

export function applySessionToProgress(
  current: ProgressState,
  questions: Question[],
  answers: AnswerRecord[],
  filters: QuizFilters,
): ProgressState {
  const questionLookup = new Map(questions.map((question) => [question.id, question]));
  const nextQuestionProgress = { ...current.questionProgress };

  answers.forEach((answer) => {
    const existing = nextQuestionProgress[answer.questionId] ?? createQuestionProgress();
    nextQuestionProgress[answer.questionId] = {
      attempts: existing.attempts + 1,
      correctAttempts: existing.correctAttempts + (answer.isCorrect ? 1 : 0),
      incorrectAttempts: existing.incorrectAttempts + (answer.isCorrect ? 0 : 1),
      flagged: answer.flagged,
      lastSeenAt: new Date().toISOString(),
    };
  });

  const incorrectAnswers = answers.filter((answer) => !answer.isCorrect);
  const missedQuestionIds = incorrectAnswers.map((answer) => answer.questionId);
  const flaggedCount = answers.filter((answer) => answer.flagged).length;
  const missedRuleIds = Array.from(
    new Set(
      incorrectAnswers.flatMap((answer) => {
        const question = questionLookup.get(answer.questionId);
        return question?.ruleIds ?? [];
      }),
    ),
  );
  const missedTopicIds = Array.from(
    new Set(
      incorrectAnswers.flatMap((answer) => {
        const question = questionLookup.get(answer.questionId);
        return question ? [question.topicId] : [];
      }),
    ),
  );

  const session: SessionRecord = {
    id: crypto.randomUUID(),
    completedAt: new Date().toISOString(),
    questionIds: answers.map((answer) => answer.questionId),
    attempted: answers.length,
    correct: answers.filter((answer) => answer.isCorrect).length,
    incorrect: incorrectAnswers.length,
    flaggedCount,
    filters,
    missedRuleIds,
    missedTopicIds,
    missedQuestionIds,
  };

  return {
    version: PROGRESS_STORAGE_VERSION,
    subject: current.subject,
    questionProgress: nextQuestionProgress,
    sessions: [session, ...current.sessions].slice(0, MAX_RECENT_SESSIONS),
    updatedAt: new Date().toISOString(),
  };
}
