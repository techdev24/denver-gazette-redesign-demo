/* Denver Gazette — Concept v5 · "Things To Do in Denver" page loader.
 *
 * The SEO + destination page for the homepage events widget ("Full calendar →")
 * and the main-nav "Things To Do" item. Pulls live from OUR own dg-events
 * worker (same endpoint the homepage widget uses), then renders a filterable
 * grid grouped under category chips. Light, fast, no third-party branding.
 */
(function () {
  'use strict';

  var EVENTS_API = 'https://dg-events.techdev-d61.workers.dev/';

  // chip label → matches against event type/genre (lowercased substring)
  var FILTERS = [
    { label: 'All',          keys: null },
    { label: 'Music',        keys: ['music', 'concert'] },
    { label: 'Sports',       keys: ['sport'] },
    { label: 'Arts & Stage', keys: ['arts', 'theatre', 'theater', 'dance'] },
    { label: 'Comedy',       keys: ['comedy'] },
    { label: 'Family',       keys: ['family', 'fair', 'festival'] }
  ];
  var TYPE_COLOR = {
    music: '#AA1E23', concert: '#AA1E23', 'arts & theatre': '#691464',
    arts: '#691464', theatre: '#691464', theater: '#691464', comedy: '#C8102E',
    film: '#691464', sports: '#1F4E79', sport: '#1F4E79', family: '#FA9632',
    festival: '#E37B40', fair: '#E37B40', dance: '#691464', event: '#0B0B0F'
  };

  var ALL = [];          // all events from the worker
  var activeFilter = null;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function lc(s) { return String(s || '').toLowerCase(); }
  function typeColor(t) { return TYPE_COLOR[lc(t)] || '#0B0B0F'; }
  function startOfDay(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

  function dayLabel(d) {
    var t = startOfDay(new Date()), x = startOfDay(d);
    var diff = Math.round((x - t) / 86400000);
    if (diff <= 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return x.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }
  function timeLabel(d) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  function card(ev) {
    var d = new Date(ev.start);
    var type = ev.type || 'Event';
    return '<a class="ttd-card" href="' + esc(ev.url) + '" target="_blank" rel="noopener">' +
      '<div class="ttd-thumb">' +
        (ev.img ? '<img src="' + esc(ev.img) + '" alt="" loading="lazy" decoding="async" onerror="this.parentElement.classList.add(\'ttd-thumb--empty\');this.remove()">' : '') +
        '<span class="ttd-type" style="--tc:' + typeColor(type) + '">' + esc(type) + '</span>' +
      '</div>' +
      '<div class="ttd-body">' +
        '<div class="ttd-when">' + esc(dayLabel(d)) + (isNaN(d) ? '' : ' · ' + esc(timeLabel(d))) + '</div>' +
        '<h3 class="ttd-name">' + esc(ev.title) + '</h3>' +
        (ev.venue ? '<div class="ttd-venue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>' + esc(ev.venue) + '</div>' : '') +
      '</div></a>';
  }

  function passes(ev, filter) {
    if (!filter || !filter.keys) return true;
    var hay = lc((ev.type || '') + ' ' + (ev.genre || ''));
    return filter.keys.some(function (k) { return hay.indexOf(k) !== -1; });
  }

  function renderGrid() {
    var grid = document.getElementById('ttd-grid');
    if (!grid) return;
    var list = ALL.filter(function (e) { return passes(e, activeFilter); });
    if (!list.length) {
      grid.innerHTML = '<div class="ttd-empty">No events in this category in the next 7 days. Try “All.”</div>';
      return;
    }
    grid.innerHTML = list.map(card).join('');
    var count = document.getElementById('ttd-count');
    if (count) count.textContent = list.length + ' event' + (list.length === 1 ? '' : 's') + ' this week';
  }

  function renderChips() {
    var wrap = document.getElementById('ttd-filters');
    if (!wrap) return;
    wrap.innerHTML = FILTERS.map(function (f, i) {
      return '<button class="ttd-chip' + (i === 0 ? ' is-active' : '') + '" data-i="' + i + '">' + esc(f.label) + '</button>';
    }).join('');
    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.ttd-chip'); if (!btn) return;
      wrap.querySelectorAll('.ttd-chip').forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      activeFilter = FILTERS[+btn.getAttribute('data-i')];
      renderGrid();
    });
  }

  function init() {
    renderChips();
    var grid = document.getElementById('ttd-grid');
    if (grid) grid.innerHTML = '<div class="ttd-empty">Loading this week’s events…</div>';
    fetch(EVENTS_API, { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (json) {
        ALL = (json && json.events) || [];
        console.log('[things-to-do] ' + ALL.length + ' events loaded');
        renderGrid();
      })
      .catch(function (e) {
        console.warn('[things-to-do] →', e.message);
        if (grid) grid.innerHTML = '<div class="ttd-empty">Couldn\u2019t load events right now. Please check back shortly.</div>';
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
