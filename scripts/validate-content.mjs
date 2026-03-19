import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = path.join(process.cwd(), 'content', 'canonical');

const isString = (value) => typeof value === 'string' && value.trim().length > 0;
const isStringArray = (value) => Array.isArray(value) && value.every(isString);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function validateSubject(subjectDir) {
  const subject = JSON.parse(await fs.readFile(path.join(subjectDir, 'subject.json'), 'utf8'));
  assert(isString(subject.slug), 'subject.slug missing');
  assert(isString(subject.title), `subject ${subject.slug} title missing`);
  assert(isStringArray(subject.examFocus), `subject ${subject.slug} examFocus must be string[]`);
  assert(isStringArray(subject.topicOrder), `subject ${subject.slug} topicOrder must be string[]`);

  const topicDir = path.join(subjectDir, 'topics');
  const topicFiles = (await fs.readdir(topicDir)).filter((entry) => entry.endsWith('.json'));
  const topics = [];

  for (const file of topicFiles) {
    const topic = JSON.parse(await fs.readFile(path.join(topicDir, file), 'utf8'));
    assert(isString(topic.slug), `${file}: topic.slug missing`);
    assert(isStringArray(topic.ruleIds), `${file}: topic.ruleIds must be string[]`);
    assert(Array.isArray(topic.rules), `${file}: topic.rules must be array`);
    assert(Array.isArray(topic.questions), `${file}: topic.questions must be array`);

    const ruleIds = new Set(topic.rules.map((rule) => rule.id));
    assert(ruleIds.size === topic.ruleIds.length, `${file}: topic.ruleIds length must match unique rule ids`);
    for (const ruleId of topic.ruleIds) {
      assert(ruleIds.has(ruleId), `${file}: missing rule for ${ruleId}`);
    }

    for (const question of topic.questions) {
      assert(isString(question.id), `${file}: question.id missing`);
      assert(Array.isArray(question.choices) && question.choices.length >= 2, `${file}: ${question.id} needs 2+ choices`);
      assert(question.choices.some((choice) => choice.id === question.correctChoiceId), `${file}: ${question.id} correctChoiceId mismatch`);
      for (const ruleId of question.ruleIds) {
        assert(ruleIds.has(ruleId), `${file}: ${question.id} references unknown rule ${ruleId}`);
      }
    }

    topics.push(topic.slug);
  }

  assert(subject.topicOrder.length === topics.length, `${subject.slug}: topicOrder count mismatch`);
  for (const topicSlug of subject.topicOrder) {
    assert(topics.includes(topicSlug), `${subject.slug}: topicOrder references missing topic ${topicSlug}`);
  }

  return {
    slug: subject.slug,
    topicCount: topics.length,
    questionCount: (await Promise.all(topicFiles.map(async (file) => {
      const topic = JSON.parse(await fs.readFile(path.join(topicDir, file), 'utf8'));
      return topic.questions.length;
    }))).reduce((sum, count) => sum + count, 0)
  };
}

const subjects = (await fs.readdir(root, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const results = [];
for (const slug of subjects) {
  results.push(await validateSubject(path.join(root, slug)));
}

for (const result of results) {
  console.log(`validated ${result.slug}: ${result.topicCount} topic(s), ${result.questionCount} question(s)`);
}
