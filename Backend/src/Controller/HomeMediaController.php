<?php

namespace App\Controller;

use App\Entity\Utilisateur;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class HomeMediaController extends AbstractController
{
    private const ALLOWED_IMAGE_SLOTS = [
        'hero',
        'step1',
        'step2',
        'step3',
        'advantage1',
        'advantage2',
        'advantage3',
    ];

    private const DEFAULT_MEDIA = [
        'hero' => '/EcoRide/Front/images/covoiturage.jpg',
        'step1' => '/EcoRide/Front/images/covoiturage.jpg',
        'step2' => '/EcoRide/Front/images/media.media.379286f2-cbf6-49d3-bfd8-e3eaf2f1298c.original700.jpg',
        'step3' => '/EcoRide/Front/images/kostenlose-fahrgemeinschaft-plattform-fuer-den-gewerbepark-regensburg_960x540.jpg',
        'advantage1' => '/EcoRide/Front/images/covoiturage.jpg',
        'advantage2' => '/EcoRide/Front/images/émissions.jpg',
        'advantage3' => '/EcoRide/Front/images/communauté.jpg',
        'step1Title' => '1. Recherchez',
        'step1Description' => "Entrez votre lieu de départ et d'arrivée pour trouver des trajets adaptés.",
        'step2Title' => '2. Réservez',
        'step2Description' => 'Sélectionnez un covoiturage, réservez votre place, contactez le conducteur.',
        'step3Title' => '3. Voyagez',
        'step3Description' => 'Partagez un trajet, faites des économies et réduisez votre impact écologique.',
        'advantagesTitle' => 'Vos avantages avec EcoRide',
        'advantage1Title' => "Économisez de l'argent",
        'advantage1Description' => 'Partagez vos trajets et réduisez vos frais de déplacement.',
        'advantage2Title' => "Moins d'émissions",
        'advantage2Description' => 'Réduisez le CO₂ et agissez concrètement pour la planète.',
        'advantage3Title' => 'Rejoignez la communauté',
        'advantage3Description' => 'Faites de nouvelles rencontres et échangez avec des membres engagés.',
    ];

    #[Route('/api/home/media', name: 'home_media_get', methods: ['GET'])]
    public function getHomeMedia(): JsonResponse
    {
        return $this->json($this->loadConfig());
    }

    #[Route('/api/admin/home/media/{slot}', name: 'admin_home_media_upload', methods: ['POST'])]
    public function uploadHomeMedia(string $slot, Request $request): JsonResponse
    {
        $admin = $this->requireAdmin();
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        if (!in_array($slot, self::ALLOWED_IMAGE_SLOTS, true)) {
            return $this->json(['message' => 'Slot image invalide.'], 400);
        }

        $fichier = $request->files->get('image');
        if (!$fichier instanceof UploadedFile) {
            return $this->json(['message' => 'Fichier image manquant.'], 400);
        }

        $url = $this->storeImage($fichier, $request);
        if ($url === null) {
            return $this->json(['message' => 'Format image invalide.'], 400);
        }

        $config = $this->loadConfig();
        $config[$slot] = $url;
        $this->saveConfig($config);

        return $this->json([
            'message' => 'Image accueil mise a jour.',
            'slot' => $slot,
            'url' => $url,
            'media' => $config,
        ]);
    }

    #[Route('/api/admin/home/content/{key}', name: 'admin_home_content_update', methods: ['PUT'])]
    public function updateHomeText(string $key, Request $request): JsonResponse
    {
        $admin = $this->requireAdmin();
        if ($admin instanceof JsonResponse) {
            return $admin;
        }

        if (!array_key_exists($key, self::DEFAULT_MEDIA) || in_array($key, self::ALLOWED_IMAGE_SLOTS, true)) {
            return $this->json(['message' => 'Cle de contenu invalide.'], 400);
        }

        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            return $this->json(['message' => 'Corps JSON invalide.'], 400);
        }

        $value = trim((string) ($payload['value'] ?? ''));
        if ($value === '') {
            return $this->json(['message' => 'Le texte ne peut pas etre vide.'], 400);
        }

        $config = $this->loadConfig();
        $config[$key] = $value;
        $this->saveConfig($config);

        return $this->json([
            'message' => 'Texte accueil mis a jour.',
            'key' => $key,
            'value' => $value,
            'media' => $config,
        ]);
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

    private function storeImage(UploadedFile $fichier, Request $request): ?string
    {
        $extensionsAutorisees = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        $extension = mb_strtolower((string) $fichier->guessExtension());
        if (!in_array($extension, $extensionsAutorisees, true)) {
            return null;
        }

        $nomFichier = uniqid('home_', true) . '.' . $extension;
        $dossierPublic = $this->getParameter('kernel.project_dir') . '/public/uploads/home';

        if (!is_dir($dossierPublic)) {
            mkdir($dossierPublic, 0775, true);
        }

        $fichier->move($dossierPublic, $nomFichier);

        return $request->getSchemeAndHttpHost() . '/uploads/home/' . $nomFichier;
    }

    private function getConfigPath(): string
    {
        return $this->getParameter('kernel.project_dir') . '/var/home_media.json';
    }

    private function loadConfig(): array
    {
        $path = $this->getConfigPath();
        if (!is_file($path)) {
            return self::DEFAULT_MEDIA;
        }

        $raw = file_get_contents($path);
        if (!is_string($raw) || trim($raw) === '') {
            return self::DEFAULT_MEDIA;
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return self::DEFAULT_MEDIA;
        }

        return array_merge(self::DEFAULT_MEDIA, array_intersect_key($decoded, self::DEFAULT_MEDIA));
    }

    private function saveConfig(array $config): void
    {
        $path = $this->getConfigPath();
        $json = json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        if (!is_string($json)) {
            return;
        }

        file_put_contents($path, $json);
    }
}
