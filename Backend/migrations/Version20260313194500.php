<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260313194500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajout type_utilisateur et preferences JSON dans utilisateur';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE utilisateur ADD type_utilisateur VARCHAR(20) DEFAULT NULL');
        $this->addSql('ALTER TABLE utilisateur ADD preferences JSON DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE utilisateur DROP type_utilisateur');
        $this->addSql('ALTER TABLE utilisateur DROP preferences');
    }
}