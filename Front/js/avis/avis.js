const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

function initAvis() {
    const testimonialsDiv = document.getElementById("testimonials");
    if (testimonialsDiv) {
        chargerAvis(testimonialsDiv, 4); 
    }

    const avisForm = document.getElementById("avis-form");
    if (avisForm) {
        avisForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const pseudo = avisForm.querySelector("[name='pseudo']").value.trim();
            const commentaire = avisForm.querySelector("[name='commentaire']").value.trim();
            const note = Number.parseInt(avisForm.querySelector("[name='note']")?.value || "5", 10);
            if (!pseudo || !commentaire) {
                alert("Veuillez remplir tous les champs.");
                return;
            }
            try {
                const res = await fetch("http://localhost:8000/api/avis", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pseudo, commentaire, note }),
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

// laedt maximal N avis
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
        // maximal anzeigen
        avis = avis.slice(0, max);
        div.innerHTML = avis.map(a => {
            const pseudo = (a.pseudo || "Utilisateur").trim() || "Utilisateur";
            const initiale = pseudo.charAt(0).toUpperCase();
            return `
            <div class="col-md-4 mb-3">
                <div class="card border-0 shadow h-100 testimonial-card">
                    <div class="card-body d-flex flex-column">
                        <p class="fst-italic mb-3 testimonial-comment">« ${escapeHtml(a.commentaire || "")} »</p>
                        <div class="d-flex align-items-center mt-auto gap-2">
                            <span class="testimonial-avatar" aria-hidden="true">${escapeHtml(initiale)}</span>
                            <span class="fw-bold">${escapeHtml(pseudo)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        }).join("");
    } catch (e) {
        div.innerHTML = "<div class='text-danger'>Erreur lors de l'affichage des avis.</div>";
    }
}


initAvis();

