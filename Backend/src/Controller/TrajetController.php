<?php

namespace App\Controller;

use App\Entity\Participation;
use App\Entity\Trajet;
use App\Entity\Utilisateur;
use App\Repository\AvisRepository;
use App\Repository\ParticipationRepository;
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
    public function detail(
        int $id,
        TrajetRepository $repo,
        AvisRepository $avisRepository,
        ParticipationRepository $participationRepository
    ): JsonResponse
    {
        $trajet = $repo->find($id);
        if (!$trajet instanceof Trajet) {
            return $this->json(['message' => 'Trajet introuvable.'], 404);
        }

        /** @var Utilisateur|null $utilisateurConnecte */
        $utilisateurConnecte = $this->getUser();

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

        $estConducteurConnecte = false;
        if ($utilisateurConnecte instanceof Utilisateur && $trajet->getConducteur() instanceof Utilisateur) {
            $estConducteurConnecte = $trajet->getConducteur()->getId() === $utilisateurConnecte->getId();
        }

        $isParticipating = false;
        if ($utilisateurConnecte instanceof Utilisateur) {
            $isParticipating = $participationRepository->findOneBy([
                'utilisateur' => $utilisateurConnecte,
                'trajet' => $trajet,
            ]) instanceof Participation;
        }

        $statut = $trajet->getStatut();
        $canParticipate = $utilisateurConnecte instanceof Utilisateur
            && !$estConducteurConnecte
            && !$isParticipating
            && $statut === 'planifie'
            && $trajet->getPlacesLibres() > 0;
        $canLeaveAvis = $utilisateurConnecte instanceof Utilisateur && $isParticipating && $statut === 'termine';
        $currentUserPseudo = $utilisateurConnecte instanceof Utilisateur ? $utilisateurConnecte->getPseudo() : null;

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
            'statut' => $statut,
            'isParticipating' => $isParticipating,
            'canParticipate' => $canParticipate,
            'canLeaveAvis' => $canLeaveAvis,
            'currentUserPseudo' => $currentUserPseudo,
            'canStart' => $estConducteurConnecte && $statut === 'planifie',
            'canFinish' => $estConducteurConnecte && $statut === 'en_cours',
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

    #[Route('/{id}', name: 'modifier_trajet', methods: ['PUT'])]
    public function modifier(int $id, Request $request, TrajetRepository $repo, EntityManagerInterface $entityManager): JsonResponse
    {
        /** @var Utilisateur|null $utilisateur */
        $utilisateur = $this->getUser();
        if (!$utilisateur instanceof Utilisateur) {
            return $this->json(['message' => self::MESSAGE_NON_AUTHENTIFIE], 401);
        }

        $trajet = $repo->find($id);
        if (!$trajet instanceof Trajet) {
            return $this->json(['message' => 'Trajet introuvable.'], 404);
        }

        if (!$this->peutAdministrerTrajet($utilisateur, $trajet)) {
            return $this->json(['message' => 'Acces refuse.'], 403);
        }

        $donnees = json_decode($request->getContent(), true);
        if (!is_array($donnees)) {
            return $this->json(['message' => 'Corps JSON invalide.'], 400);
        }

        $depart = trim((string) ($donnees['depart'] ?? $trajet->getDepart() ?? ''));
        $destination = trim((string) ($donnees['destination'] ?? $trajet->getDestination() ?? ''));
        $prix = isset($donnees['prix']) ? (float) $donnees['prix'] : (float) ($trajet->getPrix() ?? 0);
        $placesLibres = isset($donnees['placesLibres']) ? (int) $donnees['placesLibres'] : $trajet->getPlacesLibres();
        $eco = isset($donnees['eco']) ? (bool) $donnees['eco'] : $trajet->isEco();

        if ($depart === '' || $destination === '' || $prix <= 0 || $placesLibres < 0) {
            return $this->json(['message' => 'Donnees invalides pour la modification.'], 400);
        }

        $trajet
            ->setDepart($depart)
            ->setDestination($destination)
            ->setPrix($prix)
            ->setPlacesLibres($placesLibres)
            ->setEco($eco);

        $entityManager->flush();

        return $this->json(['message' => 'Trajet modifie avec succes.']);
    }

    #[Route('/{id}', name: 'supprimer_trajet', methods: ['DELETE'])]
    public function supprimer(int $id, TrajetRepository $repo, EntityManagerInterface $entityManager): JsonResponse
    {
        /** @var Utilisateur|null $utilisateur */
        $utilisateur = $this->getUser();
        if (!$utilisateur instanceof Utilisateur) {
            return $this->json(['message' => self::MESSAGE_NON_AUTHENTIFIE], 401);
        }

        $trajet = $repo->find($id);
        if (!$trajet instanceof Trajet) {
            return $this->json(['message' => 'Trajet introuvable.'], 404);
        }

        if (!$this->peutAdministrerTrajet($utilisateur, $trajet)) {
            return $this->json(['message' => 'Acces refuse.'], 403);
        }

        $entityManager->remove($trajet);
        $entityManager->flush();

        return $this->json(['message' => 'Trajet supprime avec succes.']);
    }

    #[Route('/{id}/participer', name: 'participer_trajet', methods: ['POST'])]
    public function participer(
        int $id,
        TrajetRepository $repo,
        ParticipationRepository $participationRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        /** @var Utilisateur|null $utilisateur */
        $utilisateur = $this->getUser();
        if (!$utilisateur instanceof Utilisateur) {
            return $this->json(['message' => self::MESSAGE_NON_AUTHENTIFIE], 401);
        }

        $trajet = $repo->find($id);
        if (!$trajet instanceof Trajet) {
            return $this->json(['message' => 'Trajet introuvable.'], 404);
        }

        if ($trajet->getConducteur() instanceof Utilisateur && $trajet->getConducteur()->getId() === $utilisateur->getId()) {
            return $this->json(['message' => 'Le conducteur ne peut pas participer a son propre trajet.'], 400);
        }

        if ($trajet->getStatut() !== 'planifie') {
            return $this->json(['message' => 'La participation est possible uniquement pour un trajet planifie.'], 400);
        }

        if ($trajet->getPlacesLibres() < 1) {
            return $this->json(['message' => 'Plus de place disponible.'], 400);
        }

        $participationExistante = $participationRepository->findOneBy([
            'utilisateur' => $utilisateur,
            'trajet' => $trajet,
        ]);
        if ($participationExistante instanceof Participation) {
            return $this->json(['message' => 'Vous participez deja a ce trajet.'], 400);
        }

        $creditsRequis = (int) ceil((float) ($trajet->getPrix() ?? 0));
        if ($utilisateur->getCredits() < $creditsRequis) {
            return $this->json(['message' => 'Credits insuffisants pour participer.'], 400);
        }

        $utilisateur->setCredits($utilisateur->getCredits() - $creditsRequis);
        $trajet->setPlacesLibres($trajet->getPlacesLibres() - 1);

        $participation = (new Participation())
            ->setUtilisateur($utilisateur)
            ->setTrajet($trajet)
            ->setCreditsUtilises($creditsRequis)
            ->setCreatedAt(new \DateTimeImmutable());

        $entityManager->persist($participation);
        $entityManager->flush();

        return $this->json([
            'message' => 'Participation confirmee avec succes.',
            'creditsRestants' => $utilisateur->getCredits(),
            'placesRestantes' => $trajet->getPlacesLibres(),
        ]);
    }

    #[Route('/{id}/demarrer', name: 'demarrer_trajet', methods: ['POST'])]
    public function demarrer(
        int $id,
        TrajetRepository $repo,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        /** @var Utilisateur|null $utilisateur */
        $utilisateur = $this->getUser();
        if (!$utilisateur instanceof Utilisateur) {
            return $this->json(['message' => self::MESSAGE_NON_AUTHENTIFIE], 401);
        }

        $trajet = $repo->find($id);
        if (!$trajet instanceof Trajet) {
            return $this->json(['message' => 'Trajet introuvable.'], 404);
        }

        if (!$this->peutPiloterTrajet($utilisateur, $trajet)) {
            return $this->json(['message' => 'Seul le conducteur peut demarrer ce trajet.'], 403);
        }

        if ($trajet->getStatut() !== 'planifie') {
            return $this->json(['message' => 'Le trajet ne peut pas etre demarre dans son etat actuel.'], 400);
        }

        $trajet->setStatut('en_cours');
        $entityManager->flush();

        return $this->json([
            'message' => 'Trajet demarre avec succes.',
            'statut' => $trajet->getStatut(),
        ]);
    }

    #[Route('/{id}/arrivee', name: 'arrivee_trajet', methods: ['POST'])]
    public function arrivee(
        int $id,
        TrajetRepository $repo,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        /** @var Utilisateur|null $utilisateur */
        $utilisateur = $this->getUser();
        if (!$utilisateur instanceof Utilisateur) {
            return $this->json(['message' => self::MESSAGE_NON_AUTHENTIFIE], 401);
        }

        $trajet = $repo->find($id);
        if (!$trajet instanceof Trajet) {
            return $this->json(['message' => 'Trajet introuvable.'], 404);
        }

        if (!$this->peutPiloterTrajet($utilisateur, $trajet)) {
            return $this->json(['message' => 'Seul le conducteur peut finaliser ce trajet.'], 403);
        }

        if ($trajet->getStatut() !== 'en_cours') {
            return $this->json(['message' => 'Le trajet doit etre en cours pour etre termine.'], 400);
        }

        $trajet->setStatut('termine');
        $entityManager->flush();

        return $this->json([
            'message' => 'Trajet termine avec succes.',
            'statut' => $trajet->getStatut(),
        ]);
    }

    private function utilisateurPeutCreerTrajet(Utilisateur $utilisateur): bool
    {
        $type = $utilisateur->getTypeUtilisateur();
        $roles = $utilisateur->getRoles();

        return in_array('ROLE_ADMIN', $roles, true) || $type === 'chauffeur' || $type === 'les_deux';
    }

    private function peutAdministrerTrajet(Utilisateur $utilisateur, Trajet $trajet): bool
    {
        if (in_array('ROLE_ADMIN', $utilisateur->getRoles(), true)) {
            return true;
        }

        $conducteur = $trajet->getConducteur();
        return $conducteur instanceof Utilisateur && $conducteur->getId() === $utilisateur->getId();
    }

    private function peutPiloterTrajet(Utilisateur $utilisateur, Trajet $trajet): bool
    {
        $conducteur = $trajet->getConducteur();
        return $conducteur instanceof Utilisateur && $conducteur->getId() === $utilisateur->getId();
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
            ->setStatut('planifie')
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

