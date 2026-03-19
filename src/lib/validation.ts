import {
  CaseSummary,
  DraftQuestion,
  DraftQuestionStatus,
  OutlineSection,
  Rule,
  Subject,
  SubjectDataset,
  Topic,
  ValidationIssue,
  ValidationReport,
} from '@/lib/types';

const VALID_QUESTION_STATUSES: DraftQuestionStatus[] = ['draft', 'reviewed', 'approved'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string' && entry.trim().length > 0);
}

function pushIssue(issues: ValidationIssue[], issue: ValidationIssue) {
  issues.push(issue);
}

function requireString(
  record: Record<string, unknown>,
  field: string,
  issues: ValidationIssue[],
  entityType: ValidationIssue['entityType'],
  entityId?: string,
): string | null {
  const value = record[field];

  if (!isNonEmptyString(value)) {
    pushIssue(issues, {
      code: 'missing_required_field',
      severity: 'error',
      entityType,
      entityId,
      message: `Missing or invalid string field "${field}".`,
    });

    return null;
  }

  return value;
}

function requireStringArray(
  record: Record<string, unknown>,
  field: string,
  issues: ValidationIssue[],
  entityType: ValidationIssue['entityType'],
  entityId?: string,
): string[] | null {
  const value = record[field];

  if (!isStringArray(value)) {
    pushIssue(issues, {
      code: 'missing_required_field',
      severity: 'error',
      entityType,
      entityId,
      message: `Missing or invalid string[] field "${field}".`,
    });

    return null;
  }

  return value;
}

function ensureUniqueIds<T extends { id: string }>(items: T[], issues: ValidationIssue[], entityType: ValidationIssue['entityType']): T[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      pushIssue(issues, {
        code: 'duplicate_id',
        severity: 'error',
        entityType,
        entityId: item.id,
        message: `Duplicate ${entityType} id "${item.id}" detected.`,
      });

      return false;
    }

    seen.add(item.id);
    return true;
  });
}

function validateSubject(rawSubject: unknown, issues: ValidationIssue[]): Subject {
  if (!isRecord(rawSubject)) {
    pushIssue(issues, {
      code: 'invalid_subject',
      severity: 'error',
      entityType: 'subject',
      message: 'Subject JSON must be an object.',
    });

    return {
      id: 'civpro',
      title: 'Civil Procedure',
      shortTitle: 'Civ Pro',
      description: 'Content unavailable.',
      examFocus: [],
      topicOrder: [],
    };
  }

  const id = requireString(rawSubject, 'id', issues, 'subject') ?? 'civpro';
  const title = requireString(rawSubject, 'title', issues, 'subject', id) ?? 'Civil Procedure';
  const shortTitle = requireString(rawSubject, 'shortTitle', issues, 'subject', id) ?? title;
  const description = requireString(rawSubject, 'description', issues, 'subject', id) ?? 'Content unavailable.';
  const examFocus = requireStringArray(rawSubject, 'examFocus', issues, 'subject', id) ?? [];
  const topicOrder = requireStringArray(rawSubject, 'topicOrder', issues, 'subject', id) ?? [];
  const primaryCtaLabel = isNonEmptyString(rawSubject.primaryCtaLabel) ? rawSubject.primaryCtaLabel : undefined;

  return {
    id,
    title,
    shortTitle,
    description,
    examFocus,
    primaryCtaLabel,
    topicOrder,
  };
}

function validateTopics(rawTopics: unknown, issues: ValidationIssue[]): Topic[] {
  if (!Array.isArray(rawTopics)) {
    pushIssue(issues, {
      code: 'invalid_topics',
      severity: 'error',
      entityType: 'dataset',
      message: 'Topics JSON must be an array.',
    });

    return [];
  }

  const topics = rawTopics.flatMap((entry, index) => {
    if (!isRecord(entry)) {
      pushIssue(issues, {
        code: 'invalid_topic',
        severity: 'error',
        entityType: 'topic',
        message: `Topic entry at index ${index} must be an object.`,
      });
      return [];
    }

    const id = requireString(entry, 'id', issues, 'topic');
    const subjectId = requireString(entry, 'subjectId', issues, 'topic', id ?? undefined);
    const title = requireString(entry, 'title', issues, 'topic', id ?? undefined);
    const slug = requireString(entry, 'slug', issues, 'topic', id ?? undefined);
    const summary = requireString(entry, 'summary', issues, 'topic', id ?? undefined);
    const whyItMatters = requireString(entry, 'whyItMatters', issues, 'topic', id ?? undefined);
    const ruleIds = requireStringArray(entry, 'ruleIds', issues, 'topic', id ?? undefined);

    if (!id || !subjectId || !title || !slug || !summary || !whyItMatters || !ruleIds) {
      return [];
    }

    return [{ id, subjectId, title, slug, summary, whyItMatters, ruleIds }];
  });

  return ensureUniqueIds(topics, issues, 'topic');
}

