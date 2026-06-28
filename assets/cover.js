/* Denver Gazette — Concept v5 · live daily e-edition cover.
 *
 * The cover image on daily.denvergazette.com is a PressReader thumbnail whose
 * filename encodes the date:  1312<YYYYMMDD>00000000001001  (publication 25003).
 * That means the URL changes every day — so we BUILD today's URL from the
 * current date instead of hardcoding one. Date is computed in America/Denver so
 * the cover always matches the paper's publication day (no midnight off-by-one).
 *
 * If today's edition isn't posted yet (early morning), the image 404s and we
 * fall back to yesterday's cover + relabel the date. If both fail, we show a
 * tidy placeholder.
 */
(function () {
  'use strict';

  var PREFIX = '1312';
  var SUFFIX = '00000000001001';
  var SCALE  = 100;               // higher = sharper; thumbnail was 37
  var MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

  // {weekday, month, day, year} for today (offset 0) or a prior day, in Denver time
  function denverParts(offsetDays) {
    var t = new Date();
    if (offsetDays) t = new Date(t.getTime() + offsetDays * 86400000);
    var parts = {};
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Denver',
      weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(t).forEach(function (p) { parts[p.type] = p.value; });
    return parts;
  }

  function coverUrl(p) {
    return 'https://t.prcdn.co/img?file=' + PREFIX + p.year + p.month + p.day + SUFFIX +
           '&page=1&scale=' + SCALE;
  }
  function dateLabel(p) {
    return (p.weekday + ' · ' + MONTHS[+p.month] + ' ' + (+p.day) + ', ' + p.year).toUpperCase();
  }

  function init() {
    var img = document.getElementById('cover-img');
    var dateEl = document.getElementById('cover-date');
    if (!img) return;
    var wrap = img.closest('.rr-ee-cover');

    var today = denverParts(0);
    if (dateEl) dateEl.textContent = dateLabel(today);
    img.alt = 'The Denver Gazette front page · ' + dateLabel(today);

    var triedYesterday = false;

    img.addEventListener('load', function () {
      if (wrap) wrap.classList.add('is-loaded');
    });
    img.addEventListener('error', function () {
      if (triedYesterday) {                    // today AND yesterday failed
        if (wrap) wrap.classList.add('ee-empty');
        var l = wrap && wrap.querySelector('.ee-cover-loading');
        if (l) l.textContent = 'Cover not available';
        return;
      }
      triedYesterday = true;                    // today not posted yet → use yesterday
      var y = denverParts(-1);
      if (dateEl) dateEl.textContent = dateLabel(y);
      img.alt = 'The Denver Gazette front page · ' + dateLabel(y);
      img.src = coverUrl(y);
    });

    img.src = coverUrl(today);
    console.log('[cover] today →', coverUrl(today));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
