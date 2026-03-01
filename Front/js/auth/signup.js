
const inputPseudo = document.getElementById("PseudoInput"); 
const inputEmail = document.getElementById("EmailInput");
const inputPassword = document.getElementById("PasswordInput");
const inputVerificationPassword = document.getElementById("ValidatePasswordInput");
const btnValidation = document.getElementById("btn-validation-inscription");


inputPseudo.addEventListener("keyup", validateForm);
inputEmail.addEventListener("keyup", validateForm);
inputPassword.addEventListener("keyup", validateForm);
inputVerificationPassword.addEventListener("keyup", validateForm);
inputVerificationPassword.addEventListener("keyup", validateForm);



function validateForm() {
    const pseudoOk = validateRequired(inputPseudo);
    const mailOk = validateMail(inputEmail);
    const passwordOk = validatePassword(inputPassword);
    const passwordConfirmOk = validateConfirmationPassword(inputPassword, inputVerificationPassword);


    if(pseudoOk && mailOk && passwordOk && passwordConfirmOk){
        btnValidation.disabled = false;
    }else{
        btnValidation.disabled = true;
    }
}

//validation mail
function validateMail(input){
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
function validatePassword(input){
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
function validateRequired(input){
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
function validateConfirmationPassword(inputPwd, inputConfirmPwd){
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

// inscription via API
const apiUrl = "http://localhost:8000/api/registration";
const formInscription = document.getElementById("formulaireInscription");

btnValidation.addEventListener("click", InscrireUtilisateur);

function InscrireUtilisateur() {
    let dataForm = new FormData(formInscription);

    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    let raw = JSON.stringify({
        "pseudo": dataForm.get("pseudo"),
        "email": dataForm.get("email"),
        "password": dataForm.get("mdp")
    });

    let requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };

    fetch(apiUrl, requestOptions)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                return response.text().then(text => { throw new Error(text) });
            }
        })
        .then(result => {
            alert("Bienvenue " + dataForm.get("pseudo") + ", vous êtes maintenant inscrit. Vous pouvez vous connecter.");
            document.location.href = "/EcoRide/Front/signin";
        })
        .catch(error => {
            alert("Erreur lors de l'inscription : " + error.message);
        });
}