function validateRules(rawRules: unknown, issues: ValidationIssue[]): Rule[] {
  if (!Array.isArray(rawRules)) {
    pushIssue(issues, {
      code: 'invalid_rules',
      severity: 'error',
      entityType: 'dataset',
      message: 'Rules JSON must be an array.',
    });

    return [];
  }

  const rules = rawRules.flatMap((entry, index) => {
    if (!isRecord(entry)) {
      pushIssue(issues, {
        code: 'invalid_rule',
        severity: 'error',
        entityType: 'rule',
        message: `Rule entry at index ${index} must be an object.`,
      });
      return [];
    }

    const id = requireString(entry, 'id', issues, 'rule');
    const subjectId = requireString(entry, 'subjectId', issues, 'rule', id ?? undefined);
    const topicId = requireString(entry, 'topicId', issues, 'rule', id ?? undefined);
    const title = requireString(entry, 'title', issues, 'rule', id ?? undefined);
    const shortLabel = requireString(entry, 'shortLabel', issues, 'rule', id ?? undefined);
    const blackLetterRule = requireString(entry, 'blackLetterRule', issues, 'rule', id ?? undefined);
    const elements = requireStringArray(entry, 'elements', issues, 'rule', id ?? undefined);
    const exceptions = requireStringArray(entry, 'exceptions', issues, 'rule', id ?? undefined);
    const examTips = requireStringArray(entry, 'examTips', issues, 'rule', id ?? undefined);
    const caseIds = requireStringArray(entry, 'caseIds', issues, 'rule', id ?? undefined);
    const outlineRefs = Array.isArray(entry.outlineRefs) && isStringArray(entry.outlineRefs) ? entry.outlineRefs : undefined;

    if (!id || !subjectId || !topicId || !title || !shortLabel || !blackLetterRule || !elements || !exceptions || !examTips || !caseIds) {
      return [];
    }

    return [
      {
        id,
        subjectId,
        topicId,
        title,
        shortLabel,
        blackLetterRule,
        elements,
        exceptions,
        examTips,
        caseIds,
        outlineRefs,
      },
    ];
  });

  return ensureUniqueIds(rules, issues, 'rule');
}

function validateCases(rawCases: unknown, issues: ValidationIssue[]): CaseSummary[] {
  if (!Array.isArray(rawCases)) {
    pushIssue(issues, {
      code: 'invalid_cases',
      severity: 'error',
      entityType: 'dataset',
      message: 'Cases JSON must be an array.',
    });

    return [];
  }

  const cases = rawCases.flatMap((entry, index) => {
    if (!isRecord(entry)) {
      pushIssue(issues, {
        code: 'invalid_case',
        severity: 'error',
        entityType: 'case',
        message: `Case entry at index ${index} must be an object.`,
      });
      return [];
    }

    const id = requireString(entry, 'id', issues, 'case');
    const subjectId = requireString(entry, 'subjectId', issues, 'case', id ?? undefined);
    const topicId = requireString(entry, 'topicId', issues, 'case', id ?? undefined);
    const ruleIds = requireStringArray(entry, 'ruleIds', issues, 'case', id ?? undefined);
    const title = requireString(entry, 'title', issues, 'case', id ?? undefined);
    const citation = requireString(entry, 'citation', issues, 'case', id ?? undefined);
    const courtAndYear = requireString(entry, 'courtAndYear', issues, 'case', id ?? undefined);
    const holding = requireString(entry, 'holding', issues, 'case', id ?? undefined);
    const ruleConnection = requireString(entry, 'ruleConnection', issues, 'case', id ?? undefined);
    const takeaways = requireStringArray(entry, 'takeaways', issues, 'case', id ?? undefined);

    if (!id || !subjectId || !topicId || !ruleIds || !title || !citation || !courtAndYear || !holding || !ruleConnection || !takeaways) {
      return [];
    }

    return [{ id, subjectId, topicId, ruleIds, title, citation, courtAndYear, holding, ruleConnection, takeaways }];
  });

  return ensureUniqueIds(cases, issues, 'case');
}

