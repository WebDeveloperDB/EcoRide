(() => {
    const escapeHtml = (value) => String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const zoneParticipations = document.getElementById("historiqueParticipations");
    const zoneTrajetsConducteur = document.getElementById("historiqueTrajetsConducteur");
    const zoneMessage = document.getElementById("historiqueMessage");
    const selectStatus = document.getElementById("historiqueStatusFilter");
    const boutonApplyFilter = document.getElementById("historiqueApplyFilter");
    const blocAdminUserFilter = document.getElementById("historiqueAdminUserFilterBloc");
    const inputAdminUserId = document.getElementById("historiqueUserIdFilter");

    if (!zoneParticipations || !zoneTrajetsConducteur || !zoneMessage) {
        return;
    }

    const token = typeof window.getToken === "function" ? window.getToken() : null;
    const role = typeof window.getRole === "function" ? window.getRole() : null;
    if (!token) {
        window.location.href = "/EcoRide/Front/signin";
        return;
    }

    if (blocAdminUserFilter && role === "ROLE_ADMIN") {
        blocAdminUserFilter.classList.remove("d-none");
    }

    chargerHistorique();

    boutonApplyFilter?.addEventListener("click", () => {
        chargerHistorique();
    });

    async function chargerHistorique() {
        afficherMessage("", "");
        zoneParticipations.innerHTML = "<div class='text-muted'>Chargement...</div>";
        zoneTrajetsConducteur.innerHTML = "<div class='text-muted'>Chargement...</div>";

        try {
            const status = selectStatus?.value || "all";
            const params = new URLSearchParams({ status });
            if (role === "ROLE_ADMIN") {
                const userId = Number.parseInt(inputAdminUserId?.value || "0", 10);
                if (userId > 0) {
                    params.set("userId", String(userId));
                }
            }

            const reponse = await fetch(`http://localhost:8000/api/utilisateur/historique?${params.toString()}`, {
                method: "GET",
                headers: {
                    "X-AUTH-TOKEN": token,
                },
            });

            const resultat = await reponse.json().catch(() => ({}));
            if (!reponse.ok) {
                throw new Error(resultat.message || "Impossible de charger l'historique.");
            }

            afficherParticipations(resultat.participations || []);
            afficherTrajetsConducteur(resultat.trajetsConducteur || []);
        } catch (erreur) {
            zoneParticipations.innerHTML = "";
            zoneTrajetsConducteur.innerHTML = "";
            afficherMessage("Erreur: " + erreur.message, "text-danger");
        }
    }

    function afficherParticipations(participations) {
        if (!participations.length) {
            zoneParticipations.innerHTML = "<p class='text-muted mb-0'>Aucune participation pour le moment.</p>";
            return;
        }

        zoneParticipations.innerHTML = participations.map((participation) => {
            const trajet = participation.trajet || {};
            const dateDepart = formaterDate(trajet.departAt);
            const heureDepart = formaterHeure(trajet.departAt);
            const heureArrivee = formaterHeure(trajet.arriveeAt);

            return `
                <div class="col-12 col-lg-6">
                    <div class="border rounded p-3 h-100">
                        <p class="mb-1"><strong>Trajet:</strong> ${escapeHtml(trajet.depart || "?")} -> ${escapeHtml(trajet.destination || "?")}</p>
                        <p class="mb-1"><strong>Date:</strong> ${escapeHtml(dateDepart)} (${escapeHtml(heureDepart)} - ${escapeHtml(heureArrivee)})</p>
                        <p class="mb-1"><strong>Conducteur:</strong> ${escapeHtml(trajet.driverName || "-")}</p>
                        <p class="mb-1"><strong>Credits utilises:</strong> ${escapeHtml(participation.creditsUtilises ?? "-")}</p>
                        <p class="mb-2"><strong>Participation:</strong> ${escapeHtml(formaterDateHeure(participation.joinedAt))}</p>
                        <div class="d-flex gap-2">
                            <a class="btn btn-outline-success btn-sm" href="/EcoRide/Front/covoiturage-detail?id=${encodeURIComponent(trajet.id || "")}">Voir detail</a>
                            ${participation.canCancel ? `<button class="btn btn-outline-danger btn-sm" data-annuler-participation="${participation.participationId}">Annuler ma participation</button>` : "<span class='badge text-bg-secondary align-self-center'>Non annulable</span>"}
                        </div>
                    </div>
                </div>
            `;
        }).join("");

        zoneParticipations.querySelectorAll("[data-annuler-participation]").forEach((bouton) => {
            bouton.addEventListener("click", async () => {
                const idParticipation = bouton.getAttribute("data-annuler-participation");
                if (!idParticipation) {
                    return;
                }
                if (!confirm("Annuler cette participation ?")) {
                    return;
                }
                await annulerParticipation(idParticipation);
            });
        });
    }

    function afficherTrajetsConducteur(trajets) {
        if (!trajets.length) {
            zoneTrajetsConducteur.innerHTML = "<p class='text-muted mb-0'>Aucun trajet conducteur pour le moment.</p>";
            return;
        }

        zoneTrajetsConducteur.innerHTML = trajets.map((trajet) => {
            const dateDepart = formaterDate(trajet.departAt);
            const heureDepart = formaterHeure(trajet.departAt);
            const heureArrivee = formaterHeure(trajet.arriveeAt);

            return `
                <div class="col-12 col-lg-6">
                    <div class="border rounded p-3 h-100">
                        <p class="mb-1"><strong>Trajet:</strong> ${escapeHtml(trajet.depart || "?")} -> ${escapeHtml(trajet.destination || "?")}</p>
                        <p class="mb-1"><strong>Date:</strong> ${escapeHtml(dateDepart)} (${escapeHtml(heureDepart)} - ${escapeHtml(heureArrivee)})</p>
                        <p class="mb-1"><strong>Prix:</strong> ${escapeHtml(trajet.prix ?? "-")} €</p>
                        <p class="mb-1"><strong>Places libres:</strong> ${escapeHtml(trajet.placesLibres ?? "-")}</p>
                        <p class="mb-2"><strong>Participants:</strong> ${escapeHtml(trajet.participants ?? 0)}</p>
                        <div class="d-flex gap-2">
                            <a class="btn btn-outline-success btn-sm" href="/EcoRide/Front/covoiturage-detail?id=${encodeURIComponent(trajet.trajetId || "")}">Voir detail</a>
                            ${trajet.canCancel ? `<button class="btn btn-outline-danger btn-sm" data-annuler-trajet="${trajet.trajetId}">Annuler le trajet</button>` : "<span class='badge text-bg-secondary align-self-center'>Non annulable</span>"}
                        </div>
                    </div>
                </div>
            `;
        }).join("");

        zoneTrajetsConducteur.querySelectorAll("[data-annuler-trajet]").forEach((bouton) => {
            bouton.addEventListener("click", async () => {
                const idTrajet = bouton.getAttribute("data-annuler-trajet");
                if (!idTrajet) {
                    return;
                }
                if (!confirm("Annuler ce trajet et rembourser les participants ?")) {
                    return;
                }
                await annulerTrajet(idTrajet);
            });
        });
    }

    async function annulerParticipation(idParticipation) {
        try {
            const reponse = await fetch(`http://localhost:8000/api/utilisateur/historique/participation/${idParticipation}`, {
                method: "DELETE",
                headers: {
                    "X-AUTH-TOKEN": token,
                },
            });

            const resultat = await reponse.json().catch(() => ({}));
            if (!reponse.ok) {
                throw new Error(resultat.message || "Annulation impossible.");
            }

            afficherMessage(resultat.message || "Participation annulee.", "text-success");
            await chargerHistorique();
        } catch (erreur) {
            afficherMessage("Erreur: " + erreur.message, "text-danger");
        }
    }

    async function annulerTrajet(idTrajet) {
        try {
            const reponse = await fetch(`http://localhost:8000/api/utilisateur/historique/trajet/${idTrajet}`, {
                method: "DELETE",
                headers: {
                    "X-AUTH-TOKEN": token,
                },
            });

            const resultat = await reponse.json().catch(() => ({}));
            if (!reponse.ok) {
                throw new Error(resultat.message || "Annulation du trajet impossible.");
            }

            afficherMessage(resultat.message || "Trajet annule.", "text-success");
            await chargerHistorique();
        } catch (erreur) {
            afficherMessage("Erreur: " + erreur.message, "text-danger");
        }
    }

    function afficherMessage(message, classe) {
        zoneMessage.textContent = message || "";
        zoneMessage.className = classe || "";
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

    function formaterDateHeure(valeur) {
        if (!valeur) {
            return "-";
        }
        const date = new Date(valeur);
        return `${date.toLocaleDateString("fr-FR")} ${date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
    }
})();
