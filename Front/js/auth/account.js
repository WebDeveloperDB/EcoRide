(() => {
    const formulaire = document.getElementById("profilForm");
    if (!formulaire) {
        return;
    }

    const champPseudo = document.getElementById("PseudoInput");
    const champEmail = document.getElementById("EmailInput");
    const champCredits = document.getElementById("CreditsInput");
    const champRole = document.getElementById("RoleInput");
    const champTypeUtilisateur = document.getElementById("TypeUtilisateurInput");
    const preferenceAnimaux = document.getElementById("PreferenceAnimaux");
    const preferenceFumeur = document.getElementById("PreferenceFumeur");
    const preferenceMusique = document.getElementById("PreferenceMusique");
    const zoneMessage = document.getElementById("profilMessage");

    chargerProfil();

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

            afficherMessage("Profil mis à jour.", "text-success");
            await chargerProfil(true);
        } catch (error) {
            afficherMessage("Erreur: " + error.message, "text-danger");
        }
    });

    async function chargerProfil(conserverMessage = false) {
        const token = window.getToken ? window.getToken() : null;
        if (!token) {
            afficherMessage("Vous devez être connecté.", "text-danger");
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
            champRole.value = Array.isArray(profil.roles) ? profil.roles.join(", ") : "";
            champTypeUtilisateur.value = profil.typeUtilisateur || "";

            const preferences = profil.preferences || {};
            preferenceAnimaux.checked = !!preferences.animaux;
            preferenceFumeur.checked = !!preferences.fumeur;
            preferenceMusique.checked = !!preferences.musique;

            if (!conserverMessage) {
                afficherMessage("", "");
            }
        } catch (error) {
            afficherMessage("Erreur: " + error.message, "text-danger");
        }
    }

    function afficherMessage(message, classe) {
        zoneMessage.textContent = message;
        zoneMessage.className = "pt-3 text-center " + (classe || "");
    }
})();