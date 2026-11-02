/*
 * Public visitor dashboard: aggregate statistics only.
 * Individual visit records and coordinates are not rendered.
 */
(() => {
  const ANALYTICS_API = "https://loay-portfolio-analytics-api.loaymohamed165.workers.dev";
  const status = document.querySelector("[data-analytics-status]");
  if (!status) return;

  const totalNode = document.querySelector("[data-total-visits]");
  const countriesNode = document.querySelector("[data-country-list]");
  const safeText = value => value == null || value === "" ? "Unknown" : String(value);

  fetch(ANALYTICS_API + "/stats", { mode: "cors" })
    .then(response => {
      if (!response.ok) throw new Error("Analytics unavailable");
      return response.json();
    })
    .then(data => {
      const countries = Array.isArray(data.countries) ? data.countries : [];
      if (totalNode) totalNode.textContent = Number(data.totalVisits || 0).toLocaleString();

      const countryCount = document.querySelector("[data-country-count]");
      if (countryCount) countryCount.textContent = countries.length.toLocaleString();

      if (countriesNode) {
        countriesNode.replaceChildren();
        countries.forEach(item => {
          const row = document.createElement("li");
          row.textContent = safeText(item.country) + " — " + Number(item.visits || 0).toLocaleString();
          countriesNode.appendChild(row);
        });
        if (!countries.length) {
          const row = document.createElement("li");
          row.textContent = "Country statistics are not available yet.";
          countriesNode.appendChild(row);
        }
      }

      status.textContent = "Live aggregate analytics";
    })
    .catch(() => { status.textContent = "Analytics temporarily unavailable"; });
})();
