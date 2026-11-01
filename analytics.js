/*
 * Privacy-first visitor tracking.
 * Set ANALYTICS_API to your deployed Worker URL after deployment.
 * Tracking stays disabled while the placeholder remains unchanged.
 */
(() => {
  const ANALYTICS_API = "https://YOUR-WORKER.workers.dev";
  if (ANALYTICS_API.includes("YOUR-WORKER")) return;

  fetch(ANALYTICS_API + "/track", {
    method: "POST",
    mode: "cors",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: window.location.pathname })
  }).catch(() => {
    // Analytics must never interfere with the website experience.
  });
})();
