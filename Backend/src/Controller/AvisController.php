<?php

namespace App\Controller;

use App\Entity\Avis;
use App\Entity\Utilisateur;
use App\Repository\TrajetRepository;
use App\Repository\AvisRepository;
use App\Repository\ParticipationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/avis')]
class AvisController extends AbstractController
{
    #[Route('', name: 'create_avis', methods: ['POST'])]
    public function createAvis(
        Request $request,
        EntityManagerInterface $em,
        TrajetRepository $trajetRepository,
        ParticipationRepository $participationRepository
    ): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return $this->json(['message' => 'Corps JSON invalide.'], 400);
        }

        $trajetId = (int) ($data['trajetId'] ?? 0);
        $commentaire = trim((string) ($data['commentaire'] ?? ''));
        if ($commentaire === '') {
            return $this->json(['message' => 'Commentaire obligatoire.'], 400);
        }

        $pseudo = trim((string) ($data['pseudo'] ?? ''));

        if ($trajetId <= 0 && $pseudo === '') {
            return $this->json(['message' => 'Champs manquants.'], 400);
        }

        $avis = new Avis();
        $avis->setPseudo($pseudo);
        $avis->setCommentaire($commentaire);
        $avis->setValidated(false);
        $avis->setCreatedAt(new \DateTimeImmutable());

        if ($trajetId > 0) {
            $trajet = $trajetRepository->find($trajetId);
            if ($trajet === null) {
                return $this->json(['message' => 'Trajet introuvable.'], 404);
            }

            /** @var Utilisateur|null $utilisateur */
            $utilisateur = $this->getUser();
            if (!$utilisateur instanceof Utilisateur) {
                return $this->json(['message' => 'Connexion requise pour laisser un avis sur un trajet.'], 401);
            }

            if ($trajet->getStatut() !== 'termine') {
                return $this->json(['message' => 'Avis possible uniquement apres arrivee du trajet.'], 400);
            }

            $participation = $participationRepository->findOneBy([
                'utilisateur' => $utilisateur,
                'trajet' => $trajet,
            ]);
            if ($participation === null) {
                return $this->json(['message' => 'Seuls les passagers participants peuvent laisser un avis sur ce trajet.'], 403);
            }

            $avis->setPseudo((string) $utilisateur->getPseudo());
            $avis->setTrajet($trajet);
        }

        $em->persist($avis);
        $em->flush();

        return $this->json(['message' => 'Avis soumis avec succès. Il sera publié après validation.']);
    }

    #[Route('/validated', name: 'get_validated_avis', methods: ['GET'])]
    public function getValidatedAvis(AvisRepository $repo): JsonResponse
    {
        $avis = $repo->findBy(['isValidated' => true], ['createdAt' => 'DESC']);

        // nutzt automatisch die groups "avis:read"
        return $this->json($avis, 200, [], ['groups' => 'avis:read']);
    }

    #[Route('/pending', name: 'get_pending_avis', methods: ['GET'])]
    public function getPendingAvis(AvisRepository $repo): JsonResponse
    {
        $avis = $repo->findBy(['isValidated' => false], ['createdAt' => 'ASC']);

        // auch hier groups "avis:read"
        return $this->json($avis, 200, [], ['groups' => 'avis:read']);
    }

    #[Route('/{id}/validate', name: 'validate_avis', methods: ['POST'])]
    public function validateAvis(Avis $avis, EntityManagerInterface $em): JsonResponse
    {
        if ($avis->isValidated()) {
            return $this->json(['message' => 'Cet avis est déjà validé.'], 400);
        }
        $avis->setValidated(true);
        $em->flush();

        return $this->json(['message' => 'Avis validé.']);
    }

    #[Route('/{id}', name: 'delete_avis', methods: ['DELETE'])]
    public function deleteAvis(Avis $avis, EntityManagerInterface $em): JsonResponse
    {
        $em->remove($avis);
        $em->flush();

        return $this->json(['message' => 'Avis supprimé.']);
    }
}
