/*
 * Set ANALYTICS_API to the deployed Cloudflare Worker URL.
 * Until configured, the page remains in setup-pending state.
 */
(() => {
  const ANALYTICS_API = "https://loay-portfolio-analytics-api.loaymohamed165.workers.dev";
  const status = document.querySelector("[data-analytics-status]");
  if (!status) return;

  if (ANALYTICS_API.includes("YOUR-WORKER")) {
    status.textContent = "Analytics setup pending";
    return;
  }

  const totalNode = document.querySelector("[data-total-visits]");
  const countriesNode = document.querySelector("[data-country-list]");
  const recentNode = document.querySelector("[data-recent-visits]");

  const safeText = value => value == null || value === "" ? "Unknown" : String(value);

  fetch(ANALYTICS_API + "/stats", { mode: "cors" })
    .then(response => {
      if (!response.ok) throw new Error("Analytics unavailable");
      return response.json();
    })
    .then(data => {
      if (totalNode) totalNode.textContent = Number(data.totalVisits || 0).toLocaleString();
      const countryCount = document.querySelector("[data-country-count]");
      const recentCount = document.querySelector("[data-recent-count]");
      if (countryCount) countryCount.textContent = (data.countries || []).length.toLocaleString();
      if (recentCount) recentCount.textContent = (data.recentVisits || []).length.toLocaleString();
      if (countriesNode) {
        countriesNode.replaceChildren();
        (data.countries || []).forEach(item => {
          const row = document.createElement("li");
          row.textContent = safeText(item.country) + " — " + Number(item.visits || 0).toLocaleString();
          countriesNode.appendChild(row);
        });
      }
      if (recentNode) {
        recentNode.replaceChildren();
        (data.recentVisits || []).forEach(item => {
          const row = document.createElement("li");
          const when = item.visited_at ? new Date(item.visited_at).toLocaleString() : "Time unavailable";
          row.textContent = [safeText(item.city), safeText(item.country), when].join(" · ");
          recentNode.appendChild(row);
        });
      }
      status.textContent = "Live analytics";
    })
    .catch(() => { status.textContent = "Analytics temporarily unavailable"; });
})();
