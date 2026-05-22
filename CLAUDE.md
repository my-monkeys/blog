# CLAUDE.md — `blog`

Blog statique `blog.my-monkey.fr`. Astro 5 + MDX + Decap CMS + auto-changelog GitHub Releases. Spec complet : `../docs/superpowers/specs/2026-05-22-blog-my-monkey-design.md`.

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
scripts/sync-releases.{mjs,config.json}
oauth/                          # Cloudflare Worker OAuth (deploy séparé)
.github/workflows/
  build-and-release.yml         # build + gh release sur push main
  sync-releases.yml             # cron 6h pull GitHub releases → posts update
```

## Commandes

```bash
npm install
npm run dev              # http://localhost:4321
npm run build            # → dist/ (Astro + Pagefind index + OG images)
npm run preview
npm test                 # Vitest (schemas, scripts)
npm run sync-releases    # local, requires GH_TOKEN env
```

## Variables d'environnement

- `GH_TOKEN` (local, pour `sync-releases`) — token GitHub avec scope `repo`

Secrets GitHub Actions :
- `BOT_PAT` (PAT scope `repo` + `workflow`) — pour que `sync-releases` puisse pousser et déclencher `build-and-release`

Secrets Cloudflare Worker (`oauth/`) :
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

## IndexNow

Clé : `aae48707172349adb1ecff4f015f17a8`
Fichier de validation : `public/aae48707172349adb1ecff4f015f17a8.txt`
Référencé dans `.monkey` (`post_deploy`).

## Workflow d'écriture

Trois options, par ordre de praticité :

1. **Decap CMS** (`blog.my-monkey.fr/admin`) — login GitHub → écrire → publish. Decap commit le `.mdx` dans `src/content/posts/`. Le webhook déclenche le rebuild.
2. **Direct .mdx push** — éditer `src/content/posts/<slug>.mdx` localement, commit, push.
3. **Auto-changelog** — `gh release create` dans un repo `my-monkeys/*` listé dans `scripts/sync-releases.config.json` → post `update` créé automatiquement dans les 6h.

Tous les posts avec `draft: true` sont visibles en dev (`npm run dev`) mais filtrés en prod et du RSS/sitemap.

## Types de posts

| Type | Rendu | Usage |
|---|---|---|
| `article` | Page complète, hero + body | Long-form, idées, tutoriels |
| `update` | Page courte, badge version | Auto-généré depuis GitHub Releases |
| `post-mortem` | Page complète, supporte `<Mortem>` | Debug épique, incidents |
| `link` | Pas de page, redirect direct | Linkblog, partages |

## Déploiement

Via le pipeline **monkey** (cf. `../CLAUDE.md`). Particularité : ici le build et la `gh release` sont **automatisés** par `build-and-release.yml` (déclenché par push sur `main`). On ne build/release pas manuellement, à la différence de `landing-page`.

### Setup one-shot

| Étape | Où | Détail |
|---|---|---|
| Créer repo `my-monkeys/blog` | GitHub | vide, public ou privé |
| Créer GitHub OAuth App | GitHub settings | callback : `https://decap-oauth.my-monkey.fr/callback` |
| Déployer Worker OAuth | Cloudflare | voir `oauth/` README (`wrangler login`, `wrangler secret put GITHUB_CLIENT_ID`, `wrangler secret put GITHUB_CLIENT_SECRET`, `wrangler deploy`, ajouter custom domain `decap-oauth.my-monkey.fr`) |
| Créer `BOT_PAT` | GitHub user settings → tokens | scope `repo` + `workflow`. Ajouter comme secret du repo `blog`. |
| Ajouter sous-domaine `blog.my-monkey.fr` | cPanel O2switch | addon domain pointant sur dossier `blog.my-monkey.fr/` |
| Push initial | local | `git remote add origin git@github.com:my-monkeys/blog.git && git push -u origin main` → trigger first deploy |

## Bonnes pratiques de code

Voir `../CLAUDE.md` (clean code, pas d'abstractions prématurées, pas de commentaires "quoi"). Spécifique à ce projet :

- Tous les composants Astro vivent dans `src/components/`, importés via alias `@/components/...`.
- Les composants utilisables depuis MDX (`Callout`, `Mortem`, `ProjectCard`) sont importés explicitement dans le frontmatter du fichier `.mdx` qui les utilise.
- Pas de CSS framework — tout en CSS natif avec tokens dans `global.css`.
- Animations GSAP centralisées dans `src/scripts/animations.ts`, déclenchées sur `astro:page-load` pour fonctionner aussi avec View Transitions.
