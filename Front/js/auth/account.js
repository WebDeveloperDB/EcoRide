(() => {
    const formulaire = document.getElementById("profilForm");
    if (!formulaire) {
        return;
    }
    formulaire.dataset.accountScriptReady = "1";

    const champPseudo = document.getElementById("PseudoInput");
    const champEmail = document.getElementById("EmailInput");
    const champCredits = document.getElementById("CreditsInput");
    const champTypeUtilisateur = document.getElementById("TypeUtilisateurInput");
    const champPhotoProfil = document.getElementById("PhotoProfilInput");
    const preferenceAnimaux = document.getElementById("PreferenceAnimaux");
    const preferenceFumeur = document.getElementById("PreferenceFumeur");
    const preferenceMusique = document.getElementById("PreferenceMusique");
    const zoneMessage = document.getElementById("profilMessage");
    const formulaireVehicule = document.getElementById("vehiculeForm");
    const champVehiculeMarque = document.getElementById("VehiculeMarqueInput");
    const champVehiculeModele = document.getElementById("VehiculeModeleInput");
    const champVehiculePlaces = document.getElementById("VehiculePlacesInput");
    const champVehiculeCouleur = document.getElementById("VehiculeCouleurInput");
    const champVehiculeEnergie = document.getElementById("VehiculeEnergieInput");
    const champVehiculePhoto = document.getElementById("VehiculePhotoInput");
    const listeVehicules = document.getElementById("vehiculesListe");

    let timerMessage = null;

    if (formulaireVehicule) {
        formulaireVehicule.dataset.accountScriptReady = "1";
    }

    chargerProfil();
    chargerVehicules();
    window.addEventListener("vehicule:updated", chargerVehicules);

    formulaire.addEventListener("submit", async (event) => {
        event.preventDefault();

        const token = window.getToken ? window.getToken() : null;
        if (!token) {
            afficherMessage("Vous devez être connecté.", "text-danger");
            return;
        }

        try {
            const response = await fetch("http://localhost:8000/api/utilisateur/profil", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-AUTH-TOKEN": token,
                },
                body: JSON.stringify({
                    pseudo: champPseudo.value.trim(),
                    typeUtilisateur: champTypeUtilisateur.value || null,
                    photoProfil: champPhotoProfil.value.trim() || null,
                    preferences: {
                        animaux: preferenceAnimaux.checked,
                        fumeur: preferenceFumeur.checked,
                        musique: preferenceMusique.checked,
                    },
                }),
            });

            const resultat = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(resultat.message || "Mise à jour impossible.");
            }

            afficherMessage("Profil mis a jour avec succes.", "text-success", 7000);
            await chargerProfil(true);

            if (window.synchroniserTypeUtilisateur) {
                window.synchroniserTypeUtilisateur();
            }
        } catch (error) {
            afficherMessage("Erreur: " + error.message, "text-danger", 9000);
        }
    });

    if (formulaireVehicule) {
        formulaireVehicule.addEventListener("submit", async (event) => {
            event.preventDefault();

            const token = window.getToken ? window.getToken() : null;
            if (!token) {
                afficherMessage("Vous devez etre connecte.", "text-danger", 9000);
                return;
            }

            try {
                const response = await fetch("http://localhost:8000/api/vehicule", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-AUTH-TOKEN": token,
                    },
                    body: JSON.stringify({
                        marque: champVehiculeMarque.value.trim(),
                        modele: champVehiculeModele.value.trim(),
                        places: Number.parseInt(champVehiculePlaces.value, 10),
                        couleur: champVehiculeCouleur.value.trim(),
                        energie: champVehiculeEnergie.value.trim(),
                        photoVehicule: champVehiculePhoto.value.trim(),
                    }),
                });

                const resultat = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(resultat.message || "Ajout du vehicule impossible.");
                }

                formulaireVehicule.reset();
                await chargerVehicules();
                afficherMessage(resultat.message || "Vehicule ajoute avec succes.", "text-success", 7000);
            } catch (error) {
                afficherMessage("Erreur: " + error.message, "text-danger", 9000);
            }
        });
    }

    async function chargerProfil(conserverMessage = false) {
        const token = window.getToken ? window.getToken() : null;
        if (!token) {
            afficherMessage("Vous devez etre connecte.", "text-danger", 9000);
            return;
        }

        try {
            const response = await fetch("http://localhost:8000/api/utilisateur/profil", {
                method: "GET",
                headers: {
                    "X-AUTH-TOKEN": token,
                },
            });

            const profil = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(profil.message || "Impossible de charger le profil.");
            }

            champPseudo.value = profil.pseudo || "";
            champEmail.value = profil.email || "";
            champCredits.value = String(profil.credits ?? "");
            champTypeUtilisateur.value = profil.typeUtilisateur || "";
            champPhotoProfil.value = profil.photoProfil || "";
            localStorage.setItem("typeUtilisateur", profil.typeUtilisateur || "");

            if (window.showAndHideElementsForRoles) {
                window.showAndHideElementsForRoles();
            }

            const preferences = profil.preferences || {};
            preferenceAnimaux.checked = !!preferences.animaux;
            preferenceFumeur.checked = !!preferences.fumeur;
            preferenceMusique.checked = !!preferences.musique;

            if (!conserverMessage) {
                afficherMessage("", "");
            }
        } catch (error) {
            afficherMessage("Erreur: " + error.message, "text-danger", 9000);
        }
    }

    async function chargerVehicules() {
        const token = window.getToken ? window.getToken() : null;
        if (!token || !listeVehicules) {
            return;
        }

        try {
            const response = await fetch("http://localhost:8000/api/vehicule", {
                method: "GET",
                headers: {
                    "X-AUTH-TOKEN": token,
                },
            });

            const resultat = await response.json().catch(() => []);
            if (!response.ok) {
                throw new Error(resultat.message || "Impossible de charger les vehicules.");
            }

            afficherListeVehicules(Array.isArray(resultat) ? resultat : []);
        } catch (error) {
            afficherMessage("Erreur: " + error.message, "text-danger", 9000);
        }
    }

    function afficherListeVehicules(vehicules) {
        if (!listeVehicules) {
            return;
        }

        if (!vehicules.length) {
            listeVehicules.innerHTML = "<p class=\"text-muted\">Aucun vehicule enregistre pour le moment.</p>";
            return;
        }

        const lignes = vehicules
            .map(
                (vehicule) => `
                <div class="card mb-2">
                    <div class="card-body d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                            <strong>${vehicule.marque || ""} ${vehicule.modele || ""}</strong>
                            <div class="small text-muted">${vehicule.places} place(s)${vehicule.couleur ? ` - ${vehicule.couleur}` : ""}${vehicule.energie ? ` - ${vehicule.energie}` : ""}</div>
                            ${vehicule.photoVehicule ? `<div class="small"><a href="${vehicule.photoVehicule}" target="_blank" rel="noopener">Voir la photo</a></div>` : ""}
                        </div>
                        <button type="button" class="btn btn-sm btn-outline-danger" data-delete-vehicule="${vehicule.id}">Supprimer</button>
                    </div>
                </div>
            `
            )
            .join("");

        listeVehicules.innerHTML = lignes;

        listeVehicules.querySelectorAll("[data-delete-vehicule]").forEach((bouton) => {
            bouton.addEventListener("click", async () => {
                const idVehicule = bouton.getAttribute("data-delete-vehicule");
                if (!idVehicule) {
                    return;
                }
                await supprimerVehicule(idVehicule);
            });
        });
    }

    async function supprimerVehicule(idVehicule) {
        const token = window.getToken ? window.getToken() : null;
        if (!token) {
            afficherMessage("Vous devez etre connecte.", "text-danger", 9000);
            return;
        }

        try {
            const response = await fetch(`http://localhost:8000/api/vehicule/${idVehicule}`, {
                method: "DELETE",
                headers: {
                    "X-AUTH-TOKEN": token,
                },
            });

            const resultat = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(resultat.message || "Suppression du vehicule impossible.");
            }

            await chargerVehicules();
            afficherMessage(resultat.message || "Vehicule supprime avec succes.", "text-success", 7000);
        } catch (error) {
            afficherMessage("Erreur: " + error.message, "text-danger", 9000);
        }
    }

    function afficherMessage(message, classe, dureeMs = 0) {
        if (timerMessage) {
            clearTimeout(timerMessage);
            timerMessage = null;
        }

        zoneMessage.textContent = message;
        zoneMessage.className = "pt-3 text-center " + (classe || "");

        if (message && dureeMs > 0) {
            timerMessage = setTimeout(() => {
                zoneMessage.textContent = "";
                zoneMessage.className = "pt-3 text-center";
                timerMessage = null;
            }, dureeMs);
        }
    }
})();