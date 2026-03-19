import type { QuizQuestion, QuizAnswerRecord } from '@/lib/types';

export function scoreAnswer(question: QuizQuestion, selectedChoiceId: string): QuizAnswerRecord {
  return {
    questionId: question.id,
    selectedChoiceId,
    isCorrect: question.correctChoiceId === selectedChoiceId,
    answeredAt: new Date().toISOString(),
    ruleIds: question.ruleIds
  };
}

export function shuffleQuestions<T>(items: T[]): T[] {
  const clone = [...items];

  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }

  return clone;
}
