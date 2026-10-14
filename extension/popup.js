(() => {
  'use strict';
  const F = self.CWFilter;
  const $ = (id) => document.getElementById(id);

  const PROFILE_FIELDS = ['campus', 'mode', 'year', 'semester', 'group', 'subgroup'];
  const PROFILE_FLAGS = ['hideProrata', 'hideRepeat', 'hideAbsent'];
  const NUMERIC = ['year', 'semester', 'group', 'subgroup'];
  const OTHER = '__other';
  const KNOWN_CODES = F.SPECIALIZATIONS.map((s) => s.code);

  let settings;

  // The dropdown is built from filter.js's list, so it always offers exactly the codes the filter understands.
  function buildSpecializationOptions() {
    const select = $('specialization');
    for (const s of F.SPECIALIZATIONS) select.add(new Option(s.code + ' – ' + s.name, s.code));
    select.add(new Option('Other…', OTHER));
  }

  function renderSpecialization(code) {
    const known = KNOWN_CODES.includes(code);
    $('specialization').value = known ? code : OTHER;
    $('specializationOther').hidden = known;
    $('specializationOther').value = known ? '' : code;
  }

  // Letters only, upper-case, so "se", " SE " and "S.E" all become "SE".
  function readSpecialization() {
    if ($('specialization').value !== OTHER) return $('specialization').value;
    const typed = $('specializationOther').value.toUpperCase().replace(/[^A-Z]/g, '');
    return typed || settings.profile.specialization;
  }

  function render() {
    const p = settings.profile;
    $('enabled').checked = settings.enabled;
    for (const f of PROFILE_FIELDS) $(f).value = p[f];
    renderSpecialization(p.specialization);
    for (const f of PROFILE_FLAGS) $(f).checked = p[f];
    document.querySelector('input[name="display"][value="' + settings.display + '"]').checked = true;
    $('dimCoursePage').checked = settings.dimCoursePage;
    $('fixBadge').checked = settings.fixBadge;
    $('summary').textContent = F.describeProfile(p);
    probe();
  }

  function readForm() {
    const p = {};
    for (const f of PROFILE_FIELDS) p[f] = NUMERIC.includes(f) ? Number($(f).value) || 1 : $(f).value.trim();
    p.specialization = readSpecialization();
    for (const f of PROFILE_FLAGS) p[f] = $(f).checked;
    return {
      enabled: $('enabled').checked,
      profile: F.withDefaults(p),
      display: document.querySelector('input[name="display"]:checked').value,
      dimCoursePage: $('dimCoursePage').checked,
      fixBadge: $('fixBadge').checked,
    };
  }

  function save() {
    settings = readForm();
    chrome.storage.sync.set({ settings }, () => {
      renderSpecialization(settings.profile.specialization);
      $('summary').textContent = F.describeProfile(settings.profile);
      $('saved').textContent = 'Saved.';
      probe();
    });
  }

  function probe() {
    const text = $('probe').value.trim();
    const out = $('verdict');
    if (!text) {
      out.textContent = '';
      out.className = '';
      return;
    }
    const r = F.classify(text, settings.profile);
    out.textContent = (r.relevant ? 'Shown: ' : 'Hidden: ') + r.reason;
    out.className = r.relevant ? 'mine' : 'other';
  }

  chrome.storage.sync.get('settings', (data) => {
    const s = (data && data.settings) || {};
    settings = Object.assign(
      { enabled: true, display: 'hide', dimCoursePage: true, fixBadge: true },
      s,
      { profile: F.withDefaults(s.profile) },
    );
    buildSpecializationOptions();
    render();
    $('specialization').addEventListener('change', (e) => {
      const other = $('specialization').value === OTHER;
      $('specializationOther').hidden = !other;
      if (other) {
        // Wait for the code to be typed; saving now would snap back to the old value.
        e.stopImmediatePropagation();
        $('specializationOther').focus();
      }
    });
    document.querySelectorAll('input:not(#probe), select').forEach((el) => el.addEventListener('change', save));
    $('probe').addEventListener('input', probe);
  });
})();
