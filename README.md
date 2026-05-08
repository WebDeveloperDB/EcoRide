# EcoRide - Application de Covoiturage

Application web EcoRide avec gestion des trajets, participations, avis, profils et statistiques MongoDB.

---

## Table des matieres

- [Prerequis](#prerequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Lancement de l'application](#lancement-de-lapplication)
- [Acces a l'application](#acces-a-lapplication)
- [Technologies utilisees](#technologies-utilisees)

---

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **PHP** >= 8.2
- **Composer** >= 2.0
- **PostgreSQL** >= 16
- **MongoDB** >= 5.0
- **Apache** (XAMPP)
- **Git**

---

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/WebDeveloperDB/EcoRide.git
cd EcoRide
```

### 2. Installer les dependances Backend (Symfony)

```bash
cd Backend
composer install
```

### 3. Créer la base de données PostgreSQL

```bash
cd Backend
php bin/console doctrine:database:create
```

### 5. Verifier MongoDB

Assurez-vous que MongoDB est demarre :

```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

---

## Configuration

### 1. Fichier `.env.local` (Backend Symfony)

Créer le fichier `Backend/.env.local` :

```env
# Database PostgreSQL
DATABASE_URL="postgresql://votre_user:votre_password@127.0.0.1:5432/ecoride?serverVersion=16&charset=utf8"

# MongoDB pour les statistiques
MONGODB_URL="mongodb://127.0.0.1:27017"
MONGODB_DB="ecoride_mongo"
```
Remplacez 'votre_user' et 'votre_password' par vos identifiants.

### 2. Vérifier les migrations

```bash
php bin/console doctrine:migrations:migrate
```

---

## Lancement de l'application

### 1. Démarrer le serveur Symfony (Backend)

```bash
cd Backend
symfony server:start
```

**Backend accessible sur : http://localhost:8000/api**


### 2. Accéder au Frontend

**Avec Apache (XAMPP) :**

Placer le projet dans `C:\xampp\htdocs\EcoRide` et acceder via :

**Frontend accessible sur : http://localhost/EcoRide/Front/**

---

## Accès à l'application

### Interfaces disponibles

| Interface | URL | Description |
| --- | --- | --- |
| **Page d'accueil** | http://localhost/EcoRide/Front/ | Page publique |
| **Recherche covoiturage** | http://localhost/EcoRide/Front/covoiturage | Rechercher un trajet |
| **Connexion** | http://localhost/EcoRide/Front/signin | Page de connexion |
| **Inscription** | http://localhost/EcoRide/Front/signup | Creer un compte utilisateur |
| **Mon compte** | http://localhost/EcoRide/Front/account | Profil utilisateur |
| **Creer un trajet** | http://localhost/EcoRide/Front/creer-trajet | Publication d'un trajet |
| **Dashboard Admin** | http://localhost/EcoRide/Front/admin-dashboard | Gestion administrateur |
| **Stats MongoDB (Admin)** | http://localhost/EcoRide/Front/admin-mongo-stats | Statistiques MongoDB |
| **Dashboard Employe** | http://localhost/EcoRide/Front/employeeDashboard | Moderation des avis |
| **Contact** | http://localhost/EcoRide/Front/contact | Page de contact |
| **Mentions legales** | http://localhost/EcoRide/Front/mentions-legales | Informations legales |
| **API Backend** | http://localhost:8000/api | API Symfony |


## Technologies utilisées

### Backend

- **Symfony 7.1** - Framework PHP
- **Doctrine ORM** - Gestion PostgreSQL
- **Doctrine MongoDB ODM** - Statistiques MongoDB

### Frontend

- **HTML5 / CSS3** - Structure et style
- **JavaScript** - SPA avec routing
- **Bootstrap 5** - Design responsive
- **Fetch API** - Communication avec le backend

### Base de données

- **PostgreSQL 16** - Donnees relationnelles
- **MongoDB 5.0** - Statistiques de consultation