<?php

namespace App\Controller;

use App\Document\AdminStatSnapshot;
use App\Document\SearchEvent;
use App\Entity\Avis;
use App\Entity\Participation;
use App\Entity\Trajet;
use App\Entity\Utilisateur;
use App\Entity\Vehicule;
use App\Repository\AvisRepository;
use App\Repository\ParticipationRepository;
use App\Repository\TrajetRepository;
use App\Repository\UtilisateurRepository;
use App\Repository\VehiculeRepository;
use App\Service\MongoAnalyticsLogger;
use Doctrine\ODM\MongoDB\DocumentManager as MongoDocumentManager;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/admin')]
class AdminController extends AbstractController
{
    #[Route('/stats', name: 'admin_stats', methods: ['GET'])]
    public function stats(
        UtilisateurRepository $utilisateurRepository,
        TrajetRepository $trajetRepository,
        VehiculeRepository $vehiculeRepository,
        AvisRepository $avisRepository,
        ParticipationRepository $participationRepository,
        MongoAnalyticsLogger $mongoAnalyticsLogger
    ): JsonResponse {
        $admin = $this->requireAdmin();
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $stats = [
            'usersTotal' => $utilisateurRepository->count([]),
            'usersSuspended' => $utilisateurRepository->count(['isSuspended' => true]),
            'employeesTotal' => $this->countByRole($utilisateurRepository, 'ROLE_EMPLOYEE'),
            'adminsTotal' => $this->countByRole($utilisateurRepository, 'ROLE_ADMIN'),
            'trajetsTotal' => $trajetRepository->count([]),
            'trajetsPlanifies' => $trajetRepository->count(['statut' => 'planifie']),
            'trajetsEnCours' => $trajetRepository->count(['statut' => 'en_cours']),
            'trajetsTermines' => $trajetRepository->count(['statut' => 'termine']),
            'vehiculesTotal' => $vehiculeRepository->count([]),
            'vehiculesSuspended' => $vehiculeRepository->count(['isSuspended' => true]),
            'avisPending' => $avisRepository->count(['isValidated' => false]),
            'avisValidated' => $avisRepository->count(['isValidated' => true]),
            'participationsTotal' => $participationRepository->count([]),
        ];

        $mongoAnalyticsLogger->logAdminStats($stats, $admin->getEmail());

        return $this->json($stats);
    }

    #[Route('/stats/mongo', name: 'admin_stats_mongo', methods: ['GET'])]
    public function mongoStats(MongoDocumentManager $mongoDocumentManager): JsonResponse
    {
        $admin = $this->requireAdmin();
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        /** @var SearchEvent[] $searchEvents */
        $searchEvents = $mongoDocumentManager->getRepository(SearchEvent::class)->findBy([], ['createdAt' => 'DESC'], 800);
        /** @var AdminStatSnapshot[] $snapshots */
        $snapshots = $mongoDocumentManager->getRepository(AdminStatSnapshot::class)->findBy([], ['createdAt' => 'DESC'], 300);

        $dailySearches = [];
        $filterUsage = [
            'ecoOnly' => 0,
            'maxPrice' => 0,
            'maxDuration' => 0,
            'minRating' => 0,
        ];
        $resultsSum = 0;
        $ratingsSum = 0.0;
        $ratingsCount = 0;
        $latestSearches = [];

        foreach ($searchEvents as $index => $event) {
            $createdAt = $event->getCreatedAt();
            if ($createdAt instanceof \DateTimeImmutable) {
                $key = $createdAt->format('Y-m-d');
                $dailySearches[$key] = ($dailySearches[$key] ?? 0) + 1;
            }

            $filters = $event->getFilters();
            if (($filters['ecoOnly'] ?? false) === true) {
                $filterUsage['ecoOnly']++;
            }
            if (($filters['maxPrice'] ?? null) !== null) {
                $filterUsage['maxPrice']++;
            }
            if (($filters['maxDuration'] ?? null) !== null) {
                $filterUsage['maxDuration']++;
            }
            if (($filters['minRating'] ?? null) !== null) {
                $filterUsage['minRating']++;
            }

            $resultsSum += $event->getResultsCount();

            if ($event->getAverageRating() !== null) {
                $ratingsSum += (float) $event->getAverageRating();
                $ratingsCount++;
            }

            if ($index < 8) {
                $latestSearches[] = [
                    'createdAt' => $createdAt?->format(DATE_ATOM),
                    'departure' => $event->getDeparture(),
                    'destination' => $event->getDestination(),
                    'resultsCount' => $event->getResultsCount(),
                    'userEmail' => $event->getUserEmail(),
                    'filters' => $filters,
                ];
            }
        }

        ksort($dailySearches);
        $dailySearchesData = array_map(
            static fn (string $date, int $count): array => ['date' => $date, 'count' => $count],
            array_keys($dailySearches),
            array_values($dailySearches)
        );

        $latestSnapshots = array_map(static fn (AdminStatSnapshot $snapshot): array => [
            'createdAt' => $snapshot->getCreatedAt()?->format(DATE_ATOM),
            'adminEmail' => $snapshot->getAdminEmail(),
            'stats' => $snapshot->getStats(),
        ], array_slice($snapshots, 0, 8));

        $payload = [
            'searchEventsTotal' => count($searchEvents),
            'avgResultsPerSearch' => count($searchEvents) > 0 ? round($resultsSum / count($searchEvents), 2) : 0,
            'avgRatingSeen' => $ratingsCount > 0 ? round($ratingsSum / $ratingsCount, 2) : 0,
            'filterUsage' => $filterUsage,
            'dailySearches' => $dailySearchesData,
            'latestSearches' => $latestSearches,
            'adminSnapshotsTotal' => count($snapshots),
            'latestSnapshots' => $latestSnapshots,
        ];

        return $this->json($payload);
    }

