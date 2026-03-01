<?php

namespace App\Controller;

use App\Repository\TrajetRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/trajet')]
class TrajetController extends AbstractController
{
    #[Route('/populaires', name: 'get_trajets_populaires', methods: ['GET'])]
    public function getTrajetsPopulaires(TrajetRepository $repo): JsonResponse
    {
        
        $trajets = $repo->findBy([], ['departAt' => 'DESC'], 6);
        return $this->json($trajets, 200, [], ['groups' => 'trajet:read']);
    }

    #[Route('/search', name: 'search_trajet', methods: ['GET'])]
    public function search(Request $request, TrajetRepository $repo): JsonResponse
    {
        $depart = $request->query->get('departure');
        $destination = $request->query->get('destination');
        $dateStr = $request->query->get('date');

        $date = null;
        if ($dateStr) {
            try {
                $date = new \DateTimeImmutable($dateStr);
            } catch (\Exception $e) {
                return $this->json(['message' => 'Date invalide'], 400);
            }
        }

        $trajets = $repo->search($depart, $destination, $date);

        return $this->json($trajets, 200, [], ['groups' => 'trajet:read']);
    }


}

