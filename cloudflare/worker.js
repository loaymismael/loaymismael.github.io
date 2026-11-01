const COOKIE_NAME = "loay_visitor";
const OWNER_COOKIE = "loay_analytics_excluded";
const VISIT_WINDOW_MINUTES = 30;
const VISITOR_ID_PATTERN = /^[a-f0-9]{32}$/i;

function corsHeaders(origin, allowedOrigin) {
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin"
  };

  // Only grant browser access to the portfolio's exact origin.
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

function cookieValue(request, name) {
  const header = request.headers.get("Cookie") || "";
  const match = header.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
  if (!match) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

function randomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

function validVisitorId(value) {
  return typeof value === "string" && VISITOR_ID_PATTERN.test(value);
}

function validOrigin(request, allowedOrigin) {
  const origin = request.headers.get("Origin");
  return !origin || origin === allowedOrigin;
}

function cookieOptions(name, value) {
  // Partitioned cookies can work in browsers that block ordinary third-party cookies.
  return name + "=" + value +
    "; Max-Age=31536000; Path=/; Secure; HttpOnly; SameSite=None; Partitioned";
}

function approximateCoordinate(value, min, max) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) return null;
  return Math.round(number * 10) / 10;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "https://loaymismael.github.io";
    const headers = corsHeaders(origin, allowedOrigin);

    if (!validOrigin(request, allowedOrigin)) {
      return json({ error: "Origin not allowed" }, 403);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (url.pathname === "/owner/ignore" && request.method === "POST") {
      if (!env.OWNER_BYPASS_TOKEN) {
        return json({ error: "Owner bypass is not configured" }, 503, headers);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400, headers);
      }

      if (!body || typeof body.token !== "string" ||
          body.token !== env.OWNER_BYPASS_TOKEN) {
        return json({ error: "Unauthorized" }, 401, headers);
      }

      return json(
        { ok: true, message: "This browser is excluded from analytics." },
        200,
        {
          ...headers,
          "Set-Cookie": cookieOptions(OWNER_COOKIE, "1")
        }
      );
    }

    if (url.pathname === "/track" && request.method === "POST") {
      if (cookieValue(request, OWNER_COOKIE) === "1") {
        return json({ ok: true, excluded: true }, 200, headers);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400, headers);
      }

      const requestedPath = body && typeof body.path === "string" ? body.path : "/";
      const pagePath = requestedPath.startsWith("/")
        ? requestedPath.split("?")[0].slice(0, 180) || "/"
        : "/";

      const storedVisitorId = cookieValue(request, COOKIE_NAME);
      const visitorId = validVisitorId(storedVisitorId) ? storedVisitorId : randomId();
      const isNewVisitor = !validVisitorId(storedVisitorId);

      const cf = request.cf || {};
      const country = typeof cf.country === "string" ? cf.country.slice(0, 2) : null;
      const city = typeof cf.city === "string" ? cf.city.slice(0, 100) : null;
      const latitude = approximateCoordinate(cf.latitude, -90, 90);
      const longitude = approximateCoordinate(cf.longitude, -180, 180);

      // A single conditional INSERT avoids the separate SELECT-then-INSERT race.
      // D1 serializes writes; the NOT EXISTS check is evaluated with the insert.
      const result = await env.DB.prepare(
        `INSERT INTO visits
          (visitor_id, country, city, latitude, longitude, page_path)
         SELECT ?, ?, ?, ?, ?, ?
         WHERE NOT EXISTS (
           SELECT 1 FROM visits
           WHERE visitor_id = ?
             AND visited_at >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', ?)
         )`
      ).bind(
        visitorId,
        country,
        city,
        latitude,
        longitude,
        pagePath,
        visitorId,
        "-" + VISIT_WINDOW_MINUTES + " minutes"
      ).run();

      const responseHeaders = { ...headers };
      if (isNewVisitor) {
        responseHeaders["Set-Cookie"] = cookieOptions(COOKIE_NAME, visitorId);
      }

      return json(
        { ok: true, recorded: Number(result.meta?.changes || 0) > 0 },
        200,
        responseHeaders
      );
    }

    if (url.pathname === "/stats" && request.method === "GET") {
      const [total, countries, recent] = await Promise.all([
        env.DB.prepare("SELECT COUNT(*) AS total FROM visits").first(),
        env.DB.prepare(
          "SELECT country, COUNT(*) AS visits FROM visits " +
          "WHERE country IS NOT NULL GROUP BY country " +
          "ORDER BY visits DESC LIMIT 12"
        ).all(),
        env.DB.prepare(
          "SELECT country, city, visited_at, page_path, latitude, longitude " +
          "FROM visits ORDER BY id DESC LIMIT 30"
        ).all()
      ]);

      return json({
        totalVisits: total?.total || 0,
        countries: countries.results || [],
        recentVisits: recent.results || []
      }, 200, headers);
    }

    return json({ error: "Not found" }, 404, headers);
  }
};