function validateOutlines(rawOutlines: unknown, issues: ValidationIssue[]): OutlineSection[] {
  if (!Array.isArray(rawOutlines)) {
    pushIssue(issues, {
      code: 'invalid_outlines',
      severity: 'error',
      entityType: 'dataset',
      message: 'Outlines JSON must be an array.',
    });

    return [];
  }

  const outlines = rawOutlines.flatMap((entry, index) => {
    if (!isRecord(entry)) {
      pushIssue(issues, {
        code: 'invalid_outline',
        severity: 'error',
        entityType: 'outline',
        message: `Outline entry at index ${index} must be an object.`,
      });
      return [];
    }

    const id = requireString(entry, 'id', issues, 'outline');
    const subjectId = requireString(entry, 'subjectId', issues, 'outline', id ?? undefined);
    const topicId = requireString(entry, 'topicId', issues, 'outline', id ?? undefined);
    const title = requireString(entry, 'title', issues, 'outline', id ?? undefined);
    const bullets = requireStringArray(entry, 'bullets', issues, 'outline', id ?? undefined);

    if (!id || !subjectId || !topicId || !title || !bullets) {
      return [];
    }

    return [{ id, subjectId, topicId, title, bullets }];
  });

  return ensureUniqueIds(outlines, issues, 'outline');
}

function validateQuestions(rawQuestions: unknown, issues: ValidationIssue[]): DraftQuestion[] {
  if (!Array.isArray(rawQuestions)) {
    pushIssue(issues, {
      code: 'invalid_questions',
      severity: 'error',
      entityType: 'dataset',
      message: 'Questions JSON must be an array.',
    });

    return [];
  }

  const questions = rawQuestions.flatMap((entry, index) => {
    if (!isRecord(entry)) {
      pushIssue(issues, {
        code: 'invalid_question',
        severity: 'error',
        entityType: 'question',
        message: `Question entry at index ${index} must be an object.`,
      });
      return [];
    }

    const id = requireString(entry, 'id', issues, 'question');
    const subjectId = requireString(entry, 'subjectId', issues, 'question', id ?? undefined);
    const topicId = requireString(entry, 'topicId', issues, 'question', id ?? undefined);
    const ruleId = requireString(entry, 'ruleId', issues, 'question', id ?? undefined);
    const prompt = requireString(entry, 'prompt', issues, 'question', id ?? undefined);
    const choices = requireStringArray(entry, 'choices', issues, 'question', id ?? undefined);
    const explanation = requireString(entry, 'explanation', issues, 'question', id ?? undefined);
    const answerIndex = typeof entry.answerIndex === 'number' ? entry.answerIndex : null;
    const status = entry.status;

    if (answerIndex === null) {
      pushIssue(issues, {
        code: 'missing_required_field',
        severity: 'error',
        entityType: 'question',
        entityId: id ?? undefined,
        message: 'Missing or invalid numeric field "answerIndex".',
      });
    }

    if (!VALID_QUESTION_STATUSES.includes(status as DraftQuestionStatus)) {
      pushIssue(issues, {
        code: 'invalid_question_status',
        severity: 'error',
        entityType: 'question',
        entityId: id ?? undefined,
        message: `Question status must be one of: ${VALID_QUESTION_STATUSES.join(', ')}.`,
      });
    }

    if (!id || !subjectId || !topicId || !ruleId || !prompt || !choices || !explanation || answerIndex === null) {
      return [];
    }

    if (answerIndex < 0 || answerIndex >= choices.length) {
      pushIssue(issues, {
        code: 'invalid_answer_index',
        severity: 'error',
        entityType: 'question',
        entityId: id,
        message: 'Question answerIndex falls outside the choices array.',
      });
      return [];
    }

    if (!VALID_QUESTION_STATUSES.includes(status as DraftQuestionStatus)) {
      return [];
    }

    return [
      {
        id,
        subjectId,
        topicId,
        ruleId,
        prompt,
        choices,
        answerIndex,
        explanation,
        status: status as DraftQuestionStatus,
      },
    ];
  });

  return ensureUniqueIds(questions, issues, 'question');
}

