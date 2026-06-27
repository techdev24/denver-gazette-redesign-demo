/* Denver Gazette — Concept v5 · team landing page loader.
 *
 * Reads ?team=<slug> from the URL, brands the page in that team's colors,
 * and fills a lead story + article grid live from the team's category feed
 * (via the same Cloudflare Worker proxy as the homepage).
 *
 * Self-contained: shares no state with feeds.js. Same robust parsing —
 * getElementsByTagName for namespaced tags, plus a guard against doubled
 * <rss> bodies some proxy/cache configs return.
 */
(function () {
  'use strict';

  var FEED_PROXY = 'https://dg-feeds.techdev-d61.workers.dev/?url=';
  var BASE = 'https://www.denvergazette.com';

  // slug → branding + feed. Colors mirror the homepage team cards.
  var TEAMS = {
    broncos: {
      name: 'Denver Broncos', short: 'Broncos', league: 'NFL',
      p: '#FB4F14', s: '#002244', accent: '#FB4F14',
      logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png',
      feed: BASE + '/category/denver-broncos/feed/',
      live: BASE + '/category/denver-broncos/'
    },
    nuggets: {
      name: 'Denver Nuggets', short: 'Nuggets', league: 'NBA',
      p: '#0E2240', s: '#FEC524', accent: '#FEC524',
      logo: 'https://a.espncdn.com/i/teamlogos/nba/500/den.png',
      feed: BASE + '/category/denver-nuggets/feed/',
      live: BASE + '/category/denver-nuggets/'
    },
    avalanche: {
      name: 'Colorado Avalanche', short: 'Avalanche', league: 'NHL',
      p: '#6F263D', s: '#236192', accent: '#236192',
      logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/col.png',
      feed: BASE + '/category/colorado-avalanche/feed/',
      live: BASE + '/category/colorado-avalanche/'
    },
    rockies: {
      name: 'Colorado Rockies', short: 'Rockies', league: 'MLB',
      p: '#33006F', s: '#C4CED4', accent: '#7E7BF2',
      logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/col.png',
      feed: BASE + '/category/colorado-rockies/feed/',
      live: BASE + '/category/colorado-rockies/'
    },
    rapids: {
      name: 'Colorado Rapids', short: 'Rapids', league: 'MLS',
      p: '#960A2C', s: '#8BB8E8', accent: '#960A2C',
      logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/9618.png',
      feed: BASE + '/category/colorado-rapids/feed/',
      live: BASE + '/category/colorado-rapids/'
    }
  };

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
  function categoryOf(item) {
    var c = tag(item, 'category');
    return c ? stripTags(decode(c.textContent)) : '';
  }

  function parse(xml, count) {
    // Guard: some proxy/cache configs return two <rss> roots concatenated,
    // which is invalid XML. Keep only the first complete document.
    var end = xml.indexOf('</rss>');
    if (end !== -1) xml = xml.slice(0, end + 6);
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

  // ── render ──────────────────────────────────────────────────────────────────
  function brand(team) {
    document.documentElement.style.setProperty('--p', team.p);
    document.documentElement.style.setProperty('--s', team.s);
    document.documentElement.style.setProperty('--accent', team.accent);
    document.title = team.name + ' — The Denver Gazette';

    var logo = document.getElementById('team-logo');
    if (logo) {
      logo.src = team.logo;
      logo.alt = team.short + ' logo';
      logo.onerror = function () { this.style.display = 'none'; };
    }
    setText('team-name', team.short);
    setText('team-full', team.name);
    setText('team-league', team.league);
    var all = document.getElementById('team-all');
    if (all) all.href = team.live;
  }
  function setText(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }

  function lead(a) {
    return '<a class="lead" href="' + esc(a.url) + '" target="_blank" rel="noopener">' +
      (a.img ? '<img class="lead-img" src="' + esc(a.img) + '" alt="" fetchpriority="high" decoding="async" onerror="this.style.visibility=\'hidden\'">' : '<div class="lead-img"></div>') +
      '<div class="lead-body"><div class="kicker">Latest</div>' +
      '<h2 class="lead-h">' + esc(a.title) + '</h2>' +
      (a.dek ? '<p class="lead-d">' + esc(a.dek) + '</p>' : '') +
      '<div class="sbt"><span class="sbt-cat">' + esc(a.cat || '') + '</span><span class="sbt-time"> · ' + esc(a.time) + '</span></div>' +
      '</div></a>';
  }
  function card(a) {
    return '<a class="tg-card" href="' + esc(a.url) + '" target="_blank" rel="noopener">' +
      '<div class="tg-thumb">' + (a.img ? '<img src="' + esc(a.img) + '" alt="" loading="lazy" decoding="async" onerror="this.parentElement.classList.add(\'tg-thumb--empty\');this.remove()">' : '') + '</div>' +
      '<div class="tg-c"><div class="tg-h">' + esc(a.title) + '</div>' +
      '<div class="sbt"><span class="sbt-cat">' + esc(a.cat || '') + '</span><span class="sbt-time"> · ' + esc(a.time) + '</span></div></div></a>';
  }

  function renderStories(items, team) {
    var host = document.getElementById('team-stories');
    if (!host) return;
    var leadA = items[0], rest = items.slice(1);
    host.innerHTML = lead(leadA) +
      '<div class="tg">' + rest.map(card).join('') + '</div>';
  }

  function showMessage(html) {
    var host = document.getElementById('team-stories');
    if (host) host.innerHTML = '<div class="team-msg">' + html + '</div>';
  }

  // ── boot ──────────────────────────────────────────────────────────────────
  function slugFromUrl() {
    var m = (location.search || '').match(/[?&]team=([a-z-]+)/i);
    return m ? m[1].toLowerCase() : '';
  }

  function init() {
    var slug = slugFromUrl();
    var team = TEAMS[slug];
    if (!team) {
      brand({ name: 'Denver Gazette Sports', short: 'Sports', league: '', p: '#0B0B0F', s: '#1C1C22', accent: '#C8102E', logo: '', live: BASE + '/category/sports/' });
      showMessage('Unknown team. <a href="index.html">Back to the homepage</a>.');
      return;
    }
    brand(team);
    showMessage('Loading the latest ' + esc(team.short) + ' coverage…');

    fetchFeed(team.feed)
      .then(function (xml) { renderStories(parse(xml, 13), team); })
      .catch(function (e) {
        console.warn('[teams] ' + team.feed + ' →', e.message);
        showMessage('Couldn\u2019t load live ' + esc(team.short) + ' stories right now. ' +
          'Read the latest on <a href="' + esc(team.live) + '" target="_blank" rel="noopener">denvergazette.com</a>.');
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
