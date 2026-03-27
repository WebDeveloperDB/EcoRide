<?php

namespace App\Controller;

use App\Entity\Participation;
use App\Entity\Trajet;
use App\Entity\Utilisateur;
use App\Repository\ParticipationRepository;
use App\Repository\TrajetRepository;
use App\Repository\UtilisateurRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api')]
class AuthentificationController extends AbstractController
{
    #[Route('/registration', name: 'api_inscription', methods: ['POST'])]
    public function inscription(
        Request $requete,
        UtilisateurRepository $utilisateurRepository,
        UserPasswordHasherInterface $hasher,
        EntityManagerInterface $em
    ): JsonResponse {
        $donnees = json_decode($requete->getContent(), true);

        $pseudo = trim((string) ($donnees['pseudo'] ?? ''));
        $email = mb_strtolower(trim((string) ($donnees['email'] ?? '')));
        $motDePasse = (string) ($donnees['password'] ?? '');

        $erreurValidation = $this->validerInscription($pseudo, $email, $motDePasse, $utilisateurRepository);
        if ($erreurValidation !== null) {
            return $erreurValidation;
        }

        $utilisateur = new Utilisateur();
        $utilisateur->setPseudo($pseudo);
        $utilisateur->setEmail($email);
        $utilisateur->setRoles(['ROLE_USER']);
        $utilisateur->setCredits(20);

        $motDePasseHash = $hasher->hashPassword($utilisateur, $motDePasse);
        $utilisateur->setMotDePasse($motDePasseHash);

        $em->persist($utilisateur);
        $em->flush();

        return $this->json([
            'message' => 'Inscription réussie.',
            'utilisateur' => [
                'id' => $utilisateur->getId(),
                'pseudo' => $utilisateur->getPseudo(),
                'email' => $utilisateur->getEmail(),
                'roles' => $utilisateur->getRoles(),
                'credits' => $utilisateur->getCredits(),
            ],
        ], 201);
    }

    private function validerInscription(
        string $pseudo,
        string $email,
        string $motDePasse,
        UtilisateurRepository $utilisateurRepository
    ): ?JsonResponse {
        $message = null;
        $code = 400;

        if ($pseudo === '' || $email === '' || $motDePasse === '') {
            $message = 'Pseudo, email et mot de passe sont obligatoires.';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $message = 'Email invalide.';
        } elseif (mb_strlen($motDePasse) < 8) {
            $message = 'Le mot de passe doit contenir au moins 8 caractères.';
        } elseif ($utilisateurRepository->findOneBy(['email' => $email])) {
            $message = 'Cet email existe déjà.';
            $code = 409;
        }

        return $message ? $this->json(['message' => $message], $code) : null;
    }