function validateCrossReferences(dataset: SubjectDataset, issues: ValidationIssue[]) {
  const topicIds = new Set(dataset.topics.map((topic) => topic.id));
  const ruleIds = new Set(dataset.rules.map((rule) => rule.id));
  const caseIds = new Set(dataset.cases.map((caseItem) => caseItem.id));

  dataset.subject.topicOrder.forEach((topicId) => {
    if (!topicIds.has(topicId)) {
      pushIssue(issues, {
        code: 'invalid_reference',
        severity: 'warning',
        entityType: 'subject',
        entityId: dataset.subject.id,
        message: `Subject topicOrder references missing topic "${topicId}".`,
      });
    }
  });

  dataset.topics.forEach((topic) => {
    topic.ruleIds.forEach((ruleId) => {
      if (!ruleIds.has(ruleId)) {
        pushIssue(issues, {
          code: 'invalid_reference',
          severity: 'error',
          entityType: 'topic',
          entityId: topic.id,
          message: `Topic references missing rule "${ruleId}".`,
        });
      }
    });
  });

  dataset.rules.forEach((rule) => {
    if (!topicIds.has(rule.topicId)) {
      pushIssue(issues, {
        code: 'invalid_reference',
        severity: 'error',
        entityType: 'rule',
        entityId: rule.id,
        message: `Rule references missing topic "${rule.topicId}".`,
      });
    }

    rule.caseIds.forEach((caseId) => {
      if (!caseIds.has(caseId)) {
        pushIssue(issues, {
          code: 'invalid_reference',
          severity: 'error',
          entityType: 'rule',
          entityId: rule.id,
          message: `Rule references missing case "${caseId}".`,
        });
      }
    });
  });

  dataset.cases.forEach((caseItem) => {
    if (!topicIds.has(caseItem.topicId)) {
      pushIssue(issues, {
        code: 'invalid_reference',
        severity: 'error',
        entityType: 'case',
        entityId: caseItem.id,
        message: `Case references missing topic "${caseItem.topicId}".`,
      });
    }

    caseItem.ruleIds.forEach((ruleId) => {
      if (!ruleIds.has(ruleId)) {
        pushIssue(issues, {
          code: 'invalid_reference',
          severity: 'error',
          entityType: 'case',
          entityId: caseItem.id,
          message: `Case references missing rule "${ruleId}".`,
        });
      }
    });
  });

  dataset.outlines.forEach((outline) => {
    if (!topicIds.has(outline.topicId)) {
      pushIssue(issues, {
        code: 'invalid_reference',
        severity: 'warning',
        entityType: 'outline',
        entityId: outline.id,
        message: `Outline references missing topic "${outline.topicId}".`,
      });
    }
  });

  dataset.questions.forEach((question) => {
    if (!topicIds.has(question.topicId)) {
      pushIssue(issues, {
        code: 'invalid_reference',
        severity: 'error',
        entityType: 'question',
        entityId: question.id,
        message: `Question references missing topic "${question.topicId}".`,
      });
    }

    if (!ruleIds.has(question.ruleId)) {
      pushIssue(issues, {
        code: 'invalid_reference',
        severity: 'error',
        entityType: 'question',
        entityId: question.id,
        message: `Question references missing rule "${question.ruleId}".`,
      });
    }
  });
}

export function createValidatedDataset(rawDataset: {
  subject: unknown;
  topics: unknown;
  rules: unknown;
  cases: unknown;
  outlines: unknown;
  questions: unknown;
}): { dataset: SubjectDataset; report: ValidationReport } {
  const issues: ValidationIssue[] = [];
  const subject = validateSubject(rawDataset.subject, issues);
  const topics = validateTopics(rawDataset.topics, issues);
  const rules = validateRules(rawDataset.rules, issues);
  const cases = validateCases(rawDataset.cases, issues);
  const outlines = validateOutlines(rawDataset.outlines, issues);
  const questions = validateQuestions(rawDataset.questions, issues);

  const dataset: SubjectDataset = {
    subject,
    topics,
    rules,
    cases,
    outlines,
    questions,
  };

  validateCrossReferences(dataset, issues);

  return {
    dataset,
    report: {
      issues,
    },
  };
}
