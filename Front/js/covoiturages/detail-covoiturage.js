(() => {
    const blocChargement = document.getElementById("detailTrajetChargement");
    const blocDetail = document.getElementById("detailTrajetBloc");
    const blocErreur = document.getElementById("detailTrajetErreur");
    const formulaireAvisTrajet = document.getElementById("formulaireAvisTrajet");
    const messageAvisTrajet = document.getElementById("messageAvisTrajet");

    if (!blocChargement || !blocDetail || !blocErreur) {
        return;
    }

    const photoConducteurParDefaut = "/EcoRide/Front/images/environnement.jpg";
    const photoVehiculeParDefaut = "/EcoRide/Front/images/covoiturage.jpg";

    const parametres = new URLSearchParams(window.location.search);
    const idTrajet = parametres.get("id");

    if (!idTrajet) {
        afficherErreur("Trajet introuvable.");
        return;
    }

    chargerDetailTrajet(idTrajet);
    initialiserFormulaireAvis(idTrajet);

    async function chargerDetailTrajet(id) {
        try {
            const reponse = await fetch(`http://localhost:8000/api/trajet/${id}`);
            const detail = await reponse.json().catch(() => ({}));

            if (!reponse.ok) {
                throw new Error(detail.message || "Impossible de charger ce trajet.");
            }

            remplirDetail(detail);
            blocChargement.classList.add("d-none");
            blocDetail.classList.remove("d-none");
        } catch (erreur) {
            afficherErreur(erreur.message);
        }
    }

    function remplirDetail(detail) {
        const imageConducteur = document.getElementById("detailPhotoConducteur");
        const imageVehicule = document.getElementById("detailPhotoVehicule");
        const nomConducteur = document.getElementById("detailNomConducteur");
        const vehicule = document.getElementById("detailVehicule");
        const trajet = document.getElementById("detailTrajet");
        const date = document.getElementById("detailDate");
        const heure = document.getElementById("detailHeure");
        const prix = document.getElementById("detailPrix");
        const places = document.getElementById("detailPlaces");
        const type = document.getElementById("detailType");
        const preferences = document.getElementById("detailPreferences");
        const avis = document.getElementById("detailAvis");
        const boutonParticiper = document.getElementById("btnParticiperDetail");

        imageConducteur.src = detail.driverPhoto || photoConducteurParDefaut;
        imageConducteur.onerror = () => {
            imageConducteur.onerror = null;
            imageConducteur.src = photoConducteurParDefaut;
        };

        imageVehicule.src = detail.carPhoto || photoVehiculeParDefaut;
        imageVehicule.onerror = () => {
            imageVehicule.onerror = null;
            imageVehicule.src = photoVehiculeParDefaut;
        };

        nomConducteur.textContent = detail.driverName || "Conducteur";
        vehicule.textContent = detail.vehicle || "Véhicule non renseigné";
        trajet.textContent = `${detail.depart || "?"} -> ${detail.destination || "?"}`;
        date.textContent = formaterDate(detail.departAt);
        heure.textContent = `${formaterHeure(detail.departAt)} - ${formaterHeure(detail.arriveeAt)}`;
        prix.textContent = `${detail.prix ?? "?"} €`;
        places.textContent = `${detail.placesLibres ?? "?"}`;
        type.textContent = detail.eco ? "Écologique" : "Classique";

        const listePreferences = construirePreferences(detail.preferencesConducteur || {});
        preferences.innerHTML = listePreferences.length
            ? listePreferences.map((ligne) => `<li>${ligne}</li>`).join("")
            : "<li>Aucune préférence renseignée.</li>";

        const listeAvis = Array.isArray(detail.avisConducteur) ? detail.avisConducteur : [];
        avis.innerHTML = listeAvis.length
            ? listeAvis.map((unAvis) => `
                <div class="border rounded p-2 mb-2">
                    <strong>${unAvis.pseudo || "Utilisateur"}</strong>
                    <p class="mb-0">${unAvis.commentaire || ""}</p>
                </div>
            `).join("")
            : "<p class='text-muted mb-0'>Aucun avis validé pour ce conducteur.</p>";

        boutonParticiper.addEventListener("click", () => {
            alert("Participation: fonctionnalité prévue à l'étape suivante.");
        });
    }

    function construirePreferences(preferencesConducteur) {
        const lignes = [];
        if (preferencesConducteur.animaux === true) {
            lignes.push("Accepte les animaux");
        }
        if (preferencesConducteur.fumeur === true) {
            lignes.push("Accepte les fumeurs");
        }
        if (preferencesConducteur.musique === true) {
            lignes.push("Aime la musique pendant le trajet");
        }
        return lignes;
    }

    function formaterDate(valeur) {
        if (!valeur) {
            return "-";
        }
        return new Date(valeur).toLocaleDateString("fr-FR");
    }

    function formaterHeure(valeur) {
        if (!valeur) {
            return "-";
        }
        return new Date(valeur).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    }

    function afficherErreur(message) {
        blocChargement.classList.add("d-none");
        blocErreur.classList.remove("d-none");
        blocErreur.textContent = message;
    }

    function initialiserFormulaireAvis(idTrajetCourant) {
        if (!formulaireAvisTrajet || !messageAvisTrajet) {
            return;
        }

        formulaireAvisTrajet.addEventListener("submit", async (event) => {
            event.preventDefault();

            const pseudo = (document.getElementById("avisTrajetPseudo")?.value ?? "").trim();
            const commentaire = (document.getElementById("avisTrajetCommentaire")?.value ?? "").trim();

            if (!pseudo || !commentaire) {
                afficherMessageAvis("Pseudo et commentaire sont obligatoires.", "text-danger");
                return;
            }

            try {
                const reponse = await fetch("http://localhost:8000/api/avis", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        pseudo,
                        commentaire,
                        trajetId: Number.parseInt(idTrajetCourant, 10),
                    }),
                });

                const resultat = await reponse.json().catch(() => ({}));
                if (!reponse.ok) {
                    throw new Error(resultat.message || "Impossible d'envoyer l'avis.");
                }

                formulaireAvisTrajet.reset();
                afficherMessageAvis(resultat.message || "Avis envoyé.", "text-success");
                chargerDetailTrajet(idTrajetCourant);
            } catch (erreur) {
                afficherMessageAvis("Erreur: " + erreur.message, "text-danger");
            }
        });
    }

    function afficherMessageAvis(message, classe) {
        if (!messageAvisTrajet) {
            return;
        }

        messageAvisTrajet.textContent = message;
        messageAvisTrajet.className = "pt-2 " + (classe || "");
    }
})();
