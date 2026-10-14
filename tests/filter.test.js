const test = require('node:test');
const assert = require('node:assert');
const { classify, findGroupCodes, describeProfile } = require('../extension/filter.js');
const fixtures = require('./fixtures.js');

for (const [title, expected] of fixtures) {
  test((expected ? 'show  ' : 'hide  ') + title, () => {
    const r = classify(title);
    assert.strictEqual(r.relevant, expected, 'reason given: ' + r.reason);
  });
}

test('parses sub-group codes', () => {
  const [c] = findGroupCodes('Lab 11 Submission – Malabe – Y3.S1.WE.SE.0102');
  assert.deepStrictEqual(
    { year: c.year, semester: c.semester, mode: c.mode, spec: c.specialization, group: c.group, sub: c.subgroup },
    { year: 3, semester: 1, mode: 'WE', spec: 'SE', group: 1, sub: 2 },
  );
});

test('parses a list of whole-group codes', () => {
  const codes = findGroupCodes('WEEKLY QUIZ 11 - Y3.S1.WE.AI.01, Y3.S1.WE.CS.02, Y3.S1.WE.CSNE.01');
  assert.deepStrictEqual(codes.map((c) => c.specialization + c.group + ':' + c.subgroup), ['AI1:null', 'CS2:null', 'CSNE1:null']);
});

test('a different profile flips the verdicts', () => {
  const weekdayAI = { mode: 'WD', specialization: 'AI', group: 1, subgroup: 2 };
  assert.strictEqual(classify('Lab 11 Submission – Malabe – Y3.S1.WD.AI.0102', weekdayAI).relevant, true);
  assert.strictEqual(classify('Lab 11 Submission – Malabe – Y3.S1.WE.SE.0101', weekdayAI).relevant, false);
  assert.strictEqual(classify('MEM Re-Evaluation Schedule - Weekday', weekdayAI).relevant, true);
  assert.strictEqual(classify('IT3120 Presentation Schedule - Weekend', weekdayAI).relevant, false);
  assert.strictEqual(classify('lab sheet 07 submission - Kandy Uni', { campus: 'Kandy' }).relevant, true);
});

test('pro-rata toggle', () => {
  assert.strictEqual(classify('WEEKLY QUIZ 6 - Y3.S1 Prorata Students', { hideProrata: false }).relevant, true);
});

test('describes the profile', () => {
  assert.strictEqual(describeProfile(), 'Y3.S1.WE.SE.0101 (Malabe)');
});
