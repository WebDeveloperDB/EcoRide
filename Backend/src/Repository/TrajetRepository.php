<?php

namespace App\Repository;

use App\Entity\Trajet;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Trajet>
 */
class TrajetRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Trajet::class);
    }

    /**
     * Recherche de trajets par ville de départ, destination et date
     * @return Trajet[]
     */
    public function search(?string $depart, ?string $destination, ?\DateTimeImmutable $date): array
    {
        $qb = $this->createQueryBuilder('t')
            ->andWhere('t.placesLibres > 0');

        if ($depart) {
            $qb->andWhere('LOWER(t.depart) LIKE LOWER(:depart)')
               ->setParameter('depart', '%' . $depart . '%');
        }
        if ($destination) {
            $qb->andWhere('LOWER(t.destination) LIKE LOWER(:destination)')
               ->setParameter('destination', '%' . $destination . '%');
        }
        if ($date) {
            $qb->andWhere('t.departAt >= :dateStart')
               ->andWhere('t.departAt <= :dateEnd')
               ->setParameter('dateStart', $date->setTime(0, 0, 0))
               ->setParameter('dateEnd', $date->setTime(23, 59, 59));
        }

        $qb->orderBy('t.departAt', 'ASC');

        return $qb->getQuery()->getResult();
    }
}
