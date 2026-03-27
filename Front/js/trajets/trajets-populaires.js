function initTrajetsPopulaires() {
    const trajetsDiv = document.getElementById("trajets-populaires");
    if (!trajetsDiv) return;
    chargerTrajetsPopulaires(trajetsDiv, 4);
}

const PHOTO_CONDUCTEUR_PAR_DEFAUT = "/EcoRide/Front/images/environnement.jpg";
const PHOTO_VEHICULE_PAR_DEFAUT = "/EcoRide/Front/images/covoiturage.jpg";

async function chargerTrajetsPopulaires(div, max = 4) {
    div.innerHTML = "<div class='text-center text-muted'>Chargement…</div>";
    try {
        const res = await fetch("http://localhost:8000/api/trajet/populaires");
        if (!res.ok) throw new Error("Erreur lors du chargement.");
        let trajets = await res.json();
        if (!trajets.length) {
            div.innerHTML = "<div class='text-center text-muted'>Aucun trajet populaire actuellement.</div>";
            return;
        }
        trajets = trajets.slice(0, max);
        div.innerHTML = trajets.map(t => `
            <div class="col-12 col-md-6 mb-3">
                <div class="card shadow-sm h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <img src="${t.driverPhoto || PHOTO_CONDUCTEUR_PAR_DEFAUT}" alt="Conducteur" class="rounded-circle me-3 object-fit-cover" width="50" height="50" onerror="this.onerror=null;this.src='${PHOTO_CONDUCTEUR_PAR_DEFAUT}'">
                            <img src="${t.carPhoto || PHOTO_VEHICULE_PAR_DEFAUT}" alt="Véhicule" class="rounded me-3 object-fit-cover" width="50" height="50" onerror="this.onerror=null;this.src='${PHOTO_VEHICULE_PAR_DEFAUT}'">
                            <div>
                                <h6 class="mb-0">${t.driverName || "Conducteur"}</h6>
                                <small class="text-success">${t.vehicle || "Véhicule"} • ${t.placesLibres} places libres</small>
                            </div>
                        </div>
                        <p class="mb-1">${t.depart} → ${t.destination} ${t.eco ? '<span class="badge bg-success">Écologique</span>' : '<span class="badge bg-secondary">Classique</span>'}</p>
                        <p class="mb-1">${formatTrajetDates(t.departAt, t.arriveeAt)}</p>
                        <p class="mb-2"><strong>${t.prix} €</strong></p>
                        <a href="/EcoRide/Front/covoiturage-detail?id=${t.id}" class="btn btn-outline-success btn-sm">Détails</a>
                    </div>
                </div>
            </div>
        `).join("");
    } catch (e) {
        div.innerHTML = "<div class='text-danger'>Erreur lors de l'affichage des trajets populaires.</div>";
    }
}

function formatTrajetDates(departAt, arriveeAt) {
    const d = new Date(departAt);
    const a = new Date(arriveeAt);
    return `${d.toLocaleDateString('fr-FR')} • ${d.toLocaleTimeString('fr-FR', { hour: "2-digit", minute: "2-digit" })} → ${a.toLocaleTimeString('fr-FR', { hour: "2-digit", minute: "2-digit" })}`;
}

initTrajetsPopulaires();

