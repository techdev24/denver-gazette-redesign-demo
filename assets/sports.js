/* Denver Gazette — Concept v5 · Sports hub (category landing).
 *
 * The destination for "Sports" in the nav. Gathers, in one place:
 *   • Latest across all sports  → /category/sports/feed/   (lead + grid)
 *   • One block per team        → each team's category feed (3 stories + link
 *     to that team's full landing page, team.html?team=<slug>)
 *
 * Same robust parsing as the rest of the site (getElementsByTagName for
 * namespaced tags, plus a guard against doubled <rss> bodies).
 */
(function () {
  'use strict';

  var FEED_PROXY = 'https://dg-feeds.techdev-d61.workers.dev/?url=';
  var BASE = 'https://www.denvergazette.com';

  // Team child pages, in display order. Mirrors teams.js.
  var TEAMS = [
    { slug: 'broncos',   name: 'Denver Broncos',   short: 'Broncos',   league: 'NFL',
      p: '#FB4F14', s: '#002244', accent: '#FB4F14',
      logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png',
      feed: BASE + '/category/denver-broncos/feed/' },
    { slug: 'nuggets',   name: 'Denver Nuggets',   short: 'Nuggets',   league: 'NBA',
      p: '#0E2240', s: '#FEC524', accent: '#0E2240',
      logo: 'https://a.espncdn.com/i/teamlogos/nba/500/den.png',
      feed: BASE + '/category/denver-nuggets/feed/' },
    { slug: 'avalanche', name: 'Colorado Avalanche', short: 'Avalanche', league: 'NHL',
      p: '#6F263D', s: '#236192', accent: '#6F263D',
      logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/col.png',
      feed: BASE + '/category/colorado-avalanche/feed/' },
    { slug: 'rockies',   name: 'Colorado Rockies', short: 'Rockies',   league: 'MLB',
      p: '#33006F', s: '#C4CED4', accent: '#33006F',
      logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/col.png',
      feed: BASE + '/category/colorado-rockies/feed/' },
    { slug: 'rapids',    name: 'Colorado Rapids',  short: 'Rapids',    league: 'MLS',
      p: '#960A2C', s: '#8BB8E8', accent: '#960A2C',
      logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/9618.png',
      feed: BASE + '/category/colorado-rapids/feed/' }
  ];

  // ── helpers ────────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function decode(s) { var t = document.createElement('textarea'); t.innerHTML = s || ''; return t.value; }
  function stripTags(s) { var d = document.createElement('div'); d.innerHTML = s || ''; return (d.textContent || '').trim(); }
  function truncate(s, n) { s = s || ''; return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; }
  function tag(item, name) { var els = item.getElementsByTagName(name); return els && els.length ? els[0] : null; }
  function text(item, name) { var el = tag(item, name); return el ? (el.textContent || '') : ''; }
  function ago(pub) {
    if (!pub) return '';
    var d = new Date(pub); if (isNaN(d)) return '';
    var s = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    var days = Math.floor(s / 86400);
    return days === 1 ? '1 day ago' : days + ' days ago';
  }
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
  function categoryOf(item) { var c = tag(item, 'category'); return c ? stripTags(decode(c.textContent)) : ''; }

  function parse(xml, count) {
    var end = xml.indexOf('</rss>');
    if (end !== -1) xml = xml.slice(0, end + 6); // doubled-<rss> guard
    var doc = new DOMParser().parseFromString(xml, 'text/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('malformed-xml');
    var items = Array.prototype.slice.call(doc.getElementsByTagName('item')).slice(0, count);
    if (!items.length) throw new Error('no-items');
    return items.map(function (it) {
      return {
        title: stripTags(decode(text(it, 'title'))),
        url: (text(it, 'link') || '').trim(),
        dek: truncate(stripTags(decode(text(it, 'description'))), 200),
        img: imageOf(it),
        cat: categoryOf(it),
        time: ago(text(it, 'pubDate'))
      };
    });
  }
  function fetchFeed(url) {
    return fetch(FEED_PROXY + encodeURIComponent(url), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.text(); });
  }

  // ── renderers ───────────────────────────────────────────────────────────────
  function lead(a, accent) {
    return '<a class="lead" href="' + esc(a.url) + '" target="_blank" rel="noopener" style="--accent:' + accent + '">' +
      (a.img ? '<img class="lead-img" src="' + esc(a.img) + '" alt="" fetchpriority="high" decoding="async" onerror="this.style.visibility=\'hidden\'">' : '<div class="lead-img"></div>') +
      '<div class="lead-body"><div class="kicker">Top story</div>' +
      '<h2 class="lead-h">' + esc(a.title) + '</h2>' +
      (a.dek ? '<p class="lead-d">' + esc(a.dek) + '</p>' : '') +
      '<div class="sbt"><span class="sbt-cat">' + esc(a.cat || 'Sports') + '</span><span class="sbt-time"> · ' + esc(a.time) + '</span></div>' +
      '</div></a>';
  }
  function card(a, accent) {
    return '<a class="tg-card" href="' + esc(a.url) + '" target="_blank" rel="noopener" style="--accent:' + accent + '">' +
      '<div class="tg-thumb">' + (a.img ? '<img src="' + esc(a.img) + '" alt="" loading="lazy" decoding="async" onerror="this.parentElement.classList.add(\'tg-thumb--empty\');this.remove()">' : '') + '</div>' +
      '<div class="tg-c"><div class="tg-h">' + esc(a.title) + '</div>' +
      '<div class="sbt"><span class="sbt-cat">' + esc(a.cat || '') + '</span><span class="sbt-time"> · ' + esc(a.time) + '</span></div></div></a>';
  }

  function fillLatest(items) {
    var host = document.getElementById('sports-latest');
    if (!host) return;
    var leadA = items[0], rest = items.slice(1, 7);
    host.innerHTML = lead(leadA, '#1F4E79') + '<div class="tg">' + rest.map(function (a) { return card(a, '#1F4E79'); }).join('') + '</div>';
  }

  // Build a per-team block shell immediately (branded), then fill stories async.
  function teamBlock(team) {
    var sec = document.createElement('section');
    sec.className = 'team-block';
    sec.innerHTML =
      '<div class="team-block-head" style="--p:' + team.p + ';--s:' + team.s + ';--accent:' + team.accent + '">' +
        '<img class="tb-logo" src="' + esc(team.logo) + '" alt="" decoding="async" onerror="this.style.display=\'none\'">' +
        '<div class="tb-id"><span class="tb-league">' + esc(team.league) + '</span><h2 class="tb-name">' + esc(team.short) + '</h2></div>' +
        '<a class="tb-all" href="team.html?team=' + esc(team.slug) + '">View all ' + esc(team.short) + ' →</a>' +
      '</div>' +
      '<div class="tg" data-fill="' + esc(team.slug) + '"><div class="team-msg-sm">Loading…</div></div>';
    return sec;
  }

  function fillTeam(sec, team, items) {
    var grid = sec.querySelector('.tg[data-fill="' + team.slug + '"]');
    if (!grid) return;
    grid.innerHTML = items.slice(0, 3).map(function (a) { return card(a, team.accent); }).join('');
  }
  function teamError(sec, team) {
    var grid = sec.querySelector('.tg[data-fill="' + team.slug + '"]');
    if (grid) grid.innerHTML = '<div class="team-msg-sm">Latest ' + esc(team.short) +
      ' coverage on <a href="' + esc(BASE) + '/category/' + (team.slug === 'rapids' ? 'colorado-rapids' : '') + '" target="_blank" rel="noopener">denvergazette.com</a>.</div>';
  }

  // ── boot ──────────────────────────────────────────────────────────────────
  function init() {
    // Latest across all sports
    fetchFeed(BASE + '/category/sports/feed/')
      .then(function (xml) { fillLatest(parse(xml, 7)); })
      .catch(function (e) {
        console.warn('[sports] latest →', e.message);
        var host = document.getElementById('sports-latest');
        if (host) host.innerHTML = '<div class="team-msg">Couldn\u2019t load the latest right now. <a href="' + BASE + '/category/sports/" target="_blank" rel="noopener">Sports on denvergazette.com →</a></div>';
      });

    // One block per team
    var wrap = document.getElementById('sports-teams');
    if (!wrap) return;
    TEAMS.forEach(function (team) {
      var sec = teamBlock(team);
      wrap.appendChild(sec);
      fetchFeed(team.feed)
        .then(function (xml) { fillTeam(sec, team, parse(xml, 3)); })
        .catch(function (e) { console.warn('[sports] ' + team.slug + ' →', e.message); teamError(sec, team); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
