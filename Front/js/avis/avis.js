function initAvis() {
    const testimonialsDiv = document.getElementById("testimonials");
    if (testimonialsDiv) {
        chargerAvis(testimonialsDiv, 4); // max 4 avis auf Startseite
    }

    const avisForm = document.getElementById("avis-form");
    if (avisForm) {
        avisForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const pseudo = avisForm.querySelector("[name='pseudo']").value.trim();
            const commentaire = avisForm.querySelector("[name='commentaire']").value.trim();
            if (!pseudo || !commentaire) {
                alert("Veuillez remplir tous les champs.");
                return;
            }
            try {
                const res = await fetch("http://localhost:8000/api/avis", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pseudo, commentaire }),
                });
                if (!res.ok) throw new Error("Erreur lors de l'envoi.");
                avisForm.reset();
                alert("Merci pour votre avis ! Il sera publié après validation.");
                chargerAvis(testimonialsDiv, 4);
            } catch (e) {
                alert("Erreur lors de l'envoi de votre avis.");
            }
        });
    }
}

// Lädt maximal N avis
async function chargerAvis(div, max = 4) {
    div.innerHTML = "<div class='text-center text-muted'>Chargement…</div>";
    try {
        const res = await fetch("http://localhost:8000/api/avis/validated");
        if (!res.ok) throw new Error("Erreur lors du chargement.");
        let avis = await res.json();
        if (!avis.length) {
            div.innerHTML = "<div class='text-center text-muted'>Aucun avis pour le moment.</div>";
            return;
        }
        // Maximal anzeigen
        avis = avis.slice(0, max);
        div.innerHTML = avis.map(a => `
            <div class="col-md-4 mb-3">
                <div class="card border-0 shadow h-100">
                    <div class="card-body">
                        <p class="fst-italic">« ${a.commentaire} »</p>
                        <div class="d-flex align-items-center mt-3">
                            <img src="/images/user-placeholder.jpg" alt="Utilisateur" class="rounded-circle me-3" width="42" height="42">
                            <div>
                                <span class="fw-bold">${a.pseudo}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join("");
    } catch (e) {
        div.innerHTML = "<div class='text-danger'>Erreur lors de l'affichage des avis.</div>";
    }
}

// Direkt initialisieren (SPA-kompatibel)
initAvis();

