import Link from 'next/link';
import { ContentValidationAlert } from '@/components/ContentValidationAlert';
import { TopicCard } from '@/components/TopicCard';
import { getContentValidationReport, getTopics, getTopicById } from '@/lib/content';
import { TopicDetail } from '@/lib/types';

export default function TopicsPage() {
  const topics = getTopics()
    .map((topic) => getTopicById(topic.id))
    .filter((topic): topic is TopicDetail => Boolean(topic));
  const validationReport = getContentValidationReport();

  return (
    <div className="page-stack">
      <ContentValidationAlert issues={validationReport.issues} />

      <section className="page-intro">
        <p className="page-intro__eyebrow">Civil Procedure</p>
        <h1>Topic list</h1>
        <p>Move topic by topic from doctrine overview into the rules and cases that support exam analysis.</p>
        <div className="chip-row">
          <Link className="button button--secondary" href="/quiz">
            Open quiz mode
          </Link>
        </div>
      </section>

      <div className="card-grid">
        {topics.map((topic) => (
          <TopicCard key={topic.id} topic={topic} />
        ))}
      </div>
    </div>
  );
}
