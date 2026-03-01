# EcoRide - Plateforme de Covoiturage

## Description
EcoRide est une plateforme de covoiturage écologique permettant de réduire l'impact environnemental des déplacements.

## Stack technique
- **Frontend** : HTML5, CSS (Bootstrap 5), JavaScript (SPA avec routeur custom)
- **Backend** : Symfony 7 (PHP)
- **Base de données relationnelle** : PostgreSQL
- **Base de données NoSQL** : MongoDB
- **Serveur local** : XAMPP (frontend) + Symfony CLI (backend)

## Installation en local

### Prérequis
- XAMPP (Apache + PHP)
- Composer
- PostgreSQL
- MongoDB
- Node.js (npm)

### Frontend
1. Cloner le dépôt dans le dossier `htdocs` de XAMPP
2. Se placer dans le dossier `Front/`
3. Installer les dépendances : `npm install`
4. Accéder via : `http://localhost/EcoRide/Front/`

### Backend
1. Se placer dans le dossier `Backend/`
2. Installer les dépendances : `composer install`
3. Configurer la base de données dans `.env.local`
4. Exécuter les migrations : `php bin/console doctrine:migrations:migrate`
5. Lancer le serveur Symfony : `symfony server:start`
6. API accessible via : `http://localhost:8000`

## Structure du projet
```
EcoRide/
├── Front/          # Application frontend (SPA)
│   ├── pages/      # Pages HTML
│   ├── js/         # Scripts JavaScript
│   ├── Router/     # Routeur SPA
│   ├── scss/       # Styles SCSS
│   └── images/     # Images
├── Backend/        # API Symfony
│   ├── src/        # Code source PHP
│   ├── config/     # Configuration
│   └── migrations/ # Migrations BDD
└── README.md
```
