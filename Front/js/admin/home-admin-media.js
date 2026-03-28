(() => {
    const slots = {
        hero: "homeHeroImage",
        step1: "homeStep1Image",
        step2: "homeStep2Image",
        step3: "homeStep3Image",
        advantage1: "homeAdvantage1Image",
        advantage2: "homeAdvantage2Image",
        advantage3: "homeAdvantage3Image",
    };

    const textSlots = {
        step1Title: "homeStep1Title",
        step1Description: "homeStep1Description",
        step2Title: "homeStep2Title",
        step2Description: "homeStep2Description",
        step3Title: "homeStep3Title",
        step3Description: "homeStep3Description",
        advantagesTitle: "homeAdvantagesTitle",
        advantage1Title: "homeAdvantage1Title",
        advantage1Description: "homeAdvantage1Description",
        advantage2Title: "homeAdvantage2Title",
        advantage2Description: "homeAdvantage2Description",
        advantage3Title: "homeAdvantage3Title",
        advantage3Description: "homeAdvantage3Description",
    };

    initialiser().catch(() => {
        // keep page usable even if media API is unavailable
    });

    async function initialiser() {
        await chargerEtAppliquerMedia();

        const role = typeof window.getRole === "function" ? window.getRole() : null;
        if (role !== "ROLE_ADMIN") {
            return;
        }

        document.querySelectorAll(".home-image-admin-btn[data-home-slot]").forEach((bouton) => {
            const slot = bouton.getAttribute("data-home-slot");
            if (!slot || !slots[slot]) {
                return;
            }

            bouton.classList.remove("d-none");
            bouton.addEventListener("click", () => ouvrirSelecteurFichier(slot));
        });

        document.querySelectorAll(".home-text-admin-btn[data-home-text]").forEach((bouton) => {
            const keys = (bouton.getAttribute("data-home-text") || "")
                .split(",")
                .map((key) => key.trim())
                .filter((key) => key !== "" && textSlots[key]);

            if (!keys.length) {
                return;
            }

            bouton.classList.remove("d-none");
            bouton.addEventListener("click", () => editerTextes(keys));
        });
    }

    async function chargerEtAppliquerMedia() {
        const reponse = await fetch("http://localhost:8000/api/home/media");
        if (!reponse.ok) {
            return;
        }

        const media = await reponse.json().catch(() => ({}));
        Object.entries(slots).forEach(([slot, idElement]) => {
            const image = document.getElementById(idElement);
            if (!image) {
                return;
            }

            const url = typeof media[slot] === "string" && media[slot].trim() !== ""
                ? media[slot]
                : (image.dataset.defaultSrc || image.getAttribute("src") || "");

            if (url) {
                image.src = url;
            }
        });

        Object.entries(textSlots).forEach(([key, idElement]) => {
            const element = document.getElementById(idElement);
            if (!element) {
                return;
            }

            const valeur = typeof media[key] === "string" && media[key].trim() !== ""
                ? media[key]
                : element.textContent || "";

            element.textContent = valeur;
        });
    }

    function ouvrirSelecteurFichier(slot) {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/png,image/jpeg,image/webp,image/gif";
        input.addEventListener("change", async () => {
            const fichier = input.files?.[0];
            if (!fichier) {
                return;
            }

            await envoyerImage(slot, fichier);
        });

        input.click();
    }

    async function envoyerImage(slot, fichier) {
        const token = typeof window.getToken === "function" ? window.getToken() : null;
        if (!token) {
            afficherMessage("Connexion admin requise.", "text-danger");
            return;
        }

        const formData = new FormData();
        formData.append("image", fichier);

        const reponse = await fetch(`http://localhost:8000/api/admin/home/media/${encodeURIComponent(slot)}`, {
            method: "POST",
            headers: {
                "X-AUTH-TOKEN": token,
            },
            body: formData,
        });

        const resultat = await reponse.json().catch(() => ({}));
        if (!reponse.ok) {
            afficherMessage(resultat.message || "Upload impossible.", "text-danger");
            return;
        }

        await chargerEtAppliquerMedia();
        afficherMessage("Image accueil mise a jour.", "text-success");
    }

    async function editerTextes(keys) {
        for (const key of keys) {
            const elementId = textSlots[key];
            const element = document.getElementById(elementId);
            if (!element) {
                continue;
            }

            const actuel = (element.textContent || "").trim();
            const nouveau = window.prompt(`Nouveau texte pour ${key}:`, actuel);
            if (nouveau === null) {
                return;
            }

            const valeur = nouveau.trim();
            if (valeur === "") {
                afficherMessage("Le texte ne peut pas etre vide.", "text-danger");
                return;
            }

            const ok = await envoyerTexte(key, valeur);
            if (!ok) {
                return;
            }
        }

        await chargerEtAppliquerMedia();
        afficherMessage("Texte accueil mis a jour.", "text-success");
    }

    async function envoyerTexte(key, value) {
        const token = typeof window.getToken === "function" ? window.getToken() : null;
        if (!token) {
            afficherMessage("Connexion admin requise.", "text-danger");
            return false;
        }

        const reponse = await fetch(`http://localhost:8000/api/admin/home/content/${encodeURIComponent(key)}`, {
            method: "PUT",
            headers: {
                "X-AUTH-TOKEN": token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ value }),
        });

        const resultat = await reponse.json().catch(() => ({}));
        if (!reponse.ok) {
            afficherMessage(resultat.message || "Mise a jour texte impossible.", "text-danger");
            return false;
        }

        return true;
    }

    function afficherMessage(message, classe) {
        const zone = document.getElementById("homeMediaAdminMessage");
        if (!zone) {
            return;
        }

        zone.textContent = message;
        zone.className = "small mt-3 " + (classe || "");
    }
})();
