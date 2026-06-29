/* Denver Gazette — Concept v5 · GLOBAL site footer.
 *
 * One source of truth for the footer across EVERY page — the counterpart to
 * header.js. It is loaded automatically by header.js, so a page needs no extra
 * <script> tag. On load it removes any old inline <footer> (so OutThere and the
 * news pages all share this single footer) and appends the global one.
 *
 * Edit THIS file to change the footer everywhere. Classes are prefixed `dgg-foot`
 * so they never collide with a page's own styles. All links are absolute so they
 * resolve correctly from the demo host.
 */
(function () {
  'use strict';
  if (window.__dggFooter) return;            // guard against double-inject
  window.__dggFooter = true;

  var LOGO = 'https://www.denvergazette.com/wp-content/uploads/2025/06/1f65d0d8-f5bf-11ed-a1fe-2f51df8053fb.webp';
  var BASE = 'https://www.denvergazette.com';

  // Sections mirror the GLOBAL top nav (header.js) — incl. OutThere + Events.
  var SECTIONS = [
    ['Latest', 'latest.html'],
    ['Sports', 'sports.html'],
    ['OutThere', 'outtherecolorado.html'],
    ['Events', 'events.html'],
    ['Politics', 'politics.html'],
    ['Business', 'business.html'],
    ['Opinion', 'opinion.html'],
    ['Things To Do', 'things-to-do.html'],
    ['Obits', BASE + '/obits/']
  ];
  var SERVICES = [
    ['Advertising', 'https://www.denvergazetteadvertising.com/'],
    ['Forms', BASE + '/forms/'],
    ['Calendar', BASE + '/calendar/'],
    ['Weather', BASE + '/weather/'],
    ['Transparency in Coverage', BASE + '/transparency/'],
    ['Statement of Principles', BASE + '/about/statement/'],
    ['About Us', BASE + '/about/'],
    ['Contact Us', BASE + '/contact'],
    ['Subscriber-Only Content', BASE + '/category/premium/']
  ];
  var NETWORK = [
    ['DenverGazette.com', 'https://www.denvergazette.com/'],
    ['Gazette.com', 'https://gazette.com/'],
    ['ColoradoPolitics.com', 'https://coloradopolitics.com/'],
    ['OutThereColorado.com', 'https://outtherecolorado.com/']
  ];

  // brand glyphs (label, href, svg path-or-markup)
  var SOCIAL = [
    ['Facebook', 'https://www.facebook.com/denvergazette', '<path d="M12 2C6.5 2 2 6.5 2 12c0 5 3.7 9.1 8.4 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7C18.3 21.1 22 17 22 12c0-5.5-4.5-10-10-10z"/>'],
    ['X', 'https://x.com/denvergazette', '<path d="M13.982 10.622 20.54 3h-1.554l-5.693 6.618L8.745 3H3.5l6.876 10.007L3.5 21h1.554l6.012-6.989L15.868 21h5.245l-7.131-10.378Zm-2.128 2.474-.697-.997-5.543-7.93H8l4.474 6.4.697.996 5.815 8.318h-2.387l-4.745-6.787Z"/>'],
    ['LinkedIn', 'https://www.linkedin.com/company/71043260/', '<path d="M19.7,3H4.3C3.582,3,3,3.582,3,4.3v15.4C3,20.418,3.582,21,4.3,21h15.4c0.718,0,1.3-0.582,1.3-1.3V4.3 C21,3.582,20.418,3,19.7,3z M8.339,18.338H5.667v-8.59h2.672V18.338z M7.004,8.574c-0.857,0-1.549-0.694-1.549-1.548 c0-0.855,0.691-1.548,1.549-1.548c0.854,0,1.547,0.694,1.547,1.548C8.551,7.881,7.858,8.574,7.004,8.574z M18.339,18.338h-2.669 v-4.177c0-0.996-0.017-2.278-1.387-2.278c-1.389,0-1.601,1.086-1.601,2.206v4.249h-2.667v-8.59h2.559v1.174h0.037 c0.356-0.675,1.227-1.387,2.526-1.387c2.703,0,3.203,1.779,3.203,4.092V18.338z"/>'],
    ['YouTube', 'https://www.youtube.com/@thedenvergazette', '<path d="M21.8,8.001c0,0-0.195-1.378-0.795-1.985c-0.76-0.797-1.613-0.801-2.004-0.847c-2.799-0.202-6.997-0.202-6.997-0.202 h-0.009c0,0-4.198,0-6.997,0.202C4.608,5.216,3.756,5.22,2.995,6.016C2.395,6.623,2.2,8.001,2.2,8.001S2,9.62,2,11.238v1.517 c0,1.618,0.2,3.237,0.2,3.237s0.195,1.378,0.795,1.985c0.761,0.797,1.76,0.771,2.205,0.855c1.6,0.153,6.8,0.201,6.8,0.201 s4.203-0.006,7.001-0.209c0.391-0.047,1.243-0.051,2.004-0.847c0.6-0.607,0.795-1.985,0.795-1.985s0.2-1.618,0.2-3.237v-1.517 C22,9.62,21.8,8.001,21.8,8.001z M9.935,14.594l-0.001-5.62l5.404,2.82L9.935,14.594z"/>'],
    ['TikTok', 'https://www.tiktok.com/@thedenvergazette', '<path d="M16.708 0.027c1.745-0.027 3.48-0.011 5.213-0.027 0.105 2.041 0.839 4.12 2.333 5.563 1.491 1.479 3.6 2.156 5.652 2.385v5.369c-1.923-0.063-3.855-0.463-5.6-1.291-0.76-0.344-1.468-0.787-2.161-1.24-0.009 3.896 0.016 7.787-0.025 11.667-0.104 1.864-0.719 3.719-1.803 5.255-1.744 2.557-4.771 4.224-7.88 4.276-1.907 0.109-3.812-0.411-5.437-1.369-2.693-1.588-4.588-4.495-4.864-7.615-0.032-0.667-0.043-1.333-0.016-1.984 0.24-2.537 1.495-4.964 3.443-6.615 2.208-1.923 5.301-2.839 8.197-2.297 0.027 1.975-0.052 3.948-0.052 5.923-1.323-0.428-2.869-0.308-4.025 0.495-0.844 0.547-1.485 1.385-1.819 2.333-0.276 0.676-0.197 1.427-0.181 2.145 0.317 2.188 2.421 4.027 4.667 3.828 1.489-0.016 2.916-0.88 3.692-2.145 0.251-0.443 0.532-0.896 0.547-1.417 0.131-2.385 0.079-4.76 0.095-7.145 0.011-5.375-0.016-10.735 0.025-16.093z"/>', '0 0 32 32'],
    ['Instagram', 'https://www.instagram.com/denvergazette/', '<path d="M12,4.622c2.403,0,2.688,0.009,3.637,0.052c0.877,0.04,1.354,0.187,1.671,0.31c0.42,0.163,0.72,0.358,1.035,0.673 c0.315,0.315,0.51,0.615,0.673,1.035c0.123,0.317,0.27,0.794,0.31,1.671c0.043,0.949,0.052,1.234,0.052,3.637 s-0.009,2.688-0.052,3.637c-0.04,0.877-0.187,1.354-0.31,1.671c-0.163,0.42-0.358,0.72-0.673,1.035 c-0.315,0.315-0.615,0.51-1.035,0.673c-0.317,0.123-0.794,0.27-1.671,0.31c-0.949,0.043-1.233,0.052-3.637,0.052 s-2.688-0.009-3.637-0.052c-0.877-0.04-1.354-0.187-1.671-0.31c-0.42-0.163-0.72-0.358-1.035-0.673 c-0.315-0.315-0.51-0.615-0.673-1.035c-0.123-0.317-0.27-0.794-0.31-1.671C4.631,14.688,4.622,14.403,4.622,12 s0.009-2.688,0.052-3.637c0.04-0.877,0.187-1.354,0.31-1.671c0.163-0.42,0.358-0.72,0.673-1.035 c0.315-0.315,0.615-0.51,1.035-0.673c0.317-0.123,0.794-0.27,1.671-0.31C9.312,4.631,9.597,4.622,12,4.622 M12,3 C9.556,3,9.249,3.01,8.289,3.054C7.331,3.098,6.677,3.25,6.105,3.472C5.513,3.702,5.011,4.01,4.511,4.511 c-0.5,0.5-0.808,1.002-1.038,1.594C3.25,6.677,3.098,7.331,3.054,8.289C3.01,9.249,3,9.556,3,12c0,2.444,0.01,2.751,0.054,3.711 c0.044,0.958,0.196,1.612,0.418,2.185c0.23,0.592,0.538,1.094,1.038,1.594c0.5,0.5,1.002,0.808,1.594,1.038 c0.572,0.222,1.227,0.375,2.185,0.418C9.249,20.99,9.556,21,12,21s2.751-0.01,3.711-0.054c0.958-0.044,1.612-0.196,2.185-0.418 c0.592-0.23,1.094-0.538,1.594-1.038c0.5-0.5,0.808-1.002,1.038-1.594c0.222-0.572,0.375-1.227,0.418-2.185 C20.99,14.751,21,14.444,21,12s-0.01-2.751-0.054-3.711c-0.044-0.958-0.196-1.612-0.418-2.185c-0.23-0.592-0.538-1.094-1.038-1.594 c-0.5-0.5-1.002-0.808-1.594-1.038c-0.572-0.222-1.227-0.375-2.185-0.418C14.751,3.01,14.444,3,12,3L12,3z M12,7.378 c-2.552,0-4.622,2.069-4.622,4.622S9.448,16.622,12,16.622s4.622-2.069,4.622-4.622S14.552,7.378,12,7.378z M12,15 c-1.657,0-3-1.343-3-3s1.343-3,3-3s3,1.343,3,3S13.657,15,12,15z M16.804,6.116c-0.596,0-1.08,0.484-1.08,1.08 s0.484,1.08,1.08,1.08c0.596,0,1.08-0.484,1.08-1.08S17.401,6.116,16.804,6.116z"/>']
  ];
  var APPS = [
    ['iOS App', 'https://apps.apple.com/us/app/the-denver-gazette-online/id1546159208', '0 0 448 512', '<path d="M400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zM127 384.5c-5.5 9.6-17.8 12.8-27.3 7.3-9.6-5.5-12.8-17.8-7.3-27.3l14.3-24.7c16.1-4.9 29.3-1.1 39.6 11.4L127 384.5zm138.9-53.9H84c-11 0-20-9-20-20s9-20 20-20h51l65.4-113.2-20.5-35.4c-5.5-9.6-2.2-21.8 7.3-27.3 9.6-5.5 21.8-2.2 27.3 7.3l8.9 15.4 8.9-15.4c5.5-9.6 17.8-12.8 27.3-7.3 9.6 5.5 12.8 17.8 7.3 27.3l-85.8 148.6h62.1c20.2 0 31.5 23.7 22.7 40zm98.1 0h-29l19.6 33.9c5.5 9.6 2.2 21.8-7.3 27.3-9.6 5.5-21.8 2.2-27.3-7.3-32.9-56.9-57.5-99.7-74-128.1-16.7-29-4.8-58 7.1-67.8 13.1 22.7 32.7 56.7 58.9 102h52c11 0 20 9 20 20 0 11.1-9 20-20 20z"/>'],
    ['Google Play', 'https://play.google.com/store/apps/details?id=com.gazette.id3689&hl=en_US&gl=US', '0 0 512 512', '<path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>']
  ];

  var CSS = [
    '.dgg-foot{background:var(--paper-2,#F2F1EA);border-top:3px solid var(--ink,#0B0B0F);margin-top:48px;font-family:\'Unify Sans\',\'Helvetica Neue\',Arial,sans-serif;color:var(--ink-2,#1C1C22)}',
    '.dgg-foot-in{max-width:1400px;margin:0 auto;padding:40px 24px 24px}',
    '.dgg-foot-cols{display:grid;grid-template-columns:1fr 1fr 1.3fr;gap:40px}',
    '.dgg-foot h4{font:600 12px/1 \'Unify Sans\',Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--mute,#646468);margin:0 0 14px}',
    '.dgg-foot ul{list-style:none;margin:0;padding:0;font-size:14px;line-height:2.05}',
    '.dgg-foot ul a,.dgg-foot-cookie{color:var(--ink-2,#1C1C22);text-decoration:none;cursor:pointer}',
    '.dgg-foot ul a:hover,.dgg-foot-cookie:hover{color:var(--red,#C8102E);text-decoration:underline}',
    '.dgg-foot-brand img{height:40px;width:auto;margin-bottom:18px;display:block}',
    '.dgg-foot-social{display:flex;gap:16px;margin:4px 0 20px;flex-wrap:wrap}',
    '.dgg-foot-social a{color:var(--ink-2,#1C1C22);transition:color .2s;line-height:0}',
    '.dgg-foot-social a:hover{color:var(--red,#C8102E)}',
    '.dgg-foot-social svg{width:22px;height:22px;display:block;fill:currentColor}',
    '.dgg-foot-apps{display:flex;gap:16px;align-items:center}',
    '.dgg-foot-apps a{color:var(--ink-2,#1C1C22);line-height:0}',
    '.dgg-foot-apps a:hover{color:var(--red,#C8102E)}',
    '.dgg-foot-apps svg{height:22px;width:auto;display:block;fill:currentColor}',
    '.dgg-foot-net{border-top:1px solid var(--rule,#E2E1D8);margin-top:30px;padding-top:18px;display:flex;flex-wrap:wrap;justify-content:center;font-size:13px}',
    '.dgg-foot-net a{color:var(--ink-2,#1C1C22);text-decoration:none;padding:2px 14px;border-right:1px solid var(--rule,#E2E1D8)}',
    '.dgg-foot-net a:last-child{border-right:0}',
    '.dgg-foot-net a:hover{color:var(--red,#C8102E)}',
    '.dgg-foot-copy{text-align:center;font-size:12px;color:var(--mute,#646468);padding:16px 24px 40px;line-height:1.8}',
    '.dgg-foot-copy a{color:var(--mute,#646468);text-decoration:none}',
    '.dgg-foot-copy a:hover{text-decoration:underline}',
    '@media (max-width:780px){.dgg-foot-cols{grid-template-columns:1fr 1fr;gap:28px}.dgg-foot-brand{grid-column:1/-1}}',
    '@media (max-width:520px){.dgg-foot-cols{grid-template-columns:1fr}}'
  ].join('');

  function list(items) {
    return '<ul>' + items.map(function (it) {
      return '<li><a href="' + it[1] + '">' + it[0] + '</a></li>';
    }).join('') + '</ul>';
  }
  function social() {
    return SOCIAL.map(function (s) {
      var vb = s[3] || '0 0 24 24';
      return '<a href="' + s[1] + '" target="_blank" rel="noopener nofollow" aria-label="' + s[0] + '">' +
        '<svg viewBox="' + vb + '" aria-hidden="true" focusable="false">' + s[2] + '</svg></a>';
    }).join('');
  }
  function apps() {
    return APPS.map(function (a) {
      return '<a href="' + a[1] + '" target="_blank" rel="noopener" aria-label="' + a[0] + '">' +
        '<svg viewBox="' + a[2] + '" aria-hidden="true" focusable="false">' + a[3] + '</svg></a>';
    }).join('');
  }
  function net() {
    return NETWORK.map(function (n) {
      return '<a href="' + n[1] + '" target="_blank" rel="noopener">' + n[0] + '</a>';
    }).join('');
  }

  function html() {
    return '<footer class="dgg-foot" role="contentinfo">' +
      '<div class="dgg-foot-in">' +
        '<div class="dgg-foot-cols">' +
          '<div><h4>Sections</h4>' + list(SECTIONS) + '</div>' +
          '<div><h4>Services</h4><ul>' +
            '<li><a class="dgg-foot-cookie" id="ot-sdk-btn">Manage Cookies</a></li>' +
            SERVICES.map(function (it) { return '<li><a href="' + it[1] + '">' + it[0] + '</a></li>'; }).join('') +
          '</ul></div>' +
          '<div class="dgg-foot-brand">' +
            '<a href="index.html" aria-label="The Denver Gazette"><img src="' + LOGO + '" alt="The Denver Gazette" referrerpolicy="no-referrer"></a>' +
            '<div class="dgg-foot-social">' + social() + '</div>' +
            '<div class="dgg-foot-apps">' + apps() + '</div>' +
          '</div>' +
        '</div>' +
        '<nav class="dgg-foot-net" aria-label="Network">' + net() + '</nav>' +
      '</div>' +
      '<p class="dgg-foot-copy">&copy; ' + (new Date().getFullYear()) + ' The Denver Gazette, 555 17th Street, Suite 425 Denver, CO &nbsp;|&nbsp; ' +
        '<a href="https://gazette.com/terms-of-service/">Terms of Service</a> &nbsp;|&nbsp; ' +
        '<a href="https://www.denvergazette.com/privacy-policy/">Privacy Policy</a> &nbsp;|&nbsp; ' +
        '<a href="https://privacyportal.onetrust.com/webform/c7968fb5-dd42-4c76-8f79-3e5198bd1303/d6734ebc-61ff-426c-a161-b6c6214953b8" target="_blank" rel="noopener">Your Privacy Choices</a> &nbsp;|&nbsp; ' +
        '<a href="https://gazette.com/subscription-terms-of-service/">Subscription Terms of Service</a>' +
      '</p>' +
    '</footer>';
  }

  function inject() {
    if (!document.getElementById('dgg-footer-css')) {
      var st = document.createElement('style');
      st.id = 'dgg-footer-css';
      st.textContent = CSS;
      (document.head || document.documentElement).appendChild(st);
    }
    // remove any old inline footers so every page shares this single one
    var olds = document.querySelectorAll('footer:not(.dgg-foot)');
    for (var i = 0; i < olds.length; i++) olds[i].parentNode.removeChild(olds[i]);
    if (document.body && !document.querySelector('footer.dgg-foot')) {
      document.body.insertAdjacentHTML('beforeend', html());
    }
  }

  if (document.body) inject();
  else document.addEventListener('DOMContentLoaded', inject);
})();
