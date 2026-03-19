import type { ProgressState, Question, QuestionStatusFilter, QuizFilters, Topic } from '@/src/types/civpro';

export function filterQuestions(questions: Question[], progress: ProgressState, filters: QuizFilters): Question[] {
  const hasStatusMetadata = questions.some((question) => Boolean(question.approvalStatus));

  return questions.filter((question) => {
    if (filters.topicId !== 'all' && question.topicId !== filters.topicId) {
      return false;
    }

    if (filters.reviewedOnly && hasStatusMetadata && !['approved', 'reviewed'].includes(question.approvalStatus ?? 'draft')) {
      return false;
    }

    const record = progress.questionProgress[question.id];

    switch (filters.questionStatus) {
      case 'unseen':
        return !record || record.attempts === 0;
      case 'missed':
        return Boolean(record && record.incorrectAttempts > 0);
      case 'flagged':
        return Boolean(record?.flagged);
      case 'all':
      default:
        return true;
    }
  });
}

export function pickSessionQuestions(questions: Question[], setSize: number): Question[] {
  if (questions.length <= setSize) {
    return questions;
  }

  return questions.slice(0, setSize);
}

export function buildEmptyStateMessage(filters: QuizFilters, topics: Topic[]): string {
  const topicName = filters.topicId === 'all' ? 'all topics' : topics.find((topic) => topic.id === filters.topicId)?.name ?? 'the selected topic';
  const statusLabel: Record<QuestionStatusFilter, string> = {
    all: 'any question state',
    unseen: 'unseen questions',
    missed: 'missed questions',
    flagged: 'flagged questions',
  };

  if (filters.reviewedOnly) {
    return `No ${statusLabel[filters.questionStatus]} are currently available in ${topicName} after applying the reviewed/approved-only filter.`;
  }

  return `No ${statusLabel[filters.questionStatus]} are currently available in ${topicName}. Try changing topic, status, or set size.`;
}

export function buildRecommendedReview(questionIds: string[], questions: Question[]) {
  const missedQuestions = questions.filter((question) => questionIds.includes(question.id));
  const ruleCounts = new Map<string, number>();
  const topicCounts = new Map<string, number>();

  missedQuestions.forEach((question) => {
    question.ruleIds.forEach((ruleId) => {
      ruleCounts.set(ruleId, (ruleCounts.get(ruleId) ?? 0) + 1);
    });
    topicCounts.set(question.topicId, (topicCounts.get(question.topicId) ?? 0) + 1);
  });

  return {
    ruleIds: [...ruleCounts.entries()].sort((left, right) => right[1] - left[1]).map(([ruleId]) => ruleId),
    topicIds: [...topicCounts.entries()].sort((left, right) => right[1] - left[1]).map(([topicId]) => topicId),
  };
}
