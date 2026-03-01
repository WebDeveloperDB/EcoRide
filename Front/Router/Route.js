export default class Route {
  constructor(url, title, pathHtml, authorize, pathJS = "") {
      this.url = url;
      this.title = title;
      this.pathHtml = pathHtml;
      this.pathJS = pathJS;
      this.authorize = authorize;
  }
}

/*
authorize 

[] -> Tout le monde peut y accéder
["disconnected"] -> Réserver aux utilisateurs déconnecté 
["utilisateur"] -> Réserver aux utilisateurs avec le rôle utilisateur 
["employee"] -> Réserver aux utilisateurs avec le rôle employee 
["admin"] -> Réserver aux utilisateurs avec le rôle admin 
["admin", "utilisateur", "employee"] -> Réserver aux utilisateurs avec le rôle utlisateur OU admin OU employee
*/