    #[Route('/login', name: 'api_connexion', methods: ['POST'])]
    public function connexion(#[CurrentUser] ?Utilisateur $utilisateur, EntityManagerInterface $em): JsonResponse
    {
        if (null === $utilisateur) {
            return new JsonResponse(['message' => 'Identifiants invalides.'], Response::HTTP_UNAUTHORIZED);
        }

        if ($utilisateur->isSuspended()) {
            return new JsonResponse(['message' => 'Compte suspendu. Contactez un administrateur.'], Response::HTTP_FORBIDDEN);
        }

        if (!$utilisateur->getApiToken()) {
            $utilisateur->setApiToken(bin2hex(random_bytes(32)));
            $em->flush();
        }

        return $this->json([
            'apiToken' => $utilisateur->getApiToken(),
            'roles' => $utilisateur->getRoles(),
            'user' => $utilisateur->getUserIdentifier(),
            'pseudo' => $utilisateur->getPseudo(),
            'credits' => $utilisateur->getCredits(),
        ]);
    }

    #[Route('', name: 'api_infos_utilisateur', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function infosUtilisateur(#[CurrentUser] ?Utilisateur $utilisateur): JsonResponse
    {
        return $this->json($this->construireProfil($utilisateur));
    }

    #[Route('/utilisateur/profil', name: 'api_profil_get', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function getProfil(#[CurrentUser] ?Utilisateur $utilisateur): JsonResponse
    {
        return $this->json($this->construireProfil($utilisateur));
    }

    private function construireProfil(Utilisateur $utilisateur): array
    {
        $preferences = $utilisateur->getPreferences() ?? [];

        return [
            'id' => $utilisateur->getId(),
            'pseudo' => $utilisateur->getPseudo(),
            'email' => $utilisateur->getEmail(),
            'roles' => $utilisateur->getRoles(),
            'credits' => $utilisateur->getCredits(),
            'typeUtilisateur' => $utilisateur->getTypeUtilisateur(),
            'isSuspended' => $utilisateur->isSuspended(),
            'photoProfil' => $utilisateur->getPhotoProfil(),
            'preferences' => $preferences,
        ];
    }

    #[Route('/utilisateur/historique', name: 'api_historique_get', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function getHistorique(
        #[CurrentUser] ?Utilisateur $utilisateur,
        ParticipationRepository $participationRepository,
        TrajetRepository $trajetRepository,
        Request $request,
        UtilisateurRepository $utilisateurRepository
    ): JsonResponse {
        $status = mb_strtolower(trim((string) $request->query->get('status', 'all')));
        if (!in_array($status, ['all', 'coming', 'past'], true)) {
            return $this->json(['message' => 'Filtre status invalide.'], 400);
        }

        $cibleHistorique = $utilisateur;
        $requestedUserId = (int) $request->query->get('userId', 0);
        if ($requestedUserId > 0 && in_array('ROLE_ADMIN', $utilisateur->getRoles(), true)) {
            $cible = $utilisateurRepository->find($requestedUserId);
            if ($cible instanceof Utilisateur) {
                $cibleHistorique = $cible;
            }
        }

        $maintenant = new \DateTimeImmutable();

        $participations = $participationRepository->findParticipationsUtilisateur($cibleHistorique);
        $historiqueParticipation = array_map(
            static function (Participation $participation) use ($maintenant): array {
                $trajet = $participation->getTrajet();
                if (!$trajet instanceof Trajet) {
                    return [];
                }

                $departAt = $trajet->getDepartAt();
                $limiteAnnulation = $departAt instanceof \DateTimeImmutable ? $departAt->modify('-2 hours') : null;
                $peutAnnuler = $limiteAnnulation instanceof \DateTimeImmutable && $maintenant < $limiteAnnulation;
                $estAVenir = $departAt instanceof \DateTimeImmutable && $departAt > $maintenant;

                return [
                    'participationId' => $participation->getId(),
                    'joinedAt' => $participation->getCreatedAt()?->format(DATE_ATOM),
                    'creditsUtilises' => $participation->getCreditsUtilises(),
                    'canCancel' => $peutAnnuler,
                    'isUpcoming' => $estAVenir,
                    'trajet' => [
                        'id' => $trajet->getId(),
                        'depart' => $trajet->getDepart(),
                        'destination' => $trajet->getDestination(),
                        'departAt' => $trajet->getDepartAt()?->format(DATE_ATOM),
                        'arriveeAt' => $trajet->getArriveeAt()?->format(DATE_ATOM),
                        'prix' => $trajet->getPrix(),
                        'driverName' => $trajet->getDriverName(),
                        'driverPhoto' => $trajet->getDriverPhoto(),
                        'carPhoto' => $trajet->getCarPhoto(),
                        'vehicle' => $trajet->getVehicle(),
                    ],
                ];
            },
            $participations
        );

        $historiqueParticipation = array_values(array_filter($historiqueParticipation));
        $historiqueParticipation = $this->filtrerHistoriqueParStatus($historiqueParticipation, $status);

        $trajetsConducteur = $trajetRepository->findBy(['conducteur' => $cibleHistorique], ['departAt' => 'DESC']);
        $historiqueConducteur = array_map(
            static function (Trajet $trajet) use ($maintenant, $participationRepository): array {
                $departAt = $trajet->getDepartAt();
                $peutAnnuler = $departAt instanceof \DateTimeImmutable && $departAt > $maintenant;
                $estAVenir = $departAt instanceof \DateTimeImmutable && $departAt > $maintenant;

                return [
                    'trajetId' => $trajet->getId(),
                    'depart' => $trajet->getDepart(),
                    'destination' => $trajet->getDestination(),
                    'departAt' => $trajet->getDepartAt()?->format(DATE_ATOM),
                    'arriveeAt' => $trajet->getArriveeAt()?->format(DATE_ATOM),
                    'prix' => $trajet->getPrix(),
                    'placesLibres' => $trajet->getPlacesLibres(),
                    'participants' => $participationRepository->countByTrajet($trajet),
                    'canCancel' => $peutAnnuler,
                    'isUpcoming' => $estAVenir,
                ];
            },
            $trajetsConducteur
        );
        $historiqueConducteur = $this->filtrerHistoriqueParStatus($historiqueConducteur, $status);

        return $this->json([
            'status' => $status,
            'userId' => $cibleHistorique->getId(),
            'participations' => $historiqueParticipation,
            'trajetsConducteur' => $historiqueConducteur,
        ]);
    }

