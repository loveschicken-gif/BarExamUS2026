import Link from 'next/link';

import type { Topic } from '@/lib/types';

type TopicCardProps = {
  key?: string;
  subjectSlug: string;
  topic: Topic;
};

export function TopicCard({ subjectSlug, topic }: TopicCardProps) {
  return (
    <article className="card stack-sm">
      <div className="stack-xs">
        <p className="eyebrow">Topic</p>
        <h3>{topic.title}</h3>
        <p className="muted">{topic.summary}</p>
      </div>

      <div className="pill-row">
        <span className="pill">{topic.rules.length} rules</span>
        <span className="pill">{topic.questions.length} quiz questions</span>
      </div>

      <ul className="compact-list muted">
        {topic.learningObjectives.map((objective) => (
          <li key={objective}>{objective}</li>
        ))}
      </ul>

      <div className="card-actions">
        <Link href={`/subjects/${subjectSlug}/topics/${topic.slug}`} className="button secondary">
          Open topic
        </Link>
      </div>
    </article>
  );
}
