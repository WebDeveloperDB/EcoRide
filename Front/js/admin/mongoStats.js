(() => {
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
                            <div class="small text-muted">${label}</div>
                            <div class="h5 mb-0">${value ?? 0}</div>
                        </div>
                    </div>
                `).join("");
            }

            if (zoneDaily) {
                const daily = Array.isArray(stats.dailySearches) ? stats.dailySearches : [];
                zoneDaily.innerHTML = daily.length
                    ? daily.map((row) => `<span class="badge text-bg-light me-1 mb-1">${row.date}: ${row.count}</span>`).join("")
                    : "Aucune donnee quotidienne.";
            }

            if (zoneFilters) {
                const usage = stats.filterUsage || {};
                zoneFilters.innerHTML = `
                    <span class="badge text-bg-secondary me-1 mb-1">ecoOnly: ${usage.ecoOnly ?? 0}</span>
                    <span class="badge text-bg-secondary me-1 mb-1">maxPrice: ${usage.maxPrice ?? 0}</span>
                    <span class="badge text-bg-secondary me-1 mb-1">maxDuration: ${usage.maxDuration ?? 0}</span>
                    <span class="badge text-bg-secondary me-1 mb-1">minRating: ${usage.minRating ?? 0}</span>
                `;
            }

            if (zoneLatestSearches) {
                const latest = Array.isArray(stats.latestSearches) ? stats.latestSearches : [];
                zoneLatestSearches.innerHTML = latest.length
                    ? latest.map((item) => {
                        const quand = item.createdAt ? new Date(item.createdAt).toLocaleString("fr-FR") : "-";
                        const fromTo = `${item.departure || "?"} -> ${item.destination || "?"}`;
                        return `<div class="border rounded p-2 mb-2"><strong>${fromTo}</strong><br><span class="text-muted">${quand} | resultats: ${item.resultsCount ?? 0} | user: ${item.userEmail || "anonyme"}</span></div>`;
                    }).join("")
                    : "Aucune recherche recente.";
            }

            if (zoneSnapshots) {
                const snapshots = Array.isArray(stats.latestSnapshots) ? stats.latestSnapshots : [];
                zoneSnapshots.innerHTML = snapshots.length
                    ? snapshots.map((snapshot) => {
                        const date = snapshot.createdAt ? new Date(snapshot.createdAt).toLocaleString("fr-FR") : "-";
                        const s = snapshot.stats || {};
                        return `<div class="border rounded p-2 mb-2"><strong>${date}</strong> (${snapshot.adminEmail || "admin"})<br><span class="text-muted">users: ${s.usersTotal ?? 0}, trajets: ${s.trajetsTotal ?? 0}, vehicules: ${s.vehiculesTotal ?? 0}, avis pending: ${s.avisPending ?? 0}</span></div>`;
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
