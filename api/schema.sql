-- Schéma de `blog` sur le PostgreSQL de prod-cookie (hôte `postgres-prod`, base `blog`).
--
-- Repris de la table `blog_comments` du projet Supabase partagé. Le préfixe `blog_` disparaît :
-- il n'existait que parce que la base était mutualisée entre une vingtaine d'applications, ce
-- qui n'est plus le cas ici. Le nom n'était écrit qu'à un seul endroit du code applicatif.
--
-- Ce qui a disparu au passage :
--   · RLS et les rôles `anon`/`authenticated` — la base n'est plus joignable depuis Internet,
--     seulement par cette API, sur le réseau Docker `coolify` ;
--   · les quatre policies, dont la logique se retrouve ici : les bornes de longueur en
--     contraintes CHECK, l'autorisation d'édition dans la clause WHERE des requêtes
--     (cf. `src/comments.ts`).
--
-- Idempotent : rejouable sur une base déjà en place.

create extension if not exists pgcrypto;

-- ══════════════════════════════ identité ════════════════════════════════
-- Tables de Better Auth, qui a pris la place de GoTrue. Elles sont GÉNÉRÉES — les recopier à la
-- main serait une source d'écart silencieux à chaque mise à jour de la librairie :
--   pnpm run auth:generate
-- puis comparer avec ce qui suit.
--
-- Les identifiants sont des uuid (option `generateId: 'uuid'`) et non la chaîne base62 par
-- défaut, pour que `comments.user_id` garde le type qu'il avait sous Supabase.
create table if not exists "user" (
  "id" uuid default gen_random_uuid() not null primary key,
  "name" text not null,
  "email" text not null unique,
  "emailVerified" boolean not null,
  "image" text,
  "createdAt" timestamptz default current_timestamp not null,
  "updatedAt" timestamptz default current_timestamp not null
);

create table if not exists "session" (
  "id" uuid default gen_random_uuid() not null primary key,
  "expiresAt" timestamptz not null,
  "token" text not null unique,
  "createdAt" timestamptz default current_timestamp not null,
  "updatedAt" timestamptz not null,
  "ipAddress" text,
  "userAgent" text,
  "userId" uuid not null references "user" ("id") on delete cascade
);
create index if not exists "session_userId_idx" on "session" ("userId");

create table if not exists "account" (
  "id" uuid default gen_random_uuid() not null primary key,
  "accountId" text not null,
  "providerId" text not null,
  "userId" uuid not null references "user" ("id") on delete cascade,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  "scope" text,
  "password" text,
  "createdAt" timestamptz default current_timestamp not null,
  "updatedAt" timestamptz not null
);
create index if not exists "account_userId_idx" on "account" ("userId");

create table if not exists "verification" (
  "id" uuid default gen_random_uuid() not null primary key,
  "identifier" text not null,
  "value" text not null,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz default current_timestamp not null,
  "updatedAt" timestamptz default current_timestamp not null
);
create index if not exists "verification_identifier_idx" on "verification" ("identifier");

-- ════════════════════════════ commentaires ══════════════════════════════
-- Deux façons d'être propriétaire d'un commentaire, et elles coexistent :
--   · `session_token` — un uuid tiré par le navigateur et gardé en localStorage. C'est ce qui
--     permet de corriger son commentaire sans compte. Les visiteurs qui en ont déjà un gardent
--     la main sur leurs anciens commentaires : le jeton traverse la migration inchangé.
--   · `user_id` — renseigné quand la personne était connectée. Survit au vidage du localStorage
--     et vaut sur tous ses navigateurs, d'où le ✓ affiché à côté du nom.
--
-- `on delete set null` plutôt que `cascade` : supprimer son compte ne doit pas faire disparaître
-- les fils de discussion des articles, seulement le lien vers le compte.
create table if not exists comments (
  id            uuid primary key default gen_random_uuid(),
  post_slug     text not null,
  author_name   text not null check (char_length(author_name) between 1 and 80),
  message       text not null check (char_length(message) between 1 and 2000),
  created_at    timestamptz not null default now(),
  session_token uuid not null default gen_random_uuid(),
  user_id       uuid references "user"(id) on delete set null
);

-- L'unique lecture du site : tous les commentaires d'un article, dans l'ordre.
create index if not exists comments_post_slug_idx on comments (post_slug, created_at);
