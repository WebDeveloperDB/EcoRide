<?php

require once __DIR__ . '/vendor/autoload.php'; // Assurez-vous que l'autoloader de Composer est inclus

$dsn = 'pgsql:host=db;port=5434;dbname=ecoRide';
$user = 'bajram';
$password = 'Vfbstuttgart';

try {
    $pdo = new PDO($dsn, $user, $password);
    echo "Connexion réussie à PostgreSQL !";
} catch (PDOException $e) {
    echo "Erreur de connexion à PostgreSQL : " . $e->getMessage();
}



$mongoHost = 'ecoride-mongodb';
$mongoPort = 27018;
$username = 'Bajram';
$password = 'Vfbstuttgart';

try {
    $manager = new MongoDB\Driver\Manager("mongodb://$username:$password@$mongoHost:$mongoPort");
    echo "Connexion à MongoDB réussie !";
    return $manager;
} catch (Exception $e) {
    echo "Échec de la connexion à MongoDB : " . $e->getMessage();
    exit();
} 