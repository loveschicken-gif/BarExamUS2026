'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getProgressInsights, readProgressSnapshot } from '@/lib/progress';
import { ProgressSnapshot, QuizQuestionDetail, Rule, Topic } from '@/lib/types';

interface ReviewDashboardProps {
  topics: Topic[];
  rules: Rule[];
  questions: QuizQuestionDetail[];
}

export function ReviewDashboard({ topics, rules, questions }: ReviewDashboardProps) {
  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null);

  useEffect(() => {
    setSnapshot(readProgressSnapshot());
  }, []);

  const insights = useMemo(
    () => getProgressInsights(snapshot ?? { completedRuleIds: [], savedCaseIds: [], flaggedQuestionIds: [], quizAttempts: [], questionPerformance: {}, correctCount: 0, incorrectCount: 0 }, questions),
    [questions, snapshot],
  );

  const topicById = useMemo(() => new Map(topics.map((topic) => [topic.id, topic])), [topics]);
  const ruleById = useMemo(() => new Map(rules.map((rule) => [rule.id, rule])), [rules]);
  const weakRuleTitles = insights.weakRuleIds.slice(0, 3).map((ruleId) => ruleById.get(ruleId)?.title).filter(Boolean);
  const weakTopicTitles = insights.weakTopicIds.slice(0, 3).map((topicId) => topicById.get(topicId)?.title).filter(Boolean);
  const continueHref = snapshot?.lastRuleId ? `/rules/${snapshot.lastRuleId}` : '/topics';
  const resumeTopicHref = snapshot?.lastTopicId ? `/topics/${snapshot.lastTopicId}` : '/topics';
  const completedCount = snapshot?.completedRuleIds.length ?? 0;

  return (
    <section className="card review-dashboard">
      <div className="section-heading">
        <div>
          <div className="card__eyebrow">Review dashboard</div>
          <h2>Pick up Civ Pro where you left off.</h2>
        </div>
      </div>

      <div className="review-dashboard__grid">
        <article className="review-tile">
          <h3>Continue studying</h3>
          <p>{completedCount} rules completed so far.</p>
          <Link className="button button--secondary" href={continueHref}>
            Continue
          </Link>
        </article>

        <article className="review-tile">
          <h3>Review weak areas</h3>
          <p>
            {weakRuleTitles.length > 0 || weakTopicTitles.length > 0
              ? [...weakTopicTitles, ...weakRuleTitles].join(' · ')
              : 'Weak areas will appear after quiz attempts.'}
          </p>
          <Link className="button button--secondary" href="/quiz?mode=weak">
            Review weak areas
          </Link>
        </article>

        <article className="review-tile">
          <h3>Retry missed questions</h3>
          <p>
            {insights.missedQuestionIds.length} missed · {insights.flaggedQuestionIds.length} flagged
          </p>
          <Link className="button button--secondary" href="/quiz?mode=missed">
            Retry missed
          </Link>
        </article>

        <article className="review-tile">
          <h3>Resume last topic</h3>
          <p>{snapshot?.lastTopicId ? topicById.get(snapshot.lastTopicId)?.title ?? 'Last topic' : 'No topic started yet.'}</p>
          <Link className="button button--secondary" href={resumeTopicHref}>
            Resume topic
          </Link>
        </article>
      </div>

      <div className="review-dashboard__footer">
        <span>Total quiz attempts: {snapshot?.quizAttempts.length ?? 0}</span>
        <span>
          Accuracy:{' '}
          {snapshot && snapshot.correctCount + snapshot.incorrectCount > 0
            ? `${Math.round((snapshot.correctCount / (snapshot.correctCount + snapshot.incorrectCount)) * 100)}%`
            : 'No attempts yet'}
        </span>
        <span>
          Last reviewed:{' '}
          {snapshot?.lastReviewedAt ? new Date(snapshot.lastReviewedAt).toLocaleString() : 'Not started'}
        </span>
      </div>
    </section>
  );
}
