'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AnswerRecord, PersistedQuestionProgress, ProgressState, Question, QuizFilters, SessionRecord, Topic } from '@/src/types/civpro';
import { loadProgress, applySessionToProgress, resetProgress, saveProgress, createEmptyProgress } from '@/src/lib/progress';
import { buildQuestionCounts, buildReviewIssues } from '@/src/lib/review';
import { buildEmptyStateMessage, buildRecommendedReview, filterQuestions, pickSessionQuestions } from '@/src/lib/quiz';
import type { LoadedContent } from '@/src/lib/content';

type CivProAppProps = {
  content: LoadedContent;
};

type SessionState = {
  questions: Question[];
  currentIndex: number;
  answers: AnswerRecord[];
};

const defaultFilters: QuizFilters = {
  topicId: 'all',
  questionStatus: 'all',
  setSize: 5,
  reviewedOnly: true,
};

function getAccuracy(correct: number, attempted: number) {
  if (attempted === 0) {
    return '—';
  }

  return `${Math.round((correct / attempted) * 100)}%`;
}

export function CivProApp({ content }: CivProAppProps) {
  const [progress, setProgress] = useState<ProgressState>(() => createEmptyProgress(content.subject));
  const [filters, setFilters] = useState<QuizFilters>(defaultFilters);
  const [session, setSession] = useState<SessionState | null>(null);
  const [sessionResultId, setSessionResultId] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [flagged, setFlagged] = useState(false);
  const [storageRecovered, setStorageRecovered] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadProgress(content.subject);
    setProgress(loaded.progress);
    setStorageRecovered(loaded.recoveredFromCorruption);
    setHasHydrated(true);
  }, [content.subject]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    saveProgress(progress);
  }, [hasHydrated, progress]);

  const filteredQuestions = useMemo(() => filterQuestions(content.questions, progress, filters), [content.questions, progress, filters]);
  const availableSetSizes = useMemo(
    () => Array.from(new Set([5, 10].filter((size) => filteredQuestions.length >= size).concat(filteredQuestions.length > 0 ? [Math.min(filteredQuestions.length, 20)] : []))),
    [filteredQuestions.length],
  );

  useEffect(() => {
    if (!availableSetSizes.includes(filters.setSize) && filteredQuestions.length > 0) {
      setFilters((current: QuizFilters) => ({ ...current, setSize: availableSetSizes[0] ?? filteredQuestions.length }));
    }
  }, [availableSetSizes, filteredQuestions.length, filters.setSize]);

  const questionsForSession = useMemo(() => pickSessionQuestions(filteredQuestions, filters.setSize), [filteredQuestions, filters.setSize]);
  const latestSession = progress.sessions[0] ?? null;
  const reviewIssues = useMemo(() => buildReviewIssues(content.questions), [content.questions]);
  const questionCounts = useMemo(() => buildQuestionCounts(content.questions, content.topics), [content.questions, content.topics]);

  const totalAttempted = useMemo(
    () => (Object.values(progress.questionProgress) as PersistedQuestionProgress[]).reduce((sum, entry) => sum + entry.attempts, 0),
    [progress.questionProgress],
  );
  const totalCorrect = useMemo(
    () => (Object.values(progress.questionProgress) as PersistedQuestionProgress[]).reduce((sum, entry) => sum + entry.correctAttempts, 0),
    [progress.questionProgress],
  );

  const mostMissedRules = useMemo(() => {
    const ruleMisses = new Map<string, number>();

    progress.sessions.forEach((entry: SessionRecord) => {
      entry.missedRuleIds.forEach((ruleId: string) => {
        ruleMisses.set(ruleId, (ruleMisses.get(ruleId) ?? 0) + 1);
      });
    });

    return [...ruleMisses.entries()]
      .map(([ruleId, misses]) => {
        const match = content.topics.flatMap((topic) => topic.rules).find((rule) => rule.id === ruleId);
        return { ruleId, label: match?.title ?? ruleId, misses };
      })
      .sort((left, right) => right.misses - left.misses)
      .slice(0, 5);
  }, [progress.sessions, content.topics]);

  const topicPerformance = useMemo(() => {
    return content.topics.map((topic) => {
      const topicQuestions = content.questions.filter((question) => question.topicId === topic.id);
      const attempted = topicQuestions.reduce((sum, question) => sum + (progress.questionProgress[question.id]?.attempts ?? 0), 0);
      const correct = topicQuestions.reduce((sum, question) => sum + (progress.questionProgress[question.id]?.correctAttempts ?? 0), 0);
      return {
        topicId: topic.id,
        label: topic.name,
        attempted,
        accuracy: getAccuracy(correct, attempted),
      };
    });
  }, [content.questions, content.topics, progress.questionProgress]);

  const startSession = () => {
    if (questionsForSession.length === 0) {
      return;
    }

    setSession({ questions: questionsForSession, currentIndex: 0, answers: [] });
    setSessionResultId(null);
    setSelectedAnswer(null);
    setFlagged(false);
  };

  const submitAnswer = () => {
    if (!session || selectedAnswer === null) {
      return;
    }

    const currentQuestion = session.questions[session.currentIndex];
    const nextAnswer: AnswerRecord = {
      questionId: currentQuestion.id,
      selectedIndex: selectedAnswer,
      isCorrect: selectedAnswer === currentQuestion.answerIndex,
      flagged,
    };

    const nextAnswers = [...session.answers, nextAnswer];
    const isLastQuestion = session.currentIndex === session.questions.length - 1;

    if (isLastQuestion) {
      const nextProgress = applySessionToProgress(progress, session.questions, nextAnswers, filters);
      setProgress(nextProgress);
      setSession(null);
      setSessionResultId(nextProgress.sessions[0]?.id ?? null);
      setSelectedAnswer(null);
      setFlagged(false);
      return;
    }

    setSession({
      questions: session.questions,
      currentIndex: session.currentIndex + 1,
      answers: nextAnswers,
    });
    setSelectedAnswer(null);
    setFlagged(false);
  };

  const activeQuestion = session ? session.questions[session.currentIndex] : null;
  const sessionResult = sessionResultId ? progress.sessions.find((entry: SessionRecord) => entry.id === sessionResultId) ?? latestSession : latestSession;
  const recommendedReview = sessionResult
    ? buildRecommendedReview(sessionResult.missedQuestionIds, content.questions)
    : { ruleIds: [], topicIds: [] };

  const recommendedFromLatestSession = useMemo(() => {
    if (!sessionResult) {
      return { rules: [], topics: [] as Topic[] };
    }

    return {
      rules: recommendedReview.ruleIds
        .map((ruleId) => content.topics.flatMap((topic) => topic.rules).find((rule) => rule.id === ruleId))
        .filter((value): value is NonNullable<typeof value> => Boolean(value)),
      topics: recommendedReview.topicIds
        .map((topicId) => content.topics.find((topic) => topic.id === topicId))
        .filter((value): value is Topic => Boolean(value)),
    };
  }, [sessionResult, recommendedReview, content.topics]);

  const handleReset = () => {
    setProgress(resetProgress(content.subject));
    setSession(null);
    setSessionResultId(null);
  };

  const retryLatestSession = () => {
    if (!sessionResult) {
      startSession();
      return;
    }

    setFilters(sessionResult.filters);
    const retriedPool = filterQuestions(content.questions, progress, sessionResult.filters);
    const retriedQuestions = pickSessionQuestions(retriedPool, sessionResult.filters.setSize);

    if (retriedQuestions.length === 0) {
      return;
    }

    setSession({ questions: retriedQuestions, currentIndex: 0, answers: [] });
    setSessionResultId(null);
    setSelectedAnswer(null);
    setFlagged(false);
  };

  return (
    <main className="stack">
      <section className="section stack">
        <div className="header-row">
          <div>
            <div className="kicker">Single-subject V1</div>
            <h1 style={{ margin: '6px 0 8px' }}>{content.subject} study dashboard</h1>
            <p className="small" style={{ maxWidth: 760 }}>
              Schema-first quiz flow, safe local progress persistence, and review-focused metrics for one-subject Civ Pro practice.
            </p>
          </div>
          <div className="action-row">
            <button className="danger-button" onClick={handleReset} type="button">
              Reset progress
            </button>
          </div>
        </div>
        {storageRecovered ? <div className="warning-box">Stored progress data was corrupted and has been safely reset.</div> : null}
        {content.errors.length > 0 ? (
          <div className="warning-box">
            <strong>Content validation warning:</strong> {content.errors.join(' ')}
          </div>
        ) : null}
      </section>

      <section className="section stack">
        <div className="header-row">
          <div>
            <h2 style={{ margin: 0 }}>Dashboard metrics</h2>
            <p className="small">Progress stays local, versioned, and resilient to malformed storage payloads.</p>
          </div>
          <div className="small">Storage version <span className="code">v{progress.version}</span></div>
        </div>
        <div className="grid cols-4">
          <div className="metric-card"><div className="metric-label">Questions available</div><div className="metric-value">{content.questions.length}</div></div>
          <div className="metric-card"><div className="metric-label">Total attempted</div><div className="metric-value">{totalAttempted}</div></div>
          <div className="metric-card"><div className="metric-label">Accuracy</div><div className="metric-value">{getAccuracy(totalCorrect, totalAttempted)}</div></div>
          <div className="metric-card"><div className="metric-label">Recent sessions</div><div className="metric-value">{progress.sessions.length}</div></div>
        </div>
        <div className="grid cols-2">
          <div className="metric-card stack">
            <h3 style={{ margin: 0 }}>Most-missed rules</h3>
            {mostMissedRules.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {mostMissedRules.map((rule) => (
                  <li key={rule.ruleId}>{rule.label} — {rule.misses} missed sessions</li>
                ))}
              </ul>
            ) : <div className="small">No missed-rule data yet. Complete a session to populate this list.</div>}
          </div>
          <div className="metric-card stack">
            <h3 style={{ margin: 0 }}>Recent activity</h3>
            {progress.sessions.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {progress.sessions.slice(0, 5).map((entry) => (
                  <li key={entry.id}>
                    {new Date(entry.completedAt).toLocaleString()} — {entry.correct}/{entry.attempted} correct, {entry.flaggedCount} flagged.
                  </li>
                ))}
              </ul>
            ) : <div className="small">No recent activity yet.</div>}
          </div>
        </div>
        <div className="metric-card stack">
          <h3 style={{ margin: 0 }}>Topic performance summary</h3>
          <table className="table">
            <thead>
              <tr><th>Topic</th><th>Attempts</th><th>Accuracy</th></tr>
            </thead>
            <tbody>
              {topicPerformance.map((row) => (
                <tr key={row.topicId}><td>{row.label}</td><td>{row.attempted}</td><td>{row.accuracy}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section stack">
        <div>
          <h2 style={{ marginBottom: 8 }}>Quiz controls</h2>
          <p className="small">Filter by topic, question status, and reviewed-only metadata before launching a short or longer set.</p>
        </div>
        <div className="grid cols-2">
          <div>
            <label className="label" htmlFor="topic-filter">Topic</label>
            <select id="topic-filter" className="select" value={filters.topicId} onChange={(event) => setFilters((current: QuizFilters) => ({ ...current, topicId: event.target.value }))}>
              <option value="all">All topics</option>
              {content.topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="status-filter">Question status</label>
            <select
              id="status-filter"
              className="select"
              value={filters.questionStatus}
              onChange={(event) => setFilters((current: QuizFilters) => ({ ...current, questionStatus: event.target.value as QuizFilters['questionStatus'] }))}
            >
              <option value="all">All</option>
              <option value="unseen">Unseen</option>
              <option value="missed">Missed</option>
              <option value="flagged">Flagged</option>
            </select>
          </div>
        </div>
        <div className="control-row">
          <span className="small" style={{ alignSelf: 'center' }}>Set size:</span>
          {availableSetSizes.length > 0 ? availableSetSizes.map((size) => (
            <button key={size} className={filters.setSize === size ? 'pill active' : 'pill'} onClick={() => setFilters((current: QuizFilters) => ({ ...current, setSize: size }))} type="button">
              {size === 20 && filteredQuestions.length < 20 ? `All (${filteredQuestions.length})` : size}
            </button>
          )) : <span className="small">No valid set sizes for the current filters.</span>}
        </div>
        <div className="control-row">
          <button className={filters.reviewedOnly ? 'pill active' : 'pill'} onClick={() => setFilters((current: QuizFilters) => ({ ...current, reviewedOnly: !current.reviewedOnly }))} type="button">
            {filters.reviewedOnly ? 'Reviewed/approved only' : 'Include draft questions'}
          </button>
        </div>
        <div className="inline-note">
          <strong>{filteredQuestions.length}</strong> questions match the current filters. The next session will include <strong>{questionsForSession.length}</strong> question{questionsForSession.length === 1 ? '' : 's'}.
        </div>
        {filteredQuestions.length === 0 ? (
          <div className="empty-state">{buildEmptyStateMessage(filters, content.topics)}</div>
        ) : (
          <div className="action-row">
            <button className="primary-button" onClick={startSession} type="button">Start session</button>
          </div>
        )}
      </section>

      {session && activeQuestion ? (
        <section className="section stack">
          <div className="header-row">
            <div>
              <h2 style={{ margin: 0 }}>Question {session.currentIndex + 1} of {session.questions.length}</h2>
              <p className="small">Topic: {content.topics.find((topic) => topic.id === activeQuestion.topicId)?.name ?? activeQuestion.topicId}</p>
            </div>
            <button className={flagged ? 'pill active' : 'pill'} onClick={() => setFlagged((current) => !current)} type="button">
              {flagged ? 'Flagged for review' : 'Flag question'}
            </button>
          </div>
          <div className="quiz-card stack">
            <div>{activeQuestion.stem}</div>
            <div className="option-list">
              {activeQuestion.choices.map((choice, index) => (
                <button
                  className={selectedAnswer === index ? 'option-button selected' : 'option-button'}
                  key={choice}
                  onClick={() => setSelectedAnswer(index)}
                  type="button"
                >
                  <strong>{String.fromCharCode(65 + index)}.</strong> {choice}
                </button>
              ))}
            </div>
            <div className="action-row">
              <button className="primary-button" disabled={selectedAnswer === null} onClick={submitAnswer} type="button">Submit answer</button>
            </div>
          </div>
        </section>
      ) : null}

      {!session && sessionResult ? (
        <section className="section stack">
          <div className="header-row">
            <div>
              <h2 style={{ margin: 0 }}>Session results</h2>
              <p className="small">Completed {new Date(sessionResult.completedAt).toLocaleString()}</p>
            </div>
            <div className="action-row">
              <button className="secondary-button" onClick={retryLatestSession} type="button">Retry session</button>
            </div>
          </div>
          <div className="grid cols-4">
            <div className="metric-card"><div className="metric-label">Score</div><div className="metric-value">{sessionResult.correct}/{sessionResult.attempted}</div></div>
            <div className="metric-card"><div className="metric-label">Accuracy</div><div className="metric-value">{getAccuracy(sessionResult.correct, sessionResult.attempted)}</div></div>
            <div className="metric-card"><div className="metric-label">Missed</div><div className="metric-value">{sessionResult.incorrect}</div></div>
            <div className="metric-card"><div className="metric-label">Flagged</div><div className="metric-value">{sessionResult.flaggedCount}</div></div>
          </div>
          <div className="grid cols-2">
            <div className="metric-card stack">
              <h3 style={{ margin: 0 }}>Rules to review next</h3>
              {recommendedFromLatestSession.rules.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {recommendedFromLatestSession.rules.map((rule) => <li key={rule.id}>{rule.title}</li>)}
                </ul>
              ) : <div className="small">No missed rules from this session.</div>}
            </div>
            <div className="metric-card stack">
              <h3 style={{ margin: 0 }}>Topics to review next</h3>
              {recommendedFromLatestSession.topics.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {recommendedFromLatestSession.topics.map((topic) => <li key={topic.id}><button className="pill" onClick={() => setFilters((current: QuizFilters) => ({ ...current, topicId: topic.id }))} type="button">{topic.name}</button></li>)}
                </ul>
              ) : <div className="small">No missed topics from this session.</div>}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section stack">
        <div>
          <h2 style={{ marginBottom: 8 }}>Question quality review</h2>
          <p className="small">Validation utilities surface duplicate ids, duplicate or near-duplicate stems, and inventory counts by topic and rule.</p>
        </div>
        <div className="grid cols-2">
          <div className="metric-card stack">
            <h3 style={{ margin: 0 }}>Review issues</h3>
            {reviewIssues.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {reviewIssues.map((issue, index) => (
                  <li key={`${issue.kind}-${index}`}>
                    <strong>{issue.kind}</strong>: {issue.details} ({issue.questionIds.join(', ')})
                  </li>
                ))}
              </ul>
            ) : <div className="small">No duplicate ids or duplicate/near-duplicate stems detected in the current JSON.</div>}
          </div>
          <div className="metric-card stack">
            <h3 style={{ margin: 0 }}>Counts by topic</h3>
            <table className="table">
              <thead><tr><th>Topic</th><th>Questions</th></tr></thead>
              <tbody>
                {questionCounts.byTopic.map((row) => <tr key={row.id}><td>{row.name}</td><td>{row.count}</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
        <div className="metric-card stack">
          <h3 style={{ margin: 0 }}>Counts by rule</h3>
          <table className="table">
            <thead><tr><th>Rule</th><th>Topic</th><th>Questions</th></tr></thead>
            <tbody>
              {questionCounts.byRule.map((row) => <tr key={row.id}><td>{row.title}</td><td>{row.topicName}</td><td>{row.count}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
