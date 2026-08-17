import { betterAuth } from 'better-auth';
import { pool } from './db.js';
import { BLOG_ORIGINS } from './origins.js';

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  advanced: {
    // Des uuid plutôt que la chaîne base62 par défaut : `comments.user_id` est de ce type
    // depuis Supabase, et le garder évite de toucher aux commentaires déjà écrits.
    database: { generateId: 'uuid' },
  },

  // Google seul, délibérément : commenter un article ne justifie pas de gérer des mots de
  // passe, donc pas de stockage de secret, pas de formulaire d'inscription, pas de parcours
  // de réinitialisation. Qui ne veut pas de compte commente en anonyme, comme avant.
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  // L'API vit sur un sous-domaine distinct du blog : sans cette liste, Better Auth refuse ses
  // propres requêtes, la vérification d'origine étant sa protection CSRF.
  trustedOrigins: BLOG_ORIGINS,

  session: {
    // La session est relue à chaque affichage de commentaires : sans ce cache, chaque page
    // d'article coûterait une requête de session de plus.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
});
