function initNewsletter() {
    const newsletterForm = document.getElementById("newsletter-form");
    if (!newsletterForm) return;

    newsletterForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const emailInput = newsletterForm.querySelector("#newsletter");
        const email = emailInput?.value.trim();

        if (!email || !validateEmail(email)) {
            alert("Veuillez saisir une adresse e-mail valide.");
            return;
        }

        try {
            const res = await fetch("http://localhost:8000/api/newsletter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Erreur serveur.");
            }

            newsletterForm.reset();
            alert("Merci ! Vous êtes maintenant inscrit(e) à la newsletter EcoRide.");
        } catch (error) {
            alert("Erreur : impossible d'enregistrer votre inscription.");
        }
    });
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

initNewsletter();
