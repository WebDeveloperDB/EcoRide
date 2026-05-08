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

    /**
     * @param int[] $trajetIds
     * @return array<int, float>
     */
    public function findAverageRatingsByTrajetIds(array $trajetIds): array
    {
        $ids = array_values(array_unique(array_filter(array_map('intval', $trajetIds), static fn (int $id): bool => $id > 0)));
        if (!$ids) {
            return [];
        }

        $rows = $this->getEntityManager()->createQueryBuilder()
            ->select('IDENTITY(a.trajet) AS trajetId', 'AVG(a.note) AS rating')
            ->from('App\\Entity\\Avis', 'a')
            ->where('a.isValidated = true')
            ->andWhere('a.trajet IN (:ids)')
            ->setParameter('ids', $ids)
            ->groupBy('a.trajet')
            ->getQuery()
            ->getArrayResult();

        $result = [];
        foreach ($rows as $row) {
            $trajetId = (int) ($row['trajetId'] ?? 0);
            if ($trajetId > 0) {
                $result[$trajetId] = round((float) ($row['rating'] ?? 0), 1);
            }
        }

        return $result;
    }
}
