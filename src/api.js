// src/api.js
// /src/api.js

const BASE = 'https://api.github.com';
const HEADERS = {
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  // Nota: No se incluye Authorization por seguridad en cliente.
};

/**
 * Busca repositorios.
 * @param {string} query - consulta de búsqueda (vací­a -> popular por defecto).
 * @param {number} page - página 1..N
 * @param {number} perPage - elementos por página
 * @returns {Promise<{items: any[], total_count: number}>}
 */
export async function searchRepos(query, page = 1, perPage = 10) {
  const q = (query && query.trim()) ? query.trim() : 'stars:>10000';
  const url = new URL(`${BASE}/search/repositories`);
  url.searchParams.set('q', q);
  url.searchParams.set('sort', 'stars');
  url.searchParams.set('order', 'desc');
  url.searchParams.set('per_page', String(perPage));
  url.searchParams.set('page', String(page));

  const res = await fetch(url.toString(), { headers: HEADERS });
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('RATE_LIMIT'); // manejado arriba
    }
    // respuesta de error de GitHub
    let err = 'Error de red';
    try {
      const json = await res.json();
      err = json?.message || err;
    } catch (_) {}
    throw new Error(err);
  }
  return res.json();
}

/**
 * Obtiene topics para un repo (se usa al abrir el modal).
 * @param {string} owner
 * @param {string} repo
 * @returns {Promise<string[]>}
 */
export async function getRepoTopics(owner, repo) {
  const url = `${BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/topics`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json.names) ? json.names.slice(0, 10) : [];
}