    #[Route('/utilisateur/historique/participation/{id}', name: 'api_historique_annuler_participation', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function annulerParticipation(
        int $id,
        #[CurrentUser] ?Utilisateur $utilisateur,
        ParticipationRepository $participationRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        $participation = $participationRepository->find($id);
        if (!$participation instanceof Participation) {
            return $this->json(['message' => 'Participation introuvable.'], 404);
        }

        $proprietaire = $participation->getUtilisateur();
        $estProprietaire = $proprietaire instanceof Utilisateur && $proprietaire->getId() === $utilisateur->getId();
        if (!$estProprietaire) {
            return $this->json(['message' => 'Acces refuse.'], 403);
        }

        $trajet = $participation->getTrajet();
        if (!$trajet instanceof Trajet) {
            return $this->json(['message' => 'Trajet introuvable.'], 404);
        }

        $departAt = $trajet->getDepartAt();
        $maintenant = new \DateTimeImmutable();
        $limiteParticipant = $departAt instanceof \DateTimeImmutable ? $departAt->modify('-2 hours') : null;
        if ($limiteParticipant instanceof \DateTimeImmutable && $maintenant >= $limiteParticipant) {
            return $this->json(['message' => 'Annulation impossible moins de 2 heures avant le depart.'], 400);
        }

        if ($proprietaire instanceof Utilisateur) {
            $proprietaire->setCredits($proprietaire->getCredits() + $participation->getCreditsUtilises());
        }
        $trajet->setPlacesLibres($trajet->getPlacesLibres() + 1);

        $em->remove($participation);
        $em->flush();

