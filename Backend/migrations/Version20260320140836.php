<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260320140836 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE vehicule (id SERIAL NOT NULL, utilisateur_id INT NOT NULL, marque VARCHAR(100) NOT NULL, modele VARCHAR(100) NOT NULL, couleur VARCHAR(60) DEFAULT NULL, energie VARCHAR(60) DEFAULT NULL, places INT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_292FFF1DFB88E14F ON vehicule (utilisateur_id)');
        $this->addSql('ALTER TABLE vehicule ADD CONSTRAINT FK_292FFF1DFB88E14F FOREIGN KEY (utilisateur_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE vehicule DROP CONSTRAINT FK_292FFF1DFB88E14F');
        $this->addSql('DROP TABLE vehicule');
    }
}
