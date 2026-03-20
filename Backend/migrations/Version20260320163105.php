<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260320163105 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE trajet ADD conducteur_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE trajet ADD vehicule_ref_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE trajet ADD CONSTRAINT FK_2B5BA98CF16F4AC6 FOREIGN KEY (conducteur_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE trajet ADD CONSTRAINT FK_2B5BA98CA4E2A889 FOREIGN KEY (vehicule_ref_id) REFERENCES vehicule (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE INDEX IDX_2B5BA98CF16F4AC6 ON trajet (conducteur_id)');
        $this->addSql('CREATE INDEX IDX_2B5BA98CA4E2A889 ON trajet (vehicule_ref_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE trajet DROP CONSTRAINT FK_2B5BA98CF16F4AC6');
        $this->addSql('ALTER TABLE trajet DROP CONSTRAINT FK_2B5BA98CA4E2A889');
        $this->addSql('DROP INDEX IDX_2B5BA98CF16F4AC6');
        $this->addSql('DROP INDEX IDX_2B5BA98CA4E2A889');
        $this->addSql('ALTER TABLE trajet DROP conducteur_id');
        $this->addSql('ALTER TABLE trajet DROP vehicule_ref_id');
    }
}
