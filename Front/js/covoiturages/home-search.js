console.log("js funktioniert");
function initHomeSearch() {
    const searchForm = document.getElementById("search-form");
    const resultsDiv = document.getElementById("search-results");
    if (!searchForm || !resultsDiv) return;

    searchForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const departure = document.getElementById("departure").value.trim();
        const destination = document.getElementById("destination").value.trim();
        const date = document.getElementById("travel-date").value;

        if (!departure || !destination || !date) {
            alert("Veuillez remplir tous les champs.");
            return;
        }

        resultsDiv.innerHTML = "<div class='text-center text-muted'>Recherche en cours…</div>";

        try {
            const params = new URLSearchParams({
                departure,
                destination,
                date
            }).toString();

            const res = await fetch(`http://localhost:8000/api/trajet/search?${params}`);
            if (!res.ok) throw new Error("Erreur lors de la recherche.");

            let trajets = await res.json();
            if (!trajets.length) {
                resultsDiv.innerHTML = "<div class='text-center text-muted'>Aucun trajet trouvé.</div>";
                return;
            }
            // maximal 3 ergebnisse
            trajets = trajets.slice(0, 3);
            resultsDiv.innerHTML = trajets.map(t => `
                <div class="card mb-3 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-2">
                            <img src="${t.driverPhoto || '/images/driver-placeholder.jpg'}" alt="Conducteur" class="rounded-circle me-2" width="36" height="36">
                            <strong>${t.driverName || "Conducteur"}</strong>
                            <span class="badge bg-success ms-2">${t.eco ? "Écologique" : ""}</span>
                        </div>
                        <p class="mb-1">${t.depart} → ${t.destination}</p>
                        <p class="mb-1">${formatTrajetDates(t.departAt, t.arriveeAt)}</p>
                        <p class="mb-1"><strong>${t.prix} €</strong></p>
                        <a href="/covoiturage" class="btn btn-outline-success btn-sm">Voir détails</a>
                    </div>
                </div>
            `).join("");
        } catch (e) {
            resultsDiv.innerHTML = "<div class='text-danger'>Erreur lors de la recherche.</div>";
        }
    });
}

function formatTrajetDates(departAt, arriveeAt) {
    const d = new Date(departAt);
    const a = new Date(arriveeAt);
    return `${d.toLocaleDateString('fr-FR')} • ${d.toLocaleTimeString('fr-FR', { hour: "2-digit", minute: "2-digit" })} → ${a.toLocaleTimeString('fr-FR', { hour: "2-digit", minute: "2-digit" })}`;
}

initHomeSearch();
