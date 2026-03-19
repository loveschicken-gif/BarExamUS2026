import { notFound } from 'next/navigation';

import { ReviewDashboard } from '@/components/ReviewDashboard';
import { getSubjectContent } from '@/lib/content';

type ReviewPageProps = {
  params: Promise<{ subjectSlug: string }>;
};

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { subjectSlug } = await params;

  try {
    const { subject, rules } = await getSubjectContent(subjectSlug);

    return (
      <div className="stack-lg">
        <section className="hero card stack-sm">
          <p className="eyebrow">Review dashboard</p>
          <h1>{subject.title} review</h1>
          <p className="muted">Use this page to revisit bookmarked rules and rules tied to missed quiz answers.</p>
        </section>
        <ReviewDashboard subjectSlug={subjectSlug} rules={rules} />
      </div>
    );
  } catch {
    notFound();
  }
}
