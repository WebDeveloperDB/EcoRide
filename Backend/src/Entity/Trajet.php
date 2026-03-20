<?php

namespace App\Entity;

use App\Repository\TrajetRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: TrajetRepository::class)]
class Trajet
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: "integer")]
    #[Groups(["trajet:read"])]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    #[Groups(["trajet:read"])]
    private ?string $depart = null;

    #[ORM\Column(length: 100)]
    #[Groups(["trajet:read"])]
    private ?string $destination = null;

    #[ORM\Column(type: "datetime_immutable")]
    #[Groups(["trajet:read"])]
    private ?\DateTimeImmutable $departAt = null;

    #[ORM\Column(type: "datetime_immutable")]
    #[Groups(["trajet:read"])]
    private ?\DateTimeImmutable $arriveeAt = null;

    #[ORM\Column(type: "float")]
    #[Groups(["trajet:read"])]
    private ?float $prix = null;

    #[ORM\Column(type: "boolean")]
    #[Groups(["trajet:read"])]
    private bool $eco = false;

    #[ORM\Column(type: "string", length: 100, nullable: true)]
    #[Groups(["trajet:read"])]
    private ?string $driverName = null;

    #[ORM\Column(type: "string", length: 255, nullable: true)]
    #[Groups(["trajet:read"])]
    private ?string $driverPhoto = null;

    #[ORM\Column(type: "string", length: 255, nullable: true)]
    #[Groups(["trajet:read"])]
    private ?string $carPhoto = null;

    #[ORM\Column(type: "string", length: 50, nullable: true)]
    #[Groups(["trajet:read"])]
    private ?string $vehicle = null;

    #[ORM\Column(type: "integer")]
    #[Groups(["trajet:read"])]
    private int $placesLibres = 1;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true)]
    private ?Utilisateur $conducteur = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true)]
    private ?Vehicule $vehiculeRef = null;

    // ----- GETTER UND SETTER ------

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDepart(): ?string
    {
        return $this->depart;
    }

    public function setDepart(?string $depart): static
    {
        $this->depart = $depart;
        return $this;
    }

    public function getDestination(): ?string
    {
        return $this->destination;
    }

    public function setDestination(?string $destination): static
    {
        $this->destination = $destination;
        return $this;
    }

    public function getDepartAt(): ?\DateTimeImmutable
    {
        return $this->departAt;
    }

    public function setDepartAt(?\DateTimeImmutable $departAt): static
    {
        $this->departAt = $departAt;
        return $this;
    }

    public function getArriveeAt(): ?\DateTimeImmutable
    {
        return $this->arriveeAt;
    }

    public function setArriveeAt(?\DateTimeImmutable $arriveeAt): static
    {
        $this->arriveeAt = $arriveeAt;
        return $this;
    }

    public function getPrix(): ?float
    {
        return $this->prix;
    }

    public function setPrix(?float $prix): static
    {
        $this->prix = $prix;
        return $this;
    }

    public function isEco(): bool
    {
        return $this->eco;
    }

    public function setEco(bool $eco): static
    {
        $this->eco = $eco;
        return $this;
    }

    public function getDriverName(): ?string
    {
        return $this->driverName;
    }

    public function setDriverName(?string $driverName): static
    {
        $this->driverName = $driverName;
        return $this;
    }

    public function getDriverPhoto(): ?string
    {
        return $this->driverPhoto;
    }

    public function setDriverPhoto(?string $driverPhoto): static
    {
        $this->driverPhoto = $driverPhoto;
        return $this;
    }

    public function getCarPhoto(): ?string
    {
        return $this->carPhoto;
    }

    public function setCarPhoto(?string $carPhoto): static
    {
        $this->carPhoto = $carPhoto;
        return $this;
    }

    public function getVehicle(): ?string
    {
        return $this->vehicle;
    }

    public function setVehicle(?string $vehicle): static
    {
        $this->vehicle = $vehicle;
        return $this;
    }

    public function getPlacesLibres(): int
    {
        return $this->placesLibres;
    }

    public function setPlacesLibres(int $placesLibres): static
    {
        $this->placesLibres = $placesLibres;
        return $this;
    }

    public function getConducteur(): ?Utilisateur
    {
        return $this->conducteur;
    }

    public function setConducteur(?Utilisateur $conducteur): static
    {
        $this->conducteur = $conducteur;

        return $this;
    }

    public function getVehiculeRef(): ?Vehicule
    {
        return $this->vehiculeRef;
    }

    public function setVehiculeRef(?Vehicule $vehiculeRef): static
    {
        $this->vehiculeRef = $vehiculeRef;

        return $this;
    }
}
