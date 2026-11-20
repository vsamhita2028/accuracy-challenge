import test from 'node:test';
import assert from 'node:assert/strict';
import { shuffle, makeRound, gradeRound, LIMIT_MS, rankEntries, validName } from './game.js';
import { scenarios } from './scenarios.js';
test('all 50 scenarios have unique IDs, three unique choices and a valid answer', () => {
  assert.equal(scenarios.length, 50);
  assert.equal(new Set(scenarios.map(s => s.id)).size, 50);
  for (const s of scenarios) {
    assert.ok(s.brief && s.explanation && s.title);
    assert.equal(s.statements.length, 3);
    assert.equal(new Set(s.statements.map(x => x.id)).size, 3);
    assert.ok(s.statements.some(x => x.id === s.correctAnswer));
  }
});
test('round draws three distinct scenarios and shuffles choices without losing answers', () => {
  const round = makeRound(scenarios, () => 0);
  assert.equal(round.length, 3);
  assert.equal(new Set(round.map(q => q.id)).size, 3);
  assert.notDeepEqual(round[0].statements, scenarios.find(q => q.id === round[0].id).statements);
  assert.ok(round.every(q => q.statements.some(s => s.id === q.correctAnswer)));
  assert.notDeepEqual(shuffle([1,2,3], () => 0), [1,2,3]);
});
test('scores correct, incorrect and unanswered answers and caps timeout', () => {
  const round = makeRound(scenarios, () => 0);
  const result = gradeRound(round, ['unsupported', 'supported-1'], LIMIT_MS + 500);
  assert.deepEqual(result.results.map(r => r.status), ['correct', 'incorrect', 'unanswered']);
  assert.equal(result.score, 100); assert.equal(result.time, LIMIT_MS); assert.equal(result.timedOut, true);
  assert.equal(gradeRound(round, ['unsupported','unsupported','unsupported'], 10000).score, 300);
});
test('rank by score then time and validate names', () => {
  assert.deepEqual(rankEntries([{score:0,time:1},{score:100,time:500},{score:100,time:100}]).map(x=>x.time),[100,500,1]);
  assert.equal(validName('   '),false); assert.equal(validName('Memo'),true); assert.equal(validName('x'.repeat(25)),false);
});
