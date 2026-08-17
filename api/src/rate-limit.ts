import type { RequestHandler } from 'express';

const FENETRE_MS = 10 * 60 * 1000;
const MAX_ECRITURES = 10;

const ecrituresParIp = new Map<string, number[]>();

// Purge des seaux vidés par le temps. Sans elle, la table garderait une entrée par visiteur
// jusqu'au prochain redéploiement.
const purge = setInterval(() => {
  const limite = Date.now() - FENETRE_MS;
  for (const [ip, dates] of ecrituresParIp) {
    const recentes = dates.filter((d) => d > limite);
    if (recentes.length) ecrituresParIp.set(ip, recentes);
    else ecrituresParIp.delete(ip);
  }
}, FENETRE_MS);
purge.unref();

// Cloudflare passe l'adresse réelle du visiteur ; `req.ip` ne verrait que le proxy. Un client
// qui joindrait l'origine en direct pourrait forger cet en-tête — c'est un garde-fou contre le
// spam d'un robot ordinaire, pas une frontière de sécurité.
function adresse(req: Parameters<RequestHandler>[0]): string {
  return req.get('cf-connecting-ip') ?? req.ip ?? 'inconnue';
}

// Sous Supabase, PostgREST plafonnait les écritures pour nous. Cette API est publique et sans
// compte obligatoire : sans plafond, un robot remplit la table d'un article en quelques secondes.
export const limiteEcritures: RequestHandler = (req, res, next) => {
  const ip = adresse(req);
  const limite = Date.now() - FENETRE_MS;
  const recentes = (ecrituresParIp.get(ip) ?? []).filter((d) => d > limite);

  if (recentes.length >= MAX_ECRITURES) {
    return res.status(429).json({ error: 'Trop de commentaires coup sur coup. Reviens dans un moment.' });
  }

  recentes.push(Date.now());
  ecrituresParIp.set(ip, recentes);
  next();
};
