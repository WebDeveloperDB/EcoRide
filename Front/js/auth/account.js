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
    const zonePhotoProfilApercu = document.getElementById("PhotoProfilApercu");
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
    const boutonAjouterVehicule = document.getElementById("btnAjouterVehicule");
    const boutonAnnulerEditionVehicule = document.getElementById("btnAnnulerEditionVehicule");

    let timerMessage = null;
    let vehiculeEnEdition = null;

    if (formulaireVehicule) {
        formulaireVehicule.dataset.accountScriptReady = "1";
    }

    if (boutonAnnulerEditionVehicule) {
        boutonAnnulerEditionVehicule.addEventListener("click", annulerEditionVehicule);
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

            if (champPhotoProfil && champPhotoProfil.files && champPhotoProfil.files.length > 0) {
                await envoyerPhotoProfil(champPhotoProfil.files[0]);
                champPhotoProfil.value = "";
            }

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
                const formulaireDonnees = new FormData();
                formulaireDonnees.append("marque", champVehiculeMarque.value.trim());
                formulaireDonnees.append("modele", champVehiculeModele.value.trim());
                formulaireDonnees.append("places", String(Number.parseInt(champVehiculePlaces.value, 10)));
                formulaireDonnees.append("couleur", champVehiculeCouleur.value.trim());
                formulaireDonnees.append("energie", champVehiculeEnergie.value.trim());
                if (champVehiculePhoto && champVehiculePhoto.files && champVehiculePhoto.files.length > 0) {
                    formulaireDonnees.append("photoVehicule", champVehiculePhoto.files[0]);
                }

                const urlVehicule = vehiculeEnEdition
                    ? `http://localhost:8000/api/vehicule/${vehiculeEnEdition}`
                    : "http://localhost:8000/api/vehicule";
                const methodeVehicule = vehiculeEnEdition ? "PUT" : "POST";

                const response = await fetch(urlVehicule, {
                    method: methodeVehicule,
                    headers: {
                        "X-AUTH-TOKEN": token,
                    },
                    body: formulaireDonnees,
                });

                const resultat = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(resultat.message || "Ajout du vehicule impossible.");
                }

                formulaireVehicule.reset();
                annulerEditionVehicule();
                await chargerVehicules();
                afficherMessage(resultat.message || "Vehicule enregistre avec succes.", "text-success", 7000);
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
            mettreApercuPhotoProfil(profil.photoProfil || "");
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

    async function envoyerPhotoProfil(fichierPhoto) {
        const token = window.getToken ? window.getToken() : null;
        if (!token) {
            return;
        }

        const formulaireDonnees = new FormData();
        formulaireDonnees.append("photo", fichierPhoto);

        const reponse = await fetch("http://localhost:8000/api/utilisateur/photo-profil", {
            method: "POST",
            headers: {
                "X-AUTH-TOKEN": token,
            },
            body: formulaireDonnees,
        });

        const resultat = await reponse.json().catch(() => ({}));
        if (!reponse.ok) {
            throw new Error(resultat.message || "Photo de profil impossible a envoyer.");
        }

        mettreApercuPhotoProfil(resultat.photoProfil || "");
    }

    function mettreApercuPhotoProfil(urlPhoto) {
        if (!zonePhotoProfilApercu) {
            return;
        }

        if (!urlPhoto) {
            zonePhotoProfilApercu.innerHTML = "";
            return;
        }

        zonePhotoProfilApercu.innerHTML = `<img src="${urlPhoto}" alt="Photo profil" class="rounded-circle object-fit-cover" width="72" height="72">`;
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
                        <div class="d-flex gap-2">
                            <button type="button" class="btn btn-sm btn-outline-secondary" data-edit-vehicule="${vehicule.id}">Modifier</button>
                            <button type="button" class="btn btn-sm btn-outline-danger" data-delete-vehicule="${vehicule.id}">Supprimer</button>
                        </div>
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

        listeVehicules.querySelectorAll("[data-edit-vehicule]").forEach((bouton) => {
            bouton.addEventListener("click", () => {
                const idVehicule = bouton.getAttribute("data-edit-vehicule");
                if (!idVehicule) {
                    return;
                }
                const vehicule = vehicules.find((unVehicule) => String(unVehicule.id) === idVehicule);
                if (!vehicule) {
                    return;
                }
                demarrerEditionVehicule(vehicule);
            });
        });
    }

    function demarrerEditionVehicule(vehicule) {
        vehiculeEnEdition = vehicule.id;
        champVehiculeMarque.value = vehicule.marque || "";
        champVehiculeModele.value = vehicule.modele || "";
        champVehiculePlaces.value = String(vehicule.places ?? 1);
        champVehiculeCouleur.value = vehicule.couleur || "";
        champVehiculeEnergie.value = vehicule.energie || "";
        if (champVehiculePhoto) {
            champVehiculePhoto.value = "";
        }

        if (boutonAjouterVehicule) {
            boutonAjouterVehicule.textContent = "Enregistrer les modifications";
            boutonAjouterVehicule.classList.add("btn-warning");
            boutonAjouterVehicule.classList.remove("btn-outline-primary");
        }

        afficherMessage("Mode modification activé pour ce véhicule.", "text-info", 6000);
    }

    function annulerEditionVehicule() {
        vehiculeEnEdition = null;
        if (formulaireVehicule) {
            formulaireVehicule.reset();
        }
        if (boutonAjouterVehicule) {
            boutonAjouterVehicule.textContent = "Ajouter ce véhicule";
            boutonAjouterVehicule.classList.remove("btn-warning");
            boutonAjouterVehicule.classList.add("btn-outline-primary");
        }
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