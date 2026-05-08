<?php

namespace App\Service;

use App\Document\AdminStatSnapshot;
use App\Document\SearchEvent;
use Doctrine\ODM\MongoDB\DocumentManager;
use Psr\Log\LoggerInterface;

class MongoAnalyticsLogger
{
    public function __construct(
        private readonly DocumentManager $documentManager,
        private readonly LoggerInterface $logger,
    ) {
    }

    public function logSearch(array $payload): void
    {
        try {
            $event = (new SearchEvent())
                ->setCreatedAt(new \DateTimeImmutable())
                ->setDeparture($this->toNullableString($payload['departure'] ?? null))
                ->setDestination($this->toNullableString($payload['destination'] ?? null))
                ->setTravelDate($payload['travelDate'] instanceof \DateTimeImmutable ? $payload['travelDate'] : null)
                ->setFilters(is_array($payload['filters'] ?? null) ? $payload['filters'] : [])
                ->setResultsCount((int) ($payload['resultsCount'] ?? 0))
                ->setAverageRating(isset($payload['averageRating']) ? (float) $payload['averageRating'] : null)
                ->setUserEmail($this->toNullableString($payload['userEmail'] ?? null))
                ->setUserRole($this->toNullableString($payload['userRole'] ?? null));

            $this->documentManager->persist($event);
            $this->documentManager->flush();
        } catch (\Throwable $exception) {
            $this->logger->warning('Mongo search event logging failed.', [
                'error' => $exception->getMessage(),
            ]);
        }
    }

    public function logAdminStats(array $stats, ?string $adminEmail): void
    {
        try {
            $snapshot = (new AdminStatSnapshot())
                ->setCreatedAt(new \DateTimeImmutable())
                ->setAdminEmail($this->toNullableString($adminEmail))
                ->setStats($stats);

            $this->documentManager->persist($snapshot);
            $this->documentManager->flush();
        } catch (\Throwable $exception) {
            $this->logger->warning('Mongo admin stats snapshot logging failed.', [
                'error' => $exception->getMessage(),
            ]);
        }
    }

    private function toNullableString(mixed $value): ?string
    {
        $text = trim((string) $value);

        return $text !== '' ? $text : null;
    }
}
