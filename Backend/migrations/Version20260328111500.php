<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260328111500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute la suspension des vehicules';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE vehicule ADD is_suspended BOOLEAN DEFAULT false NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE vehicule DROP is_suspended');
    }
}
