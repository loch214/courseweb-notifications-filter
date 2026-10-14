// Real CourseWeb titles collected on 2026-10-14 (notifications + activity names),
// with the verdict expected for Malabe / Y3.S1 / Weekend / SE / group 01.01.
// true = show (mine or common), false = hide (someone else's).
module.exports = [
  // --- Lab submissions, one per sub-group ---
  ['Overdue: Lab 11 Submission – Malabe – Y3.S1.WE.SE.0101', true],
  ['You have submitted your assignment submission for Lab 11 Submission – Malabe – Y3.S1.WE.SE.0101', true],
  ['Due on Tuesday, 13 October 2026, 12:00 AM: Lab 11 Submission – Malabe – Y3.S1.WE.SE.0101', true],
  ['Lab 10 Submission – Malabe – Y3.S1.WE.SE.0101', true],
  ['Y3.S1.WE.SE.0101 - Lab 4 Submission', true],
  ['Overdue: Lab 11 Submission – Malabe – Y3.S1.WE.SE.0102', false],
  ['Overdue: Lab 11 Submission – Malabe – Y3.S1.WE.SE.0201', false],
  ['Overdue: Lab 11 Submission – Malabe – Y3.S1.WE.AI.0201', false],
  ['Overdue: Lab 11 Submission – Malabe – Y3.S1.WE.AI.0102', false],
  ['Overdue: Lab 11 Submission – Malabe – Y3.S1.WE.AI.0101', false],
  ['Overdue: Lab 11 Submission – Malabe – Y3.S1.WD.AI.0101', false],
  ['Overdue: Lab 11 Submission – Malabe – Y3.S1.WD.SE.0101', false],
  ['Overdue: Lab 11 Submission – Malabe – Y3.S1.WD.SE.0102', false],
  ['Due on Tuesday, 13 October 2026, 12:00 AM: Lab 11 Submission – Northern UNI', false],
  ['Due on Tuesday, 13 October 2026, 12:00 AM: Lab 11 Submission – Kandy UNI', false],
  ['Y3.S1.WE.SE.0102 - Lab 4 Submission', false],
  ['Y3.S1.WD.SE.0101 - Lab 4 Submission', false],
  ['Y3.S1.WE.SE.0201 - Lab 4 Submission', false],
  ['Northern Uni - Lab 4 Submission', false],
  ['Kandy Uni - Lab 4 Submission', false],
  ['Lab 3 Submission (Monday - WD)', false],

  // --- Campus-only labs (all Malabe students share them) ---
  ['Lab Sheet 5 Submission - Malabe', true],
  ['lab sheet 07 submission - Malabe', true],
  ['lab sheet 07 submission - Kandy Uni', false],
  ['lab sheet 07 submission - Northern Uni', false],
  ['lab 3 Submission - Kandy', false],
  ['Lab Submission Malabe', true],
  ['Self guided course submission - Malabe', true],
  ['self guided course submission - Kandy Uni', false],
  ['Malabe - SE3100 - ABD Assignment Submission', true],
  ['Overdue: KandyUni - SE3100 - ABD Assignment Submission', false],
  ['Overdue: NorthernUni - SE3100 - ABD Assignment Submission', false],

  // --- Weekly quizzes listing several groups ---
  ['Opens on Saturday, 10 October 2026, 4:30 PM: WEEKLY QUIZ 11 -  Y3.S1.WE.IT.03, Y3.S1.WE.SE.01', true],
  ['WEEKLY QUIZ 9 - Y3.S1.WE.IT.03, Y3.S1.WE.SE.01', true],
  ['WEEKLY QUIZ 11 - Y3.S1.WE.DS.01, Y3.S1.WE.AI.02, Y3.S1.WE.SE.02, Y3.S1.WE.DS.02', false],
  ['WEEKLY QUIZ 11 - Y3.S1.WE.AI.01, Y3.S1.WE.CS.02, Y3.S1.WE.CSNE.01', false],
  ['WEEKLY QUIZ 11 - Y3.S1.WE.CS.01', false],
  ['WEEKLY QUIZ 11 - Y3.S1.WE.IT.01, Y3.S1.WE.IT.02, Prorata', false],
  ['WEEKLY QUIZ 11 - Y3.S1.WD.CS.01, Y3.S1.WD.CS.02', false],
  ['WEEKLY QUIZ 6 - Y3.S1.WD.DS.01, Y3.S1.WD.DS.02, Y3.S1.WD.AI.01, Y3.S1.WD.SE.01 (Reattempt)', false],
  ['WEEKLY QUIZ 11 - Kandy Uni', false],
  ['WEEKLY QUIZ 11 - Northern Uni', false],
  ['WEEKLY QUIZ 9 - Kandy Uni (Reattempt)', false],
  ['WEEKLY QUIZ 6 - Y3.S1 Prorata Students', false],

  // --- Pro-rata / repeat / absent ---
  ['Mid-Term Results_June Prorata', false],
  ['Prorata - SE3100 - Mid-Semester-Exam-Results', false],
  ['Prorata Grouping and Case Study Allocation', false],
  ['Overdue: SE3090-Assignment 2 - Mini Hackathon Submission -  Absent', false],

  // --- Weekday vs weekend resources ---
  ['IT3120 - Grouping- Weekend and Case Study Allocation', true],
  ['IT3120 Presentation Schedule - Weekend', true],
  ['IT3120 - Grouping- Weekday and Case Study Allocation', false],
  ['MEM Re-Evaluation Schedule - Weekday', false],

  // --- Site-wide announcements ---
  ['CourseWeb: General : Importance of Declaring Your Medical History', true],
  ['CourseWeb: General : Student Saftey and Security Notice from CSSU- Malabe Campus', true],
  ['CourseWeb: General : Register for US BUS with Mobile American Space US Embassy 13th 14th Oct @ SLIIT', true],
  ['CourseWeb: UG: FHS HND Nursing (ALTHIA) Y1S2 2026 Jul-Dec Semester Registration Notice', false],
  ['CourseWeb: UG : FOC Y1S1 Module (Prorata/ Repeat) Registrations 2026 Jul-Dec', false],
  ['CourseWeb: PG: Master of Education (MEd) SLQF 9 10 Year 1 Semester 2 Registration : 2026 July- Dec', false],

  // --- Common, no group at all: always keep ---
  ['Assignment Submission', true],
  ['Assignment 1 - Submission', true],
  ['You have assignments due in 7 days', true],
  ['SE3100 - Architecture based Development [2026/JUL] content change', true],
  ['Due on Wednesday, 14 October 2026, 12:00 PM: SE3090-Assignment 2 - Mini Hackathon Submission', true],
  ['We have updated the lecture slides', true], // "We" must not be read as a weekend group code

  // --- Other naming styles the regex should cope with ---
  ['Lab 12 - WE.SE.1.01', true],
  ['Lab 12 - WE.SE.1.02', false],
  ['Lab 12 - Y3.S1.WE.SE.01 only', true],
  ['Lab 12 - Y2.S1.WE.SE.0101', false],
];
