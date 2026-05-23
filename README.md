# Denver Gazette — Homepage Redesign Demo

Static HTML mockup of a denser, more news-forward homepage for
[denvergazette.com](https://www.denvergazette.com/), inspired by the
information density of USA Today and the engagement patterns of NY Post.

**Live demo:** https://techdev24.github.io/denver-gazette-redesign-demo/

## What's in it

- **Top Table** (USA Today-style packed hero) — 1 hero + 4 image tiles + 3 horizontal list items + 8 right-rail headlines = 16 stories above the fold
- **Sports widget** — 4 brand-colored team cards (Broncos / Nuggets / Avalanche / Rockies) with logos and live matched headlines
- **Events widget** — "Next 7 days in Denver" scraped from VisitDenver JSON-LD
- **E-Edition flip card** — today's cover ⇄ yesterday's cover on hover (NY Post pattern)
- **Section bundles** — Politics, Business, Opinion, Crime & Courts
- **More Top Stories split list** — 12 thumb+headline cards
- **Network section** — Colorado Politics, Colorado Springs Gazette, WEX NOW
- **Mile High Pulse** — editorial picks

## Data sources

- DG headlines: `denvergazette.com/feed/` + 5 WP category feeds (47 unique articles)
- Team logos: ESPN CDN
- E-Edition covers: static placeholders (would be ACF / vendor API in prod)
- VisitDenver events: JSON-LD scrape (one-time for demo)

## This is a static snapshot

For production, all of the above wire to `WP_Query` loops + a daily WP-Cron
pull for external feeds (events, network section). See conversation notes
for the WP Engine deployment architecture.
