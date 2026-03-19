import { promises as fs } from 'node:fs';
import path from 'node:path';

import type { QuizQuestion, Rule, SubjectContent, SubjectSummary, Topic } from '@/lib/types';

const CONTENT_ROOT = path.join(process.cwd(), 'content', 'canonical');

const isString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(isString);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Content validation error: ${message}`);
  }
}

function validateSubjectSummary(raw: unknown): SubjectSummary {
  assert(typeof raw === 'object' && raw !== null, 'subject summary must be an object');
  const value = raw as Record<string, unknown>;
  assert(isString(value.slug), 'subject.slug is required');
  assert(isString(value.title), 'subject.title is required');
  assert(isString(value.shortTitle), 'subject.shortTitle is required');
  assert(isString(value.description), 'subject.description is required');
  assert(isStringArray(value.examFocus), 'subject.examFocus must be a string array');
  assert(isStringArray(value.topicOrder), 'subject.topicOrder must be a string array');

  return value as SubjectSummary;
}

function validateRule(raw: unknown, topicSlug: string): Rule {
  assert(typeof raw === 'object' && raw !== null, 'rule must be an object');
  const value = raw as Record<string, unknown>;
  assert(isString(value.id), 'rule.id is required');
  assert(isString(value.title), `rule ${value.id ?? '<unknown>'} title is required`);
  assert(isString(value.blackLetterLaw), `rule ${value.id ?? '<unknown>'} blackLetterLaw is required`);
  assert(isString(value.explanation), `rule ${value.id ?? '<unknown>'} explanation is required`);
  assert(isStringArray(value.elements), `rule ${value.id ?? '<unknown>'} elements must be a string array`);
  assert(isStringArray(value.pitfalls), `rule ${value.id ?? '<unknown>'} pitfalls must be a string array`);
  assert(isStringArray(value.relatedRuleIds), `rule ${value.id ?? '<unknown>'} relatedRuleIds must be a string array`);

  return {
    ...(value as Rule),
    topicSlug: isString(value.topicSlug) ? value.topicSlug : topicSlug
  };
}

function validateQuestion(raw: unknown): QuizQuestion {
  assert(typeof raw === 'object' && raw !== null, 'question must be an object');
  const value = raw as Record<string, unknown>;
  assert(isString(value.id), 'question.id is required');
  assert(isString(value.prompt), `question ${value.id ?? '<unknown>'} prompt is required`);
  assert(isString(value.correctChoiceId), `question ${value.id ?? '<unknown>'} correctChoiceId is required`);
  assert(isStringArray(value.ruleIds), `question ${value.id ?? '<unknown>'} ruleIds must be a string array`);
  assert(isString(value.rationale), `question ${value.id ?? '<unknown>'} rationale is required`);
  assert(Array.isArray(value.choices) && value.choices.length >= 2, `question ${value.id ?? '<unknown>'} choices must have at least 2 entries`);

  for (const choice of value.choices as Array<Record<string, unknown>>) {
    assert(isString(choice.id), `question ${value.id ?? '<unknown>'} choice.id is required`);
    assert(isString(choice.text), `question ${value.id ?? '<unknown>'} choice.text is required`);
  }

  return value as QuizQuestion;
}

function validateTopic(raw: unknown): Topic {
  assert(typeof raw === 'object' && raw !== null, 'topic must be an object');
  const value = raw as Record<string, unknown>;
  assert(isString(value.id), 'topic.id is required');
  assert(isString(value.subjectSlug), 'topic.subjectSlug is required');
  assert(isString(value.slug), 'topic.slug is required');
  assert(isString(value.title), 'topic.title is required');
  assert(isString(value.summary), `topic ${value.slug ?? '<unknown>'} summary is required`);
  assert(isStringArray(value.learningObjectives), `topic ${value.slug ?? '<unknown>'} learningObjectives must be a string array`);
  assert(isStringArray(value.ruleIds), `topic ${value.slug ?? '<unknown>'} ruleIds must be a string array`);
  assert(Array.isArray(value.rules), `topic ${value.slug ?? '<unknown>'} rules must be an array`);
  assert(Array.isArray(value.questions), `topic ${value.slug ?? '<unknown>'} questions must be an array`);

  const slug = value.slug as string;
  const rules = (value.rules as unknown[]).map((rule) => validateRule(rule, slug));
  const questions = (value.questions as unknown[]).map(validateQuestion);

  assert(
    rules.length === value.ruleIds.length,
    `topic ${slug} ruleIds length does not match rules length`
  );

  for (const ruleId of value.ruleIds as string[]) {
    assert(rules.some((rule) => rule.id === ruleId), `topic ${slug} missing rule object for ruleId ${ruleId}`);
  }

  for (const question of questions) {
    assert(
      question.choices.some((choice) => choice.id === question.correctChoiceId),
      `question ${question.id} correctChoiceId must match a choice`
    );
    for (const ruleId of question.ruleIds) {
      assert(rules.some((rule) => rule.id === ruleId), `question ${question.id} references unknown ruleId ${ruleId}`);
    }
  }

  return {
    ...(value as Topic),
    rules,
    questions
  };
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const file = await fs.readFile(filePath, 'utf8');
  return JSON.parse(file) as T;
}

export async function getSubjectSlugs(): Promise<string[]> {
  const entries = await fs.readdir(CONTENT_ROOT, { withFileTypes: true });
  return entries
    .filter((entry: import('node:fs').Dirent) => entry.isDirectory())
    .map((entry: import('node:fs').Dirent) => entry.name)
    .sort();
}

export async function getSubjectContent(subjectSlug: string): Promise<SubjectContent> {
  const subjectDir = path.join(CONTENT_ROOT, subjectSlug);
  const subject = validateSubjectSummary(await readJsonFile(path.join(subjectDir, 'subject.json')));
  const topicDir = path.join(subjectDir, 'topics');
  const topicEntries = await fs.readdir(topicDir);

  const unorderedTopics = await Promise.all(
    topicEntries
      .filter((entry: string) => entry.endsWith('.json'))
      .map(async (entry: string) => validateTopic(await readJsonFile(path.join(topicDir, entry))))
  );

  const topics = subject.topicOrder
    .map((slug) => unorderedTopics.find((topic: Topic) => topic.slug === slug))
    .filter((topic): topic is Topic => Boolean(topic));

  assert(
    topics.length === subject.topicOrder.length,
    `subject ${subjectSlug} topicOrder references missing topic JSON`
  );

  const rules = topics.flatMap((topic) => topic.rules);
  const questions = topics.flatMap((topic) => topic.questions);

  return { subject, topics, rules, questions };
}

export async function getAllSubjects(): Promise<SubjectContent[]> {
  const slugs = await getSubjectSlugs();
  return Promise.all(slugs.map(getSubjectContent));
}

export async function getTopic(subjectSlug: string, topicSlug: string): Promise<Topic> {
  const { topics } = await getSubjectContent(subjectSlug);
  const topic = topics.find((entry) => entry.slug === topicSlug);

  if (!topic) {
    throw new Error(`Unknown topic ${topicSlug} for subject ${subjectSlug}`);
  }

  return topic;
}

export async function getRule(subjectSlug: string, ruleId: string): Promise<{ rule: Rule; topic: Topic }> {
  const { topics } = await getSubjectContent(subjectSlug);

  for (const topic of topics) {
    const rule = topic.rules.find((entry) => entry.id === ruleId);
    if (rule) {
      return { rule, topic };
    }
  }

  throw new Error(`Unknown rule ${ruleId} for subject ${subjectSlug}`);
}

export async function getRuleMap(subjectSlug: string): Promise<Record<string, Rule>> {
  const { rules } = await getSubjectContent(subjectSlug);
  return Object.fromEntries(rules.map((rule) => [rule.id, rule]));
}
