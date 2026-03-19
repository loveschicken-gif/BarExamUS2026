import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ContentValidationAlert } from '@/components/ContentValidationAlert';
import { RuleCard } from '@/components/RuleCard';
import { SectionBlock } from '@/components/SectionBlock';
import { StudySessionTracker } from '@/components/StudySessionTracker';
import { getContentValidationReport, getStaticTopicIds, getTopicById } from '@/lib/content';

export function generateStaticParams() {
  return getStaticTopicIds().map((topicId) => ({ topicId }));
}

export default function TopicDetailPage({ params }: { params: { topicId: string } }) {
  const topic = getTopicById(params.topicId);
  const validationReport = getContentValidationReport();

  if (!topic) {
    notFound();
  }

  return (
    <div className="page-stack">
      <StudySessionTracker topicId={topic.id} />
      <ContentValidationAlert issues={validationReport.issues} />

      <section className="page-intro">
        <p className="page-intro__eyebrow">Topic</p>
        <h1>{topic.title}</h1>
        <p>{topic.summary}</p>
        <p className="page-intro__muted">{topic.whyItMatters}</p>
        <div className="chip-row">
          <Link className="button button--secondary" href={`/quiz?topicId=${topic.id}`}>
            Quiz this topic
          </Link>
        </div>
      </section>

      <SectionBlock title="Study outline">
        <div className="stack-md">
          {topic.outlineSections.map((outline) => (
            <article key={outline.id} className="outline-block">
              <h3>{outline.title}</h3>
              <ul>
                {outline.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock title="Rules in this topic">
        <div className="card-grid">
          {topic.rules.map((rule) => (
            <RuleCard key={rule.id} rule={rule} />
          ))}
        </div>
      </SectionBlock>

      <Link href="/topics" className="text-link">
        ← Back to topics
      </Link>
    </div>
  );
}
