(() => {
    const escapeHtml = (value) => String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const token = typeof window.getToken === "function" ? window.getToken() : null;
    const role = typeof window.getRole === "function" ? window.getRole() : null;

    if (!token || role !== "ROLE_ADMIN") {
        window.location.href = "/EcoRide/Front/";
        return;
    }

    const zoneMessage = document.getElementById("mongoStatsMessage");
    const zoneCards = document.getElementById("mongoStatsCards");
    const zoneDaily = document.getElementById("mongoStatsDaily");
    const zoneFilters = document.getElementById("mongoStatsFilters");
    const zoneLatestSearches = document.getElementById("mongoStatsLatestSearches");
    const zoneSnapshots = document.getElementById("mongoStatsSnapshots");
    const boutonRefresh = document.getElementById("mongoStatsRefreshBtn");

    boutonRefresh?.addEventListener("click", async () => {
        await chargerStatsMongo();
    });

    chargerStatsMongo();

    async function chargerStatsMongo() {
        try {
            const stats = await api("http://localhost:8000/api/admin/stats/mongo");

            if (zoneCards) {
                const cartes = [
                    ["Search events", stats.searchEventsTotal],
                    ["Avg results/search", stats.avgResultsPerSearch],
                    ["Avg rating seen", stats.avgRatingSeen],
                    ["Admin snapshots", stats.adminSnapshotsTotal],
                ];

                zoneCards.innerHTML = cartes.map(([label, value]) => `
                    <div class="col-6 col-md-3">
                        <div class="border rounded p-2 text-center h-100">
                            <div class="small text-muted">${escapeHtml(label)}</div>
                            <div class="h5 mb-0">${escapeHtml(value ?? 0)}</div>
                        </div>
                    </div>
                `).join("");
            }

            if (zoneDaily) {
                const daily = Array.isArray(stats.dailySearches) ? stats.dailySearches : [];
                zoneDaily.innerHTML = daily.length
                    ? daily.map((row) => `<span class="badge text-bg-light me-1 mb-1">${escapeHtml(row.date)}: ${escapeHtml(row.count)}</span>`).join("")
                    : "Aucune donnee quotidienne.";
            }

            if (zoneFilters) {
                const usage = stats.filterUsage || {};
                zoneFilters.innerHTML = `
                    <span class="badge text-bg-secondary me-1 mb-1">ecoOnly: ${escapeHtml(usage.ecoOnly ?? 0)}</span>
                    <span class="badge text-bg-secondary me-1 mb-1">maxPrice: ${escapeHtml(usage.maxPrice ?? 0)}</span>
                    <span class="badge text-bg-secondary me-1 mb-1">maxDuration: ${escapeHtml(usage.maxDuration ?? 0)}</span>
                    <span class="badge text-bg-secondary me-1 mb-1">minRating: ${escapeHtml(usage.minRating ?? 0)}</span>
                `;
            }

            if (zoneLatestSearches) {
                const latest = Array.isArray(stats.latestSearches) ? stats.latestSearches : [];
                zoneLatestSearches.innerHTML = latest.length
                    ? latest.map((item) => {
                        const quand = item.createdAt ? new Date(item.createdAt).toLocaleString("fr-FR") : "-";
                        const fromTo = `${item.departure || "?"} -> ${item.destination || "?"}`;
                        return `<div class="border rounded p-2 mb-2"><strong>${escapeHtml(fromTo)}</strong><br><span class="text-muted">${escapeHtml(quand)} | resultats: ${escapeHtml(item.resultsCount ?? 0)} | user: ${escapeHtml(item.userEmail || "anonyme")}</span></div>`;
                    }).join("")
                    : "Aucune recherche recente.";
            }

            if (zoneSnapshots) {
                const snapshots = Array.isArray(stats.latestSnapshots) ? stats.latestSnapshots : [];
                zoneSnapshots.innerHTML = snapshots.length
                    ? snapshots.map((snapshot) => {
                        const date = snapshot.createdAt ? new Date(snapshot.createdAt).toLocaleString("fr-FR") : "-";
                        const s = snapshot.stats || {};
                        return `<div class="border rounded p-2 mb-2"><strong>${escapeHtml(date)}</strong> (${escapeHtml(snapshot.adminEmail || "admin")})<br><span class="text-muted">users: ${escapeHtml(s.usersTotal ?? 0)}, trajets: ${escapeHtml(s.trajetsTotal ?? 0)}, vehicules: ${escapeHtml(s.vehiculesTotal ?? 0)}, avis pending: ${escapeHtml(s.avisPending ?? 0)}</span></div>`;
                    }).join("")
                    : "Aucun snapshot admin recent.";
            }

            afficherMessage("Stats Mongo chargees.", "text-success");
        } catch (error) {
            afficherMessage("Erreur Mongo stats: " + error.message, "text-danger");
        }
    }

    async function api(url, options = {}) {
        const headers = {
            "X-AUTH-TOKEN": token,
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {}),
        };

        const response = await fetch(url, {
            ...options,
            headers,
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(result.message || "Erreur API");
        }

        return result;
    }

    function afficherMessage(message, classe) {
        if (!zoneMessage) {
            return;
        }

        zoneMessage.textContent = message;
        zoneMessage.className = classe || "";
    }
})();
