<?php

namespace App\Document;

use Doctrine\ODM\MongoDB\Mapping\Annotations as ODM;

#[ODM\Document(collection: 'admin_stat_snapshots')]
class AdminStatSnapshot
{
    #[ODM\Id]
    private ?string $id = null;

    #[ODM\Field(type: 'date_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    #[ODM\Field(type: 'string', nullable: true)]
    private ?string $adminEmail = null;

    #[ODM\Field(type: 'hash')]
    private array $stats = [];

    public function getId(): ?string
    {
        return $this->id;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(?\DateTimeImmutable $createdAt): self
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getAdminEmail(): ?string
    {
        return $this->adminEmail;
    }

    public function setAdminEmail(?string $adminEmail): self
    {
        $this->adminEmail = $adminEmail;

        return $this;
    }

    public function getStats(): array
    {
        return $this->stats;
    }

    public function setStats(array $stats): self
    {
        $this->stats = $stats;

        return $this;
    }
}
