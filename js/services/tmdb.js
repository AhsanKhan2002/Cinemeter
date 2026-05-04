import CONFIG from '../config.js';
import * as Cache from '../cache.js';

async function apiFetch(path, params = {}) {
  const url = new URL(CONFIG.TMDB_BASE + path);
  url.searchParams.set('api_key', CONFIG.TMDB_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDb error ${res.status}: ${path}`);
  return res.json();
}

export async function searchMovies(query) {
  const key = `tmdb:search:${query}`;
  const cached = Cache.get(key);
  if (cached) return cached;
  const data = await apiFetch('/search/movie', { query, include_adult: false });
  Cache.set(key, data.results || []);
  return data.results || [];
}

export async function getMovieDetails(id) {
  const key = `tmdb:detail:${id}`;
  const cached = Cache.get(key);
  if (cached) return cached;
  const data = await apiFetch(`/movie/${id}`, { append_to_response: 'credits,external_ids' });
  Cache.set(key, data);
  return data;
}

export async function getTopRated(page = 1) {
  const key = `tmdb:toprated:${page}`;
  const cached = Cache.get(key);
  if (cached) return cached;
  const data = await apiFetch('/movie/top_rated', { page });
  Cache.set(key, data.results || []);
  return data.results || [];
}
