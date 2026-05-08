<?php

namespace App\Command;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use MongoDB\Client;

// Ajoutez l'attribut #[AsCommand] avec le nom et la description
#[AsCommand(
    name: 'app:test-mongo',
    description: 'Test de la connexion à MongoDB.'
)]
class TestMongoCommand extends Command
{

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $output->writeln('Test de connexion MongoDB en cours...');
        
        // Connexion à MongoDB
        $client = new Client('mongodb://Bajram:Vfbstuttgart@localhost:27017/');
        $database = $client->selectDatabase('test_mongo_db'); // Nom de la base de données
        $collection = $database->selectCollection('test_collection'); // Nom de la collection
    
        // Ajout d'un document
        $result = $collection->insertOne([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'created_at' => new \MongoDB\BSON\UTCDateTime(),
        ]);
    
        $output->writeln('Document inséré avec succès : ' . $result->getInsertedId());
    
        return Command::SUCCESS;
    }
    
}
