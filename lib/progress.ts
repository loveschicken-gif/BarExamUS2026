import type { QuizAnswerRecord, ReviewItem, SubjectProgress } from '@/lib/types';

const storageKey = (subjectSlug: string) => `bar-prep-progress:${subjectSlug}`;

export function createEmptyProgress(subjectSlug: string): SubjectProgress {
  return {
    subjectSlug,
    completedRuleIds: [],
    bookmarkedRuleIds: [],
    answers: {},
    updatedAt: new Date(0).toISOString()
  };
}

export function loadProgress(subjectSlug: string): SubjectProgress {
  if (typeof window === 'undefined') {
    return createEmptyProgress(subjectSlug);
  }

  const raw = window.localStorage.getItem(storageKey(subjectSlug));
  if (!raw) {
    return createEmptyProgress(subjectSlug);
  }

  try {
    const parsed = JSON.parse(raw) as SubjectProgress;
    return {
      ...createEmptyProgress(subjectSlug),
      ...parsed,
      subjectSlug
    };
  } catch {
    return createEmptyProgress(subjectSlug);
  }
}

export function saveProgress(progress: SubjectProgress): SubjectProgress {
  const nextProgress = {
    ...progress,
    updatedAt: new Date().toISOString()
  };

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(storageKey(progress.subjectSlug), JSON.stringify(nextProgress));
  }

  return nextProgress;
}

export function toggleCompletedRule(progress: SubjectProgress, ruleId: string): SubjectProgress {
  const completedRuleIds = progress.completedRuleIds.includes(ruleId)
    ? progress.completedRuleIds.filter((id) => id !== ruleId)
    : [...progress.completedRuleIds, ruleId];

  return saveProgress({
    ...progress,
    completedRuleIds
  });
}

export function toggleBookmarkedRule(progress: SubjectProgress, ruleId: string): SubjectProgress {
  const bookmarkedRuleIds = progress.bookmarkedRuleIds.includes(ruleId)
    ? progress.bookmarkedRuleIds.filter((id) => id !== ruleId)
    : [...progress.bookmarkedRuleIds, ruleId];

  return saveProgress({
    ...progress,
    bookmarkedRuleIds
  });
}

export function recordAnswer(
  progress: SubjectProgress,
  answer: QuizAnswerRecord,
  score?: { correct: number; total: number }
): SubjectProgress {
  return saveProgress({
    ...progress,
    answers: {
      ...progress.answers,
      [answer.questionId]: answer
    },
    lastQuizScore: score
      ? {
          ...score,
          completedAt: new Date().toISOString()
        }
      : progress.lastQuizScore
  });
}

export function buildReviewItems(progress: SubjectProgress): ReviewItem[] {
  const missMap = new Map<string, ReviewItem>();

  for (const answer of Object.values(progress.answers)) {
    if (answer.isCorrect) {
      continue;
    }

    for (const ruleId of answer.ruleIds) {
      const existing = missMap.get(ruleId);
      if (existing) {
        existing.misses += 1;
        existing.questionIds.push(answer.questionId);
      } else {
        missMap.set(ruleId, {
          ruleId,
          misses: 1,
          questionIds: [answer.questionId]
        });
      }
    }
  }

  return [...missMap.values()].sort((a, b) => b.misses - a.misses || a.ruleId.localeCompare(b.ruleId));
}

export function getCompletionPercent(progress: SubjectProgress, totalRuleCount: number): number {
  if (totalRuleCount === 0) {
    return 0;
  }

  return Math.round((progress.completedRuleIds.length / totalRuleCount) * 100);
}
