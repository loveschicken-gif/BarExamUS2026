'use client';

import { useEffect, useMemo, useState } from 'react';

import { buildReviewItems, getCompletionPercent, loadProgress } from '@/lib/progress';
import type { SubjectProgress } from '@/lib/types';

type SubjectProgressSummaryProps = {
  subjectSlug: string;
  totalRuleCount: number;
  totalQuestionCount: number;
};

export function SubjectProgressSummary({
  subjectSlug,
  totalRuleCount,
  totalQuestionCount
}: SubjectProgressSummaryProps) {
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

  const reviewCount = useMemo(() => buildReviewItems(progress).length, [progress]);
  const completion = getCompletionPercent(progress, totalRuleCount);
  const attemptedQuestions = Object.keys(progress.answers).length;

  return (
    <section className="card stack-sm">
      <div className="stack-xs">
        <p className="eyebrow">Local progress</p>
        <h2>Study snapshot</h2>
        <p className="muted">Stored in your browser for this device only.</p>
      </div>

      <div className="stats-grid">
        <div>
          <strong>{completion}%</strong>
          <span>rules completed</span>
        </div>
        <div>
          <strong>{attemptedQuestions}/{totalQuestionCount}</strong>
          <span>questions attempted</span>
        </div>
        <div>
          <strong>{progress.bookmarkedRuleIds.length}</strong>
          <span>bookmarked rules</span>
        </div>
        <div>
          <strong>{reviewCount}</strong>
          <span>review targets</span>
        </div>
      </div>

      {progress.lastQuizScore ? (
        <p className="note">
          Last quiz score: {progress.lastQuizScore.correct}/{progress.lastQuizScore.total} on{' '}
          {new Date(progress.lastQuizScore.completedAt).toLocaleString()}.
        </p>
      ) : (
        <p className="note">No quiz attempts yet. Start with a topic or the mixed quiz.</p>
      )}
    </section>
  );
}
