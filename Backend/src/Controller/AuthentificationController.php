<?php

namespace App\Controller;

use App\Entity\Utilisateur;
use App\Repository\UtilisateurRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
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
        return $this->json([
            'id' => $utilisateur->getId(),
            'pseudo' => $utilisateur->getPseudo(),
            'email' => $utilisateur->getEmail(),
            'roles' => $utilisateur->getRoles(),
            'credits' => $utilisateur->getCredits(),
        ]);
    }
}