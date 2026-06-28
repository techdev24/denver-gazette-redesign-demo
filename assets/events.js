/* Denver Gazette — Concept v5 · "Plan your week" events loader.
 *
 * Source: OUR OWN events endpoint (the dg-events Cloudflare Worker), which
 * aggregates Ticketmaster / SeatGeek / venue JSON-LD, applies the 7-day window
 * and the entertainment category allow-list server-side, and returns clean,
 * already-filtered JSON: { events: [ {title,url,img,venue,start,end,type} ] }.
 *
 * No VISIT DENVER. No API keys in the browser — they live in the Worker.
 * Fail-safe: if the endpoint errors, the widget keeps its baked events.
 *
 * SETUP: after deploying events-worker.js as "dg-events", put its URL below.
 */
(function () {
  'use strict';

  // TODO: paste your deployed dg-events Worker URL.
  var EVENTS_API = 'https://dg-events.techdev-d61.workers.dev/';

  var HERO_COUNT = 3;   // featured row
  var REST_COUNT = 4;   // "Looking ahead" row

  // category → chip color (matches the baked .ev-type swatches)
  var TYPE_COLOR = {
    music: '#AA1E23', concert: '#AA1E23', 'live music': '#AA1E23',
    'arts & theatre': '#691464', arts: '#691464', theatre: '#691464', theater: '#691464',
    comedy: '#C8102E', film: '#691464',
    sports: '#1F4E79', sport: '#1F4E79',
    family: '#FA9632', festival: '#E37B40', fair: '#E37B40',
    food: '#3CC37D', dance: '#691464', event: '#0B0B0F'
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function startOfDay(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function typeColor(t) { return TYPE_COLOR[String(t || '').toLowerCase()] || '#0B0B0F'; }

  function dateLabel(start) {
    var d = startOfDay(start), today = startOfDay(new Date());
    var diff = Math.round((d - today) / 86400000);
    if (diff <= 0) return 'TODAY';
    if (diff === 1) return 'TOMORROW';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
  }
  function rangeSub(start, end) {
    if (!end) return '';
    var s = startOfDay(start), e = startOfDay(end);
    if (e <= s) return '';
    return 'THRU ' + e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  }

  function card(ev, hero) {
    var start = new Date(ev.start);
    var end = ev.end ? new Date(ev.end) : null;
    var label = dateLabel(start);
    var sub = rangeSub(start, end);
    var type = ev.type || 'Event';
    return '<a class="ev-card' + (hero ? ' ev-card--hero' : '') + '" href="' + esc(ev.url) + '" target="_blank" rel="noopener">' +
      '<div class="ev-img-wrap">' +
        (ev.img ? '<img class="ev-img" src="' + esc(ev.img) + '" alt="" loading="lazy" decoding="async" onerror="this.parentElement.classList.add(\'ev-img-empty\');this.remove()">' : '') +
        '<span class="ev-type" style="--tc:' + typeColor(type) + '">' + esc(type) + '</span>' +
      '</div>' +
      '<div class="ev-body">' +
        '<div class="ev-date"><span class="ev-date-main">' + esc(label) + '</span>' +
          (sub ? '<span class="ev-date-sub">' + esc(sub) + '</span>' : '') + '</div>' +
        '<h3 class="ev-name">' + esc(ev.title) + '</h3>' +
        (ev.venue ? '<div class="ev-venue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>' + esc(ev.venue) + '</div>' : '') +
      '</div></a>';
  }

  function render(events) {
    var hero = document.getElementById('ew-hero');
    var rest = document.getElementById('ew-rest');
    if (!hero || !rest || !events.length) return; // keep baked events
    var top = events.slice(0, HERO_COUNT);
    var more = events.slice(HERO_COUNT, HERO_COUNT + REST_COUNT);
    hero.innerHTML = top.map(function (e) { return card(e, true); }).join('');
    if (more.length) rest.innerHTML = more.map(function (e) { return card(e, false); }).join('');
  }

  function init() {
    if (!EVENTS_API) { console.warn('[events] EVENTS_API not set — keeping baked events.'); return; }
    fetch(EVENTS_API, { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (json) {
        var events = (json && json.events) || [];
        console.log('[events] ' + events.length + ' events from dg-events endpoint');
        render(events);
      })
      .catch(function (e) { console.warn('[events] →', e.message, '(keeping baked events)'); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
