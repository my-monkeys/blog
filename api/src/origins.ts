// Les origines autorisées à parler à cette API — elle ne sert qu'un site, plus l'atelier local.
// Better Auth s'en sert pour sa vérification CSRF, le middleware CORS pour ses en-têtes : les
// deux doivent dire la même chose, d'où la liste unique.
const DEV_ORIGINS = ['http://localhost:4321', 'http://127.0.0.1:4321'];

export const BLOG_ORIGINS =
  process.env.NODE_ENV === 'production'
    ? ['https://blog.my-monkey.fr']
    : ['https://blog.my-monkey.fr', ...DEV_ORIGINS];
