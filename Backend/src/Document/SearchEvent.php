<?php

namespace App\Document;

use Doctrine\ODM\MongoDB\Mapping\Annotations as ODM;

#[ODM\Document(collection: 'search_events')]
class SearchEvent
{
    #[ODM\Id]
    private ?string $id = null;

    #[ODM\Field(type: 'date_immutable')]
    private ?\DateTimeImmutable $createdAt = null;

    #[ODM\Field(type: 'string', nullable: true)]
    private ?string $departure = null;

    #[ODM\Field(type: 'string', nullable: true)]
    private ?string $destination = null;

    #[ODM\Field(type: 'date_immutable', nullable: true)]
    private ?\DateTimeImmutable $travelDate = null;

    #[ODM\Field(type: 'hash')]
    private array $filters = [];

    #[ODM\Field(type: 'int')]
    private int $resultsCount = 0;

    #[ODM\Field(type: 'float', nullable: true)]
    private ?float $averageRating = null;

    #[ODM\Field(type: 'string', nullable: true)]
    private ?string $userEmail = null;

    #[ODM\Field(type: 'string', nullable: true)]
    private ?string $userRole = null;

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

    public function getDeparture(): ?string
    {
        return $this->departure;
    }

    public function setDeparture(?string $departure): self
    {
        $this->departure = $departure;

        return $this;
    }

    public function getDestination(): ?string
    {
        return $this->destination;
    }

    public function setDestination(?string $destination): self
    {
        $this->destination = $destination;

        return $this;
    }

    public function getTravelDate(): ?\DateTimeImmutable
    {
        return $this->travelDate;
    }

    public function setTravelDate(?\DateTimeImmutable $travelDate): self
    {
        $this->travelDate = $travelDate;

        return $this;
    }

    public function getFilters(): array
    {
        return $this->filters;
    }

    public function setFilters(array $filters): self
    {
        $this->filters = $filters;

        return $this;
    }

    public function getResultsCount(): int
    {
        return $this->resultsCount;
    }

    public function setResultsCount(int $resultsCount): self
    {
        $this->resultsCount = max(0, $resultsCount);

        return $this;
    }

    public function getAverageRating(): ?float
    {
        return $this->averageRating;
    }

    public function setAverageRating(?float $averageRating): self
    {
        $this->averageRating = $averageRating;

        return $this;
    }

    public function getUserEmail(): ?string
    {
        return $this->userEmail;
    }

    public function setUserEmail(?string $userEmail): self
    {
        $this->userEmail = $userEmail;

        return $this;
    }

    public function getUserRole(): ?string
    {
        return $this->userRole;
    }

    public function setUserRole(?string $userRole): self
    {
        $this->userRole = $userRole;

        return $this;
    }
}
