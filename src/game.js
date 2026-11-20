export const LIMIT_MS = 90000;
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function outcome(selected, answer, elapsed) {
  const time = Math.min(LIMIT_MS, Math.max(0, elapsed));
  const status = time >= LIMIT_MS || !selected ? 'unanswered' : selected === answer ? 'correct' : 'incorrect';
  return { status, score: status === 'correct' ? 100 : 0, time };
}
export function formatTime(ms) { return `${(ms / 1000).toFixed(1)}s`; }
export function rankEntries(entries) {
  return [...entries].sort((a, b) => b.score - a.score || a.time - b.time || a.createdAt - b.createdAt);
}
export function validName(name) { return name.trim().length > 0 && name.trim().length <= 24; }
