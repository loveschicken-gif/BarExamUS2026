import Link from 'next/link';
import { SubjectDashboardData } from '@/lib/types';
import { TopicCard } from '@/components/TopicCard';

interface SubjectDashboardProps {
  data: SubjectDashboardData;
}

export function SubjectDashboard({ data }: SubjectDashboardProps) {
  return (
    <div className="dashboard-stack">
      <section className="hero">
        <div>
          <p className="hero__eyebrow">U.S. Bar Exam · V1</p>
          <h1>{data.subject.title}</h1>
          <p className="hero__description">{data.subject.description}</p>
        </div>
        <div className="hero__stats">
          <div className="stat-card">
            <span className="stat-card__label">Topics</span>
            <strong>{data.topics.length}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Rules</span>
            <strong>{data.ruleCount}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Cases</span>
            <strong>{data.caseCount}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-card__label">Questions</span>
            <strong>{data.questionCount}</strong>
          </div>
        </div>
      </section>

      <section className="card subject-summary">
        <div>
          <div className="card__eyebrow">Study path</div>
          <h2>Start with rules, then anchor them with cases, then test retention with quiz review.</h2>
          <p>
            This V1 app focuses only on Civil Procedure and keeps the content JSON-driven so future subjects,
            quizzes, and review tools can plug into the same schema.
          </p>
        </div>
        <div className="subject-summary__actions">
          <Link className="button" href="/topics">
            {data.subject.primaryCtaLabel ?? 'Open topics'}
          </Link>
        </div>
      </section>

      <section>
        <div className="section-heading">
          <h2>High-yield Civ Pro topics</h2>
          <Link href="/topics">View all topics</Link>
        </div>
        <div className="card-grid">
          {data.topics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      </section>

      <section className="card focus-panel">
        <div className="card__eyebrow">Exam focus</div>
        <ul className="focus-list">
          {data.subject.examFocus.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
