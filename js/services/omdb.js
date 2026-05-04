import CONFIG from '../config.js';
import * as Cache from '../cache.js';

export async function getMovieRatings(imdbId) {
  if (!imdbId) return null;
  const key = `omdb:${imdbId}`;
  const cached = Cache.get(key);
  if (cached) return cached;
  const url = `${CONFIG.OMDB_BASE}/?i=${imdbId}&apikey=${CONFIG.OMDB_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OMDb error ${res.status}`);
  const data = await res.json();
  if (data.Response === 'False') return null;
  Cache.set(key, data);
  return data;
}
