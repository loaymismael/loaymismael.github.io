/*
 * Privacy-first visitor analytics.
 * Visitor identity is stored on the portfolio's own origin.
 */
(() => {
  "use strict";

  const ANALYTICS_API =
    "https://loay-portfolio-analytics-api.loaymohamed165.workers.dev";

  const VISITOR_KEY = "loay_visitor_id";
  const OWNER_KEY = "loay_analytics_excluded";

  // Exclude the owner's browser before sending any analytics request.
  try {
    if (localStorage.getItem(OWNER_KEY) === "1") return;
  } catch {
    return;
  }

  function createVisitorId() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    return Array.from(
      bytes,
      byte => byte.toString(16).padStart(2, "0")
    ).join("");
  }

  function getVisitorId() {
    try {
      let id = localStorage.getItem(VISITOR_KEY);

      if (!/^[a-f0-9]{32}$/i.test(id || "")) {
        id = createVisitorId();
        localStorage.setItem(VISITOR_KEY, id);
      }

      return id;
    } catch {
      return null;
    }
  }

  const visitorId = getVisitorId();
  if (!visitorId) return;

  fetch(ANALYTICS_API + "/track", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      visitorId,
      path: window.location.pathname
    })
  }).catch(() => {
    // Analytics must never interfere with the website.
  });
})();
