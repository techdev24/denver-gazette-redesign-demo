/* Denver Gazette — Concept v5 · "Things To Do in Denver" page loader.
 *
 * Two independent blocks on this page:
 *   1. EVENTS  → our dg-events worker (Ticketmaster etc). Filterable by category
 *                chips, capped at 2 rows with a "More" button that reveals more.
 *   2. STORIES → the Denver Gazette editorial "things-to-do" RSS feed, pulled
 *                through our dg-feeds proxy and rendered in the SAME card style
 *                (thumb · category · headline · date) for a uniform look.
 */
(function () {
  'use strict';

  var EVENTS_API   = 'https://dg-events.techdev-d61.workers.dev/';
  var FEED_PROXY   = 'https://dg-feeds.techdev-d61.workers.dev/?url=';
  var STORIES_FEED = 'https://www.denvergazette.com/category/things-to-do/feed/';
  var PAGE = 8;                 // 2 rows of 4 on desktop
  var STORIES_MAX = 8;          // editorial cards to show

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
  var STORY_COLOR = '#0B6B53';  // editorial tag color (distinct from event types)

  var ALL = [];                 // all events from the worker
  var activeFilter = null;
  var shown = PAGE;             // how many events currently revealed

  // shared helpers
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
  function timeLabel(d) { return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }

  // EVENTS block
  function eventCard(ev) {
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
    var moreBtn = document.getElementById('ttd-more');
    if (!grid) return;
    var list = ALL.filter(function (e) { return passes(e, activeFilter); });

    var count = document.getElementById('ttd-count');
    if (count) count.textContent = list.length + ' event' + (list.length === 1 ? '' : 's') + ' this week';

    if (!list.length) {
      grid.innerHTML = '<div class="ttd-empty">No events in this category in the next 7 days. Try \u201CAll.\u201D</div>';
      if (moreBtn) moreBtn.hidden = true;
      return;
    }
    grid.innerHTML = list.slice(0, shown).map(eventCard).join('');
    if (moreBtn) {
      var remaining = list.length - shown;
      moreBtn.hidden = remaining <= 0;
      moreBtn.textContent = 'More events' + (remaining > 0 ? ' (' + remaining + ')' : '') + '  \u2193';
    }
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
      shown = PAGE;                 // reset to 2 rows on every filter change
      renderGrid();
    });
  }

  function wireMore() {
    var moreBtn = document.getElementById('ttd-more');
    if (!moreBtn) return;
    moreBtn.addEventListener('click', function () { shown += PAGE; renderGrid(); });
  }

  function loadEvents() {
    var grid = document.getElementById('ttd-grid');
    if (grid) grid.innerHTML = '<div class="ttd-empty">Loading this week\u2019s events…</div>';
    fetch(EVENTS_API, { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (json) {
        ALL = (json && json.events) || [];
        console.log('[things-to-do] ' + ALL.length + ' events loaded');
        renderGrid();
      })
      .catch(function (e) {
        console.warn('[things-to-do] events →', e.message);
        if (grid) grid.innerHTML = '<div class="ttd-empty">Couldn\u2019t load events right now. Please check back shortly.</div>';
      });
  }

  // STORIES block (editorial RSS)
  function decode(s) { var t = document.createElement('textarea'); t.innerHTML = s || ''; return t.value; }
  function stripTags(s) { var d = document.createElement('div'); d.innerHTML = s || ''; return (d.textContent || '').trim(); }
  function xtag(item, name) { var els = item.getElementsByTagName(name); return els && els.length ? els[0] : null; }
  function xtext(item, name) { var el = xtag(item, name); return el ? (el.textContent || '') : ''; }

  function imageOf(item) {
    var mc = xtag(item, 'media:content') || xtag(item, 'content');
    if (mc && mc.getAttribute && mc.getAttribute('url')) return mc.getAttribute('url');
    var mt = xtag(item, 'media:thumbnail') || xtag(item, 'thumbnail');
    if (mt && mt.getAttribute && mt.getAttribute('url')) return mt.getAttribute('url');
    var enc = xtag(item, 'enclosure');
    if (enc && /image/i.test(enc.getAttribute('type') || '')) return enc.getAttribute('url');
    var body = xtext(item, 'content:encoded') || xtext(item, 'encoded') || xtext(item, 'description') || '';
    var mm = body.match(/<img[^>]+src=["']([^"']+)["']/i);
    return mm ? mm[1] : '';
  }
  function categoryOf(item, fallback) {
    var c = xtag(item, 'category');
    var t = c ? stripTags(decode(c.textContent)) : '';
    return t || fallback || '';
  }
  function dateLabel(pub) {
    if (!pub) return '';
    var d = new Date(pub); if (isNaN(d)) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function parseFeed(xml, max) {
    var end = xml.indexOf('</rss>');            // proxy occasionally doubles the body
    if (end !== -1) xml = xml.slice(0, end + 6);
    var doc = new DOMParser().parseFromString(xml, 'text/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('malformed-xml');
    var items = Array.prototype.slice.call(doc.getElementsByTagName('item')).slice(0, max);
    if (!items.length) throw new Error('no-items');
    return items.map(function (it) {
      return {
        title: stripTags(decode(xtext(it, 'title'))),
        url: (xtext(it, 'link') || '').trim(),
        img: imageOf(it),
        cat: categoryOf(it, 'Things To Do'),
        date: dateLabel(xtext(it, 'pubDate'))
      };
    });
  }

  function storyCard(a) {
    return '<a class="ttd-card" href="' + esc(a.url) + '" target="_blank" rel="noopener">' +
      '<div class="ttd-thumb">' +
        (a.img ? '<img src="' + esc(a.img) + '" alt="" loading="lazy" decoding="async" onerror="this.parentElement.classList.add(\'ttd-thumb--empty\');this.remove()">' : '') +
        '<span class="ttd-type" style="--tc:' + STORY_COLOR + '">' + esc(a.cat) + '</span>' +
      '</div>' +
      '<div class="ttd-body">' +
        (a.date ? '<div class="ttd-when">' + esc(a.date) + '</div>' : '') +
        '<h3 class="ttd-name">' + esc(a.title) + '</h3>' +
      '</div></a>';
  }

  function loadStories() {
    var host = document.getElementById('ttd-editorial');
    var section = document.getElementById('ttd-stories');
    if (!host) return;
    host.innerHTML = '<div class="ttd-empty">Loading stories…</div>';
    fetch(FEED_PROXY + encodeURIComponent(STORIES_FEED), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.text(); })
      .then(function (xml) {
        var stories = parseFeed(xml, STORIES_MAX);
        console.log('[things-to-do] ' + stories.length + ' stories loaded');
        host.innerHTML = stories.map(storyCard).join('');
      })
      .catch(function (e) {
        console.warn('[things-to-do] stories →', e.message);
        if (section) section.hidden = true;   // hide block if feed unavailable
      });
  }

  function init() {
    renderChips();
    wireMore();
    loadEvents();
    loadStories();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
