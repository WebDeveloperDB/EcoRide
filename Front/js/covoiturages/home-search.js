const URL_DETAIL_COVOITURAGE = `${window.location.origin}/EcoRide/Front/covoiturage-detail`;
const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

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
       
            trajets = trajets.slice(0, 3);
            resultsDiv.innerHTML = trajets.map(t => `
                <div class="card mb-3 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-2">
                            ${t.driverPhoto ? `<img src="${escapeHtml(t.driverPhoto)}" alt="Conducteur" class="rounded-circle me-2 object-fit-cover" width="36" height="36">` : ""}
                            <strong>${escapeHtml(t.driverName || "Conducteur")}</strong>
                            <span class="badge bg-success ms-2">${t.eco ? "Écologique" : ""}</span>
                        </div>
                        <p class="mb-1">${escapeHtml(t.depart)} → ${escapeHtml(t.destination)}</p>
                        <p class="mb-1">${escapeHtml(formatTrajetDates(t.departAt, t.arriveeAt))}</p>
                        <p class="mb-1"><strong>${escapeHtml(t.prix)} €</strong></p>
                        <a href="${URL_DETAIL_COVOITURAGE}?id=${encodeURIComponent(t.id)}" class="btn btn-outline-success btn-sm">Voir détails</a>
                        ${construireActionsAdminAccueil(t)}
                    </div>
                </div>
            `).join("");

            activerActionsAdminAccueil(resultsDiv);
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

function estAdminConnecteAccueil() {
    return typeof window.getRole === "function" && window.getRole() === "ROLE_ADMIN";
}

function construireActionsAdminAccueil(trajet) {
    if (!estAdminConnecteAccueil()) {
        return "";
    }

    return `
        <div class="d-flex gap-2 mt-2">
            <button type="button" class="btn btn-sm btn-outline-secondary" data-admin-modifier-trajet-accueil="${trajet.id}">Modifier</button>
            <button type="button" class="btn btn-sm btn-outline-danger" data-admin-supprimer-trajet-accueil="${trajet.id}">Supprimer</button>
        </div>
    `;
}

function activerActionsAdminAccueil(conteneur) {
    if (!estAdminConnecteAccueil()) {
        return;
    }

    conteneur.querySelectorAll("[data-admin-modifier-trajet-accueil]").forEach((bouton) => {
        bouton.addEventListener("click", async () => {
            const idTrajet = bouton.getAttribute("data-admin-modifier-trajet-accueil");
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
            await modifierTrajetAdminAccueil(idTrajet, nouveauPrix, nouvellesPlaces);
            document.getElementById("search-form")?.requestSubmit();
        });
    });

    conteneur.querySelectorAll("[data-admin-supprimer-trajet-accueil]").forEach((bouton) => {
        bouton.addEventListener("click", async () => {
            const idTrajet = bouton.getAttribute("data-admin-supprimer-trajet-accueil");
            if (!idTrajet) {
                return;
            }
            if (!window.confirm("Supprimer ce trajet ? Les participants seront rembourses.")) {
                return;
            }
            await supprimerTrajetAdminAccueil(idTrajet);
            document.getElementById("search-form")?.requestSubmit();
        });
    });
}

async function modifierTrajetAdminAccueil(idTrajet, prix, placesLibres) {
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

async function supprimerTrajetAdminAccueil(idTrajet) {
    const token = typeof window.getToken === "function" ? window.getToken() : null;
    if (!token) {
        alert("Connexion admin requise.");
        return;
    }

    const reponse = await fetch(`http://localhost:8000/api/admin/trajets/${idTrajet}`, {
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

initHomeSearch();
