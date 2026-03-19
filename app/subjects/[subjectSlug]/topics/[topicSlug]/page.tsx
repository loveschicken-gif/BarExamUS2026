import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getSubjectSlugs, getTopic } from '@/lib/content';

type TopicPageProps = {
  params: Promise<{ subjectSlug: string; topicSlug: string }>;
};

export async function generateStaticParams() {
  const params: Array<{ subjectSlug: string; topicSlug: string }> = [];

  for (const subjectSlug of await getSubjectSlugs()) {
    const { getSubjectContent } = await import('@/lib/content');
    const subject = await getSubjectContent(subjectSlug);
    for (const topic of subject.topics) {
      params.push({ subjectSlug, topicSlug: topic.slug });
    }
  }

  return params;
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { subjectSlug, topicSlug } = await params;

  try {
    const topic = await getTopic(subjectSlug, topicSlug);

    return (
      <div className="stack-lg">
        <section className="hero card stack-sm">
          <p className="eyebrow">Topic detail</p>
          <h1>{topic.title}</h1>
          <p className="muted">{topic.summary}</p>
          <div className="card-actions wrap">
            <Link href={`/subjects/${subjectSlug}`} className="button secondary">
              Back to dashboard
            </Link>
            <Link href={`/subjects/${subjectSlug}/quiz`} className="button">
              Take mixed quiz
            </Link>
          </div>
        </section>

        <section className="card-grid two-up">
          <section className="card stack-sm">
            <div className="stack-xs">
              <p className="eyebrow">Objectives</p>
              <h2>What to master</h2>
            </div>
            <ul className="compact-list muted">
              {topic.learningObjectives.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
          </section>

          <section className="card stack-sm">
            <div className="stack-xs">
              <p className="eyebrow">Quiz coverage</p>
              <h2>Question set</h2>
            </div>
            <p className="muted">{topic.questions.length} JSON-defined questions currently reinforce this topic.</p>
            <ul className="compact-list muted">
              {topic.questions.map((question) => (
                <li key={question.id}>{question.prompt}</li>
              ))}
            </ul>
          </section>
        </section>

        <section className="card stack-sm">
          <div className="stack-xs">
            <p className="eyebrow">Rule list</p>
            <h2>Doctrine in this topic</h2>
          </div>
          <div className="card-grid">
            {topic.rules.map((rule) => (
              <article key={rule.id} className="card inset stack-sm">
                <div className="stack-xs">
                  <h3>{rule.title}</h3>
                  <p className="muted">{rule.blackLetterLaw}</p>
                </div>
                <div className="pill-row">
                  {rule.relatedRuleIds.map((relatedRuleId) => (
                    <span key={relatedRuleId} className="pill subtle">{relatedRuleId}</span>
                  ))}
                </div>
                <div className="card-actions">
                  <Link href={`/subjects/${subjectSlug}/rules/${rule.id}`} className="button secondary">
                    Open rule
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  } catch {
    notFound();
  }
}