    #[Route('/users', name: 'admin_users_list', methods: ['GET'])]
    public function listUsers(UtilisateurRepository $utilisateurRepository): JsonResponse
    {
        $admin = $this->requireAdmin();
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $users = $utilisateurRepository->findBy([], ['id' => 'DESC']);

        return $this->json(array_map(static fn (Utilisateur $user): array => [
            'id' => $user->getId(),
            'pseudo' => $user->getPseudo(),
            'email' => $user->getEmail(),
            'roles' => $user->getRoles(),
            'credits' => $user->getCredits(),
            'typeUtilisateur' => $user->getTypeUtilisateur(),
            'isSuspended' => $user->isSuspended(),
        ], $users));
    }

    #[Route('/employees', name: 'admin_employees_create', methods: ['POST'])]
    public function createEmployee(
        Request $request,
        UtilisateurRepository $utilisateurRepository,
        UserPasswordHasherInterface $hasher,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $admin = $this->requireAdmin();
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return $this->json(['message' => 'Corps JSON invalide.'], 400);
        }

        $pseudo = trim((string) ($payload['pseudo'] ?? ''));
        $email = mb_strtolower(trim((string) ($payload['email'] ?? '')));
        $password = trim((string) ($payload['password'] ?? ''));

        if ($pseudo === '' || $email === '' || $password === '') {
            return $this->json(['message' => 'Pseudo, email et mot de passe sont obligatoires.'], 400);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->json(['message' => 'Email invalide.'], 400);
        }
        if ($utilisateurRepository->findOneBy(['email' => $email])) {
            return $this->json(['message' => 'Cet email existe deja.'], 409);
        }

        $employee = (new Utilisateur())
            ->setPseudo($pseudo)
            ->setEmail($email)
            ->setRoles(['ROLE_EMPLOYEE', 'ROLE_USER'])
            ->setCredits(20)
            ->setTypeUtilisateur('passager');
        $employee->setMotDePasse($hasher->hashPassword($employee, $password));

        $entityManager->persist($employee);
        $entityManager->flush();

