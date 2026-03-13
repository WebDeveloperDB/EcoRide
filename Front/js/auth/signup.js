const champPseudo = document.getElementById("PseudoInput");
const champEmail = document.getElementById("EmailInput");
const champMotDePasse = document.getElementById("PasswordInput");
const champConfirmationMotDePasse = document.getElementById("ValidatePasswordInput");
const boutonInscription = document.getElementById("btn-validation-inscription");
const formulaireInscription = document.getElementById("formulaireInscription");

const apiUrlInscription = "http://localhost:8000/api/registration";

if (champPseudo && champEmail && champMotDePasse && champConfirmationMotDePasse && boutonInscription && formulaireInscription) {
    champPseudo.addEventListener("input", validerFormulaireInscription);
    champEmail.addEventListener("input", validerFormulaireInscription);
    champMotDePasse.addEventListener("input", validerFormulaireInscription);
    champConfirmationMotDePasse.addEventListener("input", validerFormulaireInscription);

    formulaireInscription.addEventListener("submit", soumettreInscription);
    boutonInscription.addEventListener("click", (event) => {
        event.preventDefault();
        formulaireInscription.requestSubmit();
    });

    validerFormulaireInscription();
}

function validerFormulaireInscription() {
    const pseudoOk = validerChampRequis(champPseudo);
    const emailOk = validerEmail(champEmail);
    const motDePasseOk = validerMotDePasse(champMotDePasse);
    const confirmationOk = validerConfirmationMotDePasse(champMotDePasse, champConfirmationMotDePasse);

    const formulaireValide = pseudoOk && emailOk && motDePasseOk && confirmationOk;
    boutonInscription.disabled = !formulaireValide;

    return formulaireValide;
}

//validation mail
function validerEmail(input){
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mailUser = input.value;
    if (mailUser.match(emailRegex)) {
        input.classList.add("is-valid");
        input.classList.remove("is-invalid");
        return true;
    } else {
        input.classList.remove("is-valid");
        input.classList.add("is-invalid");
        return false;
    }
}

//validation password
function validerMotDePasse(input){
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/;
    const passwordUser = input.value;
    if (passwordUser.match(passwordRegex)) {
        input.classList.add("is-valid");
        input.classList.remove("is-invalid");
        return true;
    } else {
        input.classList.remove("is-valid");
        input.classList.add("is-invalid");
        return false;
    }
}

//validation les champs
function validerChampRequis(input){
    if (input.value != '') {
        input.classList.add("is-valid");
        input.classList.remove("is-invalid");
        return true;
    } else {
        input.classList.remove("is-valid");
        input.classList.add("is-invalid");
        return false;
    }
}

//confirmation password
function validerConfirmationMotDePasse(inputPwd, inputConfirmPwd){
    if(inputPwd.value == inputConfirmPwd.value){
        inputConfirmPwd.classList.add("is-valid");
        inputConfirmPwd.classList.remove("is-invalid");
        return true;
    }
    else{
        inputConfirmPwd.classList.add("is-invalid");
        inputConfirmPwd.classList.remove("is-valid");
        return false;
    }
}

async function soumettreInscription(event) {
    event.preventDefault();

    if (!validerFormulaireInscription()) {
        alert("Merci de corriger les champs du formulaire avant de continuer.");
        return;
    }

    const dataForm = new FormData(formulaireInscription);

    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    let raw = JSON.stringify({
        "pseudo": dataForm.get("pseudo"),
        "email": dataForm.get("email"),
        "password": dataForm.get("mdp")
    });

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };

    try {
        const response = await fetch(apiUrlInscription, requestOptions);
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(result.message || "Impossible de créer le compte.");
        }

        alert("Bienvenue " + dataForm.get("pseudo") + ", vous êtes maintenant inscrit. Vous pouvez vous connecter.");
        document.location.href = "/EcoRide/Front/signin";
    } catch (error) {
        alert("Erreur lors de l'inscription : " + error.message);
    }
}