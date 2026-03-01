// Pour le dashboard Employé – Gestion et validation des avis

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
        <h6>${a.pseudo}</h6>
        <p>${a.commentaire}</p>
        <small class="text-muted">${new Date(a.createdAt).toLocaleDateString()}</small>
        <div class="mt-2">
          <button class="btn btn-success btn-sm me-1" onclick="validerAvis(${a.id})">Valider</button>
          <button class="btn btn-danger btn-sm" onclick="supprimerAvis(${a.id})">Rejeter</button>
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
        <h6>${a.pseudo}</h6>
        <p>${a.commentaire}</p>
        <small class="text-muted">${new Date(a.createdAt).toLocaleDateString()}</small>
        <div class="mt-2">
          <button class="btn btn-danger btn-sm" onclick="supprimerAvisValidé(${a.id})">Supprimer</button>
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
  const token = getToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

chargerAvisEnAttente();
chargerAvisValidés();
