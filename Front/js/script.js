
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


window.getRole = getRole;
window.isConnected = isConnected;
window.getCookie = getCookie;
window.getToken = getToken;
window.setToken = setToken;
window.setCookie = setCookie;
window.eraseCookie = eraseCookie;
window.showAndHideElementsForRoles = showAndHideElementsForRoles;
window.sanitizeHtml = sanitizeHtml;

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
