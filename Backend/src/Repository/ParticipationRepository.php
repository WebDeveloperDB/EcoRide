<?php

namespace App\Repository;

use App\Entity\Participation;
use App\Entity\Trajet;
use App\Entity\Utilisateur;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Participation>
 */
class ParticipationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Participation::class);
    }

    /**
     * @return Participation[]
     */
    public function findParticipationsUtilisateur(Utilisateur $utilisateur): array
    {
        return $this->createQueryBuilder('p')
            ->leftJoin('p.trajet', 't')->addSelect('t')
            ->leftJoin('t.conducteur', 'c')->addSelect('c')
            ->where('p.utilisateur = :utilisateur')
            ->setParameter('utilisateur', $utilisateur)
            ->orderBy('t.departAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return Participation[]
     */
    public function findByTrajet(Trajet $trajet): array
    {
        return $this->createQueryBuilder('p')
            ->leftJoin('p.utilisateur', 'u')->addSelect('u')
            ->where('p.trajet = :trajet')
            ->setParameter('trajet', $trajet)
            ->orderBy('p.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function countByTrajet(Trajet $trajet): int
    {
        return (int) $this->createQueryBuilder('p')
            ->select('COUNT(p.id)')
            ->where('p.trajet = :trajet')
            ->setParameter('trajet', $trajet)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
