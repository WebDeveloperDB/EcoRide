
const tokenCookieName = "accesstoken";
const RoleCookieName = "role";
const signoutBtn = document.getElementById("signout-btn");


signoutBtn.addEventListener("click", signout);

function getRole() {
    return getCookie(RoleCookieName);
}

function signout() {
    eraseCookie(tokenCookieName);
    eraseCookie(RoleCookieName);
   
    localStorage.removeItem('token');
    localStorage.removeItem('roles');
    localStorage.removeItem('email');
    window.location.reload();
}

function setToken(token) {
    setCookie(tokenCookieName, token, 7);
}

function getToken() {
    return getCookie(tokenCookieName);
}

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for (const element of ca) {
        let c = element;
        while (c.startsWith(' ')) c = c.substring(1, c.length);
        if (c.startsWith(nameEQ)) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name) {   
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function isConnected() {
    return getToken() !== null;
}

function showAndHideElementsForRoles() {
    const userConnected = isConnected();
    const role = getRole(); 

    document.querySelectorAll('[data-show]').forEach(element => {
        
        let allowed = element.dataset.show.split(",").map(r => r.trim().toLowerCase());
        let show = false;

        
        if (allowed.includes('disconnected') && !userConnected) {
            show = true;
        }
       
        else if (allowed.includes('connected') && userConnected) {
            show = true;
        }
        // rollen prüfen nur wenn eingeloggt
        else if (userConnected && role) {
            const roleName = role.replace("ROLE_", "").toLowerCase();
            
            
            if (allowed.includes('employe') && (roleName === 'admin' || roleName === 'employe')) {
                show = true;
            }
            
            else if (allowed.includes('admin') && roleName === 'admin') {
                show = true;
            }
           
            else if (allowed.includes(roleName)) {
                show = true;
            }
        }

        
        if (show) {
            element.classList.remove("d-none");
        } else {
            element.classList.add("d-none");
        }
    });
}



function sanitizeHtml(text){
    const tempHtml = document.createElement('div');
    tempHtml.textContent = text;
    return tempHtml.innerHTML; 
}

function getRoleLePlusHaut(roles) {
    let roleLePlusHaut = "ROLE_USER";

    if (roles.includes("ROLE_ADMIN")) {
        roleLePlusHaut = "ROLE_ADMIN";
    } else if (roles.includes("ROLE_EMPLOYEE")) {
        roleLePlusHaut = "ROLE_EMPLOYEE";
    }

    return roleLePlusHaut;
}

function formulaireInscriptionValide(formulaire) {
    const pseudo = (formulaire.querySelector("#PseudoInput")?.value ?? "").trim();
    const email = (formulaire.querySelector("#EmailInput")?.value ?? "").trim();
    const motDePasse = formulaire.querySelector("#PasswordInput")?.value ?? "";
    const confirmation = formulaire.querySelector("#ValidatePasswordInput")?.value ?? "";

    const emailValide = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const motDePasseValide = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/.test(motDePasse);

    return pseudo !== "" && emailValide && motDePasseValide && motDePasse === confirmation;
}

function initialiserAuthDeleguee() {
    document.addEventListener("submit", async (event) => {
        const formulaire = event.target;
        if (!(formulaire instanceof HTMLFormElement)) {
            return;
        }

        if (formulaire.id === "formulaireInscription") {
            event.preventDefault();

            if (formulaire.dataset.enCours === "1") {
                return;
            }

            if (!formulaireInscriptionValide(formulaire)) {
                alert("Merci de corriger les champs du formulaire avant de continuer.");
                return;
            }

            formulaire.dataset.enCours = "1";

            const dataForm = new FormData(formulaire);

            try {
                const response = await fetch("http://localhost:8000/api/registration", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        pseudo: dataForm.get("pseudo"),
                        email: dataForm.get("email"),
                        password: dataForm.get("mdp")
                    })
                });

                const resultat = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(resultat.message || "Impossible de créer le compte.");
                }

                alert("Inscription réussie. Vous pouvez vous connecter.");
                window.location.href = "/EcoRide/Front/signin";
            } catch (erreur) {
                alert("Erreur lors de l'inscription : " + erreur.message);
            } finally {
                delete formulaire.dataset.enCours;
            }
        }

        if (formulaire.id === "signinForm") {
            event.preventDefault();

            if (formulaire.dataset.enCours === "1") {
                return;
            }

            const email = (formulaire.querySelector("#EmailInput")?.value ?? "").trim();
            const motDePasse = formulaire.querySelector("#PasswordInput")?.value ?? "";

            if (!email || !motDePasse) {
                alert("Merci de renseigner l'email et le mot de passe.");
                return;
            }

            formulaire.dataset.enCours = "1";

            try {
                const response = await fetch("http://localhost:8000/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password: motDePasse })
                });

                const resultat = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(resultat.message || "Connexion impossible.");
                }

                const roles = resultat.roles || ["ROLE_USER"];
                const roleLePlusHaut = getRoleLePlusHaut(roles);

                setToken(resultat.apiToken);
                setCookie("role", roleLePlusHaut, 7, "/");

                localStorage.setItem("token", resultat.apiToken);
                localStorage.setItem("roles", JSON.stringify(roles));
                localStorage.setItem("email", resultat.user || email);

                window.location.href = "/EcoRide/Front/";
            } catch (erreur) {
                alert("Erreur de connexion : " + erreur.message);
            } finally {
                delete formulaire.dataset.enCours;
            }
        }
    });
}


window.getRole = getRole;
window.isConnected = isConnected;
window.getCookie = getCookie;
window.getToken = getToken;
window.setToken = setToken;
window.setCookie = setCookie;
window.eraseCookie = eraseCookie;
window.showAndHideElementsForRoles = showAndHideElementsForRoles;
window.sanitizeHtml = sanitizeHtml;
window.getRoleLePlusHaut = getRoleLePlusHaut;

initialiserAuthDeleguee();

function getInfosUser(){
    let myHeaders = new Headers();
    myHeaders.append("X-AUTH-TOKEN", getToken());

    let requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    };

    fetch("http://localhost:8000/api", requestOptions)
    .then(response =>{
        if(response.ok){
            return response.json();
        }
        else{
            console.error('Erreur:', response);
        }
    })
    .then(result => {
        return result;
    })
    .catch(error =>{
        console.error('Erreur:', error);
    });
}
