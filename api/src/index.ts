import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth.js';
import { commentaires } from './comments.js';
import { BLOG_ORIGINS } from './origins.js';
import { limiteEcritures } from './rate-limit.js';
import { pool } from './db.js';

const PORT = Number(process.env.PORT ?? 3000);

const app = express();

// Traefik est le seul à joindre ce service : sans cela, Express verrait l'adresse du proxy
// comme celle du visiteur et le plafond d'écritures s'appliquerait à tout le monde d'un bloc.
app.set('trust proxy', true);

// Le blog est servi depuis un autre sous-domaine : le navigateur n'enverra le cookie de session
// que si l'origine est nommément autorisée et les identifiants explicitement acceptés.
app.use(
  cors({
    origin: BLOG_ORIGINS,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['content-type', 'x-session-token'],
    credentials: true,
  }),
);

// ⚠️ Avant `express.json()`, et pas après : Better Auth lit le corps de la requête lui-même,
// et un corps déjà consommé laisse ses appels en attente indéfiniment.
app.all('/api/auth/*', toNodeHandler(auth));

app.use(express.json({ limit: '32kb' }));

app.use(['/comments'], (req, res, next) => (req.method === 'GET' ? next() : limiteEcritures(req, res, next)));
app.use(commentaires);

// Ce que le blog a besoin de savoir avant d'afficher son en-tête. Sans client OAuth déclaré,
// Better Auth répond 500 à la moindre tentative : mieux vaut que le bouton « Se connecter »
// n'apparaisse pas du tout, et qu'il réapparaisse de lui-même le jour où la variable est posée.
app.get('/config', (_req, res) => {
  res.json({ login: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) });
});

app.get('/health', async (_req, res) => {
  try {
    await pool.query('select 1');
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

// Les gestionnaires asynchrones passent leurs rejets ici via `asynchrone()` (cf. comments.ts).
app.use(((err, _req, res, _next) => {
  console.error('erreur non rattrapée', err);
  res.status(500).json({ error: 'erreur interne' });
}) as express.ErrorRequestHandler);

app.listen(PORT, () => {
  console.log(`API commentaires du blog sur le port ${PORT}`);
});
