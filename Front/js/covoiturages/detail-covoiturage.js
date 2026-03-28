(() => {
    const blocChargement = document.getElementById("detailTrajetChargement");
    const blocDetail = document.getElementById("detailTrajetBloc");
    const blocErreur = document.getElementById("detailTrajetErreur");
    const formulaireAvisTrajet = document.getElementById("formulaireAvisTrajet");
    const messageAvisTrajet = document.getElementById("messageAvisTrajet");
    const messageConditionAvis = document.getElementById("messageConditionAvis");
    const messageParticipation = document.getElementById("messageParticipationDetail");

    if (!blocChargement || !blocDetail || !blocErreur) {
        return;
    }

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
            const token = typeof window.getToken === "function" ? window.getToken() : null;
            const headers = token ? { "X-AUTH-TOKEN": token } : {};
            const reponse = await fetch(`http://localhost:8000/api/trajet/${id}`, { headers });
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
        const statut = document.getElementById("detailStatut");
        const preferences = document.getElementById("detailPreferences");
        const avis = document.getElementById("detailAvis");
        const boutonParticiper = document.getElementById("btnParticiperDetail");
        const boutonModifierTrajetAdmin = document.getElementById("btnModifierTrajetAdminDetail");
        const boutonSupprimerTrajetAdmin = document.getElementById("btnSupprimerTrajetAdminDetail");
        const boutonDemarrer = document.getElementById("btnDemarrerTrajetDetail");
        const boutonArrivee = document.getElementById("btnArriveeTrajetDetail");
        const champPseudoAvis = document.getElementById("avisTrajetPseudo");

        if (detail.driverPhoto) {
            imageConducteur.src = detail.driverPhoto;
            imageConducteur.classList.remove("d-none");
        } else {
            imageConducteur.removeAttribute("src");
            imageConducteur.classList.add("d-none");
        }

        if (detail.carPhoto) {
            imageVehicule.src = detail.carPhoto;
            imageVehicule.classList.remove("d-none");
        } else {
            imageVehicule.removeAttribute("src");
            imageVehicule.classList.add("d-none");
        }

        nomConducteur.textContent = detail.driverName || "Conducteur";
        vehicule.textContent = detail.vehicle || "Véhicule non renseigné";
        trajet.textContent = `${detail.depart || "?"} -> ${detail.destination || "?"}`;
        date.textContent = formaterDate(detail.departAt);
        heure.textContent = `${formaterHeure(detail.departAt)} - ${formaterHeure(detail.arriveeAt)}`;
        prix.textContent = `${detail.prix ?? "?"} €`;
        places.textContent = `${detail.placesLibres ?? "?"}`;
        type.textContent = detail.eco ? "Écologique" : "Classique";
        if (statut) {
            statut.textContent = formaterStatut(detail.statut);
        }

        if (messageParticipation) {
            if (detail.isParticipating) {
                messageParticipation.textContent = "Vous participez deja a ce trajet. Voir Historique pour les details.";
                messageParticipation.className = "pt-2 text-success";
            } else {
                messageParticipation.textContent = "";
                messageParticipation.className = "pt-2";
            }
        }

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

        if (boutonParticiper) {
            boutonParticiper.disabled = false;
            boutonParticiper.classList.remove("d-none");

            if (detail.isParticipating) {
                boutonParticiper.disabled = true;
                boutonParticiper.textContent = "Deja participant";
            } else if (!detail.canParticipate) {
                boutonParticiper.classList.add("d-none");
            } else {
                boutonParticiper.textContent = "Participer";
                boutonParticiper.onclick = async () => {
                    try {
                        await participerTrajet(detail.id, detail.prix);
                        boutonParticiper.disabled = true;
                        boutonParticiper.textContent = "Participation confirmee";
                        chargerDetailTrajet(idTrajet);
                    } catch (erreur) {
                        alert("Erreur: " + erreur.message);
                    }
                };
            }
        }

        if (formulaireAvisTrajet) {
            formulaireAvisTrajet.classList.toggle("d-none", !detail.canLeaveAvis);
        }
        if (messageConditionAvis) {
            if (detail.canLeaveAvis) {
                messageConditionAvis.textContent = "Vous pouvez laisser un avis car vous avez participe et le trajet est termine.";
            } else {
                messageConditionAvis.textContent = "Avis disponible uniquement pour les passagers participants apres arrivee du trajet.";
            }
        }
        if (champPseudoAvis) {
            champPseudoAvis.value = detail.currentUserPseudo || "";
            champPseudoAvis.readOnly = true;
        }

        const adminConnecte = typeof window.getRole === "function" && window.getRole() === "ROLE_ADMIN";
        if (boutonModifierTrajetAdmin) {
            boutonModifierTrajetAdmin.classList.toggle("d-none", !adminConnecte);
            boutonModifierTrajetAdmin.onclick = async () => {
                const nouveauPrix = window.prompt("Nouveau prix du trajet :", String(detail.prix ?? ""));
                if (nouveauPrix === null) {
                    return;
                }
                const nouvellesPlaces = window.prompt("Nouveau nombre de places libres :", String(detail.placesLibres ?? ""));
                if (nouvellesPlaces === null) {
                    return;
                }
                try {
                    await modifierTrajetAdmin(detail.id, nouveauPrix, nouvellesPlaces);
                    chargerDetailTrajet(idTrajet);
                } catch (erreur) {
                    alert("Erreur: " + erreur.message);
                }
            };
        }

        if (boutonSupprimerTrajetAdmin) {
            boutonSupprimerTrajetAdmin.classList.toggle("d-none", !adminConnecte);
            boutonSupprimerTrajetAdmin.onclick = async () => {
                if (!window.confirm("Supprimer ce trajet ? Les participants seront rembourses.")) {
                    return;
                }
                try {
                    await supprimerTrajetAdmin(detail.id);
                    window.location.href = "/EcoRide/Front/covoiturages";
                } catch (erreur) {
                    alert("Erreur: " + erreur.message);
                }
            };
        }

        if (boutonDemarrer) {
            boutonDemarrer.classList.toggle("d-none", !detail.canStart);
            boutonDemarrer.onclick = async () => {
                try {
                    await demarrerTrajet(detail.id);
                    await chargerDetailTrajet(idTrajet);
                } catch (erreur) {
                    alert("Erreur: " + erreur.message);
                }
            };
        }

        if (boutonArrivee) {
            boutonArrivee.classList.toggle("d-none", !detail.canFinish);
            boutonArrivee.onclick = async () => {
                try {
                    await terminerTrajet(detail.id);
                    await chargerDetailTrajet(idTrajet);
                } catch (erreur) {
                    alert("Erreur: " + erreur.message);
                }
            };
        }

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

    function formaterStatut(statut) {
        if (statut === "en_cours") {
            return "En cours";
        }
        if (statut === "termine") {
            return "Termine";
        }

        return "Planifie";
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
                        "X-AUTH-TOKEN": typeof window.getToken === "function" ? (window.getToken() || "") : "",
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

    async function participerTrajet(idTrajetCourant, prixTrajet) {
        const token = typeof window.getToken === "function" ? window.getToken() : null;
        if (!token) {
            const allerConnexion = confirm("Vous devez vous connecter pour participer. Aller a la connexion ?");
            if (allerConnexion) {
                window.location.href = "/EcoRide/Front/signin";
            }
            return;
        }

        if (!confirm(`Confirmer la participation a ce trajet pour environ ${Math.ceil(Number(prixTrajet || 0))} credits ?`)) {
            return;
        }
        if (!confirm("Confirmation finale: valider la participation ?")) {
            return;
        }

        const reponse = await fetch(`http://localhost:8000/api/trajet/${idTrajetCourant}/participer`, {
            method: "POST",
            headers: {
                "X-AUTH-TOKEN": token,
            },
        });

        const resultat = await reponse.json().catch(() => ({}));
        if (!reponse.ok) {
            if (resultat.message && /deja/i.test(resultat.message)) {
                const allerHistorique = confirm(resultat.message + " Aller a l'historique ?");
                if (allerHistorique) {
                    window.location.href = "/EcoRide/Front/historique";
                    return;
                }
            }
            throw new Error(resultat.message || "Participation impossible.");
        }

        alert((resultat.message || "Participation confirmee.") + " Retrouvez ce trajet dans votre historique.");
    }

    async function modifierTrajetAdmin(idTrajetCourant, prix, placesLibres) {
        const token = typeof window.getToken === "function" ? window.getToken() : null;
        if (!token) {
            throw new Error("Connexion admin requise.");
        }

        const reponse = await fetch(`http://localhost:8000/api/trajet/${idTrajetCourant}`, {
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

    async function supprimerTrajetAdmin(idTrajetCourant) {
        const token = typeof window.getToken === "function" ? window.getToken() : null;
        if (!token) {
            throw new Error("Connexion admin requise.");
        }

        const reponse = await fetch(`http://localhost:8000/api/admin/trajets/${idTrajetCourant}`, {
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

    async function demarrerTrajet(idTrajetCourant) {
        const token = typeof window.getToken === "function" ? window.getToken() : null;
        if (!token) {
            throw new Error("Connexion requise.");
        }

        const reponse = await fetch(`http://localhost:8000/api/trajet/${idTrajetCourant}/demarrer`, {
            method: "POST",
            headers: {
                "X-AUTH-TOKEN": token,
            },
        });

        const resultat = await reponse.json().catch(() => ({}));
        if (!reponse.ok) {
            throw new Error(resultat.message || "Demarrage impossible.");
        }
    }

    async function terminerTrajet(idTrajetCourant) {
        const token = typeof window.getToken === "function" ? window.getToken() : null;
        if (!token) {
            throw new Error("Connexion requise.");
        }

        const reponse = await fetch(`http://localhost:8000/api/trajet/${idTrajetCourant}/arrivee`, {
            method: "POST",
            headers: {
                "X-AUTH-TOKEN": token,
            },
        });

        const resultat = await reponse.json().catch(() => ({}));
        if (!reponse.ok) {
            throw new Error(resultat.message || "Finalisation impossible.");
        }
    }

})();
