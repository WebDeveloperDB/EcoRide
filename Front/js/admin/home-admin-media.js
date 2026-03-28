(() => {
    const slots = {
        hero: "homeHeroImage",
        step1: "homeStep1Image",
        step2: "homeStep2Image",
        step3: "homeStep3Image",
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

    function afficherMessage(message, classe) {
        const zone = document.getElementById("homeMediaAdminMessage");
        if (!zone) {
            return;
        }

        zone.textContent = message;
        zone.className = "small mt-3 " + (classe || "");
    }
})();
