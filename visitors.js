/*
 * Visitor dashboard powered by the Cloudflare analytics API.
 * The map uses OpenStreetMap tiles through Leaflet.
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

  function renderMap(visits) {
    const mapNode = document.getElementById("visitorMap");
    if (!mapNode || !window.L) return;

    const points = (visits || []).filter(item =>
      Number.isFinite(Number(item.latitude)) &&
      Number.isFinite(Number(item.longitude)) &&
      item.latitude !== null && item.longitude !== null
    );

    const map = L.map(mapNode, { scrollWheelZoom: false }).setView([20, 0], 2);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
    }).addTo(map);

    const markers = [];
    points.forEach(item => {
      const marker = L.circleMarker(
        [Number(item.latitude), Number(item.longitude)],
        { radius: 7, color: "#ffffff", weight: 1.5, fillColor: "#3977d5", fillOpacity: 0.85 }
      );
      const popup = document.createElement("div");
      const place = document.createElement("strong");
      place.textContent = [safeText(item.city), safeText(item.country)].join(", ");
      const time = document.createElement("div");
      time.textContent = item.visited_at ? new Date(item.visited_at).toLocaleString() : "Time unavailable";
      popup.append(place, time);
      marker.bindPopup(popup).addTo(map);
      markers.push(marker);
    });

    if (markers.length === 1) {
      map.setView(markers[0].getLatLng(), 4);
    } else if (markers.length > 1) {
      map.fitBounds(L.featureGroup(markers).getBounds().pad(0.2), { maxZoom: 5 });
    }
    window.setTimeout(() => map.invalidateSize(), 0);
  }

  fetch(ANALYTICS_API + "/stats", { mode: "cors" })
    .then(response => {
      if (!response.ok) throw new Error("Analytics unavailable");
      return response.json();
    })
    .then(data => {
      const countries = data.countries || [];
      const recentVisits = data.recentVisits || [];
      if (totalNode) totalNode.textContent = Number(data.totalVisits || 0).toLocaleString();
      const countryCount = document.querySelector("[data-country-count]");
      const recentCount = document.querySelector("[data-recent-count]");
      if (countryCount) countryCount.textContent = countries.length.toLocaleString();
      if (recentCount) recentCount.textContent = recentVisits.length.toLocaleString();

      if (countriesNode) {
        countriesNode.replaceChildren();
        countries.forEach(item => {
          const row = document.createElement("li");
          row.textContent = safeText(item.country) + " — " + Number(item.visits || 0).toLocaleString();
          countriesNode.appendChild(row);
        });
      }

      if (recentNode) {
        recentNode.replaceChildren();
        recentVisits.forEach(item => {
          const row = document.createElement("li");
          const when = item.visited_at ? new Date(item.visited_at).toLocaleString() : "Time unavailable";
          row.textContent = [safeText(item.city), safeText(item.country), when].join(" · ");
          recentNode.appendChild(row);
        });
      }

      renderMap(recentVisits);
      status.textContent = "Live analytics";
    })
    .catch(() => { status.textContent = "Analytics temporarily unavailable"; });
})();
