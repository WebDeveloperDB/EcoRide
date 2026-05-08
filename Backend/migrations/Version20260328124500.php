<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260328124500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Ajoute une note numerique sur les avis';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE avis ADD note SMALLINT DEFAULT 5 NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE avis DROP note');
    }
}
