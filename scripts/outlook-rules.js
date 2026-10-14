// Outlook inbox rules for CourseWeb emails, as data.
//
// Outlook rules can only do "subject includes <text>" (case-insensitive substring),
// so the group logic from extension/filter.js is rebuilt as an ORDERED list of
// rules where every rule has "Stop processing more rules" ticked.
//
//   node scripts/outlook-rules.js          -> checks the rules against tests/fixtures.js
//   node scripts/outlook-rules.js --print  -> prints the rules to type into Outlook
//
// The values below are for Malabe / Y3.S1 / Weekend / SE / group 01.01.
// Next semester: change Y3.S1 -> Y3.S2 (and your group) everywhere.

const { classify } = require('../extension/filter.js');
const fixtures = require('../tests/fixtures.js');

const SENDER = 'coursewebalerts@sliit.lk';
const MINE = 'keep (tag "CourseWeb - mine")';
const MOVE = 'move to "CourseWeb - not mine" + mark as read';

const RULES = [
  { name: 'CW1 mine - my sub-group', includes: ['Y3.S1.WE.SE.0101', 'WE.SE.1.01'], action: MINE },
  // Other sub-groups of my group (0102, 0103 ... 0119). 0101 was already caught above.
  { name: 'CW2 other sub-groups of my group', includes: ['Y3.S1.WE.SE.010', 'Y3.S1.WE.SE.011'], action: MOVE },
  // Whole-group items such as weekly quizzes ("Y3.S1.WE.IT.03, Y3.S1.WE.SE.01").
  { name: 'CW3 mine - my whole group', includes: ['Y3.S1.WE.SE.01'], action: MINE },
  // Any group code still left belongs to someone else.
  { name: 'CW4 other groups', includes: ['Y1.S', 'Y2.S', 'Y3.S', 'Y4.S', '.WE.', '.WD.', 'WE.SE.', 'WD.'], action: MOVE },
  {
    name: 'CW5 other campuses',
    includes: ['Kandy', 'Northern', 'Matara', 'Kurunegala', 'Jaffna'],
    except: ['Malabe'],
    action: MOVE,
  },
  { name: 'CW6 weekday batch', includes: ['Weekday', 'Week day', '- WD)', '(WD)'], except: ['Weekend'], action: MOVE },
  {
    name: 'CW7 pro-rata, repeat, absent, other faculties/years',
    includes: [
      'Prorata', 'Pro rata', 'Pro-rata', 'Repeat', 'Absent',
      'FHS', 'Nursing', 'PG:', 'PG :', 'Postgraduate', 'Master of',
      'Y1S1', 'Y1S2', 'Y2S1', 'Y2S2', 'Y3S2', 'Y4S1', 'Y4S2',
      'Year 1 Semester', 'Year 2 Semester', 'Year 4 Semester', 'Year 3 Semester 2',
    ],
    action: MOVE,
  },
];

function outlookDecision(subject) {
  const s = subject.toLowerCase();
  const has = (list) => (list || []).some((w) => s.includes(w.toLowerCase()));
  for (const rule of RULES) {
    if (has(rule.includes) && !has(rule.except)) return { keep: rule.action === MINE, rule: rule.name };
  }
  return { keep: true, rule: '(no rule: stays in inbox)' };
}

// The same titles arrive as email subjects with these prefixes.
const PREFIXES = ['', 'Overdue: ', 'Due on Tuesday, 13 October 2026, 12:00 AM: ', 'Opens on Saturday, 10 October 2026, 4:30 PM: '];

if (process.argv.includes('--print')) {
  console.log('All rules: From = ' + SENDER + ', "Stop processing more rules" ticked, in this exact order.\n');
  RULES.forEach((r, i) => {
    console.log(i + 1 + '. ' + r.name);
    console.log('   Subject includes: ' + r.includes.join(' | '));
    if (r.except) console.log('   Except if subject includes: ' + r.except.join(' | '));
    console.log('   Action: ' + r.action + '\n');
  });
} else {
  let failures = 0;
  let checked = 0;
  for (const [title] of fixtures) {
    // "We have updated..." is a filter.js regex edge case, not a CourseWeb email subject.
    if (/^We have/.test(title)) continue;
    for (const prefix of PREFIXES) {
      const subject = prefix + title;
      const want = classify(subject).relevant;
      const got = outlookDecision(subject);
      checked++;
      if (got.keep !== want) {
        failures++;
        console.log('MISMATCH  filter=' + (want ? 'keep' : 'move') + '  outlook=' + (got.keep ? 'keep' : 'move') + ' [' + got.rule + ']  ' + subject);
      }
    }
  }
  console.log(checked + ' subjects checked, ' + failures + ' mismatch(es) between Outlook rules and the extension filter');
  process.exitCode = failures ? 1 : 0;
}

module.exports = { RULES, outlookDecision, SENDER };
