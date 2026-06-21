# CLAUDE.md — `blog`

Blog statique `blog.my-monkey.fr`. Astro 5 + MDX + Decap CMS. Spec complet : `../docs/superpowers/specs/2026-05-22-blog-my-monkey-design.md`.

## Stack

- **Astro 5** (SSG, content collections, view transitions)
- **MDX** pour les posts
- **Decap CMS** servi sous `/admin` (commit markdown via OAuth GitHub)
- **Cloudflare Worker** dans `oauth/` (proxy OAuth GitHub pour Decap)
- **Pagefind** (recherche full-text indexée au build)
- **astro-expressive-code** (syntax highlighting Shiki)
- **GSAP 3** (animations parcimonieuses — hero stagger, scroll-in, view transitions)
- **Satori + resvg** (OG images générées au build)
- **Vitest** pour les tests

## Structure

```
.monkey                         # deploy config
src/
  content/posts/                # *.mdx (4 types : article, update, post-mortem, link)
  content/now/now.md            # singleton page /now
  data/projects.ts              # registre des projets référençables
  layouts/                      # BaseLayout, PostLayout
  pages/                        # routes Astro
  components/                   # composants + composants MDX (Callout, Mortem, ProjectCard)
  styles/                       # global.css, code.css
  scripts/animations.ts         # GSAP central
  lib/readingTime.ts
public/admin/                   # Decap CMS (index.html + config.yml)
oauth/                          # Cloudflare Worker OAuth (deploy séparé)
.github/workflows/
  build-and-release.yml         # build + gh release sur push main
```

## Commandes

```bash
pnpm install
pnpm dev                 # http://localhost:4321
pnpm build               # → dist/ (Astro + Pagefind index + OG images)
pnpm preview
pnpm test                # Vitest (schemas, lib, registre projets)
```

## Variables d'environnement

`build-and-release.yml` n'utilise que le `GITHUB_TOKEN` auto des Actions — aucun secret custom à configurer côté repo.

Secrets Cloudflare Worker (`oauth/`) :
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

## IndexNow

Clé : `aae48707172349adb1ecff4f015f17a8`
Fichier de validation : `public/aae48707172349adb1ecff4f015f17a8.txt`
Référencé dans `.monkey` (`post_deploy`).

## Workflow d'écriture

Deux options, par ordre de praticité :

1. **Decap CMS** (`blog.my-monkey.fr/admin`) — login GitHub → écrire → publish. Decap commit le `.mdx` dans `src/content/posts/`. Le webhook déclenche le rebuild.
2. **Direct .mdx push** — éditer `src/content/posts/<slug>.mdx` localement, commit, push.

Tous les posts avec `draft: true` sont visibles en dev (`pnpm dev`) mais filtrés en prod et du RSS/sitemap.

## Types de posts

| Type | Rendu | Usage |
|---|---|---|
| `article` | Page complète, hero + body | Long-form, idées, tutoriels |
| `update` | Page courte, badge version | Notes de version, écrites à la main |
| `post-mortem` | Page complète, supporte `<Mortem>` | Debug épique, incidents |
| `link` | Pas de page, redirect direct | Linkblog, partages |

## Créer un article

### 1. Créer le fichier

Un article = un fichier `.mdx` dans `src/content/posts/`. Le **nom du fichier devient le slug** de l'URL :

```
src/content/posts/mon-super-article.mdx   →  https://blog.my-monkey.fr/posts/mon-super-article/
```

Convention de nommage : kebab-case, ASCII pur, pas d'accent (le fichier *peut* en contenir mais l'URL sera plus propre sans).

### 2. Le frontmatter (champs YAML en tête de fichier)

Tous les champs validés par Zod (`src/content/config.ts`). Le build casse si un champ obligatoire manque ou est invalide.

