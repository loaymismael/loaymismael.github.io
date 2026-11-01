const COOKIE_NAME = "loay_visitor";
const OWNER_COOKIE = "loay_analytics_excluded";
const VISIT_WINDOW_MINUTES = 30;

function corsHeaders(origin, allowedOrigin) {
  return {
    "Access-Control-Allow-Origin": origin === allowedOrigin ? allowedOrigin : allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin"
  };
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers }
  });
}

function cookieValue(request, name) {
  const header = request.headers.get("Cookie") || "";
  const match = header.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function randomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

function validOrigin(request, allowedOrigin) {
  const origin = request.headers.get("Origin");
  return !origin || origin === allowedOrigin;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = env.ALLOWED_ORIGIN || "https://loaymismael.github.io";
    const headers = corsHeaders(origin, allowedOrigin);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (!validOrigin(request, allowedOrigin)) return json({ error: "Origin not allowed" }, 403, headers);

    if (url.pathname === "/owner/ignore" && request.method === "POST") {
      if (!env.OWNER_BYPASS_TOKEN) return json({ error: "Owner bypass is not configured" }, 503, headers);
      let body;
      try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400, headers); }
      if (body.token !== env.OWNER_BYPASS_TOKEN) return json({ error: "Unauthorized" }, 401, headers);
      return json({ ok: true, message: "This browser is excluded from analytics." }, 200, {
        ...headers,
        "Set-Cookie": OWNER_COOKIE + "=1; Max-Age=31536000; Path=/; Secure; HttpOnly; SameSite=Lax"
      });
    }

    if (url.pathname === "/track" && request.method === "POST") {
      if (cookieValue(request, OWNER_COOKIE) === "1") return json({ ok: true, excluded: true }, 200, headers);
      let body;
      try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400, headers); }
      const pagePath = typeof body.path === "string" && body.path.startsWith("/")
        ? body.path.slice(0, 180) : "/";
      let visitorId = cookieValue(request, COOKIE_NAME);
      const isNewVisitor = !visitorId;
      if (!visitorId) visitorId = randomId();

      const lastVisit = await env.DB.prepare(
        "SELECT visited_at FROM visits WHERE visitor_id = ? ORDER BY id DESC LIMIT 1"
      ).bind(visitorId).first();

      let recorded = false;
      if (!lastVisit || Date.now() - Date.parse(lastVisit.visited_at) > VISIT_WINDOW_MINUTES * 60 * 1000) {
        const cf = request.cf || {};
        const lat = Number.isFinite(Number(cf.latitude)) ? Math.round(Number(cf.latitude) * 10) / 10 : null;
        const lon = Number.isFinite(Number(cf.longitude)) ? Math.round(Number(cf.longitude) * 10) / 10 : null;
        await env.DB.prepare(
          "INSERT INTO visits (visitor_id, country, city, latitude, longitude, page_path) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(visitorId, cf.country || null, cf.city || null, lat, lon, pagePath).run();
        recorded = true;
      }

      const responseHeaders = { ...headers };
      if (isNewVisitor) responseHeaders["Set-Cookie"] =
        COOKIE_NAME + "=" + visitorId + "; Max-Age=31536000; Path=/; Secure; HttpOnly; SameSite=Lax";
      return json({ ok: true, recorded }, 200, responseHeaders);
    }

    if (url.pathname === "/stats" && request.method === "GET") {
      const [total, countries, recent] = await Promise.all([
        env.DB.prepare("SELECT COUNT(*) AS total FROM visits").first(),
        env.DB.prepare("SELECT country, COUNT(*) AS visits FROM visits WHERE country IS NOT NULL GROUP BY country ORDER BY visits DESC LIMIT 12").all(),
        env.DB.prepare("SELECT country, city, visited_at, page_path, latitude, longitude FROM visits ORDER BY id DESC LIMIT 30").all()
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
