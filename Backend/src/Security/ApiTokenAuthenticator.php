<?php

namespace App\Security;

use App\Repository\UtilisateurRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

class ApiTokenAuthenticator extends AbstractAuthenticator
{
    public function __construct(private UtilisateurRepository $repository)
    {
    }

    public function supports(Request $request): ?bool
    {
        return $request->headers->has('X-AUTH-TOKEN') || $request->headers->has('Authorization');
    }

    public function authenticate(Request $request): Passport
    {
        $apiToken = $request->headers->get('X-AUTH-TOKEN');

        if (!$apiToken) {
            $authorization = $request->headers->get('Authorization');
            if ($authorization && str_starts_with($authorization, 'Bearer ')) {
                $apiToken = trim(substr($authorization, 7));
            }
        }

        if (!$apiToken) {
            throw new CustomUserMessageAuthenticationException('Token API manquant');
        }

        $utilisateur = $this->repository->findOneBy(['apiToken' => $apiToken]);

        if (null === $utilisateur) {
            throw new UserNotFoundException();
        }

        return new SelfValidatingPassport(new UserBadge($utilisateur->getUserIdentifier()));
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return null;
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        return new JsonResponse(
            ['message' => strtr($exception->getMessageKey(), $exception->getMessageData())],
            Response::HTTP_UNAUTHORIZED
        );
    }
}