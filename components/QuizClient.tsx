'use client';

import { useMemo, useState } from 'react';

import { recordAnswer, loadProgress } from '@/lib/progress';
import { scoreAnswer } from '@/lib/quiz';
import type { QuizQuestion, SubjectProgress } from '@/lib/types';

type QuizClientProps = {
  subjectSlug: string;
  questions: QuizQuestion[];
};

export function QuizClient({ subjectSlug, questions }: QuizClientProps) {
  const [progress, setProgress] = useState<SubjectProgress>(() => loadProgress(subjectSlug));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string>('');
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, string>>({});
  const [correctCount, setCorrectCount] = useState(0);

  const question = questions[currentIndex];
  const isAnswered = Boolean(revealedAnswers[question.id]);
  const score = useMemo(() => `${correctCount}/${Object.keys(revealedAnswers).length || 0}`, [correctCount, revealedAnswers]);

  function submitAnswer() {
    if (!selectedChoiceId || isAnswered) {
      return;
    }

    const answer = scoreAnswer(question, selectedChoiceId);
    const nextAnsweredCount = Object.keys(revealedAnswers).length + 1;
    const nextCorrectCount = correctCount + (answer.isCorrect ? 1 : 0);

    setRevealedAnswers((current) => ({ ...current, [question.id]: selectedChoiceId }));
    setCorrectCount(nextCorrectCount);
    setProgress(
      recordAnswer(progress, answer, {
        correct: nextCorrectCount,
        total: nextAnsweredCount
      })
    );
  }

  function goToNext() {
    const nextIndex = Math.min(currentIndex + 1, questions.length - 1);
    setCurrentIndex(nextIndex);
    setSelectedChoiceId(revealedAnswers[questions[nextIndex].id] ?? '');
  }

  function goToPrevious() {
    const nextIndex = Math.max(currentIndex - 1, 0);
    setCurrentIndex(nextIndex);
    setSelectedChoiceId(revealedAnswers[questions[nextIndex].id] ?? '');
  }

  return (
    <section className="card stack-md">
      <div className="quiz-header">
        <div>
          <p className="eyebrow">Quiz runtime</p>
          <h2>Mixed Civ Pro quiz</h2>
          <p className="muted">Question {currentIndex + 1} of {questions.length}</p>
        </div>
        <div className="pill-row">
          <span className="pill">Score {score}</span>
          <span className="pill">Saved locally</span>
        </div>
      </div>

      <div className="stack-sm">
        <p className="question-prompt">{question.prompt}</p>
        <div className="stack-xs">
          {question.choices.map((choice) => {
            const submittedChoiceId = revealedAnswers[question.id];
            const showCorrect = submittedChoiceId && choice.id === question.correctChoiceId;
            const showIncorrect = submittedChoiceId === choice.id && choice.id !== question.correctChoiceId;

            return (
              <label key={choice.id} className={`choice ${showCorrect ? 'choice-correct' : ''} ${showIncorrect ? 'choice-incorrect' : ''}`}>
                <input
                  type="radio"
                  name={question.id}
                  value={choice.id}
                  checked={selectedChoiceId === choice.id}
                  onChange={() => setSelectedChoiceId(choice.id)}
                  disabled={Boolean(submittedChoiceId)}
                />
                <span>{choice.text}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="pill-row">
        {question.ruleIds.map((ruleId) => (
          <span key={ruleId} className="pill subtle">{ruleId}</span>
        ))}
      </div>

      {isAnswered ? (
        <div className="feedback stack-xs">
          <p>
            <strong>{question.correctChoiceId === revealedAnswers[question.id] ? 'Correct.' : 'Not quite.'}</strong> {question.rationale}
          </p>
        </div>
      ) : null}

      <div className="card-actions wrap">
        <button type="button" className="button secondary" onClick={goToPrevious} disabled={currentIndex === 0}>
          Previous
        </button>
        <button type="button" className="button" onClick={submitAnswer} disabled={!selectedChoiceId || isAnswered}>
          Check answer
        </button>
        <button type="button" className="button secondary" onClick={goToNext} disabled={currentIndex === questions.length - 1}>
          Next
        </button>
      </div>
    </section>
  );
}
