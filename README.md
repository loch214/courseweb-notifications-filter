# CourseWeb Notifications Filter (SLIIT)

Shows you only the CourseWeb stuff meant for **your** group, both on the website and in email.

Set up for: **Malabe · Year 3 Sem 1 · Weekend · SE · group 01.01** (`Y3.S1.WE.SE.0101`).

## What counts as "yours"

| Kind of item | Example | Result |
| --- | --- | --- |
| Your sub-group | `Lab 11 Submission – Malabe – Y3.S1.WE.SE.0101` | shown |
| Your whole group | `WEEKLY QUIZ 11 - Y3.S1.WE.IT.03, Y3.S1.WE.SE.01` | shown |
| Common to everyone (no group named) | `Assignment 1 - Submission`, `Lab Sheet 5 Submission - Malabe`, faculty notices | shown |
| Other sub-group / group / specialisation | `…Y3.S1.WE.SE.0102`, `…WE.AI.0101`, `…WD.SE.0101` | hidden |
| Other campus | `Lab 11 Submission – Kandy UNI`, `NorthernUni - …` | hidden |
| Weekday batch | `Presentation Schedule - Weekday`, `Lab 3 Submission (Monday - WD)` | hidden |
| Pro-rata / repeat / absent | `WEEKLY QUIZ 6 - Y3.S1 Prorata Students`, `…Hackathon Submission - Absent` | hidden |
| Other faculty / year | `FHS HND Nursing … Y1S2`, `PG: Master of Education …` | hidden |

When in doubt (no group, campus or audience mentioned), the item is **kept**.

## Part 1: Chrome extension (CourseWeb website)

It filters the **bell dropdown**, the **notifications page**, the dashboard **Timeline**, the **calendar**, and
it greys out (never hides) other groups' activities on **module pages**. The bell number only counts *your* unread
notifications. A small pill in the bottom-left says how many items were hidden, with a **Show them** button.

It only changes what you see on screen. It never clicks, submits, marks as read or deletes anything on CourseWeb.

### Install (about 1 minute)

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (top-right switch).
3. Click **Load unpacked** and choose the `extension` folder in this project.
4. Pin it (puzzle-piece icon → pin) if you want quick access to its settings.
5. Open or refresh CourseWeb.

Click the extension icon to change your group, switch between *hide* and *grey out*, or paste any title into
**Try a title** to see whether it would be shown.

**Next semester:** just change Year/Semester/Group in the popup.

## Part 2: Email (Outlook)

CourseWeb emails come from `coursewebalerts@sliit.lk` and land in your **Outlook / Microsoft 365** mailbox
(`<student-id>@my.sliit.lk` at outlook.office.com), **not** in the Gmail of the same address. That's why they seem to
"disappear" when you open Gmail.

Outlook rules run on Microsoft's servers, so they work even when your laptop is off. Outlook rules can only check
"subject contains some text", so the logic is split into 7 rules that must stay **in this order**, each with
**Stop processing more rules** ticked. Print them any time with `npm run rules`:

| # | Name | From | Subject includes (any of) | Except if subject includes | Action |
| - | --- | --- | --- | --- | --- |
| 1 | CW1 mine - my sub-group | coursewebalerts@sliit.lk | `Y3.S1.WE.SE.0101` `WE.SE.1.01` | | Categorize "CourseWeb - mine" |
| 2 | CW2 other sub-groups of my group | coursewebalerts@sliit.lk | `Y3.S1.WE.SE.010` `Y3.S1.WE.SE.011` | | Move to "CourseWeb - not mine", mark as read |
| 3 | CW3 mine - my whole group | coursewebalerts@sliit.lk | `Y3.S1.WE.SE.01` | | Categorize "CourseWeb - mine" |
| 4 | CW4 other groups | coursewebalerts@sliit.lk | `Y1.S` `Y2.S` `Y3.S` `Y4.S` `.WE.` `.WD.` `WE.SE.` `WD.` | | Move + mark as read |
| 5 | CW5 other campuses | coursewebalerts@sliit.lk | `Kandy` `Northern` `Matara` `Kurunegala` `Jaffna` | `Malabe` | Move + mark as read |
| 6 | CW6 weekday batch | coursewebalerts@sliit.lk | `Weekday` `Week day` `- WD)` `(WD)` | `Weekend` | Move + mark as read |
| 7 | CW7 pro-rata, repeat, absent, other faculties/years | coursewebalerts@sliit.lk | `Prorata` `Pro rata` `Pro-rata` `Repeat` `Absent` `FHS` `Nursing` `PG:` `PG :` `Postgraduate` `Master of` `Y1S1` `Y1S2` `Y2S1` `Y2S2` `Y3S2` `Y4S1` `Y4S2` `Year 1 Semester` `Year 2 Semester` `Year 4 Semester` `Year 3 Semester 2` | | Move + mark as read |

Why the odd order: Outlook matches plain text, so `Y3.S1.WE.SE.01` would also match `…SE.0102`. Rule 1 keeps your
sub-group first, rule 2 moves the other sub-groups, rule 3 keeps whole-group items, and rule 4 then moves every
other group code that's left.

Dry run on the 322 most recent CourseWeb emails in the mailbox (2026-10-14): **225 would be moved, 97 kept**.

Nothing is deleted: moved emails go to a "CourseWeb - not mine" folder, so you can always check them.

## Checking the logic

```
npm test
```

* `tests/filter.test.js`: 73 checks against real CourseWeb titles (`tests/fixtures.js`).
* `scripts/outlook-rules.js`: confirms the Outlook rules give the same answer as the extension for every test title
  (with "Overdue:", "Due on …:" and "Opens on …:" prefixes).

## Files

```
extension/        Chrome extension (load this folder)
  filter.js       the "is this mine?" logic, shared by everything
  content.js/css  runs on courseweb.sliit.lk
  popup.*         settings popup
tests/            real titles + expected answers
scripts/          Outlook rules (as data) + checker
```
