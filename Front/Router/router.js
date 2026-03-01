// router.js
import Route from "./Route.js";
import { allRoutes, websiteName, basePath } from "./allRoutes.js";

const route404 = new Route("404", "Page introuvable", basePath + "/pages/404.html", []);

const getRouteByUrl = (url) => {
  let currentRoute = null;
  allRoutes.forEach((element) => {
    if (element.url == url) {
      currentRoute = element;
    }
  });
  return currentRoute || route404;
};

const LoadContentPage = async () => {
  const path = window.location.pathname;
  const actualRoute = getRouteByUrl(path);

  const allRolesArray = actualRoute.authorize;
  
  if (allRolesArray.length > 0) {
    if (allRolesArray.includes("disconnected")) {
      const connected = window.isConnected ? window.isConnected() : false;
      if (connected) {
        window.location.replace(basePath + "/");
        return;
      }
    } else {
      const roleUser = window.getRole ? window.getRole() : null;
      
      let hasAccess = allRolesArray.includes(roleUser);
      if (roleUser === 'ROLE_ADMIN') {
        hasAccess = true;
      } else if (roleUser === 'ROLE_EMPLOYEE' && allRolesArray.includes('ROLE_USER')) {
        hasAccess = true;
      }
      
      if (!hasAccess) {
        window.location.replace(basePath + "/");
        return;
      }
    }
  }

  const html = await fetch(actualRoute.pathHtml).then((data) => data.text());
  document.getElementById("main-page").innerHTML = html;

  if (actualRoute.pathJS != "") {
    const scriptTag = document.createElement("script");
    scriptTag.setAttribute("type", "text/javascript");
    scriptTag.setAttribute("src", actualRoute.pathJS);
    document.querySelector("body").appendChild(scriptTag);
  }

  document.title = actualRoute.title + " - " + websiteName;
  
  if (window.showAndHideElementsForRoles) {
    window.showAndHideElementsForRoles();
  }
};

const routeEvent = (event) => {
  event = event || window.event;
  event.preventDefault();
  window.history.pushState({}, "", event.target.href);
  LoadContentPage();
};

// Intercepter tous les clics sur les liens <a> pour le SPA routing
document.addEventListener("click", (e) => {
  const anchor = e.target.closest("a");
  if (anchor && anchor.href && anchor.href.startsWith(window.location.origin + basePath)) {
    e.preventDefault();
    window.history.pushState({}, "", anchor.href);
    LoadContentPage();
  }
});

window.onpopstate = LoadContentPage;
window.route = routeEvent;
LoadContentPage();
