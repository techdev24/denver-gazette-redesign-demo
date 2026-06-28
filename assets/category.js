/* Denver Gazette — Concept v5 · shared CATEGORY LANDING renderer.
 *
 * One file powers every category landing (Politics, Business, Opinion, Crime…).
 * Each page sets window.DG_CATEGORY = { name, color, feed, tagline } and includes
 * this script; it injects the layout + styles, then pulls the category RSS feed
 * through our dg-feeds proxy and renders uniform cards: thumb · category · headline · date.
 */
(function () {
  'use strict';
  var cfg = window.DG_CATEGORY;
  if (!cfg) return;
  var root = document.getElementById('cat-root');
  if (!root) return;

  var FEED_PROXY = 'https://dg-feeds.techdev-d61.workers.dev/?url=';
  var MAX = 24;

  // ── styles (injected once) ─────────────────────────────────────────────────
  var CSS = [
    '.cat-hero{background:linear-gradient(180deg,#0B0B0F,#15151c);color:#fff;position:relative;overflow:hidden;border-bottom:3px solid var(--cc,#C8102E)}',
    '.cat-hero::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 85% -10%,color-mix(in srgb,var(--cc,#C8102E) 40%,transparent),transparent 60%);pointer-events:none}',
    '.cat-hero-inner{max-width:1400px;margin:0 auto;padding:42px 24px;position:relative}',
    '.cat-eyebrow{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.62);font-weight:700;margin-bottom:11px}',
    '.cat-hero h1{font-weight:900;font-size:clamp(32px,5vw,54px);line-height:1;letter-spacing:-.025em;margin:0}',
    '.cat-hero p{margin:13px 0 0;font-size:16px;line-height:1.5;color:rgba(255,255,255,.8);max-width:60ch}',
    '.cat-slim{max-width:1400px;margin:0 auto;padding:30px 24px 0}',
    '.cat-slim .cat-eyebrow{color:var(--alpen,#C2410C)}',
    '.cat-slim h1{font-weight:900;font-size:clamp(28px,3.6vw,40px);letter-spacing:-.022em;line-height:1;border-bottom:3px solid var(--cc,#C8102E);padding-bottom:14px;margin:0}',
    '.cat-slim p{margin:13px 0 0;font-size:15px;line-height:1.5;color:var(--mute,#646468);max-width:70ch}',
    '.cat-main{max-width:1400px;margin:0 auto;padding:28px 24px 56px}',
    '.cat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:22px}',
    '.cat-card{display:flex;flex-direction:column;border:1px solid var(--rule,#E2E1D8);border-radius:6px;overflow:hidden;background:#fff;text-decoration:none;color:inherit;transition:border-color .2s,transform .2s,box-shadow .2s}',
    '.cat-card:hover{border-color:var(--ink-2,#1C1C22);transform:translateY(-3px);box-shadow:0 10px 24px rgba(0,0,0,.07)}',
    '.cat-thumb{position:relative;width:100%;aspect-ratio:16/10;background:#1F2937;overflow:hidden}',
    '.cat-thumb img{width:100%;height:100%;object-fit:cover}',
    '.cat-thumb--empty{background:repeating-linear-gradient(135deg,#2b2b33,#2b2b33 8px,#33333c 8px,#33333c 16px)}',
    '.cat-tag{position:absolute;top:10px;left:10px;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:#fff;background:var(--tc,#0B0B0F);padding:4px 8px;border-radius:3px}',
    '.cat-cbody{padding:13px 15px 17px;display:flex;flex-direction:column;flex:1}',
    '.cat-when{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--alpen,#C2410C);font-weight:700}',
    '.cat-h{font-weight:900;font-size:16px;line-height:1.2;letter-spacing:-.004em;margin:6px 0 0}',
    '.cat-card:hover .cat-h{color:var(--cc,#C8102E)}',
    '.cat-empty{grid-column:1 / -1;padding:56px 8px;text-align:center;color:var(--mute,#646468);font-size:15px}',
    '.cat-foot{border-top:1px solid var(--rule,#E2E1D8);background:#FAFAF7;padding:30px 24px}',
    '.cat-foot-in{max-width:1400px;margin:0 auto;display:flex;justify-content:space-between;font-size:11px;color:var(--mute,#646468);letter-spacing:.06em;text-transform:uppercase}',
    '.cat-foot-in .dds{color:var(--ink,#0B0B0F);font-weight:600}',
    '@media (max-width:1100px){.cat-grid{grid-template-columns:repeat(3,1fr)}}',
    '@media (max-width:820px){.cat-grid{grid-template-columns:repeat(2,1fr)}.cat-main{padding:18px 14px 40px}.cat-hero-inner{padding:30px 16px}}',
    '@media (max-width:520px){.cat-grid{grid-template-columns:1fr}}'
  ].join('');

  // ── helpers (RSS parsing, mirrors feeds.js) ────────────────────────────────
  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function decode(s){var t=document.createElement('textarea');t.innerHTML=s||'';return t.value;}
  function stripTags(s){var d=document.createElement('div');d.innerHTML=s||'';return (d.textContent||'').trim();}
  function xtag(i,n){var e=i.getElementsByTagName(n);return e&&e.length?e[0]:null;}
  function xtext(i,n){var e=xtag(i,n);return e?(e.textContent||''):'';}
  function imageOf(item){
    var mc=xtag(item,'media:content')||xtag(item,'content');
    if(mc&&mc.getAttribute&&mc.getAttribute('url'))return mc.getAttribute('url');
    var mt=xtag(item,'media:thumbnail')||xtag(item,'thumbnail');
    if(mt&&mt.getAttribute&&mt.getAttribute('url'))return mt.getAttribute('url');
    var enc=xtag(item,'enclosure');
    if(enc&&/image/i.test(enc.getAttribute('type')||''))return enc.getAttribute('url');
    var body=xtext(item,'content:encoded')||xtext(item,'encoded')||xtext(item,'description')||'';
    var m=body.match(/<img[^>]+src=["']([^"']+)["']/i);
    return m?m[1]:'';
  }
  function categoryOf(item,fallback){var c=xtag(item,'category');var t=c?stripTags(decode(c.textContent)):'';return t||fallback||'';}
  function dateLabel(pub){if(!pub)return '';var d=new Date(pub);return isNaN(d)?'':d.toLocaleDateString('en-US',{month:'short',day:'numeric'});}

  function parseFeed(xml,max){
    var end=xml.indexOf('</rss>'); if(end!==-1) xml=xml.slice(0,end+6);
    var doc=new DOMParser().parseFromString(xml,'text/xml');
    if(doc.getElementsByTagName('parsererror').length) throw new Error('malformed-xml');
    var items=Array.prototype.slice.call(doc.getElementsByTagName('item')).slice(0,max);
    if(!items.length) throw new Error('no-items');
    return items.map(function(it){
      return {
        title: stripTags(decode(xtext(it,'title'))),
        url: (xtext(it,'link')||'').trim(),
        img: imageOf(it),
        cat: categoryOf(it,cfg.name),
        date: dateLabel(xtext(it,'pubDate'))
      };
    });
  }

  function card(a){
    return '<a class="cat-card" href="'+esc(a.url)+'" target="_blank" rel="noopener">'+
      '<div class="cat-thumb">'+
        (a.img?'<img src="'+esc(a.img)+'" alt="" loading="lazy" decoding="async" onerror="this.parentElement.classList.add(\'cat-thumb--empty\');this.remove()">':'')+
        '<span class="cat-tag" style="--tc:'+(cfg.color||'#0B0B0F')+'">'+esc(a.cat)+'</span>'+
      '</div>'+
      '<div class="cat-cbody">'+
        (a.date?'<div class="cat-when">'+esc(a.date)+'</div>':'')+
        '<h3 class="cat-h">'+esc(a.title)+'</h3>'+
      '</div></a>';
  }

  function build() {
    var s=document.createElement('style'); s.textContent=CSS; document.head.appendChild(s);
    var col = cfg.color || '#C8102E';
    var head = cfg.compact
      ? ('<header class="cat-slim" style="--cc:'+col+'">'+
           '<div class="cat-eyebrow">The Denver Gazette</div>'+
           '<h1>'+esc(cfg.name)+'</h1>'+
           (cfg.tagline?'<p>'+esc(cfg.tagline)+'</p>':'')+
         '</header>')
      : ('<section class="cat-hero" style="--cc:'+col+'">'+
           '<div class="cat-hero-inner">'+
             '<div class="cat-eyebrow">The Denver Gazette</div>'+
             '<h1>'+esc(cfg.name)+'</h1>'+
             (cfg.tagline?'<p>'+esc(cfg.tagline)+'</p>':'')+
           '</div>'+
         '</section>');
    root.innerHTML = head +
      '<main class="cat-main"><div class="cat-grid" id="cat-grid"><div class="cat-empty">Loading the latest '+esc(cfg.name)+'…</div></div></main>'+
      '<footer class="cat-foot"><div class="cat-foot-in"><span>© The Denver Gazette</span><span class="dds">Powered by Digital Desk Services</span></div></footer>';

    fetch(FEED_PROXY+encodeURIComponent(cfg.feed),{cache:'no-store'})
      .then(function(r){if(!r.ok)throw new Error('http '+r.status);return r.text();})
      .then(function(xml){
        var items=parseFeed(xml,MAX);
        console.log('[category:'+cfg.key+'] '+items.length+' stories');
        document.getElementById('cat-grid').innerHTML=items.map(card).join('');
      })
      .catch(function(e){
        console.warn('[category:'+(cfg.key||'?')+'] →',e.message);
        var g=document.getElementById('cat-grid');
        if(g) g.innerHTML='<div class="cat-empty">Couldn\u2019t load '+esc(cfg.name)+' stories right now. Please check back shortly.</div>';
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
