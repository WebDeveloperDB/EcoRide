// /js/covoiturage.js
console.log("js funktioniert");
let lastResults = [];

function initCovoiturageSearch() {
    const searchForm = document.getElementById("search-itineraries");
    const itinerariesContainer = document.getElementById("itineraries-container");
    const noItineraries = document.getElementById("no-itineraries");

    if (!searchForm) return;

    searchForm.addEventListener("submit", async (e) => {
        e.preventDefault();
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
            const params = new URLSearchParams({ departure, destination, date }).toString();
            const res = await fetch(`http://localhost:8000/api/trajet/search?${params}`);
            if (!res.ok) throw new Error("Erreur lors de la recherche.");

            let trajets = await res.json();
            lastResults = trajets; // speichere für Filter
            renderItineraries(trajets);
        } catch (e) {
            itinerariesContainer.innerHTML = "";
            noItineraries.textContent = "Erreur lors de la recherche.";
            noItineraries.classList.remove("d-none");
        }
    });

    // Filter-Button: Filter anwenden auf letzte Ergebnisse
    const filterBtn = document.getElementById("apply-filters");
    if (filterBtn) {
        filterBtn.addEventListener("click", () => {
            if (!lastResults.length) return;
            let filtered = [...lastResults];

            // Ecologique Filter
            const ecological = document.getElementById("filter-ecological").value;
            if (ecological === "ecological") {
                filtered = filtered.filter(t => t.eco);
            }
            // Preis Filter
            const maxPrice = parseFloat(document.getElementById("filter-price").value);
            if (!isNaN(maxPrice)) {
                filtered = filtered.filter(t => t.prix <= maxPrice);
            }
            // Dauer Filter (Stunden)
            const maxDuration = parseFloat(document.getElementById("filter-duration").value);
            if (!isNaN(maxDuration)) {
                filtered = filtered.filter(t => calcDurationInHours(t.departAt, t.arriveeAt) <= maxDuration);
            }
            // Bewertung Filter (optional, falls vorhanden)
            const minRating = parseFloat(document.getElementById("filter-rating").value);
            if (!isNaN(minRating)) {
                filtered = filtered.filter(t => (t.rating ?? 5) >= minRating);
            }

            renderItineraries(filtered);
        });
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
                        <img src="${t.driverPhoto || '/images/driver-placeholder.jpg'}" alt="Photo du chauffeur" class="rounded-circle me-3" width="50" height="50">
                        <img src="${t.carPhoto || '/images/car-placeholder.jpg'}" alt="Photo de la voiture" class="rounded me-3" width="50" height="50">
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
                    <a href="/pages/details.html?id=${t.id}" class="btn btn-success">Détail</a>
                </div>
            </div>
        </div>
    `).join("");
}

// Formatierer
function formatDate(str) {
    return new Date(str).toLocaleDateString('fr-FR');
}
function formatHeure(str) {
    return new Date(str).toLocaleTimeString('fr-FR', { hour: "2-digit", minute: "2-digit" });
}

// Init sofort aufrufen (SPA-Ready)
initCovoiturageSearch();


