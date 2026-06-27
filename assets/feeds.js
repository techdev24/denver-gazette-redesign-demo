/* Denver Gazette — Concept v5 · live RSS for the Top Table.
 *
 * Zones (per the approved mapping):
 *   #tt-tiles   → category/sports/feed      · 3 latest, thumb + headline + category
 *   #tt-center  → category/local-news/feed  · newest = hero (thumb+headline+dek), then 4 list items
 *   #rr-th      → /feed/  (site-wide latest) · "Top Headlines" list
 *
 * Static GitHub Pages can't fetch denvergazette.com RSS directly (no CORS header),
 * so requests go through FEED_PROXY. Default below is a public proxy so the demo works
 * on push; for production swap in the Cloudflare Worker in feed-proxy-worker.js (locked
 * to denvergazette.com, 5-min edge cache) and set FEED_PROXY to its URL.
 *
 * Fail-safe: if any feed errors, that zone keeps its baked HTML — the page never breaks.
 */
(function () {
  'use strict';

  // ── config ────────────────────────────────────────────────────────────────
  // Public proxy default. Replace with e.g. 'https://feeds.YOURDOMAIN.workers.dev/?url='
  var FEED_PROXY = 'https://api.allorigins.win/raw?url=';
  var BASE = 'https://www.denvergazette.com';

  var ZONES = {
    sports: { url: BASE + '/category/sports/feed',     count: 3 },
    local:  { url: BASE + '/category/local-news/feed',  count: 5 }, // 1 hero + 4 list
    latest: { url: BASE + '/feed/',                      count: 8 }
  };

  // Category → accent color (--sc), mirroring the baked sbt bands.
  var CAT_COLOR = {
    sports: '#1F4E79', politics: '#626262', crime: '#9A0A20', courts: '#9A0A20',
    business: '#3CC37D', opinion: '#7E7BF2', education: '#005F64',
    local: '#0B0B0F', 'colorado news': '#0B0B0F', government: '#626262',
    aerospace: '#1F4E79', 'arts & entertainment': '#C8102E'
  };

  // ── helpers ──────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function decode(s) { var t = document.createElement('textarea'); t.innerHTML = s || ''; return t.value; }
  function stripTags(s) { var d = document.createElement('div'); d.innerHTML = s || ''; return (d.textContent || '').trim(); }
  function truncate(s, n) { s = s || ''; return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; }
  function color(cat) { return CAT_COLOR[(cat || '').toLowerCase()] || '#C8102E'; }

  function ago(pub) {
    if (!pub) return '';
    var d = new Date(pub); if (isNaN(d)) return '';
    var s = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    var days = Math.floor(s / 86400);
    return days === 1 ? '1 day ago' : days + ' days ago';
  }

  // Image: media:content → media:thumbnail → enclosure → first <img> in content/description.
  function imageOf(item) {
    var m = item.querySelector('content[url], thumbnail[url]'); // media:* (namespace-agnostic in HTML-ish parse)
    if (m && m.getAttribute('url')) return m.getAttribute('url');
    var enc = item.querySelector('enclosure[url]');
    if (enc && /image/i.test(enc.getAttribute('type') || '') ) return enc.getAttribute('url');
    var body = (item.querySelector('encoded') && item.querySelector('encoded').textContent) ||
               (item.querySelector('description') && item.querySelector('description').textContent) || '';
    var mm = body.match(/<img[^>]+src=["']([^"']+)["']/i);
    return mm ? mm[1] : '';
  }
  function categoryOf(item, fallback) {
    var c = item.querySelector('category');
    var t = c ? stripTags(decode(c.textContent)) : '';
    return t || fallback || '';
  }

  function parse(xml, count, fallbackCat) {
    var doc = new DOMParser().parseFromString(xml, 'text/xml');
    if (doc.querySelector('parsererror')) throw new Error('parse');
    var items = Array.prototype.slice.call(doc.querySelectorAll('item')).slice(0, count);
    if (!items.length) throw new Error('empty');
    return items.map(function (it) {
      return {
        title: stripTags(decode((it.querySelector('title') || {}).textContent || '')),
        url: ((it.querySelector('link') || {}).textContent || '').trim(),
        dek: truncate(stripTags(decode((it.querySelector('description') || {}).textContent || '')), 180),
        img: imageOf(it),
        cat: categoryOf(it, fallbackCat),
        time: ago(((it.querySelector('pubDate') || {}).textContent || ''))
      };
    });
  }

  function fetchFeed(url) {
    return fetch(FEED_PROXY + encodeURIComponent(url), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); });
  }

  // ── renderers (markup mirrors the baked cards so existing CSS applies) ─────
  function tile(a) {
    return '<a class="tt-tile" href="' + esc(a.url) + '" target="_blank" rel="noopener">' +
      (a.img ? '<img class="tt-tile-img" src="' + esc(a.img) + '" alt="" loading="lazy" decoding="async" onerror="this.style.background=\'#1F2937\';this.removeAttribute(\'src\')">' : '<div class="tt-tile-img"></div>') +
      '<div class="tt-tile-h">' + esc(a.title) + '</div>' +
      '<div class="sbt" style="--sc:' + color(a.cat) + '"><span class="sbt-cat">' + esc(a.cat || 'Sports') + '</span><span class="sbt-time"> · ' + esc(a.time) + '</span></div></a>';
  }
  function hero(a) {
    return '<a class="tt-hero" href="' + esc(a.url) + '" target="_blank" rel="noopener">' +
      (a.img ? '<img class="tt-hero-img" src="' + esc(a.img) + '" alt="" fetchpriority="high" decoding="async">' : '<div class="tt-hero-img"></div>') +
      '<div class="tt-hero-body"><h2 class="tt-hero-h">' + esc(a.title) + '</h2>' +
      (a.dek ? '<p class="tt-hero-d">' + esc(a.dek) + '</p>' : '') +
      '<div class="sbt" style="--sc:' + color(a.cat || 'local') + '"><span class="sbt-cat">' + esc(a.cat || 'Local') + '</span><span class="sbt-time"> · ' + esc(a.time) + '</span></div></div></a>';
  }
  function listItem(a) {
    return '<a class="tt-li" href="' + esc(a.url) + '" target="_blank" rel="noopener">' +
      '<div class="tt-li-thumb">' + (a.img ? '<img src="' + esc(a.img) + '" alt="" loading="lazy" decoding="async">' : '') + '</div>' +
      '<div class="tt-li-c"><div class="tt-li-h">' + esc(a.title) + '</div>' +
      '<div class="sbt" style="--sc:' + color(a.cat || 'local') + '"><span class="sbt-cat">' + esc(a.cat || 'Local') + '</span><span class="sbt-time"> · ' + esc(a.time) + '</span></div></div></a>';
  }

  // ── zone fills ─────────────────────────────────────────────────────────────
  function fillTiles(items) {
    var host = document.getElementById('tt-tiles'); if (!host) return;
    // keep any data-keep tile (the Sponsored slot); drop the rest, then append live.
    Array.prototype.slice.call(host.querySelectorAll('.tt-tile')).forEach(function (el) {
      if (!el.hasAttribute('data-keep')) el.remove();
    });
    host.insertAdjacentHTML('beforeend', items.map(tile).join(''));
  }
  function fillCenter(items) {
    var host = document.getElementById('tt-center'); if (!host || !items.length) return;
    var lead = items[0], rest = items.slice(1, 5);
    host.innerHTML = hero(lead) + rest.map(listItem).join('');
  }
  function fillLatest(items) {
    var host = document.getElementById('rr-th'); if (!host) return;
    var head = host.querySelector('.rr-th-head');
    var more = host.querySelector('.rr-th-more');
    Array.prototype.slice.call(host.querySelectorAll('.rr-th-a')).forEach(function (el) { el.remove(); });
    var html = items.map(function (a, i) {
      return '<a class="rr-th-a' + (i >= 5 ? ' rr-th-a--extra' : '') + '" href="' + esc(a.url) + '" target="_blank" rel="noopener">' + esc(a.title) + '</a>';
    }).join('');
    if (more) more.insertAdjacentHTML('beforebegin', html);
    else if (head) head.insertAdjacentHTML('afterend', html);
  }

  // ── boot ───────────────────────────────────────────────────────────────────
  function load(zone, cat, fill) {
    fetchFeed(zone.url)
      .then(function (xml) { fill(parse(xml, zone.count, cat)); })
      .catch(function (e) { /* keep baked fallback */ console.warn('[feeds] ' + zone.url + ' →', e.message); });
  }

  function init() {
    load(ZONES.sports, 'Sports', fillTiles);
    load(ZONES.local, 'Local', fillCenter);
    load(ZONES.latest, '', fillLatest);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