| Champ | Obligatoire | Type | Notes |
|---|---|---|---|
| `title` | ✅ | string, max 120 | Titre affiché partout |
| `date` | ✅ | YYYY-MM-DD | Date de publication, sert au tri |
| `type` | ✅ | `article` \| `update` \| `post-mortem` \| `link` | Détermine le rendu et le badge |
| `excerpt` | ⛔ | string, max 280 | Affiché sous le titre dans le feed, RSS, OG image. Sinon vide. |
| `tags` | ⛔ | array de string | Génère les pages `/tags/<tag>/`. Lowercase, libre. |
| `project` | ⛔ | slug | Doit matcher un slug de `src/data/projects.ts` → badge cliquable vers le projet |
| `cover` | ⛔ | chemin image | `./_assets/foo.jpg` (relatif au `.mdx`). Active le rendu Featured dans le feed. |
| `url` | ✅ si type=`link` | URL | URL externe pour les liens partagés |
| `source_url` | ⛔ | URL | Pour `update`, lien vers la release GitHub. Affiché en footer. |
| `draft` | ⛔ | boolean (default `false`) | `true` = visible en `pnpm dev` mais filtré en prod, RSS, sitemap |

### 3. Templates prêts à copier-coller

#### Article long-form

```mdx
---
title: "Comment j'ai cassé ma prod en 4 lignes de Bash"
date: 2026-05-25
type: article
excerpt: "Une commande mal pensée, un find sans -depth, et un week-end de récup."
tags: ["bash", "ops"]
project: "manabo"
draft: false
---

Le contexte court ici, ce qui va te happer en 2 phrases.

## Le décor

Texte en markdown classique. Les `code` inline marchent. Les listes :

- item un
- item deux

## Le code qui casse

\`\`\`bash
find . -name "*.tmp" -exec rm {} \;
\`\`\`

## La leçon

Conclusion courte.
```

#### Post-mortem (utilise le composant `<Mortem>`)

```mdx
---
title: "Le firewall Docker qui cassait manabo"
date: 2026-05-19
type: post-mortem
excerpt: "Pendant 3 jours, manabo renvoyait 502. Cause cachée dans UFW."
tags: ["docker", "infra", "debug"]
project: "manabo"
draft: false
---

import Mortem from '@/components/Mortem.astro';

<Mortem
  symptom="manabo.cookie répond 502 systématiquement. Le container tourne."
  cause="Caddy atteint l'hôte via host.docker.internal, UFW bloque le range 172.16.0.0/12."
  fix="sudo ufw allow from 172.16.0.0/12 to any port 3456 proto tcp"
/>

## Lessons

Texte libre après le bloc Mortem.
```

#### Linkblog (lien externe)

```mdx
---
title: "On the death of personal sites"
date: 2026-05-12
type: link
url: "https://smithereens.dev/posts/death-of-personal-sites/"
excerpt: "Pourquoi les sites perso disparaissent au profit des plateformes."
tags: ["web", "indieweb"]
draft: false
---

Une ou deux phrases de commentaire perso. Le corps n'est PAS affiché en page (le clic dans le feed ouvre direct l'URL externe), mais reste utile pour le contexte si quelqu'un lit le `.mdx` sur GitHub.
```

#### Update (note de version, écrite à la main)

```mdx
---
title: "Update piloo v0.4.2"
date: 2026-05-26
type: update
project: "piloo"
tags: ["release"]
excerpt: "Sync iOS background fix + cleanup migrations."
source_url: "https://github.com/my-monkeys/piloo/releases/tag/v0.4.2"
draft: false
---

## Features

- Background sync iOS rétabli sur 17.4+

## Fixes

- Migration 0042 idempotente
```

**Convention de nom de fichier pour `type: update`** : `<repo>-v<X>-<Y>-<Z>.mdx` (e.g., `piloo-v0-4-2.mdx`). Le composant `PostRow` extrait la version depuis le slug pour l'afficher en badge.

### 4. Composants MDX disponibles

Trois composants utilisables depuis n'importe quel `.mdx` — il faut les **importer explicitement** dans le frontmatter :

```mdx
import Callout from '@/components/Callout.astro';
import Mortem from '@/components/Mortem.astro';
import ProjectCard from '@/components/ProjectCard.astro';
```

