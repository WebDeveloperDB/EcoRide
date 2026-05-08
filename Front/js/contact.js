(() => {
    const formulaire = document.getElementById("contactForm");
    const feedback = document.getElementById("contactFeedback");

    if (!formulaire || !feedback) {
        return;
    }

    formulaire.addEventListener("submit", (event) => {
        event.preventDefault();

        const nom = (document.getElementById("contactName")?.value || "").trim();
        const email = (document.getElementById("contactEmail")?.value || "").trim();
        const sujet = (document.getElementById("contactSubject")?.value || "").trim();
        const message = (document.getElementById("contactMessage")?.value || "").trim();

        if (!nom || !email || !sujet || !message) {
            afficherFeedback("Tous les champs sont obligatoires.", "text-danger");
            return;
        }

        formulaire.reset();
        afficherFeedback("Message envoye. Nous vous repondrons rapidement.", "text-success");
    });

    function afficherFeedback(message, classe) {
        feedback.textContent = message;
        feedback.className = classe;
    }
})();
