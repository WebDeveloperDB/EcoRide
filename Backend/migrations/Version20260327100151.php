<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260327100151 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE participation (id SERIAL NOT NULL, utilisateur_id INT NOT NULL, trajet_id INT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, credits_utilises INT NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_AB55E24FFB88E14F ON participation (utilisateur_id)');
        $this->addSql('CREATE INDEX IDX_AB55E24FD12A823 ON participation (trajet_id)');
        $this->addSql('COMMENT ON COLUMN participation.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE participation ADD CONSTRAINT FK_AB55E24FFB88E14F FOREIGN KEY (utilisateur_id) REFERENCES utilisateur (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE participation ADD CONSTRAINT FK_AB55E24FD12A823 FOREIGN KEY (trajet_id) REFERENCES trajet (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE participation DROP CONSTRAINT FK_AB55E24FFB88E14F');
        $this->addSql('ALTER TABLE participation DROP CONSTRAINT FK_AB55E24FD12A823');
        $this->addSql('DROP TABLE participation');
    }
}
