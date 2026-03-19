import type { Question, ReviewIssue, RuleCatalog } from '@/src/types/civpro';

function normalizeStem(stem: string) {
  return stem.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function tokenSimilarity(left: string, right: string) {
  const leftTokens = new Set(normalizeStem(left).split(' ').filter(Boolean));
  const rightTokens = new Set(normalizeStem(right).split(' ').filter(Boolean));

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return intersection / Math.max(leftTokens.size, rightTokens.size);
}

export function buildReviewIssues(questions: Question[]): ReviewIssue[] {
  const issues: ReviewIssue[] = [];
  const ids = new Map<string, string[]>();
  const exactStems = new Map<string, string[]>();

  questions.forEach((question) => {
    ids.set(question.id, [...(ids.get(question.id) ?? []), question.id]);
    const stemKey = normalizeStem(question.stem);
    exactStems.set(stemKey, [...(exactStems.get(stemKey) ?? []), question.id]);
  });

  ids.forEach((questionIds, id) => {
    if (questionIds.length > 1) {
      issues.push({ kind: 'duplicate-id', details: `Duplicate question id: ${id}`, questionIds });
    }
  });

  exactStems.forEach((questionIds, stem) => {
    if (questionIds.length > 1) {
      issues.push({ kind: 'duplicate-stem', details: `Duplicate stem detected for normalized stem: ${stem}`, questionIds });
    }
  });

  for (let index = 0; index < questions.length; index += 1) {
    for (let comparison = index + 1; comparison < questions.length; comparison += 1) {
      const similarity = tokenSimilarity(questions[index].stem, questions[comparison].stem);
      if (similarity >= 0.85 && normalizeStem(questions[index].stem) !== normalizeStem(questions[comparison].stem)) {
        issues.push({
          kind: 'near-duplicate-stem',
          details: `Near-duplicate stems (${Math.round(similarity * 100)}% token overlap).`,
          questionIds: [questions[index].id, questions[comparison].id],
        });
      }
    }
  }

  return issues;
}

export function buildQuestionCounts(questions: Question[], rules: RuleCatalog['topics']) {
  const byTopic = rules.map((topic) => ({
    id: topic.id,
    name: topic.name,
    count: questions.filter((question) => question.topicId === topic.id).length,
  }));

  const byRule = rules.flatMap((topic) =>
    topic.rules.map((rule) => ({
      id: rule.id,
      topicName: topic.name,
      title: rule.title,
      count: questions.filter((question) => question.ruleIds.includes(rule.id)).length,
    })),
  );

  return { byTopic, byRule };
}
