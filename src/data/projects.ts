export type Project = {
  slug: string;
  name: string;
  url: string;
};

export const PROJECTS: readonly Project[] = [
  { slug: 'alloc-warrior', name: 'Alloc Warrior', url: 'https://alloc-warrior.my-monkey.fr' },
  { slug: 'arcade', name: 'Arcade', url: 'https://arcade.my-monkey.fr' },
  { slug: 'asso', name: 'Asso', url: 'https://asso.my-monkey.fr' },
  { slug: 'auth-mymonkey', name: 'Auth My-Monkey', url: 'https://auth.my-monkey.fr' },
  { slug: 'bananaclicker', name: 'Banana Clicker', url: 'https://bananaclicker.my-monkey.fr' },
  { slug: 'blog', name: 'Blog', url: 'https://blog.my-monkey.fr' },
  { slug: 'chirurgien', name: 'Chirurgien', url: 'https://chirurgien.my-monkey.fr' },
  { slug: 'clique-salope', name: 'Clique Salope', url: 'https://clique-salope.my-monkey.fr' },
  { slug: 'controller', name: 'Controller', url: 'https://controller.my-monkey.fr' },
  { slug: 'fapmap', name: 'Fapmap', url: 'https://fapmap.my-monkey.fr' },
  { slug: 'geography', name: 'Geography', url: 'https://geography.my-monkey.fr' },
  { slug: 'kebab-shit-map', name: 'Kebab Shit Map', url: 'https://kebab.my-monkey.fr' },
  { slug: 'landing-page', name: 'Landing My-Monkey', url: 'https://my-monkey.fr' },
  { slug: 'manabo', name: 'Manabo', url: 'https://manabo.my-monkey.fr' },
  { slug: 'mapmap', name: 'Mapmap', url: 'https://mapmap.my-monkey.fr' },
  { slug: 'michto-scale', name: 'Michto Scale', url: 'https://michto-scale.my-monkey.fr' },
  { slug: 'milkylog', name: 'MilkyLog', url: 'https://milkylog.my-monkey.fr' },
  { slug: 'modpacks-wiki', name: 'Modpacks Wiki', url: 'https://modpacks.my-monkey.fr' },
  { slug: 'monkey', name: 'Monkey', url: 'https://monkey.my-monkey.fr' },
  { slug: 'movies', name: 'Movies', url: 'https://movies.my-monkey.fr' },
  { slug: 'papers', name: 'Papers', url: 'https://papers.my-monkey.fr' },
  { slug: 'piloo', name: 'Piloo', url: 'https://piloo.my-monkey.fr' },
  { slug: 'porndle-next', name: 'Porndle', url: 'https://porndle.my-monkey.fr' },
  { slug: 'showroom', name: 'Showroom', url: 'https://showroom.my-monkey.fr' },
  { slug: 'snaaplt', name: 'Snaaplt', url: 'https://snaaplt.my-monkey.fr' },
  { slug: 'support', name: 'Support', url: 'https://support.my-monkey.fr' },
  { slug: 'traquenard', name: 'Traquenard', url: 'https://traquenard.my-monkey.fr' },
  { slug: 'uptime', name: 'Uptime', url: 'https://uptime.my-monkey.fr' },
];

const BY_SLUG = new Map(PROJECTS.map((p) => [p.slug, p]));

export function getProject(slug: string): Project | undefined {
  return BY_SLUG.get(slug);
}
