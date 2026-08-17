import { Pool, type QueryResultRow } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  // La base est sur le même hôte : une requête qui dépasse ça est un incident, pas de la
  // lenteur réseau. Mieux vaut rendre la main que faire attendre l'affichage des commentaires.
  statement_timeout: 5_000,
});

export async function query<T extends QueryResultRow>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

// Nombre de lignes touchées — pour les écritures dont seul le succès compte. Les requêtes
// d'édition portent l'autorisation dans leur WHERE, donc 0 ligne veut dire « pas le droit »
// autant que « n'existe pas » : c'est voulu, on ne distingue pas les deux dans la réponse.
export async function execute(text: string, params?: unknown[]): Promise<number> {
  const result = await pool.query(text, params);
  return result.rowCount ?? 0;
}
