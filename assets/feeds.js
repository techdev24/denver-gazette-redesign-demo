/* Denver Gazette — Concept v5 · live RSS for the Top Table.
 *
 * Zones (per the approved mapping):
 *   #tt-tiles   → category/sports/feed      · 3 latest, thumb + headline + category
 *   #tt-center  → category/local-news/feed  · newest = hero (thumb+headline+dek), then 4 list items
 *   #rr-th      → /feed/  (site-wide latest) · "Top Headlines" list
 *
 * Requests go through FEED_PROXY (Cloudflare Worker, locked to denvergazette.com).
 * Fail-safe: if any feed errors, that zone keeps its baked HTML — the page never breaks.
 */
(function () {
  'use strict';

  var FEED_PROXY = 'https://dg-feeds.techdev-d61.workers.dev/?url=';
  var BASE = 'https://www.denvergazette.com';

  var ZONES = {
    sports: { url: BASE + '/category/sports/feed/',     count: 3 },
    local:  { url: BASE + '/category/local-news/feed/',  count: 5 }, // 1 hero + 4 list
    latest: { url: BASE + '/feed/',                      count: 8 }
  };

  var CAT_COLOR = {
    sports: '#1F4E79', politics: '#626262', crime: '#9A0A20', courts: '#9A0A20',
    business: '#3CC37D', opinion: '#7E7BF2', education: '#005F64',
    local: '#0B0B0F', 'local news': '#0B0B0F', 'colorado news': '#0B0B0F',
    government: '#626262', aerospace: '#1F4E79', 'arts & entertainment': '#C8102E'
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

  // Safe getter: first child element with the given (possibly namespaced) tag name.
  function tag(item, name) {
    var els = item.getElementsByTagName(name);
    return els && els.length ? els[0] : null;
  }
  function text(item, name) {
    var el = tag(item, name);
    return el ? (el.textContent || '') : '';
  }

  function ago(pub) {
    if (!pub) return '';
    var d = new Date(pub); if (isNaN(d)) return '';
    var s = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    var days = Math.floor(s / 86400);
    return days === 1 ? '1 day ago' : days + ' days ago';
  }

  // Image: media:content → media:thumbnail → enclosure → first <img> in content:encoded/description.
  function imageOf(item) {
    var mc = tag(item, 'media:content') || tag(item, 'content');
    if (mc && mc.getAttribute && mc.getAttribute('url')) return mc.getAttribute('url');
    var mt = tag(item, 'media:thumbnail') || tag(item, 'thumbnail');
    if (mt && mt.getAttribute && mt.getAttribute('url')) return mt.getAttribute('url');
    var enc = tag(item, 'enclosure');
    if (enc && /image/i.test(enc.getAttribute('type') || '')) return enc.getAttribute('url');
    var body = text(item, 'content:encoded') || text(item, 'encoded') || text(item, 'description') || '';
    var mm = body.match(/<img[^>]+src=["']([^"']+)["']/i);
    return mm ? mm[1] : '';
  }
  function categoryOf(item, fallback) {
    var c = tag(item, 'category');
    var t = c ? stripTags(decode(c.textContent)) : '';
    return t || fallback || '';
  }

  function parse(xml, count, fallbackCat) {
    // Some proxy/cache configs return the feed body twice (two <?xml>/<rss> roots
    // concatenated). XML allows exactly one root, so a doubled body fails to parse.
    // Defensively keep only the first complete document: cut at the first </rss>.
    var end = xml.indexOf('</rss>');
    if (end !== -1) xml = xml.slice(0, end + 6);
    var doc = new DOMParser().parseFromString(xml, 'text/xml');
    // parsererror lives in the XHTML namespace; getElementsByTagName finds it safely.
    if (doc.getElementsByTagName('parsererror').length) throw new Error('malformed-xml');
    var items = Array.prototype.slice.call(doc.getElementsByTagName('item')).slice(0, count);
    if (!items.length) throw new Error('no-items');
    return items.map(function (it) {
      return {
        title: stripTags(decode(text(it, 'title'))),
        url: (text(it, 'link') || '').trim(),
        dek: truncate(stripTags(decode(text(it, 'description'))), 180),
        img: imageOf(it),
        cat: categoryOf(it, fallbackCat),
        time: ago(text(it, 'pubDate'))
      };
    });
  }

  function fetchFeed(url) {
    return fetch(FEED_PROXY + encodeURIComponent(url), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.text(); });
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

  // ── sports widget (team cards + "More from Sports") ────────────────────────
  // Per-team category feeds. Trailing slash avoids the WordPress 301 redirect.
  var TEAMS = {
    broncos:   BASE + '/category/denver-broncos/feed/',
    nuggets:   BASE + '/category/denver-nuggets/feed/',
    avalanche: BASE + '/category/colorado-avalanche/feed/',
    rockies:   BASE + '/category/colorado-rockies/feed/'
  };

  // Update one team card with its latest story. The card LINK stays pointed at
  // the team landing page (team.html?team=…); only the headline and timestamp
  // go live. Logo, colors, league badge, and team name stay baked.
  function fillTeam(slug, items) {
    if (!items.length) return; // no items → keep the baked card untouched
    var card = document.querySelector('.tc[data-team="' + slug + '"]');
    if (!card) return;
    var a = items[0];
    var h = card.querySelector('.tc-headline');
    if (h && a.title) h.textContent = a.title;
    var when = card.querySelector('.tc-when');
    if (when && a.time) when.textContent = a.time;
  }

  // Rebuild the "More from Sports" two-column list from the section-wide feed.
  function fillSportsRest(items) {
    var ul = document.getElementById('sw-rest-list');
    if (!ul || !items.length) return;
    ul.innerHTML = items.slice(0, 4).map(function (a) {
      return '<li><a href="' + esc(a.url) + '" target="_blank" rel="noopener">' +
        esc(a.title) + '</a><span class="sw-rest-time">' + esc(a.time) + '</span></li>';
    }).join('');
  }

  // ── boot ───────────────────────────────────────────────────────────────────
  function load(zone, cat, fill) {
    fetchFeed(zone.url)
      .then(function (xml) { fill(parse(xml, zone.count, cat)); })
      .catch(function (e) { console.warn('[feeds] ' + zone.url + ' →', e.message); });
  }

  function init() {
    // Top Table
    load(ZONES.sports, 'Sports', fillTiles);
    load(ZONES.local, 'Local', fillCenter);
    load(ZONES.latest, '', fillLatest);

    // Sports widget — one fetch per team card (newest story each)…
    Object.keys(TEAMS).forEach(function (slug) {
      load({ url: TEAMS[slug], count: 1 }, 'Sports', function (items) { fillTeam(slug, items); });
    });
    // …plus the section-wide sports feed for the "More from Sports" list.
    load({ url: BASE + '/category/sports/feed/', count: 6 }, 'Sports', fillSportsRest);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
