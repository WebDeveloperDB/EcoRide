<?php

namespace App\Controller;

use App\Entity\Trajet;
use App\Entity\Utilisateur;
use App\Repository\AvisRepository;
use App\Repository\VehiculeRepository;
use Doctrine\ORM\EntityManagerInterface;
use App\Repository\TrajetRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/trajet')]
class TrajetController extends AbstractController
{
    private const MESSAGE_NON_AUTHENTIFIE = 'Non authentifie.';
    private const MESSAGE_ACCES_REFUSE = 'Seul un chauffeur peut creer un trajet.';

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

    #[Route('/{id}', name: 'detail_trajet', methods: ['GET'])]
    public function detail(int $id, TrajetRepository $repo, AvisRepository $avisRepository): JsonResponse
    {
        $trajet = $repo->find($id);
        if (!$trajet instanceof Trajet) {
            return $this->json(['message' => 'Trajet introuvable.'], 404);
        }

        $preferencesConducteur = [];
        $conducteur = $trajet->getConducteur();
        if ($conducteur instanceof Utilisateur) {
            $preferencesConducteur = $conducteur->getPreferences() ?? [];
        }

        $avis = $avisRepository->findBy([
            'isValidated' => true,
            'trajet' => $trajet,
        ], ['createdAt' => 'DESC'], 10);

        if (!$avis) {
            $avis = $avisRepository->findBy([
                'isValidated' => true,
                'pseudo' => $trajet->getDriverName() ?? '',
            ], ['createdAt' => 'DESC'], 10);
        }

        $avisFormat = array_map(static fn ($unAvis): array => [
            'pseudo' => $unAvis->getPseudo(),
            'commentaire' => $unAvis->getCommentaire(),
            'createdAt' => $unAvis->getCreatedAt()?->format(DATE_ATOM),
        ], $avis);

        return $this->json([
            'id' => $trajet->getId(),
            'depart' => $trajet->getDepart(),
            'destination' => $trajet->getDestination(),
            'departAt' => $trajet->getDepartAt()?->format(DATE_ATOM),
            'arriveeAt' => $trajet->getArriveeAt()?->format(DATE_ATOM),
            'prix' => $trajet->getPrix(),
            'eco' => $trajet->isEco(),
            'driverName' => $trajet->getDriverName(),
            'driverPhoto' => $trajet->getDriverPhoto(),
            'carPhoto' => $trajet->getCarPhoto(),
            'vehicle' => $trajet->getVehicle(),
            'placesLibres' => $trajet->getPlacesLibres(),
            'preferencesConducteur' => $preferencesConducteur,
            'avisConducteur' => $avisFormat,
        ]);
    }

    #[Route('', name: 'create_trajet', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $entityManager,
        VehiculeRepository $vehiculeRepository
    ): JsonResponse {
        /** @var Utilisateur|null $utilisateur */
        $utilisateur = $this->getUser();
        if (!$utilisateur instanceof Utilisateur) {
            return $this->json(['message' => self::MESSAGE_NON_AUTHENTIFIE], 401);
        }

        if (!$this->utilisateurPeutCreerTrajet($utilisateur)) {
            return $this->json(['message' => self::MESSAGE_ACCES_REFUSE], 403);
        }

        $payload = json_decode($request->getContent(), true);
        [$body, $status] = $this->creerTrajetDepuisPayload(
            $payload,
            $utilisateur,
            $vehiculeRepository,
            $entityManager
        );

        return $this->json($body, $status);
    }

    private function utilisateurPeutCreerTrajet(Utilisateur $utilisateur): bool
    {
        $type = $utilisateur->getTypeUtilisateur();

        return $type === 'chauffeur' || $type === 'les_deux';
    }

    private function creerTrajetDepuisPayload(
        mixed $payload,
        Utilisateur $utilisateur,
        VehiculeRepository $vehiculeRepository,
        EntityManagerInterface $entityManager
    ): array {
        $body = [];
        $data = [];

        if (!is_array($payload)) {
            $status = 400;
            $body = ['message' => 'Corps JSON invalide.'];
        } else {
            [$data, $status, $body] = $this->validerPayloadCreation($payload);
        }

        if ($status === 201) {
            [$body, $status] = $this->enregistrerTrajet($data, $utilisateur, $vehiculeRepository, $entityManager);
        }

        return [$body, $status];
    }

    private function validerPayloadCreation(array $payload): array
    {
        $data = [
            'depart' => trim((string) ($payload['depart'] ?? '')),
            'destination' => trim((string) ($payload['destination'] ?? '')),
            'prix' => (float) ($payload['prix'] ?? 0),
            'placesLibres' => (int) ($payload['placesLibres'] ?? 0),
            'vehiculeId' => (int) ($payload['vehiculeId'] ?? 0),
            'eco' => (bool) ($payload['eco'] ?? false),
            'departAt' => null,
            'arriveeAt' => null,
        ];

        $status = 201;
        $body = [];

        if ($data['depart'] === '' || $data['destination'] === '' || $data['prix'] <= 0 || $data['placesLibres'] < 1 || $data['vehiculeId'] < 1) {
            $status = 400;
            $body = ['message' => 'Champs obligatoires manquants ou invalides.'];
        } else {
            try {
                $data['departAt'] = new \DateTimeImmutable((string) ($payload['departAt'] ?? ''));
                $data['arriveeAt'] = new \DateTimeImmutable((string) ($payload['arriveeAt'] ?? ''));
            } catch (\Exception) {
                $status = 400;
                $body = ['message' => 'Dates invalides.'];
            }

            if ($status === 201 && $data['arriveeAt'] <= $data['departAt']) {
                $status = 400;
                $body = ['message' => 'La date d\'arrivee doit etre apres la date de depart.'];
            }
        }

        return [$data, $status, $body];
    }

    private function enregistrerTrajet(
        array $data,
        Utilisateur $utilisateur,
        VehiculeRepository $vehiculeRepository,
        EntityManagerInterface $entityManager
    ): array {
        $vehicule = $vehiculeRepository->findOneBy([
            'id' => $data['vehiculeId'],
            'utilisateur' => $utilisateur,
        ]);

        if ($vehicule === null) {
            return [['message' => 'Vehicule introuvable pour cet utilisateur.'], 404];
        }

        $trajet = (new Trajet())
            ->setDepart($data['depart'])
            ->setDestination($data['destination'])
            ->setDepartAt($data['departAt'])
            ->setArriveeAt($data['arriveeAt'])
            ->setPrix($data['prix'])
            ->setPlacesLibres($data['placesLibres'])
            ->setEco($data['eco'])
            ->setConducteur($utilisateur)
            ->setVehiculeRef($vehicule)
            ->setDriverName($utilisateur->getPseudo())
            ->setDriverPhoto($utilisateur->getPhotoProfil())
            ->setCarPhoto($vehicule->getPhotoVehicule())
            ->setVehicle(trim(($vehicule->getMarque() ?? '') . ' ' . ($vehicule->getModele() ?? '')));

        $entityManager->persist($trajet);
        $entityManager->flush();

        return [[
            'message' => 'Trajet cree avec succes.',
            'trajetId' => $trajet->getId(),
        ], 201];
    }


}