        return $this->json([
            'message' => 'Participation annulee avec remboursement.',
            'creditsRestants' => $proprietaire instanceof Utilisateur ? $proprietaire->getCredits() : null,
            'placesLibres' => $trajet->getPlacesLibres(),
        ]);
    }

    #[Route('/utilisateur/historique/trajet/{id}', name: 'api_historique_annuler_trajet', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function annulerTrajetConducteur(
        int $id,
        #[CurrentUser] ?Utilisateur $utilisateur,
        TrajetRepository $trajetRepository,
        ParticipationRepository $participationRepository,
        EntityManagerInterface $em
    ): JsonResponse {
        $trajet = $trajetRepository->find($id);
        if (!$trajet instanceof Trajet) {
            return $this->json(['message' => 'Trajet introuvable.'], 404);
        }

        $conducteur = $trajet->getConducteur();
        $estConducteur = $conducteur instanceof Utilisateur && $conducteur->getId() === $utilisateur->getId();
        if (!$estConducteur) {
            return $this->json(['message' => 'Acces refuse.'], 403);
        }

        $departAt = $trajet->getDepartAt();
        if ($departAt instanceof \DateTimeImmutable && $departAt <= new \DateTimeImmutable()) {
            return $this->json(['message' => 'Annulation impossible apres le depart.'], 400);
        }

        $participations = $participationRepository->findByTrajet($trajet);
        $nbRembourses = 0;
        foreach ($participations as $participation) {
            $participant = $participation->getUtilisateur();
            if ($participant instanceof Utilisateur) {
                $participant->setCredits($participant->getCredits() + $participation->getCreditsUtilises());
            }
            $em->remove($participation);
            $nbRembourses++;
        }

        $em->remove($trajet);
        $em->flush();

        return $this->json([
            'message' => 'Trajet annule avec remboursement des participants.',
            'participantsRembourses' => $nbRembourses,
        ]);
    }

    /**
     * @param array<int, array<string, mixed>> $items
     * @return array<int, array<string, mixed>>
     */
    private function filtrerHistoriqueParStatus(array $items, string $status): array
    {
        if ($status === 'all') {
            return $items;
        }

        return array_values(array_filter($items, static function (array $item) use ($status): bool {
            $isUpcoming = (bool) ($item['isUpcoming'] ?? false);
            if ($status === 'coming') {
                return $isUpcoming;
            }

            return !$isUpcoming;
        }));
    }

    #[Route('/utilisateur/profil', name: 'api_profil_put', methods: ['PUT'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function updateProfil(
        Request $requete,
        #[CurrentUser] ?Utilisateur $utilisateur,
        EntityManagerInterface $em
    ): JsonResponse {
        $donnees = json_decode($requete->getContent(), true);
        if (!is_array($donnees)) {
            return $this->json(['message' => 'Corps JSON invalide.'], 400);
        }

        $messageErreur = $this->appliquerPseudo($donnees, $utilisateur)
            ?? $this->appliquerTypeUtilisateur($donnees, $utilisateur)
            ?? $this->appliquerPhotoProfil($donnees, $utilisateur)
            ?? $this->appliquerPreferences($donnees, $utilisateur);

        if ($messageErreur !== null) {
            return $this->json(['message' => $messageErreur], 400);
        }

        $em->flush();

        return $this->json([
            'message' => 'Profil mis à jour.',
            'profil' => $this->construireProfil($utilisateur),
        ]);
    }

    #[Route('/utilisateur/photo-profil', name: 'api_profil_photo_post', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function uploadPhotoProfil(
        Request $requete,
        #[CurrentUser] ?Utilisateur $utilisateur,
        EntityManagerInterface $em
    ): JsonResponse {
        $fichier = $requete->files->get('photo');
        if (!$fichier instanceof UploadedFile) {
            return $this->json(['message' => 'Fichier photo manquant.'], 400);
        }

        $urlPhoto = $this->enregistrerPhoto($fichier, 'profils', $requete);
        if ($urlPhoto === null) {
            return $this->json(['message' => 'Format photo invalide.'], 400);
        }

        $utilisateur->setPhotoProfil($urlPhoto);
        $em->flush();

        return $this->json([
            'message' => 'Photo de profil mise a jour.',
            'photoProfil' => $urlPhoto,
        ]);
    }

    private function enregistrerPhoto(UploadedFile $fichier, string $dossier, Request $requete): ?string
    {
        $extensionsAutorisees = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        $extension = mb_strtolower((string) $fichier->guessExtension());

        if (!in_array($extension, $extensionsAutorisees, true)) {
            return null;
        }

        $nomFichier = uniqid('photo_', true) . '.' . $extension;
        $dossierPublic = $this->getParameter('kernel.project_dir') . '/public/uploads/' . $dossier;

        if (!is_dir($dossierPublic)) {
            mkdir($dossierPublic, 0775, true);
        }

        $fichier->move($dossierPublic, $nomFichier);

        return $requete->getSchemeAndHttpHost() . '/uploads/' . $dossier . '/' . $nomFichier;
    }

    private function appliquerPseudo(array $donnees, Utilisateur $utilisateur): ?string
    {
        if (!isset($donnees['pseudo'])) {
            return null;
        }

        $pseudo = trim((string) $donnees['pseudo']);
        if ($pseudo === '') {
            return 'Le pseudo ne peut pas être vide.';
        }

        $utilisateur->setPseudo($pseudo);
        return null;
    }

    private function appliquerTypeUtilisateur(array $donnees, Utilisateur $utilisateur): ?string
    {
        if (!array_key_exists('typeUtilisateur', $donnees)) {
            return null;
        }

        $typeUtilisateur = $donnees['typeUtilisateur'];
        $typesAutorises = ['passager', 'chauffeur', 'les_deux', null, ''];
        if (!in_array($typeUtilisateur, $typesAutorises, true)) {
            return 'Type utilisateur invalide.';
        }

        $utilisateur->setTypeUtilisateur($typeUtilisateur ?: null);
        return null;
    }

    private function appliquerPreferences(array $donnees, Utilisateur $utilisateur): ?string
    {
        if (!array_key_exists('preferences', $donnees)) {
            return null;
        }

        if (!is_array($donnees['preferences'])) {
            return 'Les préférences doivent être un objet JSON.';
        }

        $utilisateur->setPreferences($donnees['preferences']);
        return null;
    }

    private function appliquerPhotoProfil(array $donnees, Utilisateur $utilisateur): ?string
    {
        if (!array_key_exists('photoProfil', $donnees)) {
            return null;
        }

        $photoProfil = trim((string) $donnees['photoProfil']);
        $utilisateur->setPhotoProfil($photoProfil !== '' ? $photoProfil : null);

        return null;
    }
}