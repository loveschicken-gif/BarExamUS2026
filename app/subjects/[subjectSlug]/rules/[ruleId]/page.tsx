import Link from 'next/link';
import { notFound } from 'next/navigation';

import { RuleActionPanel } from '@/components/RuleActionPanel';
import { getRule, getSubjectContent } from '@/lib/content';

type RulePageProps = {
  params: Promise<{ subjectSlug: string; ruleId: string }>;
};

export async function generateStaticParams() {
  const { getSubjectSlugs } = await import('@/lib/content');
  const params: Array<{ subjectSlug: string; ruleId: string }> = [];

  for (const subjectSlug of await getSubjectSlugs()) {
    const subject = await getSubjectContent(subjectSlug);
    for (const rule of subject.rules) {
      params.push({ subjectSlug, ruleId: rule.id });
    }
  }

  return params;
}

export default async function RulePage({ params }: RulePageProps) {
  const { subjectSlug, ruleId } = await params;

  try {
    const { rule, topic } = await getRule(subjectSlug, ruleId);

    return (
      <div className="stack-lg">
        <section className="hero card stack-sm">
          <p className="eyebrow">Rule detail</p>
          <h1>{rule.title}</h1>
          <p className="muted">{rule.blackLetterLaw}</p>
          <div className="card-actions wrap">
            <Link href={`/subjects/${subjectSlug}/topics/${topic.slug}`} className="button secondary">
              Back to {topic.title}
            </Link>
            <Link href={`/subjects/${subjectSlug}/review`} className="button secondary">
              Review dashboard
            </Link>
          </div>
          <RuleActionPanel subjectSlug={subjectSlug} ruleId={rule.id} />
        </section>

        <section className="card-grid two-up">
          <section className="card stack-sm">
            <div className="stack-xs">
              <p className="eyebrow">Explanation</p>
              <h2>Why it matters</h2>
            </div>
            <p className="muted">{rule.explanation}</p>
          </section>

          <section className="card stack-sm">
            <div className="stack-xs">
              <p className="eyebrow">Related doctrine</p>
              <h2>Cross-links</h2>
            </div>
            <div className="pill-row">
              {rule.relatedRuleIds.length === 0 ? (
                <span className="note">No related rules listed.</span>
              ) : (
                rule.relatedRuleIds.map((relatedRuleId) => (
                  <Link key={relatedRuleId} href={`/subjects/${subjectSlug}/rules/${relatedRuleId}`} className="pill link-pill">
                    {relatedRuleId}
                  </Link>
                ))
              )}
            </div>
          </section>
        </section>

        <section className="card-grid two-up">
          <section className="card stack-sm">
            <div className="stack-xs">
              <p className="eyebrow">Elements</p>
              <h2>Checklist</h2>
            </div>
            <ul className="compact-list muted">
              {rule.elements.map((element) => (
                <li key={element}>{element}</li>
              ))}
            </ul>
          </section>

          <section className="card stack-sm">
            <div className="stack-xs">
              <p className="eyebrow">Pitfalls</p>
              <h2>Common traps</h2>
            </div>
            <ul className="compact-list muted">
              {rule.pitfalls.map((pitfall) => (
                <li key={pitfall}>{pitfall}</li>
              ))}
            </ul>
          </section>
        </section>
      </div>
    );
  } catch {
    notFound();
  }
}
