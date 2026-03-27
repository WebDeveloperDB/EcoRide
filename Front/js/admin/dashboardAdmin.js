(() => {
    const token = typeof window.getToken === "function" ? window.getToken() : null;
    const role = typeof window.getRole === "function" ? window.getRole() : null;

    if (!token || role !== "ROLE_ADMIN") {
        window.location.href = "/EcoRide/Front/";
        return;
    }

    const zoneMessage = document.getElementById("adminMessage");
    const zoneUsers = document.getElementById("adminUsersList");
    const zoneVehicules = document.getElementById("adminVehiculesList");
    const zoneTrajets = document.getElementById("adminTrajetsList");
    const zoneAvis = document.getElementById("adminAvisList");
    const zoneParticipations = document.getElementById("adminParticipationsList");

    const formulaireUser = document.getElementById("adminCreateUserForm");
    const formulaireVehicule = document.getElementById("adminCreateVehiculeForm");

    initialiser();

    async function initialiser() {
        await chargerTout();

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
            chargerUsers(),
            chargerVehicules(),
            chargerTrajets(),
            chargerAvis(),
            chargerParticipations(),
        ]);
    }

    async function chargerUsers() {
        try {
            const users = await api("http://localhost:8000/api/admin/users");
            zoneUsers.innerHTML = users.length
                ? users.map((u) => `
                    <div class="border rounded p-2 mb-2">
                        <div><strong>#${u.id}</strong> ${u.pseudo} (${u.email}) - ${u.roles.join(", ")} - credits: ${u.credits}</div>
                        <div class="mt-2 d-flex gap-2">
                            <button class="btn btn-sm btn-outline-secondary" data-edit-user="${u.id}">Modifier</button>
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
                    const role = prompt("Role principal (ROLE_USER / ROLE_EMPLOYEE / ROLE_ADMIN):", "ROLE_USER");
                    if (role === null) return;
                    await api(`http://localhost:8000/api/admin/users/${id}`, {
                        method: "PUT",
                        body: JSON.stringify({
                            pseudo,
                            credits: Number.parseInt(credits, 10),
                            roles: [role],
                        }),
                    });
                    afficherMessage("Utilisateur modifie.", "text-success");
                    await chargerUsers();
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
        } catch (error) {
            afficherMessage("Erreur users: " + error.message, "text-danger");
        }
    }

    async function creerUser() {
        const pseudo = document.getElementById("adminUserPseudo")?.value.trim();
        const email = document.getElementById("adminUserEmail")?.value.trim();
        const password = document.getElementById("adminUserPassword")?.value;
        const role = document.getElementById("adminUserRole")?.value || "ROLE_USER";

        await api("http://localhost:8000/api/admin/users", {
            method: "POST",
            body: JSON.stringify({ pseudo, email, password, roles: [role] }),
        });

        formulaireUser?.reset();
        afficherMessage("Utilisateur cree.", "text-success");
        await chargerUsers();
    }

    async function chargerVehicules() {
        try {
            const vehicules = await api("http://localhost:8000/api/admin/vehicules");
            zoneVehicules.innerHTML = vehicules.length
                ? vehicules.map((v) => `
                    <div class="border rounded p-2 mb-2">
                        <div><strong>#${v.id}</strong> ${v.marque} ${v.modele} (${v.places} places) - owner #${v.ownerId} ${v.ownerPseudo || ""}</div>
                        <div class="mt-2 d-flex gap-2">
                            <button class="btn btn-sm btn-outline-secondary" data-edit-vehicule="${v.id}">Modifier</button>
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
                        body: JSON.stringify({ prix: Number.parseFloat(prix), placesLibres: Number.parseInt(placesLibres, 10) }),
                    });
                    afficherMessage("Trajet modifie.", "text-success");
                    await chargerTrajets();
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
                        <div><strong>#${a.id}</strong> ${a.pseudo}: ${a.commentaire}</div>
                        <div class="small text-muted">valide: ${a.isValidated ? "oui" : "non"}</div>
                        <div class="mt-2 d-flex gap-2">
                            <button class="btn btn-sm btn-outline-secondary" data-edit-avis="${a.id}">Modifier</button>
                            <button class="btn btn-sm btn-outline-danger" data-del-avis="${a.id}">Supprimer</button>
                        </div>
                    </div>
                `).join("")
                : "<p class='text-muted mb-0'>Aucun avis.</p>";

            zoneAvis.querySelectorAll("[data-edit-avis]").forEach((b) => {
                b.addEventListener("click", async () => {
                    const id = b.getAttribute("data-edit-avis");
                    const commentaire = prompt("Nouveau commentaire:");
                    if (commentaire === null) return;
                    const isValidated = confirm("Valider cet avis ?");
                    await api(`http://localhost:8000/api/admin/avis/${id}`, {
                        method: "PUT",
                        body: JSON.stringify({ commentaire, isValidated }),
                    });
                    afficherMessage("Avis modifie.", "text-success");
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
        if (!zoneMessage) return;
        zoneMessage.textContent = message;
        zoneMessage.className = classe || "";
    }
})();
