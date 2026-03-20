import questionCatalog from '@/content/civ-pro/questions.json';
import ruleCatalog from '@/content/civ-pro/rules.json';
import type { ApprovalStatus, Question, QuestionCatalog, RuleCatalog, Topic } from '@/src/types/civpro';
import { validators } from '@/src/lib/schema';

export type LoadedContent = {
  subject: string;
  topics: Topic[];
  questions: Question[];
  errors: string[];
};

function validateRules(input: unknown): RuleCatalog | null {
  if (!validators.isRecord(input) || !validators.isString(input.subject) || !Array.isArray(input.topics)) {
    return null;
  }

  const topics = input.topics.flatMap((topic) => {
    if (!validators.isRecord(topic) || !validators.isString(topic.id) || !validators.isString(topic.name) || !Array.isArray(topic.rules)) {
      return [];
    }

    const rules = topic.rules.flatMap((rule) => {
      if (!validators.isRecord(rule) || !validators.isString(rule.id) || !validators.isString(rule.title) || !validators.isString(rule.summary)) {
        return [];
      }
      return [{ id: rule.id, title: rule.title, summary: rule.summary }];
    });

    return [{ id: topic.id, name: topic.name, rules }];
  });

  return { subject: input.subject, topics };
}

function validateQuestions(input: unknown): QuestionCatalog | null {
  if (!validators.isRecord(input) || !validators.isString(input.subject) || !Array.isArray(input.questions)) {
    return null;
  }

  const questions = input.questions.flatMap((question) => {
    if (
      !validators.isRecord(question) ||
      !validators.isString(question.id) ||
      !validators.isString(question.topicId) ||
      !validators.isStringArray(question.ruleIds) ||
      !validators.isString(question.stem) ||
      !Array.isArray(question.choices) ||
      !question.choices.every(validators.isString) ||
      !validators.isNumber(question.answerIndex) ||
      !validators.isString(question.explanation)
    ) {
      return [];
    }

    const approvalStatus: ApprovalStatus | undefined =
      question.approvalStatus === 'approved' || question.approvalStatus === 'reviewed' || question.approvalStatus === 'draft'
        ? question.approvalStatus
        : undefined;

    return [
      {
        id: question.id,
        topicId: question.topicId,
        ruleIds: question.ruleIds,
        approvalStatus,
        stem: question.stem,
        choices: question.choices,
        answerIndex: question.answerIndex,
        explanation: question.explanation,
      },
    ];
  });

  return { subject: input.subject, questions };
}

export function loadCivProContent(): LoadedContent {
  const errors: string[] = [];
  const rules = validateRules(ruleCatalog);
  const questions = validateQuestions(questionCatalog);

  if (!rules) {
    errors.push('Rules JSON failed validation.');
  }

  if (!questions) {
    errors.push('Questions JSON failed validation.');
  }

  return {
    subject: rules?.subject ?? questions?.subject ?? 'Civil Procedure',
    topics: rules?.topics ?? [],
    questions: questions?.questions ?? [],
    errors,
  };
}
