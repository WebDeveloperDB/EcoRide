let lastResults = [];
const URL_DETAIL_COVOITURAGE = `${window.location.origin}/EcoRide/Front/covoiturage-detail`;

function initCovoiturageSearch() {
    const searchForm = document.getElementById("search-itineraries");
    const itinerariesContainer = document.getElementById("itineraries-container");
    const noItineraries = document.getElementById("no-itineraries");

    if (!searchForm) return;

    searchForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        await lancerRechercheAvecFiltres();
    });

    // filter button filter anwenden auf letzte ergebnisse
    const filterBtn = document.getElementById("apply-filters");
    if (filterBtn) {
        filterBtn.addEventListener("click", async () => {
            await lancerRechercheAvecFiltres();
        });
    }

    async function lancerRechercheAvecFiltres() {
        const departure = document.getElementById("departure").value.trim();
        const destination = document.getElementById("destination").value.trim();
        const date = document.getElementById("travel-date").value;

        if (!departure || !destination || !date) {
            alert("Veuillez remplir tous les champs.");
            return;
        }

        noItineraries.classList.add("d-none");
        itinerariesContainer.classList.remove("d-none");
        itinerariesContainer.innerHTML = "<div class='text-center text-muted'>Recherche en cours…</div>";

        try {
            const ecological = document.getElementById("filter-ecological")?.value || "all";
            const maxPrice = parseFloat(document.getElementById("filter-price")?.value || "");
            const maxDuration = parseFloat(document.getElementById("filter-duration")?.value || "");
            const minRating = parseFloat(document.getElementById("filter-rating")?.value || "");

            const params = new URLSearchParams({ departure, destination, date });
            if (ecological === "ecological") {
                params.set("ecoOnly", "1");
            }
            if (!Number.isNaN(maxPrice)) {
                params.set("maxPrice", String(maxPrice));
            }
            if (!Number.isNaN(maxDuration)) {
                params.set("maxDuration", String(maxDuration));
            }
            if (!Number.isNaN(minRating)) {
                params.set("minRating", String(minRating));
            }

            const res = await fetch(`http://localhost:8000/api/trajet/search?${params.toString()}`);
            if (!res.ok) throw new Error("Erreur lors de la recherche.");

            const trajets = await res.json();
            lastResults = Array.isArray(trajets) ? trajets : [];
            renderItineraries(lastResults);
        } catch (e) {
            itinerariesContainer.innerHTML = "";
            noItineraries.textContent = "Erreur lors de la recherche.";
            noItineraries.classList.remove("d-none");
        }
    }
}

// Hilfsfunktion: berechnet Dauer in Stunden
function calcDurationInHours(start, end) {
    try {
        const s = new Date(start), e = new Date(end);
        return Math.abs(e - s) / (1000 * 60 * 60);
    } catch {
        return 0;
    }
}

// Zeigt die Trajets dynamisch an
function renderItineraries(trajets) {
    const itinerariesContainer = document.getElementById("itineraries-container");
    const noItineraries = document.getElementById("no-itineraries");
    itinerariesContainer.innerHTML = "";

    if (!trajets.length) {
        itinerariesContainer.classList.add("d-none");
        noItineraries.textContent = "Aucun covoiturage trouvé. Veuillez ajuster votre recherche.";
        noItineraries.classList.remove("d-none");
        return;
    }
    itinerariesContainer.classList.remove("d-none");
    noItineraries.classList.add("d-none");

    itinerariesContainer.innerHTML = trajets.map((t, idx) => `
        <div class="col-md-6 mb-4" id="itinerary-${idx}">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex align-items-center mb-3">
                        ${t.driverPhoto ? `<img src="${t.driverPhoto}" alt="Photo du chauffeur" class="rounded-circle me-3 object-fit-cover" width="50" height="50">` : ""}
                        ${t.carPhoto ? `<img src="${t.carPhoto}" alt="Photo de la voiture" class="rounded me-3 object-fit-cover" width="50" height="50">` : ""}
                        <div>
                            <h5 class="card-title mb-0">${t.driverName || "Chauffeur"}</h5>
                            <small class="text-muted">Note : ${(t.rating ?? "5")}/5</small>
                        </div>
                    </div>
                    <p class="card-text">Départ : <strong>${t.depart}</strong> | Arrivée : <strong>${t.destination}</strong></p>
                    <p class="card-text">Date : <strong>${formatDate(t.departAt)}</strong> | Heure : <strong>${formatHeure(t.departAt)} - ${formatHeure(t.arriveeAt)}</strong></p>
                    <p class="card-text">Durée : <strong>${calcDurationInHours(t.departAt, t.arriveeAt).toFixed(1)}h</strong></p>
                    <p class="card-text">Places restantes : <strong>${t.placesLibres}</strong></p>
                    <p class="card-text">Prix : <strong>${t.prix}€</strong></p>
                    <p class="card-text">Type de trajet : <strong>${t.eco ? "Écologique" : "Classique"}</strong></p>
                    <a href="${URL_DETAIL_COVOITURAGE}?id=${encodeURIComponent(t.id)}" class="btn btn-success">Détail</a>
                    ${construireActionsAdminCovoiturage(t)}
                </div>
            </div>
        </div>
    `).join("");

    activerActionsAdminCovoiturage(itinerariesContainer);
}

// Formatierer
function formatDate(str) {
    return new Date(str).toLocaleDateString('fr-FR');
}
function formatHeure(str) {
    return new Date(str).toLocaleTimeString('fr-FR', { hour: "2-digit", minute: "2-digit" });
}

function estAdminConnecteCovoiturage() {
    return typeof window.getRole === "function" && window.getRole() === "ROLE_ADMIN";
}

function construireActionsAdminCovoiturage(trajet) {
    if (!estAdminConnecteCovoiturage()) {
        return "";
    }

    return `
        <div class="d-flex gap-2 mt-2">
            <button type="button" class="btn btn-sm btn-outline-secondary" data-admin-modifier-trajet-covoiturage="${trajet.id}">Modifier</button>
            <button type="button" class="btn btn-sm btn-outline-danger" data-admin-supprimer-trajet-covoiturage="${trajet.id}">Supprimer</button>
        </div>
    `;
}

function activerActionsAdminCovoiturage(conteneur) {
    if (!estAdminConnecteCovoiturage()) {
        return;
    }

    conteneur.querySelectorAll("[data-admin-modifier-trajet-covoiturage]").forEach((bouton) => {
        bouton.addEventListener("click", async () => {
            const idTrajet = bouton.getAttribute("data-admin-modifier-trajet-covoiturage");
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
            await modifierTrajetAdminCovoiturage(idTrajet, nouveauPrix, nouvellesPlaces);
            const formulaireRecherche = document.getElementById("search-itineraries");
            formulaireRecherche?.requestSubmit();
        });
    });

    conteneur.querySelectorAll("[data-admin-supprimer-trajet-covoiturage]").forEach((bouton) => {
        bouton.addEventListener("click", async () => {
            const idTrajet = bouton.getAttribute("data-admin-supprimer-trajet-covoiturage");
            if (!idTrajet) {
                return;
            }
            if (!window.confirm("Supprimer ce trajet ? Les participants seront rembourses.")) {
                return;
            }
            await supprimerTrajetAdminCovoiturage(idTrajet);
            document.getElementById("search-itineraries")?.requestSubmit();
        });
    });
}

async function modifierTrajetAdminCovoiturage(idTrajet, prix, placesLibres) {
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

async function supprimerTrajetAdminCovoiturage(idTrajet) {
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

// Init sofort aufrufen (SPA-Ready)
initCovoiturageSearch();


