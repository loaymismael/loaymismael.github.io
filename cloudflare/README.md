# Portfolio Visitor Analytics (Cloudflare)

This folder documents the currently deployed analytics backend for the portfolio.

## Architecture and privacy

- The website creates a random 128-bit visitor ID and stores it in first-party localStorage under the key `loay_visitor_id`.
- The ID is not derived from an IP address. It normally remains stable in the same browser until site storage is cleared or a private session ends.
- The Worker stores one row per visitor ID in the `visitors` table. Its primary key prevents the same ID from being counted as a second unique visitor.
- The `visits` table records at most one visit per visitor ID in a rolling 30-minute window.
- Country and city are read from Cloudflare request metadata. Coordinates, when available, are rounded to one decimal place before storage.
- Raw IP addresses and visitor IDs are not returned by the public statistics endpoint.
- The public `GET /stats` endpoint returns total visit count, unique visitor count, and aggregate country counts only.
- Owner exclusion is performed in the owner's browser by setting `localStorage.setItem("loay_analytics_excluded", "1")`. This is a local browser preference, not an account-wide exclusion.

## D1 database

The database is named `loay-portfolio-analytics`. The Worker expects a D1 binding named `DB`.

Run `schema.sql` when creating a fresh database. It creates both `visits` and `visitors` tables. The live database has already been populated from historical visit records. Do not drop or recreate either live table.

## Worker configuration

The deployed Worker is named `loay-portfolio-analytics-api`.

Required binding: `DB` → `loay-portfolio-analytics`.

Worker variable: `ALLOWED_ORIGIN` = `https://loaymismael.github.io`.

Runtime configuration belongs in Cloudflare and must not be committed as secrets to this public repository.

## Routes

- `POST /track`: validates the browser visitor ID, registers it once in `visitors`, and records a visit subject to the 30-minute window.
- `GET /stats`: returns aggregate totals and country counts.
- `POST /owner/ignore`: retained as a compatibility route; normal owner exclusion is handled by the website's local-storage setting.

## Website integration

`analytics.js` sends the visitor ID and current page path to the Worker. Include it on each public page intended to be counted. `visitors.js` reads `/stats` and displays total visits, unique visitors, and country aggregates on `visitors.html`.

## Important limitations

- Cleared browser storage, a different browser, or a new private session can generate a new visitor ID. The same human may therefore be counted as a new unique browser visitor.
- This is browser-based unique counting, not verified person-level identity.
- A specific analytics retention period has not been configured or promised.
- Test changes against a separate development database before applying them to the live database.
