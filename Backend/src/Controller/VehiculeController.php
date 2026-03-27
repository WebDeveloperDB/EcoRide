<?php

namespace App\Controller;

use App\Entity\Utilisateur;
use App\Entity\Vehicule;
use App\Repository\VehiculeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/vehicule')]
class VehiculeController extends AbstractController
{
    private const MESSAGE_NON_AUTHENTIFIE = 'Non authentifie.';

    #[Route('', name: 'api_vehicule_lister', methods: ['GET'])]
    public function lister(VehiculeRepository $vehiculeRepository): JsonResponse
    {
        /** @var Utilisateur|null $utilisateur */
        $utilisateur = $this->getUser();
        if (!$utilisateur instanceof Utilisateur) {
            return $this->nonAuthentifie();
        }

        $vehicules = $vehiculeRepository->findBy(['utilisateur' => $utilisateur], ['id' => 'DESC']);

        $data = array_map(static fn (Vehicule $vehicule): array => [
            'id' => $vehicule->getId(),
            'marque' => $vehicule->getMarque(),
            'modele' => $vehicule->getModele(),
            'couleur' => $vehicule->getCouleur(),
            'energie' => $vehicule->getEnergie(),
            'photoVehicule' => $vehicule->getPhotoVehicule(),
            'places' => $vehicule->getPlaces(),
        ], $vehicules);

        return $this->json($data);
    }

    #[Route('', name: 'api_vehicule_creer', methods: ['POST'])]
    public function creer(Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        /** @var Utilisateur|null $utilisateur */
        $utilisateur = $this->getUser();
        if (!$utilisateur instanceof Utilisateur) {
            return $this->nonAuthentifie();
        }

        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            $payload = $request->request->all();
        }
        if (!is_array($payload)) {
            return $this->json(['message' => 'Corps de requete invalide.'], 400);
        }

        [$body, $status] = $this->construireReponseCreation($payload, $utilisateur, $entityManager, $request->files->get('photoVehicule'), $request);

        return $this->json($body, $status);
    }

    #[Route('/{id}/photo', name: 'api_vehicule_photo_post', methods: ['POST'])]
    public function uploadPhoto(int $id, Request $request, VehiculeRepository $vehiculeRepository, EntityManagerInterface $entityManager): JsonResponse
    {
        /** @var Utilisateur|null $utilisateur */
        $utilisateur = $this->getUser();
        if (!$utilisateur instanceof Utilisateur) {
            return $this->nonAuthentifie();
        }

        $vehicule = $vehiculeRepository->findOneBy(['id' => $id, 'utilisateur' => $utilisateur]);
        if (!$vehicule instanceof Vehicule) {
            return $this->json(['message' => 'Vehicule introuvable.'], 404);
        }

        $fichier = $request->files->get('photoVehicule');
        if (!$fichier instanceof UploadedFile) {
            return $this->json(['message' => 'Fichier photo manquant.'], 400);
        }

        $urlPhoto = $this->enregistrerPhotoVehicule($fichier, $request);
        if ($urlPhoto === null) {
            return $this->json(['message' => 'Format photo invalide.'], 400);
        }

        $vehicule->setPhotoVehicule($urlPhoto);
        $entityManager->flush();

        return $this->json(['message' => 'Photo du vehicule mise a jour.', 'photoVehicule' => $urlPhoto]);
    }

    #[Route('/{id}', name: 'api_vehicule_supprimer', methods: ['DELETE'])]
    public function supprimer(int $id, VehiculeRepository $vehiculeRepository, EntityManagerInterface $entityManager): JsonResponse
    {
        /** @var Utilisateur|null $utilisateur */
        $utilisateur = $this->getUser();
        if (!$utilisateur instanceof Utilisateur) {
            return $this->nonAuthentifie();
        }

        $vehicule = $vehiculeRepository->findOneBy(['id' => $id, 'utilisateur' => $utilisateur]);
        if (!$vehicule instanceof Vehicule) {
            return $this->json(['message' => 'Vehicule introuvable.'], 404);
        }

        $entityManager->remove($vehicule);
        $entityManager->flush();

        return $this->json(['message' => 'Vehicule supprime avec succes.']);
    }

    private function nonAuthentifie(): JsonResponse
    {
        return $this->json(['message' => self::MESSAGE_NON_AUTHENTIFIE], 401);
    }

    private function construireReponseCreation(
        array $payload,
        Utilisateur $utilisateur,
        EntityManagerInterface $entityManager,
        mixed $fichierPhotoVehicule,
        Request $request
    ): array
    {
        $marque = trim((string) ($payload['marque'] ?? ''));
        $modele = trim((string) ($payload['modele'] ?? ''));
        $places = (int) ($payload['places'] ?? 0);
        $couleur = trim((string) ($payload['couleur'] ?? ''));
        $energie = trim((string) ($payload['energie'] ?? ''));
        $photoVehicule = trim((string) ($payload['photoVehicule'] ?? ''));

        if ($fichierPhotoVehicule instanceof UploadedFile) {
            $photoDepuisFichier = $this->enregistrerPhotoVehicule($fichierPhotoVehicule, $request);
            if ($photoDepuisFichier === null) {
                return [['message' => 'Format photo invalide.'], 400];
            }
            $photoVehicule = $photoDepuisFichier;
        }

        if ($marque === '' || $modele === '' || $places < 1) {
            return [['message' => 'Marque, modele et nombre de places sont obligatoires.'], 400];
        }

        $vehicule = (new Vehicule())
            ->setMarque($marque)
            ->setModele($modele)
            ->setPlaces($places)
            ->setCouleur($couleur !== '' ? $couleur : null)
            ->setEnergie($energie !== '' ? $energie : null)
            ->setPhotoVehicule($photoVehicule !== '' ? $photoVehicule : null)
            ->setUtilisateur($utilisateur);

        $entityManager->persist($vehicule);
        $entityManager->flush();

        return [[
            'message' => 'Vehicule ajoute avec succes.',
            'vehicule' => [
                'id' => $vehicule->getId(),
                'marque' => $vehicule->getMarque(),
                'modele' => $vehicule->getModele(),
                'couleur' => $vehicule->getCouleur(),
                'energie' => $vehicule->getEnergie(),
                'photoVehicule' => $vehicule->getPhotoVehicule(),
                'places' => $vehicule->getPlaces(),
            ],
        ], 201];
    }

    private function enregistrerPhotoVehicule(UploadedFile $fichier, Request $request): ?string
    {
        $extensionsAutorisees = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        $extension = mb_strtolower((string) $fichier->guessExtension());
        if (!in_array($extension, $extensionsAutorisees, true)) {
            return null;
        }

        $nomFichier = uniqid('vehicule_', true) . '.' . $extension;
        $dossierPublic = $this->getParameter('kernel.project_dir') . '/public/uploads/vehicules';

        if (!is_dir($dossierPublic)) {
            mkdir($dossierPublic, 0775, true);
        }

        $fichier->move($dossierPublic, $nomFichier);

        return $request->getSchemeAndHttpHost() . '/uploads/vehicules/' . $nomFichier;
    }
}