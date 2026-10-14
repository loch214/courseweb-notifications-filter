/*
 * Runs on every courseweb.sliit.lk page.
 *
 * Read-only: it only hides/dims things on screen and reads your notification
 * list. It never clicks, submits, marks as read or deletes anything.
 */
(() => {
  'use strict';
  const F = self.CWFilter;

  const DEFAULT_SETTINGS = {
    enabled: true,
    profile: F.DEFAULT_PROFILE,
    display: 'hide', // 'hide' or 'dim' for notifications / timeline / calendar
    dimCoursePage: true, // dim other groups' activities on module pages (never hidden)
    fixBadge: true, // bell count shows only your unread notifications
  };

  // What to filter: element selector + where the title text lives inside it.
  const TARGETS = [
    // Bell dropdown and the full notifications page share this markup.
    { kind: 'list', item: '[data-region="notification-content-item-container"]', title: '.notification-message', useFullSubject: true },
    // Dashboard "Timeline" block.
    { kind: 'list', item: '[data-region="event-list-item"]', title: '.event-name a, .event-name' },
    // "Upcoming events" block and calendar upcoming/day views.
    { kind: 'list', item: '.block_calendar_upcoming .event, [data-type="event"]', title: '.name, h3, a' },
    // Calendar month view entries.
    { kind: 'list', item: 'li[data-region="event-item"]', title: '.eventname, a' },
    // Activities on a module (course) page. Text areas ("labels") are skipped: they hold
    // long free text like module overviews, which would trip the keyword rules.
    { kind: 'course', item: 'li.activity:not(.modtype_label)', title: '.instancename, .activityname' },
  ];

  let settings = DEFAULT_SETTINGS;
  let reveal = false;
  const fullSubjects = new Map(); // notification id -> full subject (popover titles can be shortened)
  let notifList = null; // last fetched notification list
  let badge = { original: null, lastSet: null };

  // ---------- settings ----------
  function loadSettings() {
    return new Promise((resolve) => {
      try {
        chrome.storage.sync.get('settings', (data) => {
          const s = (data && data.settings) || {};
          settings = Object.assign({}, DEFAULT_SETTINGS, s, { profile: F.withDefaults(s.profile) });
          resolve();
        });
      } catch (e) {
        resolve();
      }
    });
  }

  // ---------- reading notifications (read-only web service) ----------
  function sesskey() {
    const link = document.querySelector('a[href*="sesskey="]');
    const m = link && link.getAttribute('href').match(/sesskey=(\w+)/);
    if (m) return m[1];
    const m2 = document.documentElement.innerHTML.match(/"sesskey":"(\w+)"/);
    return m2 ? m2[1] : null;
  }

  function userId() {
    const el = document.querySelector('[data-userid]');
    return el ? Number(el.getAttribute('data-userid')) : 0;
  }

  let lastFetch = 0;
  async function fetchNotifications() {
    const key = sesskey();
    const uid = userId();
    if (!key || !uid || Date.now() - lastFetch < 15000) return;
    lastFetch = Date.now();
    const all = [];
    for (let offset = 0; offset < 150; offset += 50) {
      const res = await fetch('/lib/ajax/service.php?sesskey=' + key + '&info=message_popup_get_popup_notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify([
          { index: 0, methodname: 'message_popup_get_popup_notifications', args: { useridto: uid, newestfirst: 1, limit: 50, offset } },
        ]),
      }).then((r) => r.json());
      const page = res && res[0] && res[0].data ? res[0].data.notifications : [];
      all.push(...page);
      if (page.length < 50) break;
    }
    for (const n of all) fullSubjects.set(String(n.id), n.subject);
    notifList = all;
    schedule();
  }

  // ---------- applying the filter ----------
  function titleOf(el, target) {
    if (target.useFullSubject) {
      const id = el.getAttribute('data-id');
      if (id && fullSubjects.has(id)) return fullSubjects.get(id);
    }
    // Only ever judge an item by its title. Without one there's nothing reliable to go on,
    // so return '' (classified as "common") rather than scanning all of its text.
    const t = el.querySelector(target.title);
    return t ? t.textContent : '';
  }

  function mark(el, verdict, kind) {
    const other = !verdict.relevant;
    el.classList.toggle('cwf-other', other);
    el.classList.toggle('cwf-dim', other && (kind === 'course' || settings.display === 'dim'));
    let tag = el.querySelector(':scope > .cwf-tag');
    if (other) {
      if (!tag) {
        tag = document.createElement('span');
        tag.className = 'cwf-tag';
        el.prepend(tag);
      }
      tag.textContent = 'Not yours: ' + verdict.reason;
    } else if (tag) {
      tag.remove();
    }
  }

  function clearAll() {
    document.querySelectorAll('.cwf-other').forEach((el) => el.classList.remove('cwf-other', 'cwf-dim'));
    document.querySelectorAll('.cwf-tag').forEach((el) => el.remove());
  }

  function applyFilter() {
    if (!settings.enabled) {
      clearAll();
      restoreBadge();
      updatePill(0);
      return;
    }
    let hidden = 0;
    for (const target of TARGETS) {
      if (target.kind === 'course' && !settings.dimCoursePage) continue;
      document.querySelectorAll(target.item).forEach((el) => {
        if (el.closest('.cwf-pill')) return;
        const text = titleOf(el, target);
        const key = text + '|' + JSON.stringify(settings.profile);
        if (el.dataset.cwfKey !== key) {
          el.dataset.cwfKey = key;
          mark(el, F.classify(text, settings.profile), target.kind);
        }
        if (target.kind === 'list' && el.classList.contains('cwf-other')) hidden++;
      });
    }
    document.body.classList.toggle('cwf-mode-hide', settings.display === 'hide');
    updateBadge();
    updatePill(hidden);
  }

  // ---------- bell badge: count only your unread notifications ----------
  function badgeEl() {
    return document.querySelector('#nav-notification-popover-container [data-region="count-container"]');
  }

  function updateBadge() {
    const el = badgeEl();
    if (!el || !settings.fixBadge || !notifList) return;
    const shown = el.textContent.trim();
    if (shown !== badge.lastSet) badge.original = shown; // Moodle refreshed the count itself
    const totalUnread = Number(badge.original) || 0;
    const unread = notifList.filter((n) => !n.read);
    const mine = unread.filter((n) => F.classify(n.subject, settings.profile).relevant).length;
    // Unread notifications older than what we fetched can't be classified: count them as yours.
    const count = mine + Math.max(0, totalUnread - unread.length);
    const text = count ? String(count) : '';
    if (el.textContent.trim() !== text) el.textContent = text;
    badge.lastSet = text;
    el.classList.toggle('hidden', !count);
    el.title = totalUnread - count + ' unread notification(s) for other groups not counted';
  }

  function restoreBadge() {
    const el = badgeEl();
    if (el && badge.original !== null && badge.lastSet !== null && el.textContent.trim() === badge.lastSet) {
      el.textContent = badge.original;
      el.classList.toggle('hidden', !Number(badge.original));
      badge.lastSet = null;
    }
  }

  // ---------- floating "N hidden · Show" pill ----------
  function updatePill(hidden) {
    let pill = document.querySelector('.cwf-pill');
    if (!hidden) {
      if (pill) pill.remove();
      return;
    }
    if (!pill) {
      pill = document.createElement('div');
      pill.className = 'cwf-pill';
      pill.innerHTML = '<span class="cwf-pill-text"></span><button type="button"></button>';
      pill.querySelector('button').addEventListener('click', () => {
        reveal = !reveal;
        document.body.classList.toggle('cwf-reveal', reveal);
        applyFilter();
      });
      document.body.appendChild(pill);
    }
    setText(
      pill.querySelector('.cwf-pill-text'),
      hidden + ' item' + (hidden === 1 ? '' : 's') + ' for other groups ' + (settings.display === 'hide' && !reveal ? 'hidden' : 'dimmed'),
    );
    setText(pill.querySelector('button'), reveal ? 'Hide again' : 'Show them');
  }

  function setText(el, text) {
    if (el.textContent !== text) el.textContent = text;
  }

  // True when a DOM change was made by this script (so we don't react to ourselves).
  function isOwnMutation(m) {
    const target = m.target.nodeType === 1 ? m.target : m.target.parentElement;
    if (target && target.closest('.cwf-pill, .cwf-tag')) return true;
    // Bell count: ours if it still shows what we set; otherwise Moodle refreshed it.
    const count = target && target.closest('[data-region="count-container"]');
    if (count) return count.textContent.trim() === badge.lastSet;
    const nodes = [...m.addedNodes, ...m.removedNodes];
    return nodes.length > 0 && nodes.every((n) => n.nodeType === 1 && n.matches('.cwf-pill, .cwf-tag'));
  }

  // ---------- wiring ----------
  let pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    setTimeout(() => {
      pending = false;
      applyFilter();
    }, 120);
  }

  async function start() {
    await loadSettings();
    applyFilter();
    new MutationObserver((mutations) => {
      if (mutations.every(isOwnMutation)) return;
      // New notification ids (bell opened / more loaded) -> fetch full subjects.
      const ids = [...document.querySelectorAll('[data-region="notification-content-item-container"][data-id]')].map((e) => e.getAttribute('data-id'));
      if (ids.some((id) => !fullSubjects.has(id))) fetchNotifications().catch(() => {});
      schedule();
    }).observe(document.body, { childList: true, subtree: true, characterData: true });

    try {
      chrome.storage.onChanged.addListener((changes) => {
        if (!changes.settings) return;
        loadSettings().then(() => {
          document.querySelectorAll('[data-cwf-key]').forEach((el) => delete el.dataset.cwfKey);
          applyFilter();
        });
      });
    } catch (e) {
      /* not running as an extension (e.g. injected for testing) */
    }

    if (document.querySelector('#nav-notification-popover-container')) {
      fetchNotifications().catch(() => {});
      setInterval(() => fetchNotifications().catch(() => {}), 2 * 60 * 1000);
    }
  }

  start();
})();
