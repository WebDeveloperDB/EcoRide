function initTrajetsPopulaires() {
    const trajetsDiv = document.getElementById("trajets-populaires");
    if (!trajetsDiv) return;
    chargerTrajetsPopulaires(trajetsDiv, 3);
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
                        ${construireActionsAdmin(t)}
                    </div>
                </div>
            </div>
        `).join("");

        activerActionsAdmin(div);
    } catch (e) {
        div.innerHTML = "<div class='text-danger'>Erreur lors de l'affichage des trajets populaires.</div>";
    }
}

function formatTrajetDates(departAt, arriveeAt) {
    const d = new Date(departAt);
    const a = new Date(arriveeAt);
    return `${d.toLocaleDateString('fr-FR')} • ${d.toLocaleTimeString('fr-FR', { hour: "2-digit", minute: "2-digit" })} → ${a.toLocaleTimeString('fr-FR', { hour: "2-digit", minute: "2-digit" })}`;
}

function estAdminConnecte() {
    return typeof window.getRole === "function" && window.getRole() === "ROLE_ADMIN";
}

function construireActionsAdmin(trajet) {
    if (!estAdminConnecte()) {
        return "";
    }

    return `
        <div class="d-flex gap-2 mt-2">
            <button type="button" class="btn btn-sm btn-outline-secondary" data-admin-modifier-trajet="${trajet.id}">Modifier</button>
            <button type="button" class="btn btn-sm btn-outline-danger" data-admin-supprimer-trajet="${trajet.id}">Supprimer</button>
        </div>
    `;
}

function activerActionsAdmin(conteneur) {
    if (!estAdminConnecte()) {
        return;
    }

    conteneur.querySelectorAll("[data-admin-supprimer-trajet]").forEach((bouton) => {
        bouton.addEventListener("click", async () => {
            const idTrajet = bouton.getAttribute("data-admin-supprimer-trajet");
            if (!idTrajet || !confirm("Supprimer ce trajet ?")) {
                return;
            }
            await supprimerTrajetAdmin(idTrajet);
            initTrajetsPopulaires();
        });
    });

    conteneur.querySelectorAll("[data-admin-modifier-trajet]").forEach((bouton) => {
        bouton.addEventListener("click", async () => {
            const idTrajet = bouton.getAttribute("data-admin-modifier-trajet");
            if (!idTrajet) {
                return;
            }
            const nouveauPrix = window.prompt("Nouveau prix du trajet :");
            if (nouveauPrix === null) {
                return;
            }
            const nouvellesPlaces = window.prompt("Nouveau nombre de places libres :");
            if (nouvellesPlaces === null) {
                return;
            }
            await modifierTrajetAdmin(idTrajet, nouveauPrix, nouvellesPlaces);
            initTrajetsPopulaires();
        });
    });
}

async function supprimerTrajetAdmin(idTrajet) {
    const token = typeof window.getToken === "function" ? window.getToken() : null;
    if (!token) {
        alert("Connexion admin requise.");
        return;
    }

    const reponse = await fetch(`http://localhost:8000/api/trajet/${idTrajet}`, {
        method: "DELETE",
        headers: {
            "X-AUTH-TOKEN": token,
        },
    });

    if (!reponse.ok) {
        const resultat = await reponse.json().catch(() => ({}));
        throw new Error(resultat.message || "Suppression impossible.");
    }
}

async function modifierTrajetAdmin(idTrajet, prix, placesLibres) {
    const token = typeof window.getToken === "function" ? window.getToken() : null;
    if (!token) {
        alert("Connexion admin requise.");
        return;
    }

    const reponse = await fetch(`http://localhost:8000/api/trajet/${idTrajet}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "X-AUTH-TOKEN": token,
        },
        body: JSON.stringify({
            prix: Number.parseFloat(prix),
            placesLibres: Number.parseInt(placesLibres, 10),
        }),
    });

    if (!reponse.ok) {
        const resultat = await reponse.json().catch(() => ({}));
        throw new Error(resultat.message || "Modification impossible.");
    }
}

initTrajetsPopulaires();

