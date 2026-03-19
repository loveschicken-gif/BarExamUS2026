import { notFound } from 'next/navigation';

import { QuizClient } from '@/components/QuizClient';
import { getSubjectContent } from '@/lib/content';

type QuizPageProps = {
  params: Promise<{ subjectSlug: string }>;
};

export default async function QuizPage({ params }: QuizPageProps) {
  const { subjectSlug } = await params;

  try {
    const { subject, questions } = await getSubjectContent(subjectSlug);

    return (
      <div className="stack-lg">
        <section className="hero card stack-sm">
          <p className="eyebrow">Quiz runtime</p>
          <h1>{subject.title} mixed quiz</h1>
          <p className="muted">All questions are loaded from canonical JSON and scored in the browser.</p>
        </section>
        <QuizClient subjectSlug={subjectSlug} questions={questions} />
      </div>
    );
  } catch {
    notFound();
  }
}
