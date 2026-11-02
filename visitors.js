/*
 * Public visitor dashboard: aggregate statistics only.
 * Individual visit records and coordinates are not rendered.
 */
(() => {
  const ANALYTICS_API = "https://loay-portfolio-analytics-api.loaymohamed165.workers.dev";
  const totalNode = document.querySelector("[data-total-visits]");
  const countryCount = document.querySelector("[data-country-count]");
  const countriesNode = document.querySelector("[data-country-list]");
  const countryNames = typeof Intl.DisplayNames === "function"
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

  const countryLabel = code => {
    if (typeof code !== "string" || !/^[A-Z]{2}$/.test(code)) return "Unknown";
    try {
      return countryNames ? countryNames.of(code) || code : code;
    } catch {
      return code;
    }
  };

  fetch(ANALYTICS_API + "/stats", { mode: "cors" })
    .then(response => {
      if (!response.ok) throw new Error("Analytics unavailable");
      return response.json();
    })
    .then(data => {
      const countries = Array.isArray(data.countries) ? data.countries : [];

      if (totalNode) {
        totalNode.textContent = Number(data.totalVisits || 0).toLocaleString();
      }

      if (countryCount) {
        countryCount.textContent = countries.length.toLocaleString();
      }

      if (countriesNode) {
        countriesNode.replaceChildren();

        countries.forEach(item => {
          const row = document.createElement("li");
          row.textContent = countryLabel(item.country) + " — " +
            Number(item.visits || 0).toLocaleString();
          countriesNode.appendChild(row);
        });

        if (!countries.length) {
          const row = document.createElement("li");
          row.textContent = "Country statistics are not available yet.";
          countriesNode.appendChild(row);
        }
      }
    })
    .catch(error => {
      console.error("Visitor analytics error:", error);
      if (totalNode) totalNode.textContent = "—";
      if (countryCount) countryCount.textContent = "—";
      if (countriesNode) {
        countriesNode.replaceChildren();
        const row = document.createElement("li");
        row.textContent = "Analytics temporarily unavailable. Please try again later.";
        countriesNode.appendChild(row);
      }
    });
})();