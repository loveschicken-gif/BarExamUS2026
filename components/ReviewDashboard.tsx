'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { buildReviewItems, loadProgress } from '@/lib/progress';
import type { Rule, SubjectProgress } from '@/lib/types';

type ReviewDashboardProps = {
  subjectSlug: string;
  rules: Rule[];
};

export function ReviewDashboard({ subjectSlug, rules }: ReviewDashboardProps) {
  const [progress, setProgress] = useState<SubjectProgress>(() => loadProgress(subjectSlug));

  useEffect(() => {
    const sync = () => setProgress(loadProgress(subjectSlug));
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
    };
  }, [subjectSlug]);

  const bookmarkedRules = useMemo(
    () => rules.filter((rule) => progress.bookmarkedRuleIds.includes(rule.id)),
    [progress.bookmarkedRuleIds, rules]
  );
  const reviewItems = useMemo(() => buildReviewItems(progress), [progress]);

  return (
    <div className="review-grid">
      <section className="card stack-sm">
        <div className="stack-xs">
          <p className="eyebrow">Review queue</p>
          <h2>Missed-rule priorities</h2>
          <p className="muted">Generated from incorrect quiz answers saved in local storage.</p>
        </div>
        {reviewItems.length === 0 ? (
          <p className="note">No missed-rule history yet. Take the quiz to generate review targets.</p>
        ) : (
          <ul className="stack-sm plain-list">
            {reviewItems.map((item: { ruleId: string; misses: number; questionIds: string[] }) => {
              const rule = rules.find((entry) => entry.id === item.ruleId);
              if (!rule) {
                return null;
              }

              return (
                <li key={item.ruleId} className="review-item">
                  <div>
                    <strong>{rule.title}</strong>
                    <p className="muted">{item.misses} missed question(s) tied to this rule.</p>
                  </div>
                  <Link href={`/subjects/${subjectSlug}/rules/${rule.id}`} className="button secondary">
                    Review rule
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card stack-sm">
        <div className="stack-xs">
          <p className="eyebrow">Bookmarks</p>
          <h2>Saved doctrine</h2>
          <p className="muted">Manual review items you flagged while reading rules.</p>
        </div>
        {bookmarkedRules.length === 0 ? (
          <p className="note">No bookmarked rules yet.</p>
        ) : (
          <ul className="stack-sm plain-list">
            {bookmarkedRules.map((rule: Rule) => (
              <li key={rule.id} className="review-item">
                <div>
                  <strong>{rule.title}</strong>
                  <p className="muted">Rule ID: {rule.id}</p>
                </div>
                <Link href={`/subjects/${subjectSlug}/rules/${rule.id}`} className="button secondary">
                  Open rule
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
