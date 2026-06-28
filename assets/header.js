/* Denver Gazette — Concept v5 · GLOBAL site header.
 *
 * One source of truth for the top bar + masthead + nav across every page.
 * Each page only needs:  <script src="assets/header.js?v=1"></script>  right
 * after <body>. This injects the header (and its CSS) and highlights the active
 * nav item based on the current page. Edit THIS file to change the header
 * everywhere — never copy the markup into individual pages.
 *
 * Classes are prefixed `dgg-` so they never collide with a page's own styles.
 */
(function () {
  'use strict';
  if (window.__dggHeader) return;        // guard against double-inject
  window.__dggHeader = true;

  var LOGO = 'https://www.denvergazette.com/wp-content/uploads/2025/06/1f65d0d8-f5bf-11ed-a1fe-2f51df8053fb.webp';

  // nav model — real pages link out, placeholders stay on '#'
  var NAV = [
    { label: 'Latest',       href: 'index.html',        key: 'latest' },
    { label: 'Sports',       href: 'sports.html',       key: 'sports' },
    { label: 'OutThere',     href: '#',                 key: 'outthere', cls: 'dgg-out' },
    { label: 'Politics',     href: 'politics.html',     key: 'politics' },
    { label: 'Business',     href: 'business.html',     key: 'business' },
    { label: 'Opinion',      href: 'opinion.html',      key: 'opinion' },
    { label: 'Things To Do', href: 'things-to-do.html', key: 'ttd' },
    { label: 'Obits',        href: '#',                 key: 'obits' }
  ];

  // which nav item is active for this page
  function activeKey() {
    var p = (location.pathname || '').toLowerCase();
    if (p.indexOf('sports.html') !== -1 || p.indexOf('team.html') !== -1) return 'sports';
    if (p.indexOf('things-to-do.html') !== -1) return 'ttd';
    if (p.indexOf('politics.html') !== -1) return 'politics';
    if (p.indexOf('business.html') !== -1) return 'business';
    if (p.indexOf('opinion.html') !== -1) return 'opinion';
    return 'latest';   // index.html or site root
  }

  function todayDenver() {
    var p = {};
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Denver', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return p.weekday + ' · ' + p.month + ' ' + p.day + ', ' + p.year;
  }

  var CSS = [
    '.dgg-util{background:var(--paper-2,#F2F1EA);border-bottom:1px solid var(--rule,#E2E1D8);font-family:\'Unify Sans\',\'Helvetica Neue\',Arial,sans-serif;font-size:11px;letter-spacing:.06em;text-transform:uppercase}',
    '.dgg-util-row{max-width:1400px;margin:0 auto;padding:8px 24px;display:flex;justify-content:space-between;align-items:center;gap:24px}',
    '.dgg-util-left{display:flex;gap:18px;align-items:center;color:var(--mute,#646468)}',
    '.dgg-util-right{display:flex;gap:18px;align-items:center}',
    '.dgg-util-right a{color:var(--mute,#646468);text-decoration:none}',
    '.dgg-util-right a:hover{color:var(--ink,#0B0B0F)}',
    '.dgg-sub{background:var(--red,#C8102E)!important;color:#fff!important;padding:6px 14px;border-radius:999px;font-weight:600;letter-spacing:.06em}',
    '.dgg-sub:hover{background:var(--red-deep,#A00D24)!important}',
    '.dgg-mast{border-bottom:1px solid var(--rule,#E2E1D8);background:rgba(250,250,247,.97);position:sticky;top:0;z-index:60;-webkit-backdrop-filter:saturate(1.4) blur(8px);backdrop-filter:saturate(1.4) blur(8px)}',
    '.dgg-mast-row{max-width:1400px;margin:0 auto;padding:12px 24px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:24px}',
    '.dgg-logo{display:flex;align-items:center;line-height:1;text-decoration:none}',
    '.dgg-logo img{height:46px;width:auto;display:block}',
    '.dgg-nav{display:flex;gap:20px;justify-content:center;font-family:\'Unify Sans\',\'Helvetica Neue\',Arial,sans-serif;font-weight:500;font-size:14px}',
    '.dgg-nav a{padding:6px 0;border-bottom:2px solid transparent;transition:border-color .2s,color .2s;text-decoration:none;color:var(--ink,#0B0B0F);white-space:nowrap}',
    '.dgg-nav a:hover{border-bottom-color:var(--red,#C8102E);color:var(--ink,#0B0B0F)}',
    '.dgg-nav a.active{border-bottom-color:var(--ink,#0B0B0F);font-weight:600}',
    '.dgg-nav a.dgg-out{color:var(--alpen,#C2410C);font-weight:600}',
    '.dgg-actions{display:flex;gap:10px;justify-content:flex-end;align-items:center}',
    '.dgg-icon{width:34px;height:34px;border-radius:50%;border:1px solid var(--rule,#E2E1D8);display:grid;place-items:center;color:var(--ink-2,#1C1C22);transition:all .2s;background:transparent;cursor:pointer}',
    '.dgg-icon:hover{border-color:var(--ink,#0B0B0F);background:var(--ink,#0B0B0F);color:var(--paper,#FAFAF7)}',
    '.dgg-icon svg{width:15px;height:15px}',
    '@media (max-width:900px){.dgg-nav{display:none}.dgg-mast-row{grid-template-columns:auto 1fr auto;padding:10px 14px}.dgg-util-row{padding:6px 14px;gap:8px;font-size:10px}.dgg-util-left .dgg-weather{display:none}}'
  ].join('');

  function navHTML() {
    var act = activeKey();
    return NAV.map(function (n) {
      var cls = [];
      if (n.key === act) cls.push('active');
      if (n.cls) cls.push(n.cls);
      return '<a href="' + n.href + '"' + (cls.length ? ' class="' + cls.join(' ') + '"' : '') + '>' + n.label + '</a>';
    }).join('');
  }

  function html() {
    return '' +
      '<div class="dgg-util">' +
        '<div class="dgg-util-row">' +
          '<div class="dgg-util-left">' +
            '<span class="dgg-date">' + todayDenver() + '</span>' +
            '<span class="dgg-weather">Denver 42&deg;F</span>' +
          '</div>' +
          '<div class="dgg-util-right">' +
            '<a href="https://daily.denvergazette.com/" target="_blank" rel="noopener">E-Edition</a>' +
            '<a href="#">Newsletters</a>' +
            '<a href="#">Account</a>' +
            '<a href="#" class="dgg-sub">Subscribe &middot; 99&cent; / 3 mo</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<header class="dgg-mast">' +
        '<div class="dgg-mast-row">' +
          '<a href="index.html" class="dgg-logo" aria-label="The Denver Gazette">' +
            '<img src="' + LOGO + '" alt="The Denver Gazette" referrerpolicy="no-referrer">' +
          '</a>' +
          '<nav class="dgg-nav">' + navHTML() + '</nav>' +
          '<div class="dgg-actions">' +
            '<button class="dgg-icon" title="Search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></button>' +
            '<button class="dgg-icon" title="Menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>' +
          '</div>' +
        '</div>' +
      '</header>';
  }

  function inject() {
    if (!document.getElementById('dgg-header-css')) {
      var s = document.createElement('style');
      s.id = 'dgg-header-css';
      s.textContent = CSS;
      (document.head || document.documentElement).appendChild(s);
    }
    if (document.body) document.body.insertAdjacentHTML('afterbegin', html());
  }

  if (document.body) inject();
  else document.addEventListener('DOMContentLoaded', inject);
})();
