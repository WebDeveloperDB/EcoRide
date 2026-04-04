
(() => {
const token = typeof window.getToken === "function" ? window.getToken() : null;
const role = typeof window.getRole === "function" ? window.getRole() : null;

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&#39;");

if (!token || (role !== "ROLE_EMPLOYEE" && role !== "ROLE_ADMIN")) {
  window.location.href = "/EcoRide/Front/";
  return;
}

async function chargerAvisEnAttente() {
  const div = document.getElementById("pending-avis-list");
  if (!div) return;
  div.innerHTML = "<div class='text-center text-muted'>Chargement…</div>";
  const res = await fetchWithAuth("http://localhost:8000/api/avis/pending");
  if (!res.ok) {
    div.innerHTML = "<div class='alert alert-danger'>Erreur de chargement.</div>";
    return;
  }
  const avis = await res.json();
  if (!avis.length) {
    div.innerHTML = "<div class='alert alert-info'>Aucun avis en attente.</div>";
    return;
  }
  div.innerHTML = avis.map(a => `
    <div class="card mb-2 shadow">
      <div class="card-body">
        <h6>${escapeHtml(a.pseudo)}</h6>
        <p>${escapeHtml(a.commentaire)}</p>
        <small class="text-muted">${new Date(a.createdAt).toLocaleDateString()}</small>
        <div class="mt-2">
          <button class="btn btn-success btn-sm me-1" data-action="validate" data-avis-id="${Number(a.id)}">Valider</button>
          <button class="btn btn-danger btn-sm" data-action="reject" data-avis-id="${Number(a.id)}">Rejeter</button>
        </div>
      </div>
    </div>
  `).join("");
}

window.validerAvis = async function(id) {
  const res = await fetchWithAuth(`http://localhost:8000/api/avis/${id}/validate`, { method: "POST" });
  if (res.ok) {
    chargerAvisEnAttente();
    chargerAvisValidés();
  } else {
    alert("Erreur lors de la validation.");
  }
};

window.supprimerAvis = async function(id) {
  const res = await fetchWithAuth(`http://localhost:8000/api/avis/${id}`, { method: "DELETE" });
  if (res.ok) {
    chargerAvisEnAttente();
    chargerAvisValidés();
  } else {
    alert("Erreur lors de la suppression.");
  }
};

async function chargerAvisValidés() {
  const div = document.getElementById("validated-avis-list");
  if (!div) return;
  const res = await fetchWithAuth("http://localhost:8000/api/avis/validated");
  if (!res.ok) {
    div.innerHTML = "<div class='alert alert-danger'>Erreur lors du chargement.</div>";
    return;
  }
  const avis = await res.json();
  if (!avis.length) {
    div.innerHTML = "<div class='alert alert-info'>Aucun avis validé.</div>";
    return;
  }
  div.innerHTML = avis.map(a => `
    <div class="card mb-2 shadow">
      <div class="card-body">
        <h6>${escapeHtml(a.pseudo)}</h6>
        <p>${escapeHtml(a.commentaire)}</p>
        <small class="text-muted">${new Date(a.createdAt).toLocaleDateString()}</small>
        <div class="mt-2">
          <button class="btn btn-danger btn-sm" data-action="delete-validated" data-avis-id="${Number(a.id)}">Supprimer</button>
        </div>
      </div>
    </div>
  `).join("");
}

window.supprimerAvisValidé = async function(id) {
  const res = await fetchWithAuth(`http://localhost:8000/api/avis/${id}`, { method: "DELETE" });
  if (res.ok) {
    chargerAvisValidés();
  } else {
    alert("Erreur lors de la suppression de l'avis validé.");
  }
};

function fetchWithAuth(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "X-AUTH-TOKEN": token,
      "Content-Type": "application/json",
    },
  });
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const actionButton = target.closest("button[data-action][data-avis-id]");
  if (!(actionButton instanceof HTMLButtonElement)) {
    return;
  }

  const id = Number(actionButton.dataset.avisId);
  if (!Number.isInteger(id) || id <= 0) {
    return;
  }

  const action = actionButton.dataset.action;
  if (action === "validate") {
    window.validerAvis(id);
  } else if (action === "reject") {
    window.supprimerAvis(id);
  } else if (action === "delete-validated") {
    window.supprimerAvisValidé(id);
  }
});

chargerAvisEnAttente();
chargerAvisValidés();
})();
