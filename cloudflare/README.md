# Portfolio Visitor Analytics (Cloudflare)

This folder contains the optional analytics backend for the portfolio.

## Privacy choices

- Raw IP addresses are never written to D1 or returned by the API.
- Country and city come from Cloudflare request metadata.
- Coordinates are rounded to one decimal place before storage for approximate map placement.
- A random first-party visitor token is stored in a Secure, HttpOnly cookie. It is not derived from an IP address.
- Repeat page loads from the same browser are grouped into one visit within a 30-minute window.
- The public API returns aggregate country counts and a limited recent-visit list; it never returns visitor tokens.
- Owner exclusion is a separate HttpOnly cookie set only after a valid secret is submitted to the Worker.

## 1. Create the D1 database

In Cloudflare Dashboard, open **Workers & Pages → D1 SQL Database**, create a database named
`loay-portfolio-analytics`, then run the contents of `schema.sql` in its SQL console.
Copy its database ID into `wrangler.toml`.

## 2. Create and deploy the Worker

Create a Worker named `loay-portfolio-analytics`. Deploy `worker.js` as its entry point,
and configure the D1 binding exactly as follows:

- Variable name: `DB`
- D1 database: `loay-portfolio-analytics`

Set the Worker variable `ALLOWED_ORIGIN` to:
`https://loaymismael.github.io`

Create a Worker secret named `OWNER_BYPASS_TOKEN` with a long random value.
Do not put this secret in GitHub, HTML, JavaScript, or a public message.

The Worker routes are:
- `POST /track` — records a visit if the browser has not been counted in the last 30 minutes.
- `GET /stats` — returns totals, country counts, and recent visits.
- `POST /owner/ignore` — sets the owner-exclusion cookie when given the secret.

## 3. Connect the website

After deploying, copy the Worker URL (for example, `https://loay-portfolio-analytics.<account>.workers.dev`).
Replace the placeholder `ANALYTICS_API` in both `analytics.js` and `visitors.js` with that URL.

Add this script before the closing `</body>` tag on every page you want counted:
`<script src="analytics.js"></script>`

On `visitors.html`, add:
`<script src="visitors.js"></script>`

The Visitors page needs elements with these attributes for live values:
- `data-analytics-status`
- `data-total-visits`
- `data-country-list`
- `data-recent-visits`

Until the API URL is configured and deployment is tested, the website tracker remains disabled.

## 4. Exclude your own browser

From a private local script or browser console on your own site, send:
```js
fetch("https://YOUR-WORKER.workers.dev/owner/ignore", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ token: "YOUR_OWNER_BYPASS_TOKEN" })
});
```

Do not share the token. Repeat this on each browser/device you use. The exclusion cookie lasts one year.

## 5. Verify before announcing launch

1. Open the site in a normal browser and confirm one visit appears.
2. Reload several times within 30 minutes; the visit count should not increase.
3. Use a second browser/device and confirm it is counted separately.
4. Set the owner exclusion cookie and confirm that browser no longer records visits.
5. Check that no IP address or visitor token appears in D1 query results or the public API.
6. Test the site on mobile and desktop.

Do not describe analytics as active until these checks pass.
