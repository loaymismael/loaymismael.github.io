const VISITOR_ID_PATTERN = /^[a-f0-9]{32}$/i;
const VISIT_WINDOW_MINUTES = 30;

function corsHeaders(origin, allowedOrigin) {
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };

  if (origin === allowedOrigin) {
    headers["Access-Control-Allow-Origin"] = allowedOrigin;
  }

  return headers;
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers
    }
  });
}

function validOrigin(request, allowedOrigin) {
  const origin = request.headers.get("Origin");
  return !origin || origin === allowedOrigin;
}

function validVisitorId(value) {
  return typeof value === "string" &&
    VISITOR_ID_PATTERN.test(value);
}

function approximateCoordinate(value, min, max) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < min || number > max) {
    return null;
  }

  return Math.round(number * 10) / 10;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin =
      env.ALLOWED_ORIGIN || "https://loaymismael.github.io";

    const headers = corsHeaders(origin, allowedOrigin);

    if (!validOrigin(request, allowedOrigin)) {
      return json({ error: "Origin not allowed" }, 403, headers);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    // Track visits and register each browser only once.
    if (url.pathname === "/track" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400, headers);
      }

      const visitorId = body?.visitorId;

      if (!validVisitorId(visitorId)) {
        return json({ error: "Invalid visitor ID" }, 400, headers);
      }

      const requestedPath =
        typeof body.path === "string" ? body.path : "/";

      const pagePath = requestedPath.startsWith("/")
        ? requestedPath.split("?")[0].slice(0, 180) || "/"
        : "/";

      const cf = request.cf || {};

      const country =
        typeof cf.country === "string" ? cf.country.slice(0, 2) : null;

      const city =
        typeof cf.city === "string" ? cf.city.slice(0, 100) : null;

      const latitude = approximateCoordinate(cf.latitude, -90, 90);
      const longitude = approximateCoordinate(cf.longitude, -180, 180);

      const results = await env.DB.batch([
        env.DB.prepare(
          `INSERT OR IGNORE INTO visitors
            (visitor_id, first_seen_at)
           VALUES (?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`
        ).bind(visitorId),

        env.DB.prepare(
          `INSERT INTO visits
            (visitor_id, country, city, latitude, longitude, page_path)
           SELECT ?, ?, ?, ?, ?, ?
           WHERE NOT EXISTS (
             SELECT 1 FROM visits
             WHERE visitor_id = ?
               AND visited_at >= strftime(
                 '%Y-%m-%dT%H:%M:%fZ',
                 'now',
                 ?
               )
           )`
        ).bind(
          visitorId,
          country,
          city,
          latitude,
          longitude,
          pagePath,
          visitorId,
          `-${VISIT_WINDOW_MINUTES} minutes`
        )
      ]);

      return json({
        ok: true,
        newVisitor: Number(results[0]?.meta?.changes || 0) > 0,
        recorded: Number(results[1]?.meta?.changes || 0) > 0
      }, 200, headers);
    }

    // Legacy owner endpoint retained for compatibility.
    if (url.pathname === "/owner/ignore" && request.method === "POST") {
      if (!env.OWNER_BYPASS_TOKEN) {
        return json(
          { error: "Owner bypass is not configured" },
          503,
          headers
        );
      }

      let body;

      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400, headers);
      }

      if (body?.token !== env.OWNER_BYPASS_TOKEN) {
        return json({ error: "Unauthorized" }, 401, headers);
      }

      return json({
        ok: true,
        message: "This browser should use the portfolio owner exclusion."
      }, 200, headers);
    }

    // Public aggregate statistics.
    if (url.pathname === "/stats" && request.method === "GET") {
      const [total, unique, countries] = await Promise.all([
        env.DB.prepare(
          "SELECT COUNT(*) AS total FROM visits"
        ).first(),

        env.DB.prepare(
          "SELECT COUNT(*) AS total FROM visitors"
        ).first(),

        env.DB.prepare(
          `SELECT country, COUNT(*) AS visits
           FROM visits
           WHERE country IS NOT NULL
           GROUP BY country
           ORDER BY visits DESC
           LIMIT 12`
        ).all()
      ]);

      return json({
        totalVisits: total?.total || 0,
        uniqueVisitors: unique?.total || 0,
        countries: countries.results || []
      }, 200, headers);
    }

    return json({ error: "Not found" }, 404, headers);
  }
};