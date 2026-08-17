# `api/` — commentaires du blog

Petit service Express qui sert les commentaires de `blog.my-monkey.fr` et porte l'identité des
personnes qui en signent un avec un compte. Déployé à part du blog, comme `oauth/`.

**Pourquoi un service séparé** : le blog est un site statique (Astro SSG, servi en fichiers par
nginx). Il n'a pas de serveur où poser une route. Tant qu'il parlait à Supabase, le navigateur
attaquait PostgREST directement ; en sortant de Supabase il fallait bien un point d'entrée
quelque part. Le mettre ici plutôt que dans le blog garde le déploiement du blog inchangé — et
si cette API tombe, les articles continuent d'être servis, seuls les commentaires affichent leur
message d'erreur.

## Ce qu'il expose

| Route | Effet |
|---|---|
| `GET /comments?slug=…` | Les commentaires d'un article, dans l'ordre |
| `POST /comments` | En poster un |
| `PATCH /comments/:id` | Corriger le sien |
| `DELETE /comments/:id` | Supprimer le sien |
| `/api/auth/*` | Better Auth (connexion Google, session) |
| `GET /health` | Sonde : vérifie que la base répond |

Être propriétaire d'un commentaire se prouve de deux façons, qui coexistent : l'en-tête
`x-session-token` (un uuid tiré par le navigateur, gardé en localStorage — c'est ce qui permet
de commenter sans compte) ou la session Better Auth. L'autorisation vit dans la clause `WHERE`
des requêtes, jamais dans un `if` : zéro ligne touchée vaut refus.

⚠️ **`session_token` ne sort jamais d'ici.** C'est un secret porteur, et l'ancien `select *`
servait au navigateur ceux de tout le monde — qui les lisait pouvait modifier les commentaires
d'autrui. Le serveur renvoie à la place un `can_edit` qu'il a calculé lui-même.

## Variables d'environnement

| Clé | |
|---|---|
| `DATABASE_URL` | `postgresql://blog:…@postgres-prod:5432/blog` (dans `~/secrets/blog-database-url` sur prod-cookie) |
| `BETTER_AUTH_URL` | `https://blog-api.my-monkey.fr` |
| `BETTER_AUTH_SECRET` | tiré au sort, jamais commité |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | client OAuth « Blog My-Monkey » (copie dans `~/secrets/blog-google-oauth`) |
| `PORT` | 3000 par défaut |

Le client OAuth vit dans le projet Google Cloud `dailygeo-489414`, sous le nom **Blog My-Monkey**,
avec deux URI de redirection : `https://blog-api.my-monkey.fr/api/auth/callback/google` et
`http://localhost:3000/api/auth/callback/google` pour le développement.

Il est **délibérément distinct du client « My-Monkey »** partagé par la galaxie : celui-là sert
Supabase GoTrue et piloo, et Google n'affiche plus le code secret d'un client existant — s'en
servir aurait imposé une rotation de secret, donc un risque pour ces applications, pour rien.
Corollaire : le secret ci-dessus n'est affiché qu'une fois, à la création. S'il est perdu, il faut
en ajouter un nouveau depuis la console.

## Développer en local

```bash
pnpm install
# .env local (gitignoré) — la base passe par le tunnel Tailscale, port 5433
{
  echo "DATABASE_URL=$(ssh prod-cookie 'cat ~/secrets/blog-database-url.tunnel' | sed 's/127.0.0.1/100.97.216.108/')"
  echo "BETTER_AUTH_URL=http://localhost:3000"
  echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)"
} > .env

set -a; . ./.env; set +a
pnpm exec tsx src/index.ts
```

Côté blog, pointer le composant sur ce serveur : `PUBLIC_COMMENTS_API=http://localhost:3000`.
Sans cette variable il tape la production.

## Le schéma

`schema.sql` est idempotent et rejouable :

```bash
cat schema.sql | ssh prod-cookie 'docker exec -i postgres psql -U blog -d blog -v ON_ERROR_STOP=1'
```

Les tables de Better Auth y sont **recopiées d'une génération**, pas écrites à la main — les
régénérer et comparer après chaque montée de version de la librairie :

```bash
pnpm run auth:generate
```

## Déploiement

Application Coolify distincte du blog, sur le même dépôt, avec `api` comme répertoire de base et
un `Dockerfile`. Voir la section correspondante du `CLAUDE.md` du blog.
