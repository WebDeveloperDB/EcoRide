import Route from "./Route.js";


export const allRoutes = [
    new Route("/EcoRide/Front/", "Accueil", "/EcoRide/Front/pages/home.html", [], "/EcoRide/Front/js/home.js"),
    new Route("/EcoRide/Front/covoiturage", "Covoiturage", "/EcoRide/Front/pages/covoiturages/covoiturage.html", [], "/EcoRide/Front/js/covoiturages/covoiturages.js"),
    new Route("/EcoRide/Front/covoiturage-detail", "Detail covoiturage", "/EcoRide/Front/pages/covoiturages/detail.html", [], "/EcoRide/Front/js/covoiturages/detail-covoiturage.js"),
    new Route("/EcoRide/Front/signin", "Connexion", "/EcoRide/Front/pages/auth/signin.html", ["disconnected"], "/EcoRide/Front/js/auth/signin.js"),
    new Route("/EcoRide/Front/signup", "Inscription", "/EcoRide/Front/pages/auth/signup.html", ["disconnected"], "/EcoRide/Front/js/auth/signup.js"),
    new Route("/EcoRide/Front/account", "Mon compte", "/EcoRide/Front/pages/auth/account.html", ["ROLE_USER"], "/EcoRide/Front/js/auth/account.js"),
    new Route("/EcoRide/Front/creer-trajet", "Creer un trajet", "/EcoRide/Front/pages/trajets/creer.html", ["ROLE_USER"], "/EcoRide/Front/js/trajets/creer-trajet.js"),
    new Route("/EcoRide/Front/editPassword", "Changement de mot de passe", "/EcoRide/Front/pages/auth/editPassword.html", ["ROLE_USER"], ""),
    new Route("/EcoRide/Front/employeeDashboard", "Dashboard Employé", "/EcoRide/Front/pages/employee/dashboardEmployee.html", ["ROLE_EMPLOYEE"], "/EcoRide/Front/js/employee/dashboardEmployeeAvis.js"),
];


export const websiteName = "EcoRide";


export const basePath = "/EcoRide/Front"; 

