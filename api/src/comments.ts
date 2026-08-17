import { Router, type Request, type RequestHandler, type Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from './auth.js';
import { execute, query } from './db.js';

// Express 4 ignore les promesses rejetées d'un gestionnaire : la requête resterait suspendue
// jusqu'au délai d'attente du navigateur, sans jamais atteindre le gestionnaire d'erreurs.
const asynchrone =
  (gestionnaire: (req: Request, res: Response) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    gestionnaire(req, res).catch(next);
  };

// Un jeton absent doit faire échouer la comparaison SQL, pas la requête entière. Cet uuid ne
// peut appartenir à personne : `gen_random_uuid()` ne le tire jamais.
const AUCUN_JETON = '00000000-0000-0000-0000-000000000000';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const NOM_MAX = 80;
const MESSAGE_MAX = 2000;

interface CommentaireRendu {
  id: string;
  author_name: string;
  message: string;
  created_at: string;
  verified: boolean;
  can_edit: boolean;
}

// Le jeton de session anonyme est tiré par le navigateur et gardé en localStorage. C'est un
// secret porteur : qui le détient peut modifier les commentaires qu'il a signés — raison pour
// laquelle il ne ressort jamais d'ici, à la différence du `select *` de l'époque Supabase, qui
// servait au navigateur les jetons de tout le monde.
function jetonAnonyme(req: Request): string {
  const brut = req.get('x-session-token');
  return brut && UUID.test(brut) ? brut : AUCUN_JETON;
}

async function utilisateurConnecte(req: Request): Promise<string | null> {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  return session?.user.id ?? null;
}

function texteValide(valeur: unknown, max: number): valeur is string {
  return typeof valeur === 'string' && valeur.trim().length >= 1 && valeur.trim().length <= max;
}

export const commentaires: Router = Router();

commentaires.get(
  '/comments',
  asynchrone(async (req, res) => {
    const slug = req.query.slug;
    if (typeof slug !== 'string' || !slug) return res.status(400).json({ error: 'slug manquant' });

    const lignes = await query<CommentaireRendu>(
      `select id, author_name, message, created_at,
              user_id is not null as verified,
              (session_token = $2 or coalesce(user_id = $3::uuid, false)) as can_edit
         from comments
        where post_slug = $1
        order by created_at`,
      [slug, jetonAnonyme(req), await utilisateurConnecte(req)],
    );

    res.json(lignes);
  }),
);

commentaires.post(
  '/comments',
  asynchrone(async (req, res) => {
    const { post_slug: slug, author_name: nom, message } = req.body ?? {};
    if (typeof slug !== 'string' || !slug) return res.status(400).json({ error: 'slug manquant' });
    if (!texteValide(nom, NOM_MAX)) return res.status(400).json({ error: 'nom invalide' });
    if (!texteValide(message, MESSAGE_MAX)) return res.status(400).json({ error: 'message invalide' });

    const [cree] = await query<{ id: string }>(
      `insert into comments (post_slug, author_name, message, session_token, user_id)
       values ($1, $2, $3, $4, $5::uuid)
       returning id`,
      [slug, nom.trim(), message.trim(), jetonAnonyme(req), await utilisateurConnecte(req)],
    );

    res.status(201).json({ id: cree.id });
  }),
);

commentaires.patch(
  '/comments/:id',
  asynchrone(async (req, res) => {
    const { message } = req.body ?? {};
    if (!UUID.test(req.params.id)) return res.status(400).json({ error: 'identifiant invalide' });
    if (!texteValide(message, MESSAGE_MAX)) return res.status(400).json({ error: 'message invalide' });

    const touchees = await execute(
      `update comments set message = $1
        where id = $2
          and (session_token = $3 or coalesce(user_id = $4::uuid, false))`,
      [message.trim(), req.params.id, jetonAnonyme(req), await utilisateurConnecte(req)],
    );

    if (!touchees) return res.status(403).json({ error: 'commentaire introuvable ou pas le vôtre' });
    res.status(204).end();
  }),
);

commentaires.delete(
  '/comments/:id',
  asynchrone(async (req, res) => {
    if (!UUID.test(req.params.id)) return res.status(400).json({ error: 'identifiant invalide' });

    const touchees = await execute(
      `delete from comments
        where id = $1
          and (session_token = $2 or coalesce(user_id = $3::uuid, false))`,
      [req.params.id, jetonAnonyme(req), await utilisateurConnecte(req)],
    );

    if (!touchees) return res.status(403).json({ error: 'commentaire introuvable ou pas le vôtre' });
    res.status(204).end();
  }),
);