**`<Callout>`** — encart annoté (info / warn / fix) :
```mdx
<Callout type="info">
  Petit aparté utile à savoir mais pas critique.
</Callout>

<Callout type="warn">Attention, ne fais surtout pas ça.</Callout>
<Callout type="fix">Le fix exact à appliquer.</Callout>
```

**`<Mortem>`** — bloc symptôme/cause/fix pour post-mortems (3 colonnes desktop, 1 colonne mobile) :
```mdx
<Mortem
  symptom="..."
  cause="..."
  fix="..."
/>
```

**`<ProjectCard slug="manabo">`** — carte cliquable vers un projet :
```mdx
<ProjectCard slug="piloo" />
```
Le slug doit matcher `src/data/projects.ts`. Si inconnu : fallback texte sans lien + warning au build.

**`<Mermaid>`** — diagramme Mermaid, rendu **client-side** (lazy import, mermaid n'est téléchargé que sur les pages qui en contiennent) :

```mdx
import Mermaid from '@/components/Mermaid.astro';

<Mermaid code={`
graph LR
  A[Client] -->|HTTPS| B(Caddy)
  B --> C{Service}
  C -->|OK| D[Response]
  C -->|fail| E[502]
`} />
```

Avec une légende :

```mdx
<Mermaid
  caption="Flow réseau du proxy Caddy"
  code={`
sequenceDiagram
  Client->>Caddy: GET /
  Caddy->>App: proxy_pass
  App-->>Caddy: 200
  Caddy-->>Client: 200
`}
/>
```

Supporte tous les types de diagrammes Mermaid : `graph`, `sequenceDiagram`, `classDiagram`, `stateDiagram`, `erDiagram`, `gantt`, `pie`, `journey`, `gitGraph`, etc. Voir https://mermaid.js.org/intro/.

Theme auto-adapté au mode light/dark **au premier rendu** (pas dynamique si on toggle après — recharger la page pour reformatter).

Si le diagramme contient une erreur de syntaxe, le bloc affiche un cadre rouge avec "Mermaid render failed (voir console)" — pratique pour debug.

**`<CodeDiff>`** — bloc avant/après côte à côte, syntax-highlighted via Shiki (theme dual light/dark) :

```mdx
import CodeDiff from '@/components/CodeDiff.astro';

<CodeDiff
  lang="javascript"
  caption="Avant le fix, après le fix"
  before={`function add(a, b) {
  return a + b;
}`}
  after={`function add(a, b) {
  if (typeof a !== 'number') throw new Error('a must be number');
  if (typeof b !== 'number') throw new Error('b must be number');
  return a + b;
}`}
/>
```

Props : `before`, `after`, `lang`, `beforeLabel?` (default "Avant"), `afterLabel?` (default "Après"), `caption?`. Side-by-side desktop, stacké mobile.

**`<Video>`** — embed vidéo locale (ou URL absolue) avec controls par défaut :

```mdx
import Video from '@/components/Video.astro';

<Video
  src="/videos/demo-deploy.mp4"
  poster="/videos/demo-deploy.jpg"
  caption="Demo du pipeline .monkey en action"
/>
```

Props : `src` (requis), `poster?`, `caption?`, `autoplay?`, `loop?`, `muted?` (true par défaut si autoplay), `controls?` (true sauf si autoplay), `width?`, `height?`. Les vidéos vont dans `public/videos/` (Astro ne touche pas aux .mp4).

**Tweet embed** — via `@astro-community/astro-embed-twitter` (rendu statique au build, pas de JS tiers à runtime) :

```mdx
import { Tweet } from '@astro-community/astro-embed-twitter';

<Tweet id="https://twitter.com/jack/status/20" />
```

**YouTube embed** — pareil :

```mdx
import { YouTube } from '@astro-community/astro-embed-youtube';

<YouTube id="dQw4w9WgXcQ" title="Démo" />
```

### 6. Math (KaTeX)

Activé via `remark-math` + `rehype-katex`. CSS KaTeX importé global dans `global.css`.

Syntaxe inline avec `$...$`, bloc avec `$$...$$` :

```mdx
La complexité est en $O(n \log n)$.

Théorème :
$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$
```

### 7. Commentaires

Section `<Comments />` ajoutée automatiquement à la fin de chaque post via `PostLayout`. Backed par **Giscus** + GitHub Discussions sur `my-monkeys/blog` (catégorie "General"). Mapping par pathname → 1 thread par post.

**Setup requis** (one-shot, à faire si pas encore) : installer le GitHub App Giscus sur le repo → https://github.com/apps/giscus → "Only select repositories" → cocher `my-monkeys/blog`. Sans ça, l'iframe s'affiche mais le post ne marche pas.

Theme dark/light suit automatiquement le `data-theme` du blog (postMessage à l'iframe au toggle).

### 5. Ajouter des images

#### Image inline dans un article

Mets l'image dans `src/content/posts/_assets/` puis référence-la en chemin relatif :

```mdx
![alt text](./_assets/mon-image.jpg)
```

Astro l'optimise au build (resize, WebP/AVIF, lazy loading).

#### Image cover (active le rendu Featured)

```yaml
cover: ./_assets/cover-de-mon-article.jpg
```

Le post apparaît alors comme **carte large avec image full-bleed** dans le feed (1 entrée sur 4 par défaut, voir `src/pages/index.astro`).

#### Lightbox automatique

Toutes les images dans une page post (cover + inline body) sont **cliquables pour s'agrandir** par défaut. Le script `src/scripts/image-lightbox.ts` :

- Ajoute un `cursor: zoom-in` sur les images
- Au clic → ouvre un `<dialog>` natif fullscreen (ESC ou clic-backdrop pour fermer)
- Récupère la variante la plus haute résolution depuis le `srcset` généré par Astro Image

Pour **désactiver** sur une image spécifique, ajouter l'attribut `data-no-zoom` :

```mdx
<img src="/icon.svg" alt="" data-no-zoom />
```

### 6. Code dans un article

Triple backtick + langue → highlight automatique via `astro-expressive-code` (theme dual light/dark, copy-button au hover, bordure 2px) :

````mdx
```typescript
function foo(x: number): number {
  return x * 2;
}
```
````

Langues supportées : tout ce que Shiki supporte (>180 langues).

### 7. Drafts (brouillons)

```yaml
draft: true
```

→ Visible en `pnpm dev`, **invisible** en prod (filtré du feed, des tags/archives, du RSS, du sitemap, l'URL directe renvoie 404).

Workflow : push un brouillon, itère localement, passe à `draft: false` quand prêt.

### 8. Publier

#### Option A — Git direct (la plus rapide aujourd'hui)

```bash
cd /Users/maxim/Documents/my-monkey/blog
# 1. créer l'article
vim src/content/posts/mon-article.mdx
# 2. tester en local
pnpm dev   # http://localhost:4321/posts/mon-article/
# 3. publier
git add src/content/posts/mon-article.mdx
git commit -m "post: mon article"
git push
# → workflow build-and-release → release → monkey → blog.my-monkey.fr en ~60s
```

#### Option B — Decap CMS (`/admin`)

Marche dès que le setup Worker OAuth est fait (cf. "Setup one-shot" ci-dessous). UI web sur `https://blog.my-monkey.fr/admin/` → login GitHub → écris → publish → Decap commit pour toi → même pipeline.

## Déploiement

Via le pipeline **monkey** (cf. `../CLAUDE.md`). Particularité : ici le build et la `gh release` sont **automatisés** par `build-and-release.yml` (déclenché par push sur `main`). On ne build/release pas manuellement, à la différence de `landing-page`.

### Setup one-shot

| Étape | Où | Détail |
|---|---|---|
| Créer repo `my-monkeys/blog` | GitHub | vide, public ou privé |
| Créer GitHub OAuth App | GitHub settings | callback : `https://decap-oauth.my-monkey.fr/callback` |
| Déployer Worker OAuth | Cloudflare | voir `oauth/` README (`wrangler login`, `wrangler secret put GITHUB_CLIENT_ID`, `wrangler secret put GITHUB_CLIENT_SECRET`, `wrangler deploy`, ajouter custom domain `decap-oauth.my-monkey.fr`) |
| Ajouter sous-domaine `blog.my-monkey.fr` | cPanel O2switch | addon domain pointant sur dossier `blog.my-monkey.fr/` |
| Push initial | local | `git remote add origin git@github.com:my-monkeys/blog.git && git push -u origin main` → trigger first deploy |

## Bonnes pratiques de code

Voir `../CLAUDE.md` (clean code, pas d'abstractions prématurées, pas de commentaires "quoi"). Spécifique à ce projet :

- Tous les composants Astro vivent dans `src/components/`, importés via alias `@/components/...`.
- Les composants utilisables depuis MDX (`Callout`, `Mortem`, `ProjectCard`) sont importés explicitement dans le frontmatter du fichier `.mdx` qui les utilise.
- Pas de CSS framework — tout en CSS natif avec tokens dans `global.css`.
- Animations GSAP centralisées dans `src/scripts/animations.ts`, déclenchées sur `astro:page-load` pour fonctionner aussi avec View Transitions.

## Vérifier qu'un deploy est bien passé

`gh release create` rend la main **avant** que monkey ait fini (webhook async). Ne jamais conclure « déployé » sur le seul exit code de `gh` : **toujours** confirmer `status: success` via l'API admin monkey.

Deux URLs pour la même API admin (Bearer token `ADMIN_API_TOKEN`), à choisir selon ton accès réseau :
- **Public (depuis Internet, pour tout le monde)** : `https://git.my-monkey.fr/api/admin/deploys`
- **Tailscale (sur le tailnet cookie-server)** : `http://monkey.cookie/api/admin/deploys`

Filtre `?repo=<org/repo>&limit=1`, tri par date desc → la ligne `[0]` est le dernier deploy.

```bash
# Token admin monkey — deux cas :
#  • Tailscale + accès SSH à cookie-server → récupération auto ci-dessous
#  • sinon → exporte d'abord  MONKEY_ADMIN_TOKEN=<token admin monkey>
TOKEN="${MONKEY_ADMIN_TOKEN}"
[ -z "$TOKEN" ] && TOKEN=$(ssh cookie-server.tailscale "grep '^ADMIN_API_TOKEN=' /home/maxim/monkey/infra/.env.production | cut -d= -f2-")
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)   # ex: my-monkeys/<repo>
TAG="vX.Y.Z"   # le tag qu'on vient de publier

for i in $(seq 1 40); do
  row=$(curl -s "https://git.my-monkey.fr/api/admin/deploys?repo=$REPO&limit=1" \
          -H "Authorization: Bearer $TOKEN")
  st=$(echo "$row" | jq -r '.deploys[0].status')
  tg=$(echo "$row" | jq -r '.deploys[0].tag')
  echo "deploy $tg → $st"
  case "$st" in
    success)          echo "✅ upload OK ($tg)"; break ;;
    failed|cancelled) id=$(echo "$row" | jq -r '.deploys[0]._id')
                      echo "❌ deploy $st — logs :"
                      curl -s "https://git.my-monkey.fr/api/admin/deploys/$id/logs" \
                           -H "Authorization: Bearer $TOKEN" \
                        | jq -r '.logs[] | "[\(.phase)] \(.msg)"'
                      exit 1 ;;
    *)                sleep 5 ;;   # pending/running → on attend
  esac
done
```

À asserter : `deploys[0].tag` == le tag publié **et** `deploys[0].status` == `success`. Si `failed`/`cancelled`, lire les logs via `…/deploys/<id>/logs` (champs `phase` + `msg`) avant de retenter. Champs d'une ligne : `repo`, `tag`, `target`, `status`, `phase`, `startedAt`, `finishedAt`, `releaseUrl`.
