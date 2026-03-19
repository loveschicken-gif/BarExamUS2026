'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getProgressInsights, readProgressSnapshot, recordQuizAttempt, toggleFlaggedQuestion, writeProgressSnapshot } from '@/lib/progress';
import { ProgressSnapshot, QuizQuestionDetail } from '@/lib/types';

type QuizMode = 'all' | 'missed' | 'flagged' | 'weak';

interface QuizRunnerProps {
  questions: QuizQuestionDetail[];
  initialMode?: string;
  topicId?: string;
  ruleId?: string;
}

function normalizeMode(mode?: string): QuizMode {
  if (mode === 'missed' || mode === 'flagged' || mode === 'weak') {
    return mode;
  }

  return 'all';
}

export function QuizRunner({ questions, initialMode, topicId, ruleId }: QuizRunnerProps) {
  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setSnapshot(readProgressSnapshot());
  }, []);

  const mode = normalizeMode(initialMode);
  const insights = useMemo(
    () => getProgressInsights(snapshot ?? { completedRuleIds: [], savedCaseIds: [], flaggedQuestionIds: [], quizAttempts: [], questionPerformance: {}, correctCount: 0, incorrectCount: 0 }, questions),
    [questions, snapshot],
  );

  const filteredQuestions = useMemo(() => {
    let nextQuestions = [...questions];

    if (topicId) {
      nextQuestions = nextQuestions.filter((question) => question.topicId === topicId);
    }

    if (ruleId) {
      nextQuestions = nextQuestions.filter((question) => question.ruleId === ruleId);
    }

    if (mode === 'missed') {
      nextQuestions = nextQuestions.filter((question) => insights.missedQuestionIds.includes(question.id));
    }

    if (mode === 'flagged') {
      nextQuestions = nextQuestions.filter((question) => insights.flaggedQuestionIds.includes(question.id));
    }

    if (mode === 'weak') {
      nextQuestions = nextQuestions.filter(
        (question) => insights.weakRuleIds.includes(question.ruleId) || insights.weakTopicIds.includes(question.topicId),
      );
    }

    return nextQuestions;
  }, [insights.flaggedQuestionIds, insights.missedQuestionIds, insights.weakRuleIds, insights.weakTopicIds, mode, questions, ruleId, topicId]);

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedAnswerIndex(null);
    setSubmitted(false);
  }, [mode, topicId, ruleId]);

  const currentQuestion = filteredQuestions[currentIndex];
  const currentPerformance = currentQuestion ? snapshot?.questionPerformance[currentQuestion.id] : undefined;
  const isFlagged = currentQuestion ? snapshot?.flaggedQuestionIds.includes(currentQuestion.id) ?? false : false;

  const moveToQuestion = (nextIndex: number) => {
    setCurrentIndex(nextIndex);
    setSelectedAnswerIndex(null);
    setSubmitted(false);
  };

  const handleSubmit = () => {
    if (!currentQuestion || selectedAnswerIndex === null) {
      return;
    }

    const isCorrect = selectedAnswerIndex === currentQuestion.answerIndex;
    const currentSnapshot = snapshot ?? readProgressSnapshot();
    const nextSnapshot = recordQuizAttempt(currentSnapshot, {
      questionId: currentQuestion.id,
      ruleId: currentQuestion.ruleId,
      topicId: currentQuestion.topicId,
      selectedAnswerIndex,
      isCorrect,
    });

    writeProgressSnapshot(nextSnapshot);
    setSnapshot(nextSnapshot);
    setSubmitted(true);
  };

  const handleToggleFlag = () => {
    if (!currentQuestion) {
      return;
    }

    const currentSnapshot = snapshot ?? readProgressSnapshot();
    const nextSnapshot = toggleFlaggedQuestion(currentSnapshot, currentQuestion.id);
    writeProgressSnapshot(nextSnapshot);
    setSnapshot(nextSnapshot);
  };

  if (questions.length === 0) {
    return (
      <section className="card empty-state">
        <h2>No quiz questions are available yet.</h2>
        <p>Add draft questions in a reviewable draft file before enabling this screen for more content.</p>
      </section>
    );
  }

  if (!currentQuestion) {
    return (
      <section className="card empty-state">
        <h2>No questions match this review filter yet.</h2>
        <p>Try the full set first, then come back to weak, missed, or flagged review.</p>
        <div className="chip-row">
          <Link className="button button--secondary" href="/quiz">
            Open all questions
          </Link>
          <Link className="button button--secondary" href="/">
            Back to dashboard
          </Link>
        </div>
      </section>
    );
  }

  const isCorrect = submitted && selectedAnswerIndex === currentQuestion.answerIndex;

  return (
    <div className="page-stack">
      <section className="page-intro">
        <p className="page-intro__eyebrow">Quiz mode</p>
        <h1>Civil Procedure questions</h1>
        <p>
          Work through draft questions, check your answer, and use the linked rule and case references to reinforce the
          governing doctrine.
        </p>
        <div className="chip-row">
          <span className="chip">Mode: {mode}</span>
          <span className="chip">
            Question {currentIndex + 1} of {filteredQuestions.length}
          </span>
          <span className="chip">Flagged: {snapshot?.flaggedQuestionIds.length ?? 0}</span>
        </div>
      </section>

      <section className="card quiz-card">
        <div className="quiz-card__header">
          <div>
            <div className="card__eyebrow">Question</div>
            <h2>{currentQuestion.prompt}</h2>
          </div>
          <button className="button button--secondary" type="button" onClick={handleToggleFlag}>
            {isFlagged ? 'Unflag question' : 'Flag for review'}
          </button>
        </div>

        <div className="quiz-card__choices">
          {currentQuestion.choices.map((choice, choiceIndex) => {
            const isSelected = selectedAnswerIndex === choiceIndex;
            const isAnswer = submitted && currentQuestion.answerIndex === choiceIndex;
            const isWrongSelection = submitted && isSelected && currentQuestion.answerIndex !== choiceIndex;

            return (
              <button
                key={`${currentQuestion.id}-${choice}`}
                type="button"
                className={`quiz-choice${isSelected ? ' quiz-choice--selected' : ''}${isAnswer ? ' quiz-choice--correct' : ''}${isWrongSelection ? ' quiz-choice--incorrect' : ''}`}
                onClick={() => setSelectedAnswerIndex(choiceIndex)}
                disabled={submitted}
              >
                <span className="quiz-choice__label">{String.fromCharCode(65 + choiceIndex)}</span>
                <span>{choice}</span>
              </button>
            );
          })}
        </div>

        <div className="quiz-card__actions">
          <button className="button" type="button" onClick={handleSubmit} disabled={submitted || selectedAnswerIndex === null}>
            {submitted ? 'Answer checked' : 'Check answer'}
          </button>
          <div className="chip-row">
            <button
              className="button button--secondary"
              type="button"
              onClick={() => moveToQuestion(currentIndex - 1)}
              disabled={currentIndex === 0}
            >
              Previous
            </button>
            <button
              className="button button--secondary"
              type="button"
              onClick={() => moveToQuestion(currentIndex + 1)}
              disabled={currentIndex >= filteredQuestions.length - 1}
            >
              Next
            </button>
          </div>
        </div>

        {submitted ? (
          <div className={`quiz-feedback ${isCorrect ? 'quiz-feedback--correct' : 'quiz-feedback--incorrect'}`}>
            <h3>{isCorrect ? 'Correct.' : 'Not quite.'}</h3>
            <p>{currentQuestion.explanation}</p>
            <p className="card__muted">
              Attempts: {currentPerformance?.attempts ?? 0} · Correct: {currentPerformance?.correctCount ?? 0} · Incorrect:{' '}
              {currentPerformance?.incorrectCount ?? 0}
            </p>
          </div>
        ) : null}
      </section>

      <section className="card reference-panel">
        <div className="card__eyebrow">Linked references</div>
        <div className="stack-md">
          <div>
            <h3>Rule</h3>
            {currentQuestion.linkedRule ? (
              <>
                <p>{currentQuestion.linkedRule.title}</p>
                <p className="card__muted">{currentQuestion.linkedRule.blackLetterRule}</p>
                <Link className="text-link" href={`/rules/${currentQuestion.linkedRule.id}`}>
                  Open rule page
                </Link>
              </>
            ) : (
              <p className="card__muted">No linked rule is available for this question.</p>
            )}
          </div>

          <div>
            <h3>Cases</h3>
            {currentQuestion.linkedCases.length > 0 ? (
              <ul>
                {currentQuestion.linkedCases.map((caseItem) => (
                  <li key={caseItem.id}>
                    <strong>{caseItem.title}</strong> — {caseItem.ruleConnection}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="card__muted">No linked cases are available for this question yet.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
