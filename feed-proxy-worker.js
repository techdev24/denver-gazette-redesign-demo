/**
 * feed-proxy-worker.js — CORS proxy for Denver Gazette RSS.
 *
 * Why: a static site (GitHub Pages) can't fetch denvergazette.com/feed directly because
 * WordPress RSS doesn't send an Access-Control-Allow-Origin header. This Worker fetches the
 * feed server-side and re-serves it with CORS + a 5-minute edge cache (matches dg-feed-client).
 *
 * Locked to denvergazette.com so it can never be used as an open proxy.
 *
 * Deploy (Cloudflare dashboard or wrangler), then in assets/feeds.js set:
 *   FEED_PROXY = 'https://feeds.<your-subdomain>.workers.dev/?url=';
 *
 * Author: Digital Desk Services · techdev@digitaldesk.services
 */

const ALLOWED_HOST = 'www.denvergazette.com';
const CACHE_TTL = 300; // seconds

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors() });
    }

    const target = new URL(request.url).searchParams.get('url');
    if (!target) {
      return new Response('Missing ?url=', { status: 400, headers: cors() });
    }

    let parsed;
    try { parsed = new URL(target); }
    catch { return new Response('Bad url', { status: 400, headers: cors() }); }

    if (parsed.protocol !== 'https:' || parsed.hostname !== ALLOWED_HOST) {
      return new Response('Host not allowed', { status: 403, headers: cors() });
    }

    const upstream = await fetch(parsed.toString(), {
      cf: { cacheTtl: CACHE_TTL, cacheEverything: true },
      headers: { 'user-agent': 'DG-Feed-Proxy/1.0 (+digitaldesk.services)' }
    });

    if (!upstream.ok) {
      return new Response('Upstream ' + upstream.status, { status: 502, headers: cors() });
    }

    const body = await upstream.text();
    return new Response(body, {
      headers: {
        ...cors(),
        'content-type': 'application/rss+xml; charset=utf-8',
        'cache-control': 'public, max-age=' + CACHE_TTL
      }
    });
  }
};

function cors() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, OPTIONS',
    'access-control-allow-headers': 'Content-Type'
  };
}
