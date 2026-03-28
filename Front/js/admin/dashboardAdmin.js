(() => {
    const token = typeof window.getToken === "function" ? window.getToken() : null;
    const role = typeof window.getRole === "function" ? window.getRole() : null;

    if (!token || role !== "ROLE_ADMIN") {
        window.location.href = "/EcoRide/Front/";
        return;
    }

    const zoneMessage = document.getElementById("adminMessage");
    const zoneStats = document.getElementById("adminStats");
    const zoneMongoStats = document.getElementById("adminMongoStats");
    const zoneMongoDaily = document.getElementById("adminMongoDailySearches");
    const zoneMongoFilters = document.getElementById("adminMongoFilterUsage");
    const zoneMongoLatest = document.getElementById("adminMongoLatestSearches");
    const zoneUsers = document.getElementById("adminUsersList");
    const zoneVehicules = document.getElementById("adminVehiculesList");
    const zoneTrajets = document.getElementById("adminTrajetsList");
    const zoneAvis = document.getElementById("adminAvisList");
    const zoneParticipations = document.getElementById("adminParticipationsList");

    const formulaireEmployee = document.getElementById("adminCreateEmployeeForm");
    const formulaireUser = document.getElementById("adminCreateUserForm");
    const formulaireVehicule = document.getElementById("adminCreateVehiculeForm");

    initialiser();

    async function initialiser() {
        await chargerTout();

        formulaireEmployee?.addEventListener("submit", async (event) => {
            event.preventDefault();
            await creerEmployee();
        });

        formulaireUser?.addEventListener("submit", async (event) => {
            event.preventDefault();
            await creerUser();
        });

        formulaireVehicule?.addEventListener("submit", async (event) => {
            event.preventDefault();
            await creerVehicule();
        });
    }

    async function chargerTout() {
        await Promise.all([
            chargerStats(),
            chargerStatsMongo(),
            chargerUsers(),
            chargerVehicules(),
            chargerTrajets(),
            chargerAvis(),
            chargerParticipations(),
        ]);
    }

    async function chargerStats() {
        try {
            const stats = await api("http://localhost:8000/api/admin/stats");
            if (!zoneStats) {
                return;
            }

            const cartes = [
                ["Users", stats.usersTotal],
                ["Suspendus", stats.usersSuspended],
                ["Employes", stats.employeesTotal],
                ["Admins", stats.adminsTotal],
                ["Trajets", stats.trajetsTotal],
                ["Planifies", stats.trajetsPlanifies],
                ["En cours", stats.trajetsEnCours],
                ["Termines", stats.trajetsTermines],
                ["Vehicules", stats.vehiculesTotal],
                ["Vehicules suspendus", stats.vehiculesSuspended],
                ["Avis en attente", stats.avisPending],
                ["Avis valides", stats.avisValidated],
                ["Participations", stats.participationsTotal],
            ];

            zoneStats.innerHTML = cartes.map(([label, value]) => `
                <div class="col-6 col-md-3">
                    <div class="border rounded p-2 text-center h-100">
                        <div class="small text-muted">${label}</div>
                        <div class="h5 mb-0">${value ?? 0}</div>
                    </div>
                </div>
            `).join("");
        } catch (error) {
            afficherMessage("Erreur stats: " + error.message, "text-danger");
        }
    }

    async function chargerStatsMongo() {
        try {
            const stats = await api("http://localhost:8000/api/admin/stats/mongo");

            if (zoneMongoStats) {
                const cartes = [
                    ["Search events", stats.searchEventsTotal],
                    ["Avg results/search", stats.avgResultsPerSearch],
                    ["Avg rating seen", stats.avgRatingSeen],
                    ["Admin snapshots", stats.adminSnapshotsTotal],
                ];

                zoneMongoStats.innerHTML = cartes.map(([label, value]) => `
                    <div class="col-6 col-md-3">
                        <div class="border rounded p-2 text-center h-100">
                            <div class="small text-muted">${label}</div>
                            <div class="h5 mb-0">${value ?? 0}</div>
                        </div>
                    </div>
                `).join("");
            }

            if (zoneMongoDaily) {
                const daily = Array.isArray(stats.dailySearches) ? stats.dailySearches : [];
                zoneMongoDaily.innerHTML = daily.length
                    ? daily.slice(-10).map((row) => `<span class="badge text-bg-light me-1 mb-1">${row.date}: ${row.count}</span>`).join("")
                    : "Aucune donnee quotidienne.";
            }

            if (zoneMongoFilters) {
                const usage = stats.filterUsage || {};
                zoneMongoFilters.innerHTML = `
                    <span class="badge text-bg-secondary me-1 mb-1">ecoOnly: ${usage.ecoOnly ?? 0}</span>
                    <span class="badge text-bg-secondary me-1 mb-1">maxPrice: ${usage.maxPrice ?? 0}</span>
                    <span class="badge text-bg-secondary me-1 mb-1">maxDuration: ${usage.maxDuration ?? 0}</span>
                    <span class="badge text-bg-secondary me-1 mb-1">minRating: ${usage.minRating ?? 0}</span>
                `;
            }

            if (zoneMongoLatest) {
                const latest = Array.isArray(stats.latestSearches) ? stats.latestSearches : [];
                zoneMongoLatest.innerHTML = latest.length
                    ? latest.map((item) => {
                        const quand = item.createdAt ? new Date(item.createdAt).toLocaleString("fr-FR") : "-";
                        const fromTo = `${item.departure || "?"} -> ${item.destination || "?"}`;
                        return `<div class="border rounded p-2 mb-2"><strong>${fromTo}</strong><br><span class="text-muted">${quand} | resultats: ${item.resultsCount ?? 0} | user: ${item.userEmail || "anonyme"}</span></div>`;
                    }).join("")
                    : "Aucune recherche recente.";
            }
        } catch (error) {
            afficherMessage("Erreur stats Mongo: " + error.message, "text-danger");
        }
    }

    async function chargerUsers() {
        try {
            const users = await api("http://localhost:8000/api/admin/users");
            zoneUsers.innerHTML = users.length
                ? users.map((u) => `
                    <div class="border rounded p-2 mb-2">
                        <div><strong>#${u.id}</strong> ${u.pseudo} (${u.email}) - ${u.roles.join(", ")} - credits: ${u.credits}</div>
                        <div class="small ${u.isSuspended ? "text-danger" : "text-success"}">${u.isSuspended ? "Suspendu" : "Actif"}</div>
                        <div class="mt-2 d-flex gap-2 flex-wrap">
                            <button class="btn btn-sm btn-outline-secondary" data-edit-user="${u.id}">Modifier</button>
                            <button class="btn btn-sm ${u.isSuspended ? "btn-outline-success" : "btn-outline-warning"}" data-toggle-suspend-user="${u.id}" data-suspended="${u.isSuspended ? "1" : "0"}">${u.isSuspended ? "Reactiver" : "Suspendre"}</button>
                            <button class="btn btn-sm btn-outline-danger" data-del-user="${u.id}">Supprimer</button>
                        </div>
                    </div>
                `).join("")
                : "<p class='text-muted mb-0'>Aucun utilisateur.</p>";

            zoneUsers.querySelectorAll("[data-edit-user]").forEach((b) => {
                b.addEventListener("click", async () => {
                    const id = b.getAttribute("data-edit-user");
                    const pseudo = prompt("Nouveau pseudo:");
                    if (pseudo === null) return;
                    const credits = prompt("Nouveaux credits:");
                    if (credits === null) return;
                    const nouveauRole = prompt("Role principal (ROLE_USER / ROLE_EMPLOYEE / ROLE_ADMIN):", "ROLE_USER");
                    if (nouveauRole === null) return;

                    await api(`http://localhost:8000/api/admin/users/${id}`, {
                        method: "PUT",
                        body: JSON.stringify({
                            pseudo,
                            credits: Number.parseInt(credits, 10),
                            roles: [nouveauRole],
                        }),
                    });

                    afficherMessage("Utilisateur modifie.", "text-success");
                    await chargerUsers();
                    await chargerStats();
                });
            });

            zoneUsers.querySelectorAll("[data-del-user]").forEach((b) => {
                b.addEventListener("click", async () => {
                    const id = b.getAttribute("data-del-user");
                    if (!confirm("Supprimer cet utilisateur ?")) return;
                    await api(`http://localhost:8000/api/admin/users/${id}`, { method: "DELETE" });
                    afficherMessage("Utilisateur supprime.", "text-success");
                    await chargerTout();
                });
            });

            zoneUsers.querySelectorAll("[data-toggle-suspend-user]").forEach((b) => {
                b.addEventListener("click", async () => {
                    const id = b.getAttribute("data-toggle-suspend-user");
                    const estSuspendu = b.getAttribute("data-suspended") === "1";
                    const endpoint = estSuspendu ? "unsuspend" : "suspend";
                    await api(`http://localhost:8000/api/admin/users/${id}/${endpoint}`, { method: "POST" });
                    afficherMessage(estSuspendu ? "Compte reactive." : "Compte suspendu.", "text-success");
                    await chargerUsers();
                    await chargerStats();
                });
            });
        } catch (error) {
            afficherMessage("Erreur users: " + error.message, "text-danger");
        }
    }

    async function creerEmployee() {
        const pseudo = document.getElementById("adminEmployeePseudo")?.value.trim();
        const email = document.getElementById("adminEmployeeEmail")?.value.trim();
        const password = document.getElementById("adminEmployeePassword")?.value;

        await api("http://localhost:8000/api/admin/employees", {
            method: "POST",
            body: JSON.stringify({ pseudo, email, password }),
        });

        formulaireEmployee?.reset();
        afficherMessage("Employe cree.", "text-success");
        await chargerUsers();
        await chargerStats();
    }

    async function creerUser() {
        const pseudo = document.getElementById("adminUserPseudo")?.value.trim();
        const email = document.getElementById("adminUserEmail")?.value.trim();
        const password = document.getElementById("adminUserPassword")?.value;
        const roleSelect = document.getElementById("adminUserRole")?.value || "ROLE_USER";

        await api("http://localhost:8000/api/admin/users", {
            method: "POST",
            body: JSON.stringify({ pseudo, email, password, roles: [roleSelect] }),
        });

        formulaireUser?.reset();
        afficherMessage("Utilisateur cree.", "text-success");
        await chargerUsers();
        await chargerStats();
    }

    async function chargerVehicules() {
        try {
            const vehicules = await api("http://localhost:8000/api/admin/vehicules");
            zoneVehicules.innerHTML = vehicules.length
                ? vehicules.map((v) => `
                    <div class="border rounded p-2 mb-2">
                        <div><strong>#${v.id}</strong> ${v.marque} ${v.modele} (${v.places} places) - owner #${v.ownerId} ${v.ownerPseudo || ""}</div>
                        <div class="small ${v.isSuspended ? "text-danger" : "text-success"}">${v.isSuspended ? "Suspendu" : "Actif"}</div>
                        <div class="mt-2 d-flex gap-2">
                            <button class="btn btn-sm btn-outline-secondary" data-edit-vehicule="${v.id}">Modifier</button>
                            <button class="btn btn-sm ${v.isSuspended ? "btn-outline-success" : "btn-outline-warning"}" data-toggle-suspend-vehicule="${v.id}" data-suspended="${v.isSuspended ? "1" : "0"}">${v.isSuspended ? "Reactiver" : "Suspendre"}</button>
                            <button class="btn btn-sm btn-outline-danger" data-del-vehicule="${v.id}">Supprimer</button>
                        </div>
                    </div>
                `).join("")
                : "<p class='text-muted mb-0'>Aucun vehicule.</p>";

            zoneVehicules.querySelectorAll("[data-edit-vehicule]").forEach((b) => {
                b.addEventListener("click", async () => {
                    const id = b.getAttribute("data-edit-vehicule");
                    const places = prompt("Nouvelles places:");
                    if (places === null) return;
                    await api(`http://localhost:8000/api/admin/vehicules/${id}`, {
                        method: "PUT",
                        body: JSON.stringify({ places: Number.parseInt(places, 10) }),
                    });
                    afficherMessage("Vehicule modifie.", "text-success");
                    await chargerVehicules();
                });
            });

            zoneVehicules.querySelectorAll("[data-del-vehicule]").forEach((b) => {
                b.addEventListener("click", async () => {
                    const id = b.getAttribute("data-del-vehicule");
                    if (!confirm("Supprimer ce vehicule ?")) return;
                    await api(`http://localhost:8000/api/admin/vehicules/${id}`, { method: "DELETE" });
                    afficherMessage("Vehicule supprime.", "text-success");
                    await chargerTout();
                });
            });

            zoneVehicules.querySelectorAll("[data-toggle-suspend-vehicule]").forEach((b) => {
                b.addEventListener("click", async () => {
                    const id = b.getAttribute("data-toggle-suspend-vehicule");
                    const estSuspendu = b.getAttribute("data-suspended") === "1";
                    const endpoint = estSuspendu ? "unsuspend" : "suspend";
                    await api(`http://localhost:8000/api/admin/vehicules/${id}/${endpoint}`, { method: "POST" });
                    afficherMessage(estSuspendu ? "Vehicule reactive." : "Vehicule suspendu.", "text-success");
                    await chargerVehicules();
                    await chargerStats();
                });
            });
        } catch (error) {
            afficherMessage("Erreur vehicules: " + error.message, "text-danger");
        }
    }

    async function creerVehicule() {
        const ownerId = Number.parseInt(document.getElementById("adminVehiculeOwnerId")?.value || "0", 10);
        const marque = document.getElementById("adminVehiculeMarque")?.value.trim();
        const modele = document.getElementById("adminVehiculeModele")?.value.trim();
        const places = Number.parseInt(document.getElementById("adminVehiculePlaces")?.value || "0", 10);
        const energie = document.getElementById("adminVehiculeEnergie")?.value.trim();

        await api("http://localhost:8000/api/admin/vehicules", {
            method: "POST",
            body: JSON.stringify({ ownerId, marque, modele, places, energie }),
        });

        formulaireVehicule?.reset();
        afficherMessage("Vehicule cree.", "text-success");
        await chargerVehicules();
        await chargerStats();
    }

    async function chargerTrajets() {
        try {
            const trajets = await api("http://localhost:8000/api/admin/trajets");
            zoneTrajets.innerHTML = trajets.length
                ? trajets.map((t) => `
                    <div class="border rounded p-2 mb-2">
                        <div><strong>#${t.id}</strong> ${t.depart} -> ${t.destination} | ${t.prix} EUR | places ${t.placesLibres}</div>
                        <div class="mt-2 d-flex gap-2">
                            <button class="btn btn-sm btn-outline-secondary" data-edit-trajet="${t.id}">Modifier</button>
                            <button class="btn btn-sm btn-outline-danger" data-del-trajet="${t.id}">Supprimer</button>
                        </div>
                    </div>
                `).join("")
                : "<p class='text-muted mb-0'>Aucun trajet.</p>";

            zoneTrajets.querySelectorAll("[data-edit-trajet]").forEach((b) => {
                b.addEventListener("click", async () => {
                    const id = b.getAttribute("data-edit-trajet");
                    const prix = prompt("Nouveau prix:");
                    if (prix === null) return;
                    const placesLibres = prompt("Nouvelles places libres:");
                    if (placesLibres === null) return;
                    await api(`http://localhost:8000/api/admin/trajets/${id}`, {
                        method: "PUT",
                        body: JSON.stringify({
                            prix: Number.parseFloat(prix),
                            placesLibres: Number.parseInt(placesLibres, 10),
                        }),
                    });
                    afficherMessage("Trajet modifie.", "text-success");
                    await chargerTrajets();
                });
            });

            zoneTrajets.querySelectorAll("[data-del-trajet]").forEach((b) => {
                b.addEventListener("click", async () => {
                    const id = b.getAttribute("data-del-trajet");
                    if (!confirm("Supprimer ce trajet ? Les participants seront rembourses.")) return;
                    await api(`http://localhost:8000/api/admin/trajets/${id}`, { method: "DELETE" });
                    afficherMessage("Trajet supprime.", "text-success");
                    await chargerTout();
                });
            });
        } catch (error) {
            afficherMessage("Erreur trajets: " + error.message, "text-danger");
        }
    }

    async function chargerAvis() {
        try {
            const avis = await api("http://localhost:8000/api/admin/avis");
            zoneAvis.innerHTML = avis.length
                ? avis.map((a) => `
                    <div class="border rounded p-2 mb-2">
                        <div><strong>#${a.id}</strong> ${a.pseudo}</div>
                        <p class="mb-1">${a.commentaire || "(sans commentaire)"}</p>
                        <div class="small text-muted">note: ${a.note ?? "-"} / 5 - valide: ${a.isValidated ? "oui" : "non"}</div>
                        <div class="mt-2 d-flex gap-2">
                            <button class="btn btn-sm ${a.isValidated ? "btn-outline-warning" : "btn-outline-success"}" data-toggle-avis="${a.id}" data-validated="${a.isValidated ? "1" : "0"}">${a.isValidated ? "Retirer validation" : "Valider"}</button>
                            <button class="btn btn-sm btn-outline-secondary" data-edit-comment-avis="${a.id}">Editer commentaire</button>
                            <button class="btn btn-sm btn-outline-danger" data-del-avis="${a.id}">Supprimer</button>
                        </div>
                    </div>
                `).join("")
                : "<p class='text-muted mb-0'>Aucun avis.</p>";

            zoneAvis.querySelectorAll("[data-toggle-avis]").forEach((b) => {
                b.addEventListener("click", async () => {
                    const id = b.getAttribute("data-toggle-avis");
                    const estValide = b.getAttribute("data-validated") === "1";
                    await api(`http://localhost:8000/api/admin/avis/${id}`, {
                        method: "PUT",
                        body: JSON.stringify({ isValidated: !estValide }),
                    });
                    afficherMessage(!estValide ? "Avis valide." : "Validation retiree.", "text-success");
                    await chargerAvis();
                    await chargerStats();
                });
            });

            zoneAvis.querySelectorAll("[data-edit-comment-avis]").forEach((b) => {
                b.addEventListener("click", async () => {
                    const id = b.getAttribute("data-edit-comment-avis");
                    const commentaire = prompt("Nouveau commentaire (laisser vide pour supprimer le texte):", "");
                    if (commentaire === null) return;
                    const noteSaisie = prompt("Nouvelle note (1-5):", "5");
                    if (noteSaisie === null) return;
                    const note = Number.parseInt(noteSaisie, 10);
                    await api(`http://localhost:8000/api/admin/avis/${id}`, {
                        method: "PUT",
                        body: JSON.stringify({ commentaire, note }),
                    });
                    afficherMessage("Commentaire mis a jour.", "text-success");
                    await chargerAvis();
                });
            });

            zoneAvis.querySelectorAll("[data-del-avis]").forEach((b) => {
                b.addEventListener("click", async () => {
                    const id = b.getAttribute("data-del-avis");
                    if (!confirm("Supprimer cet avis ?")) return;
                    await api(`http://localhost:8000/api/admin/avis/${id}`, { method: "DELETE" });
                    afficherMessage("Avis supprime.", "text-success");
                    await chargerAvis();
                });
            });
        } catch (error) {
            afficherMessage("Erreur avis: " + error.message, "text-danger");
        }
    }

    async function chargerParticipations() {
        try {
            const participations = await api("http://localhost:8000/api/admin/participations");
            zoneParticipations.innerHTML = participations.length
                ? participations.map((p) => `
                    <div class="border rounded p-2 mb-2">
                        <div><strong>#${p.id}</strong> user #${p.utilisateurId} ${p.utilisateurPseudo || ""} -> trajet #${p.trajetId} (${p.depart || "?"} -> ${p.destination || "?"})</div>
                        <div class="small text-muted">credits: ${p.creditsUtilises}</div>
                    </div>
                `).join("")
                : "<p class='text-muted mb-0'>Aucune participation.</p>";
        } catch (error) {
            afficherMessage("Erreur participations: " + error.message, "text-danger");
        }
    }

    async function api(url, options = {}) {
        const headers = {
            "X-AUTH-TOKEN": token,
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {}),
        };

        const response = await fetch(url, {
            ...options,
            headers,
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(result.message || "Erreur API");
        }

        return result;
    }

    function afficherMessage(message, classe) {
        if (!zoneMessage) {
            return;
        }

        zoneMessage.textContent = message;
        zoneMessage.className = classe || "";
    }
})();
