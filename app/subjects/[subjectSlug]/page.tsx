import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SubjectProgressSummary } from '@/components/SubjectProgressSummary';
import { TopicCard } from '@/components/TopicCard';
import { getAllSubjects, getSubjectContent, getSubjectSlugs } from '@/lib/content';

type SubjectPageProps = {
  params: Promise<{ subjectSlug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getSubjectSlugs();
  return slugs.map((subjectSlug) => ({ subjectSlug }));
}

export async function generateMetadata({ params }: SubjectPageProps) {
  const { subjectSlug } = await params;
  const subjects = await getAllSubjects();
  const match = subjects.find((entry) => entry.subject.slug === subjectSlug);
  return {
    title: match ? `${match.subject.title} | BarExamUS2026` : 'Subject | BarExamUS2026'
  };
}

export default async function SubjectPage({ params }: SubjectPageProps) {
  const { subjectSlug } = await params;

  try {
    const { subject, topics, rules, questions } = await getSubjectContent(subjectSlug);

    return (
      <div className="stack-lg">
        <section className="hero card stack-md">
          <div className="stack-sm">
            <div className="stack-xs">
              <p className="eyebrow">Subject dashboard</p>
              <h1>{subject.title}</h1>
              <p className="muted">{subject.description}</p>
            </div>
            <div className="pill-row">
              <span className="pill">{topics.length} topics</span>
              <span className="pill">{rules.length} rules</span>
              <span className="pill">{questions.length} questions</span>
            </div>
            <div className="card-actions wrap">
              <Link href={`/subjects/${subjectSlug}/quiz`} className="button">
                Start mixed quiz
              </Link>
              <Link href={`/subjects/${subjectSlug}/review`} className="button secondary">
                Open review dashboard
              </Link>
            </div>
          </div>

          <SubjectProgressSummary
            subjectSlug={subjectSlug}
            totalRuleCount={rules.length}
            totalQuestionCount={questions.length}
          />
        </section>

        <section className="card stack-sm">
          <div className="stack-xs">
            <p className="eyebrow">Topic list</p>
            <h2>Study sequence</h2>
          </div>
          <div className="card-grid">
            {topics.map((topic) => (
              <TopicCard key={topic.id} subjectSlug={subjectSlug} topic={topic} />
            ))}
          </div>
        </section>
      </div>
    );
  } catch {
    notFound();
  }
}
