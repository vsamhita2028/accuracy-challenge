import test from 'node:test';
import assert from 'node:assert/strict';
import { shuffle, outcome, LIMIT_MS, rankEntries, validName } from './game.js';
import { scenarios } from './scenarios.js';
test('correct, incorrect, and unanswered outcomes and expiry', () => {
  assert.deepEqual(outcome('otp', 'otp', 1200), {status:'correct',score:100,time:1200});
  assert.equal(outcome('reset','otp',2000).status,'incorrect');
  assert.equal(outcome('', 'otp', LIMIT_MS).status,'unanswered');
  assert.equal(outcome('otp','otp',LIMIT_MS).score,0);
});
test('shuffle preserves statement identities and can change their order', () => {
  const items = scenarios[0].statements;
  const shuffled = shuffle(items, () => 0);
  assert.notDeepEqual(shuffled, items);
  assert.deepEqual(new Set(shuffled.map(x => x.id)), new Set(items.map(x => x.id)));
  assert.ok(shuffled.find(x => x.id === scenarios[0].correctAnswer));
});
test('rank by score then time and validate names', () => {
  assert.deepEqual(rankEntries([{score:0,time:1},{score:100,time:500},{score:100,time:100}]).map(x=>x.time),[100,500,1]);
  assert.equal(validName('   '),false); assert.equal(validName('Memo'),true); assert.equal(validName('x'.repeat(25)),false);
});
