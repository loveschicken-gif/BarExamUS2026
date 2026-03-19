import Link from 'next/link';
import { TopicDetail } from '@/lib/types';

interface TopicCardProps {
  topic: TopicDetail;
}

export function TopicCard({ topic }: TopicCardProps) {
  return (
    <article className="card topic-card">
      <div className="card__eyebrow">Topic</div>
      <h3>{topic.title}</h3>
      <p>{topic.summary}</p>
      <p className="card__muted">Why it matters: {topic.whyItMatters}</p>
      <div className="topic-card__meta">
        <span>{topic.rules.length} rules</span>
        <span>{topic.outlineSections.length} study outline blocks</span>
      </div>
      <Link className="button button--secondary" href={`/topics/${topic.id}`}>
        Open topic
      </Link>
    </article>
  );
}
