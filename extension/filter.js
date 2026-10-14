/*
 * CourseWeb relevance filter.
 *
 * Decides whether a CourseWeb title (notification subject, email subject,
 * timeline entry, activity name) is meant for *you*, based on your profile.
 *
 * Works in the browser (exposes `CWFilter` on the global object) and in Node
 * (module.exports) so the same logic can be unit-tested.
 */
(function (root) {
  'use strict';

  const DEFAULT_PROFILE = {
    campus: 'Malabe',
    year: 3,
    semester: 1,
    mode: 'WE', // WE = weekend batch, WD = weekday batch
    specialization: 'SE',
    group: 1, // the "01" in WE.SE.01 / WE.SE.0101
    subgroup: 1, // the second "01" in WE.SE.0101
    hideProrata: true,
    hideRepeat: true,
    hideAbsent: true,
  };

  // Specialisation codes as they appear in CourseWeb group codes (e.g. Y3.S1.WE.SE.0101).
  // Collected from real CourseWeb module pages and notifications (Oct 2026).
  const SPECIALIZATIONS = [
    { code: 'IT', name: 'Information Technology' },
    { code: 'SE', name: 'Software Engineering' },
    { code: 'AI', name: 'Artificial Intelligence' },
    { code: 'DS', name: 'Data Science' },
    { code: 'CS', name: 'Cyber Security' },
    { code: 'CSNE', name: 'Computer Systems & Network Engineering' },
    { code: 'ISE', name: 'Information Systems Engineering' },
    { code: 'IM', name: 'Interactive Media' },
  ];

  // SLIIT campuses other than the one in the profile are treated as "not mine".
  const CAMPUSES = ['Malabe', 'Kandy', 'Northern', 'Matara', 'Kurunegala', 'Jaffna', 'Metro'];

  // Faculties / programmes a Faculty of Computing undergrad never needs.
  const OTHER_AUDIENCE = [
    /\bFHS\b/, // Faculty of Humanities & Sciences
    /\bFOB\b/,
    /\bFOE\b/,
    /\bFOH\b/,
    /\bFGS\b/,
    /\bnursing\b/i,
    /\bPG\s*:/, // "CourseWeb: PG: ..." postgraduate announcements
    /\bpostgraduate\b/i,
    /\bmaster of\b/i,
    /\b(MBA|MSc|MEd)\b/,
    /\bfaculty of (business|engineering|humanities|graduate studies)\b/i,
    /\bschool of architecture\b/i,
  ];

  // Group codes such as:
  //   Y3.S1.WE.SE.0101   (year 3, sem 1, weekend, SE, group 01, sub-group 01)
  //   Y3.S1.WE.SE.01     (whole group 01)
  //   WE.SE.1.01         (no year/semester prefix, dotted sub-group)
  // Case-sensitive on purpose so ordinary words like "we" never match.
  const GROUP_CODE =
    /(?:\bY\s?(\d)\s?\.?\s?S\s?(\d)\s?\.\s?)?\b(WE|WD)\s?\.\s?([A-Z]{2,5})\s?\.\s?(\d{1,2})(?:\.(\d{2})|(\d{2}))?(?!\d)/g;

  // "Y1S1", "Y3.S1", "Y2 S2", "Year 1 Semester 2", "Year 1, Semester 2"
  const YEAR_SEM = [/\bY\s?([1-4])\s?\.?\s?S\s?([12])\b/gi, /\bYear\s*([1-4])\s*,?\s*Sem(?:ester)?\s*([12])\b/gi];

  function withDefaults(profile) {
    const p = Object.assign({}, DEFAULT_PROFILE, profile || {});
    // Group codes are upper-case ("SE"), so " se " must still match.
    p.specialization = String(p.specialization || '').trim().toUpperCase();
    p.mode = String(p.mode || '').trim().toUpperCase();
    return p;
  }

  function findGroupCodes(text) {
    const codes = [];
    GROUP_CODE.lastIndex = 0;
    let m;
    while ((m = GROUP_CODE.exec(text))) {
      codes.push({
        raw: m[0].trim(),
        year: m[1] ? Number(m[1]) : null,
        semester: m[2] ? Number(m[2]) : null,
        mode: m[3],
        specialization: m[4],
        group: Number(m[5]),
        subgroup: m[6] || m[7] ? Number(m[6] || m[7]) : null,
      });
    }
    return codes;
  }

  function codeIsMine(code, p) {
    if (code.year !== null && code.year !== Number(p.year)) return false;
    if (code.semester !== null && code.semester !== Number(p.semester)) return false;
    if (code.mode !== p.mode) return false;
    if (code.specialization !== p.specialization) return false;
    if (code.group !== Number(p.group)) return false;
    // A code without a sub-group (e.g. WE.SE.01) covers every sub-group in it.
    if (code.subgroup !== null && code.subgroup !== Number(p.subgroup)) return false;
    return true;
  }

  function findYearSems(text) {
    const found = [];
    for (const re of YEAR_SEM) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text))) found.push({ year: Number(m[1]), semester: Number(m[2]) });
    }
    return found;
  }

  function mentionsCampus(text, campus) {
    // No trailing \b so "KandyUni" / "NorthernUni" still match.
    return new RegExp('\\b' + campus, 'i').test(text);
  }

  /**
   * @returns {{relevant: boolean, reason: string}}
   */
  function classify(text, profile) {
    const p = withDefaults(profile);
    const t = String(text || '').replace(/\s+/g, ' ');

    // 1. Explicit group codes decide everything when present.
    const codes = findGroupCodes(t);
    if (codes.length) {
      return codes.some((c) => codeIsMine(c, p))
        ? { relevant: true, reason: 'your group' }
        : { relevant: false, reason: 'other group (' + codes.map((c) => c.raw).join(', ') + ')' };
    }

    // 2. Special audiences you never belong to.
    if (p.hideProrata && /\bpro\s*-?\s*rata\b/i.test(t)) return { relevant: false, reason: 'pro-rata students' };
    if (p.hideRepeat && /\brepeat(ers?|ing)?\b/i.test(t)) return { relevant: false, reason: 'repeat students' };
    if (p.hideAbsent && /\babsent(ees)?\b/i.test(t)) return { relevant: false, reason: 'absentees only' };

    // 3. Weekday vs weekend batch.
    const weekend = /\bweek\s?end\b/i.test(t) || /\bWE\b/.test(t);
    const weekday = /\bweek\s?day\b/i.test(t) || /\bWD\b/.test(t);
    if (p.mode === 'WE' && weekday && !weekend) return { relevant: false, reason: 'weekday batch' };
    if (p.mode === 'WD' && weekend && !weekday) return { relevant: false, reason: 'weekend batch' };

    // 4. Other campuses (only when your campus isn't also mentioned).
    if (!mentionsCampus(t, p.campus)) {
      const other = CAMPUSES.find((c) => c.toLowerCase() !== String(p.campus).toLowerCase() && mentionsCampus(t, c));
      if (other) return { relevant: false, reason: other + ' campus' };
    }

    // 5. Announcements for another year / semester.
    const ys = findYearSems(t);
    if (ys.length && !ys.some((y) => y.year === Number(p.year) && y.semester === Number(p.semester))) {
      return { relevant: false, reason: 'other year/semester (Y' + ys[0].year + 'S' + ys[0].semester + ')' };
    }

    // 6. Other faculties / postgraduate programmes.
    if (OTHER_AUDIENCE.some((re) => re.test(t))) return { relevant: false, reason: 'other faculty/programme' };

    // 7. Nothing says it's for someone else: it's common to everyone, keep it.
    return { relevant: true, reason: 'common to everyone' };
  }

  function describeProfile(profile) {
    const p = withDefaults(profile);
    const pad = (n) => String(n).padStart(2, '0');
    return 'Y' + p.year + '.S' + p.semester + '.' + p.mode + '.' + p.specialization + '.' + pad(p.group) + pad(p.subgroup) + ' (' + p.campus + ')';
  }

  const api = { DEFAULT_PROFILE, SPECIALIZATIONS, classify, findGroupCodes, describeProfile, withDefaults };
  root.CWFilter = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis);
