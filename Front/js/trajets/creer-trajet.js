(() => {
    const form = document.getElementById("createTrajetForm");
    if (!form) {
        return;
    }

    const inputDepart = document.getElementById("TrajetDepartInput");
    const inputDestination = document.getElementById("TrajetDestinationInput");
    const inputDepartAt = document.getElementById("TrajetDepartAtInput");
    const inputArriveeAt = document.getElementById("TrajetArriveeAtInput");
    const inputPrix = document.getElementById("TrajetPrixInput");
    const inputPlaces = document.getElementById("TrajetPlacesInput");
    const inputVehicule = document.getElementById("TrajetVehiculeInput");
    const inputEco = document.getElementById("TrajetEcoInput");
    const zoneMessage = document.getElementById("createTrajetMessage");

    chargerVehicules();

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const token = window.getToken ? window.getToken() : null;
        if (!token) {
            afficherMessage("Vous devez etre connecte.", "text-danger");
            return;
        }

        try {
            const response = await fetch("http://localhost:8000/api/trajet", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-AUTH-TOKEN": token,
                },
                body: JSON.stringify({
                    depart: inputDepart.value.trim(),
                    destination: inputDestination.value.trim(),
                    departAt: convertirDate(inputDepartAt.value),
                    arriveeAt: convertirDate(inputArriveeAt.value),
                    prix: Number.parseFloat(inputPrix.value),
                    placesLibres: Number.parseInt(inputPlaces.value, 10),
                    vehiculeId: Number.parseInt(inputVehicule.value, 10),
                    eco: inputEco.checked,
                }),
            });

            const resultat = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(resultat.message || "Creation du trajet impossible.");
            }

            afficherMessage(resultat.message || "Trajet cree avec succes.", "text-success");
            form.reset();
        } catch (error) {
            afficherMessage("Erreur: " + error.message, "text-danger");
        }
    });

    async function chargerVehicules() {
        const token = window.getToken ? window.getToken() : null;
        if (!token) {
            afficherMessage("Vous devez etre connecte.", "text-danger");
            return;
        }

        try {
            const response = await fetch("http://localhost:8000/api/vehicule", {
                method: "GET",
                headers: {
                    "X-AUTH-TOKEN": token,
                },
            });

            const vehicules = await response.json().catch(() => []);
            if (!response.ok) {
                throw new Error("Impossible de charger vos vehicules.");
            }

            remplirSelectVehicules(Array.isArray(vehicules) ? vehicules : []);
        } catch (error) {
            afficherMessage("Erreur: " + error.message, "text-danger");
        }
    }

    function remplirSelectVehicules(vehicules) {
        inputVehicule.innerHTML = '<option value="">Choisir un vehicule</option>';

        vehicules.forEach((vehicule) => {
            const option = document.createElement("option");
            option.value = String(vehicule.id);
            option.textContent = `${vehicule.marque || ""} ${vehicule.modele || ""} (${vehicule.places} places)`;
            inputVehicule.appendChild(option);
        });
    }

    function convertirDate(dateInput) {
        if (!dateInput) {
            return "";
        }

        return new Date(dateInput).toISOString();
    }

    function afficherMessage(message, classe) {
        zoneMessage.textContent = message;
        zoneMessage.className = "pt-3 text-center " + (classe || "");
    }
})();
