<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260313100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Création de la table utilisateur avec email unique et token API unique.';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE utilisateur (id SERIAL NOT NULL, pseudo VARCHAR(100) NOT NULL, email VARCHAR(180) NOT NULL, roles JSON NOT NULL, mot_de_passe VARCHAR(255) NOT NULL, credits INT NOT NULL, token_api VARCHAR(64) DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX uniq_utilisateur_email ON utilisateur (email)');
        $this->addSql('CREATE UNIQUE INDEX uniq_utilisateur_token ON utilisateur (token_api)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE utilisateur');
    }
}