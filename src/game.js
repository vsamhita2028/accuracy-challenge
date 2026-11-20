export const LIMIT_MS = 90000;
export const QUESTION_COUNT = 3;
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function makeRound(bank, random = Math.random) {
  if (bank.length < QUESTION_COUNT) throw new Error('At least three scenarios are required.');
  return shuffle(bank, random).slice(0, QUESTION_COUNT).map(s => ({ ...s, statements: shuffle(s.statements, random) }));
}
export function gradeRound(questions, answers, elapsed) {
  const time = Math.min(LIMIT_MS, Math.max(0, elapsed));
  const results = questions.map((question, index) => ({
    ...question, selected: answers[index] || '',
    status: !answers[index] ? 'unanswered' : answers[index] === question.correctAnswer ? 'correct' : 'incorrect',
  }));
  return { results, score: results.filter(r => r.status === 'correct').length * 100, time, timedOut: elapsed >= LIMIT_MS };
}
export function formatTime(ms) { return `${(ms / 1000).toFixed(1)}s`; }
export function rankEntries(entries) {
  return [...entries].sort((a, b) => b.score - a.score || a.time - b.time || a.createdAt - b.createdAt);
}
export function validName(name) { return name.trim().length > 0 && name.trim().length <= 24; }
