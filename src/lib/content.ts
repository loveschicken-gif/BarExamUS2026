import rawSubjectData from '@/data/civpro/subject.json';
import rawTopicsData from '@/data/civpro/topics.json';
import rawRulesData from '@/data/civpro/rules.json';
import rawCasesData from '@/data/civpro/cases.json';
import rawOutlinesData from '@/data/civpro/outlines.json';
import rawQuestionsData from '@/data/civpro/questions.draft.json';
import {
  CaseSummary,
  DraftQuestion,
  QuizQuestionDetail,
  Rule,
  RuleDetail,
  Subject,
  SubjectDashboardData,
  SubjectDataset,
  Topic,
  TopicDetail,
  ValidationReport,
} from '@/lib/types';
import { createValidatedDataset } from '@/lib/validation';

const validated = createValidatedDataset({
  subject: rawSubjectData,
  topics: rawTopicsData,
  rules: rawRulesData,
  cases: rawCasesData,
  outlines: rawOutlinesData,
  questions: rawQuestionsData,
});

const dataset: SubjectDataset = validated.dataset;
const validationReport: ValidationReport = validated.report;

const topicById = new Map(dataset.topics.map((topic) => [topic.id, topic]));
const ruleById = new Map(dataset.rules.map((rule) => [rule.id, rule]));
const caseById = new Map(dataset.cases.map((item) => [item.id, item]));

function sortTopics(topics: Topic[]): Topic[] {
  return [...topics].sort((left, right) => {
    const leftIndex = dataset.subject.topicOrder.indexOf(left.id);
    const rightIndex = dataset.subject.topicOrder.indexOf(right.id);

    if (leftIndex === -1 && rightIndex === -1) {
      return left.title.localeCompare(right.title);
    }

    if (leftIndex === -1) {
      return 1;
    }

    if (rightIndex === -1) {
      return -1;
    }

    return leftIndex - rightIndex;
  });
}

export function getSubject(): Subject {
  return dataset.subject;
}

export function getContentValidationReport(): ValidationReport {
  return validationReport;
}

export function getTopics(): Topic[] {
  return sortTopics(dataset.topics);
}

export function getTopicById(topicId: string): TopicDetail | undefined {
  const topic = topicById.get(topicId);

  if (!topic) {
    return undefined;
  }

  const rules = topic.ruleIds
    .map((ruleId) => ruleById.get(ruleId))
    .filter((rule): rule is Rule => Boolean(rule));

  const outlineSections = dataset.outlines.filter((outline) => outline.topicId === topic.id);

  return {
    ...topic,
    rules,
    outlineSections,
  };
}

export function getRulesByTopic(topicId: string): Rule[] {
  return dataset.rules.filter((rule) => rule.topicId === topicId);
}

export function getRuleById(ruleId: string): RuleDetail | undefined {
  const rule = ruleById.get(ruleId);

  if (!rule) {
    return undefined;
  }

  const topic = topicById.get(rule.topicId);

  if (!topic) {
    return undefined;
  }

  const linkedCases = rule.caseIds
    .map((caseId) => caseById.get(caseId))
    .filter((item): item is CaseSummary => Boolean(item));

  return {
    ...rule,
    topic,
    linkedCases,
  };
}

export function getCasesForRule(ruleId: string): CaseSummary[] {
  return dataset.cases.filter((item) => item.ruleIds.includes(ruleId));
}

export function getDashboardData(): SubjectDashboardData {
  const topics = getTopics()
    .map((topic) => getTopicById(topic.id))
    .filter((topic): topic is TopicDetail => Boolean(topic));

  return {
    subject: getSubject(),
    topics,
    rules: dataset.rules,
    ruleCount: dataset.rules.length,
    caseCount: dataset.cases.length,
    questionCount: dataset.questions.length,
  };
}

export function getDraftQuestions(): DraftQuestion[] {
  return dataset.questions;
}

export function getQuizQuestions(): QuizQuestionDetail[] {
  return dataset.questions.map((question) => {
    const linkedRule = ruleById.get(question.ruleId);
    const topic = topicById.get(question.topicId);
    const linkedCases = linkedRule
      ? linkedRule.caseIds.map((caseId) => caseById.get(caseId)).filter((item): item is CaseSummary => Boolean(item))
      : [];

    return {
      ...question,
      topic,
      linkedRule,
      linkedCases,
    };
  });
}

export function getStaticTopicIds(): string[] {
  return dataset.topics.map((topic) => topic.id);
}

export function getStaticRuleIds(): string[] {
  return dataset.rules.map((rule) => rule.id);
}