        return $this->json([
            'message' => 'Employe cree avec succes.',
            'id' => $employee->getId(),
        ], 201);
    }

    #[Route('/users', name: 'admin_users_create', methods: ['POST'])]
    public function createUser(
        Request $request,
        UtilisateurRepository $utilisateurRepository,
        UserPasswordHasherInterface $hasher,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $admin = $this->requireAdmin();
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return $this->json(['message' => 'Corps JSON invalide.'], 400);
        }

        $pseudo = trim((string) ($payload['pseudo'] ?? ''));
        $email = mb_strtolower(trim((string) ($payload['email'] ?? '')));
        $password = (string) ($payload['password'] ?? '');
        $credits = (int) ($payload['credits'] ?? 20);
        $typeUtilisateur = trim((string) ($payload['typeUtilisateur'] ?? ''));
        $roles = $this->normaliserRoles($payload['roles'] ?? ['ROLE_USER']);

        if ($pseudo === '' || $email === '' || $password === '') {
            return $this->json(['message' => 'Pseudo, email et mot de passe sont obligatoires.'], 400);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->json(['message' => 'Email invalide.'], 400);
        }
        if ($utilisateurRepository->findOneBy(['email' => $email])) {
            return $this->json(['message' => 'Cet email existe deja.'], 409);
        }

        $user = (new Utilisateur())
            ->setPseudo($pseudo)
            ->setEmail($email)
            ->setRoles($roles)
            ->setCredits($credits)
            ->setTypeUtilisateur($typeUtilisateur !== '' ? $typeUtilisateur : null);

        $user->setMotDePasse($hasher->hashPassword($user, $password));

        $entityManager->persist($user);
        $entityManager->flush();

        return $this->json(['message' => 'Utilisateur cree avec succes.', 'id' => $user->getId()], 201);
    }

    #[Route('/users/{id}', name: 'admin_users_update', methods: ['PUT'])]
    public function updateUser(int $id, Request $request, UtilisateurRepository $utilisateurRepository, EntityManagerInterface $entityManager): JsonResponse
    {
        $admin = $this->requireAdmin();
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $user = $utilisateurRepository->find($id);
        if (!$user instanceof Utilisateur) {
            return $this->json(['message' => 'Utilisateur introuvable.'], 404);
        }

        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return $this->json(['message' => 'Corps JSON invalide.'], 400);
        }

        if (array_key_exists('pseudo', $payload)) {
            $pseudo = trim((string) $payload['pseudo']);
            if ($pseudo === '') {
                return $this->json(['message' => 'Pseudo invalide.'], 400);
            }
            $user->setPseudo($pseudo);
        }

        if (array_key_exists('email', $payload)) {
            $email = mb_strtolower(trim((string) $payload['email']));
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return $this->json(['message' => 'Email invalide.'], 400);
            }
            $deja = $utilisateurRepository->findOneBy(['email' => $email]);
            if ($deja instanceof Utilisateur && $deja->getId() !== $user->getId()) {
                return $this->json(['message' => 'Cet email existe deja.'], 409);
            }
            $user->setEmail($email);
        }

        if (array_key_exists('credits', $payload)) {
            $user->setCredits((int) $payload['credits']);
        }

        if (array_key_exists('typeUtilisateur', $payload)) {
            $type = trim((string) $payload['typeUtilisateur']);
            $user->setTypeUtilisateur($type !== '' ? $type : null);
        }

        if (array_key_exists('roles', $payload)) {
            $user->setRoles($this->normaliserRoles($payload['roles']));
        }

        $entityManager->flush();

        return $this->json(['message' => 'Utilisateur modifie avec succes.']);
    }

    #[Route('/users/{id}', name: 'admin_users_delete', methods: ['DELETE'])]
    public function deleteUser(int $id, UtilisateurRepository $utilisateurRepository, EntityManagerInterface $entityManager): JsonResponse
    {
        /** @var Utilisateur|JsonResponse $admin */
        $admin = $this->requireAdmin();
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $user = $utilisateurRepository->find($id);
        if (!$user instanceof Utilisateur) {
            return $this->json(['message' => 'Utilisateur introuvable.'], 404);
        }

        if ($admin->getId() === $user->getId()) {
            return $this->json(['message' => 'Vous ne pouvez pas supprimer votre propre compte admin.'], 400);
        }

        $entityManager->remove($user);
        $entityManager->flush();

        return $this->json(['message' => 'Utilisateur supprime avec succes.']);
    }

    #[Route('/users/{id}/suspend', name: 'admin_users_suspend', methods: ['POST'])]
    public function suspendUser(int $id, UtilisateurRepository $utilisateurRepository, EntityManagerInterface $entityManager): JsonResponse
    {
        /** @var Utilisateur|JsonResponse $admin */
        $admin = $this->requireAdmin();
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $user = $utilisateurRepository->find($id);
        if (!$user instanceof Utilisateur) {
            return $this->json(['message' => 'Utilisateur introuvable.'], 404);
        }

        if ($admin->getId() === $user->getId()) {
            return $this->json(['message' => 'Vous ne pouvez pas suspendre votre propre compte.'], 400);
        }

        $user->setSuspended(true);
        $entityManager->flush();

        return $this->json(['message' => 'Compte suspendu avec succes.']);
    }

    #[Route('/users/{id}/unsuspend', name: 'admin_users_unsuspend', methods: ['POST'])]
    public function unsuspendUser(int $id, UtilisateurRepository $utilisateurRepository, EntityManagerInterface $entityManager): JsonResponse
    {
        $admin = $this->requireAdmin();
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $user = $utilisateurRepository->find($id);
        if (!$user instanceof Utilisateur) {
            return $this->json(['message' => 'Utilisateur introuvable.'], 404);
        }

        $user->setSuspended(false);
        $entityManager->flush();

        return $this->json(['message' => 'Compte reactive avec succes.']);
    }

    #[Route('/vehicules', name: 'admin_vehicules_list', methods: ['GET'])]
    public function listVehicules(VehiculeRepository $vehiculeRepository): JsonResponse
    {
        $admin = $this->requireAdmin();
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $vehicules = $vehiculeRepository->findBy([], ['id' => 'DESC']);

        return $this->json(array_map(static fn (Vehicule $vehicule): array => [
            'id' => $vehicule->getId(),
            'marque' => $vehicule->getMarque(),
            'modele' => $vehicule->getModele(),
            'places' => $vehicule->getPlaces(),
            'couleur' => $vehicule->getCouleur(),
            'energie' => $vehicule->getEnergie(),
            'photoVehicule' => $vehicule->getPhotoVehicule(),
            'ownerId' => $vehicule->getUtilisateur()?->getId(),
            'ownerPseudo' => $vehicule->getUtilisateur()?->getPseudo(),
            'isSuspended' => $vehicule->isSuspended(),
        ], $vehicules));
    }

    #[Route('/vehicules', name: 'admin_vehicules_create', methods: ['POST'])]
    public function createVehicule(
        Request $request,
        UtilisateurRepository $utilisateurRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $admin = $this->requireAdmin();
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return $this->json(['message' => 'Corps JSON invalide.'], 400);
        }

        $ownerId = (int) ($payload['ownerId'] ?? 0);
        $owner = $utilisateurRepository->find($ownerId);
        if (!$owner instanceof Utilisateur) {
            return $this->json(['message' => 'Proprietaire introuvable.'], 404);
        }

        $marque = trim((string) ($payload['marque'] ?? ''));
        $modele = trim((string) ($payload['modele'] ?? ''));
        $places = (int) ($payload['places'] ?? 0);

        if ($marque === '' || $modele === '' || $places < 1) {
            return $this->json(['message' => 'Marque, modele et places sont obligatoires.'], 400);
        }

        $vehicule = (new Vehicule())
            ->setUtilisateur($owner)
            ->setMarque($marque)
            ->setModele($modele)
            ->setPlaces($places)
            ->setCouleur(trim((string) ($payload['couleur'] ?? '')) ?: null)
            ->setEnergie(trim((string) ($payload['energie'] ?? '')) ?: null)
            ->setSuspended(false)
            ->setPhotoVehicule(trim((string) ($payload['photoVehicule'] ?? '')) ?: null);

        $entityManager->persist($vehicule);
        $entityManager->flush();

        return $this->json(['message' => 'Vehicule cree avec succes.', 'id' => $vehicule->getId()], 201);
    }

    #[Route('/vehicules/{id}', name: 'admin_vehicules_update', methods: ['PUT'])]
    public function updateVehicule(int $id, Request $request, VehiculeRepository $vehiculeRepository, EntityManagerInterface $entityManager): JsonResponse
    {
        $admin = $this->requireAdmin();
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $vehicule = $vehiculeRepository->find($id);
        if (!$vehicule instanceof Vehicule) {
            return $this->json(['message' => 'Vehicule introuvable.'], 404);
        }

        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return $this->json(['message' => 'Corps JSON invalide.'], 400);
        }

        if (array_key_exists('marque', $payload)) {
            $vehicule->setMarque(trim((string) $payload['marque']));
        }
        if (array_key_exists('modele', $payload)) {
            $vehicule->setModele(trim((string) $payload['modele']));
        }
        if (array_key_exists('places', $payload)) {
            $vehicule->setPlaces((int) $payload['places']);
        }
        if (array_key_exists('couleur', $payload)) {
            $vehicule->setCouleur(trim((string) $payload['couleur']) ?: null);
        }
        if (array_key_exists('energie', $payload)) {
            $vehicule->setEnergie(trim((string) $payload['energie']) ?: null);
        }
        if (array_key_exists('photoVehicule', $payload)) {
            $vehicule->setPhotoVehicule(trim((string) $payload['photoVehicule']) ?: null);
        }
        if (array_key_exists('isSuspended', $payload)) {
            $vehicule->setSuspended((bool) $payload['isSuspended']);
        }

        $entityManager->flush();

        return $this->json(['message' => 'Vehicule modifie avec succes.']);
    }

    #[Route('/vehicules/{id}', name: 'admin_vehicules_delete', methods: ['DELETE'])]
    public function deleteVehicule(int $id, VehiculeRepository $vehiculeRepository, EntityManagerInterface $entityManager): JsonResponse
    {
        $admin = $this->requireAdmin();
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $vehicule = $vehiculeRepository->find($id);
        if (!$vehicule instanceof Vehicule) {
            return $this->json(['message' => 'Vehicule introuvable.'], 404);
        }

        $entityManager->remove($vehicule);
        $entityManager->flush();

        return $this->json(['message' => 'Vehicule supprime avec succes.']);
    }

    #[Route('/vehicules/{id}/suspend', name: 'admin_vehicules_suspend', methods: ['POST'])]
    public function suspendVehicule(int $id, VehiculeRepository $vehiculeRepository, EntityManagerInterface $entityManager): JsonResponse
    {
        $admin = $this->requireAdmin();
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $vehicule = $vehiculeRepository->find($id);
        if (!$vehicule instanceof Vehicule) {
            return $this->json(['message' => 'Vehicule introuvable.'], 404);
        }

        $vehicule->setSuspended(true);
        $entityManager->flush();

        return $this->json(['message' => 'Vehicule suspendu avec succes.']);
    }

    #[Route('/vehicules/{id}/unsuspend', name: 'admin_vehicules_unsuspend', methods: ['POST'])]
    public function unsuspendVehicule(int $id, VehiculeRepository $vehiculeRepository, EntityManagerInterface $entityManager): JsonResponse
    {
        $admin = $this->requireAdmin();
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $vehicule = $vehiculeRepository->find($id);
        if (!$vehicule instanceof Vehicule) {
            return $this->json(['message' => 'Vehicule introuvable.'], 404);
        }

        $vehicule->setSuspended(false);
        $entityManager->flush();

        return $this->json(['message' => 'Vehicule reactive avec succes.']);
    }

    #[Route('/trajets', name: 'admin_trajets_list', methods: ['GET'])]
    public function listTrajets(TrajetRepository $trajetRepository): JsonResponse
    {
        $admin = $this->requireAdmin();
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $trajets = $trajetRepository->findBy([], ['departAt' => 'DESC']);

        return $this->json(array_map(static fn (Trajet $trajet): array => [
            'id' => $trajet->getId(),
            'depart' => $trajet->getDepart(),
            'destination' => $trajet->getDestination(),
            'departAt' => $trajet->getDepartAt()?->format(DATE_ATOM),
            'arriveeAt' => $trajet->getArriveeAt()?->format(DATE_ATOM),
            'prix' => $trajet->getPrix(),
            'placesLibres' => $trajet->getPlacesLibres(),
            'eco' => $trajet->isEco(),
            'driverName' => $trajet->getDriverName(),
            'conducteurId' => $trajet->getConducteur()?->getId(),
            'vehiculeId' => $trajet->getVehiculeRef()?->getId(),
        ], $trajets));
    }

    #[Route('/trajets/{id}', name: 'admin_trajets_update', methods: ['PUT'])]
    public function updateTrajet(int $id, Request $request, TrajetRepository $trajetRepository, EntityManagerInterface $entityManager): JsonResponse
    {
        $admin = $this->requireAdmin();
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $trajet = $trajetRepository->find($id);
        if (!$trajet instanceof Trajet) {
            return $this->json(['message' => 'Trajet introuvable.'], 404);
        }

        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return $this->json(['message' => 'Corps JSON invalide.'], 400);
        }

        if (array_key_exists('depart', $payload)) {
            $trajet->setDepart(trim((string) $payload['depart']));
        }
        if (array_key_exists('destination', $payload)) {
            $trajet->setDestination(trim((string) $payload['destination']));
        }
        if (array_key_exists('prix', $payload)) {
            $trajet->setPrix((float) $payload['prix']);
        }
        if (array_key_exists('placesLibres', $payload)) {
            $trajet->setPlacesLibres((int) $payload['placesLibres']);
        }
        if (array_key_exists('eco', $payload)) {
            $trajet->setEco((bool) $payload['eco']);
        }

        $entityManager->flush();

        return $this->json(['message' => 'Trajet modifie avec succes.']);
    }

    #[Route('/trajets/{id}', name: 'admin_trajets_delete', methods: ['DELETE'])]
    public function deleteTrajet(
        int $id,
        TrajetRepository $trajetRepository,
        ParticipationRepository $participationRepository,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        $admin = $this->requireAdmin();
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $trajet = $trajetRepository->find($id);
        if (!$trajet instanceof Trajet) {
            return $this->json(['message' => 'Trajet introuvable.'], 404);
        }

        $participations = $participationRepository->findByTrajet($trajet);
        foreach ($participations as $participation) {
            $participant = $participation->getUtilisateur();
            if ($participant instanceof Utilisateur) {
                $participant->setCredits($participant->getCredits() + $participation->getCreditsUtilises());
            }
            $entityManager->remove($participation);
        }

        $entityManager->remove($trajet);
        $entityManager->flush();

        return $this->json(['message' => 'Trajet supprime avec succes (participants rembourses).']);
    }

    #[Route('/avis', name: 'admin_avis_list', methods: ['GET'])]
    public function listAvis(AvisRepository $avisRepository): JsonResponse
    {
        $admin = $this->requireAdmin();
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $avis = $avisRepository->findBy([], ['createdAt' => 'DESC']);

        return $this->json(array_map(static fn (Avis $a): array => [
            'id' => $a->getId(),
            'pseudo' => $a->getPseudo(),
            'commentaire' => $a->getCommentaire(),
            'note' => $a->getNote(),
            'isValidated' => $a->isValidated(),
            'createdAt' => $a->getCreatedAt()?->format(DATE_ATOM),
            'trajetId' => $a->getTrajet()?->getId(),
        ], $avis));
    }

    #[Route('/avis/{id}', name: 'admin_avis_update', methods: ['PUT'])]
    public function updateAvis(int $id, Request $request, AvisRepository $avisRepository, EntityManagerInterface $entityManager): JsonResponse
    {
        $admin = $this->requireAdmin();
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $avis = $avisRepository->find($id);
        if (!$avis instanceof Avis) {
            return $this->json(['message' => 'Avis introuvable.'], 404);
        }

        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return $this->json(['message' => 'Corps JSON invalide.'], 400);
        }

        if (array_key_exists('pseudo', $payload)) {
            $avis->setPseudo(trim((string) $payload['pseudo']));
        }
        if (array_key_exists('commentaire', $payload)) {
            $avis->setCommentaire(trim((string) $payload['commentaire']));
        }
        if (array_key_exists('isValidated', $payload)) {
            $avis->setValidated((bool) $payload['isValidated']);
        }
        if (array_key_exists('note', $payload)) {
            $avis->setNote((int) $payload['note']);
        }

        $entityManager->flush();

        return $this->json(['message' => 'Avis modifie avec succes.']);
    }

    #[Route('/avis/{id}', name: 'admin_avis_delete', methods: ['DELETE'])]
    public function deleteAvis(int $id, AvisRepository $avisRepository, EntityManagerInterface $entityManager): JsonResponse
    {
        $admin = $this->requireAdmin();
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $avis = $avisRepository->find($id);
        if (!$avis instanceof Avis) {
            return $this->json(['message' => 'Avis introuvable.'], 404);
        }

        $entityManager->remove($avis);
        $entityManager->flush();

        return $this->json(['message' => 'Avis supprime avec succes.']);
    }

    #[Route('/participations', name: 'admin_participations_list', methods: ['GET'])]
    public function listParticipations(ParticipationRepository $participationRepository): JsonResponse
    {
        $admin = $this->requireAdmin();
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $participations = $participationRepository->findBy([], ['createdAt' => 'DESC']);

        return $this->json(array_map(static fn (Participation $p): array => [
            'id' => $p->getId(),
            'createdAt' => $p->getCreatedAt()?->format(DATE_ATOM),
            'creditsUtilises' => $p->getCreditsUtilises(),
            'utilisateurId' => $p->getUtilisateur()?->getId(),
            'utilisateurPseudo' => $p->getUtilisateur()?->getPseudo(),
            'trajetId' => $p->getTrajet()?->getId(),
            'depart' => $p->getTrajet()?->getDepart(),
            'destination' => $p->getTrajet()?->getDestination(),
        ], $participations));
    }

    #[Route('/participations/{id}', name: 'admin_participations_delete', methods: ['DELETE'])]
    public function deleteParticipation(int $id, ParticipationRepository $participationRepository, EntityManagerInterface $entityManager): JsonResponse
    {
        $admin = $this->requireAdmin();
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        $participation = $participationRepository->find($id);
        if (!$participation instanceof Participation) {
            return $this->json(['message' => 'Participation introuvable.'], 404);
        }

        $participant = $participation->getUtilisateur();
        if ($participant instanceof Utilisateur) {
            $participant->setCredits($participant->getCredits() + $participation->getCreditsUtilises());
        }

        $trajet = $participation->getTrajet();
        if ($trajet instanceof Trajet) {
            $trajet->setPlacesLibres($trajet->getPlacesLibres() + 1);
        }

        $entityManager->remove($participation);
        $entityManager->flush();

        return $this->json(['message' => 'Participation supprimee avec succes (remboursement applique).']);
    }

    private function normaliserRoles(mixed $rolesPayload): array
    {
        if (!is_array($rolesPayload)) {
            return ['ROLE_USER'];
        }

        $roles = [];
        foreach ($rolesPayload as $role) {
            $value = strtoupper(trim((string) $role));
            if ($value !== '' && str_starts_with($value, 'ROLE_')) {
                $roles[] = $value;
            }
        }

        if (!in_array('ROLE_USER', $roles, true)) {
            $roles[] = 'ROLE_USER';
        }

        return array_values(array_unique($roles));
    }

    private function countByRole(UtilisateurRepository $utilisateurRepository, string $role): int
    {
        $compteur = 0;
        foreach ($utilisateurRepository->findAll() as $utilisateur) {
            if (in_array($role, $utilisateur->getRoles(), true)) {
                $compteur++;
            }
        }

        return $compteur;
    }

    private function requireAdmin(): Utilisateur|JsonResponse
    {
        /** @var Utilisateur|null $user */
        $user = $this->getUser();
        if (!$user instanceof Utilisateur) {
            return $this->json(['message' => 'Non authentifie.'], 401);
        }

        if (!in_array('ROLE_ADMIN', $user->getRoles(), true)) {
            return $this->json(['message' => 'Acces refuse.'], 403);
        }

        return $user;
    }
}
