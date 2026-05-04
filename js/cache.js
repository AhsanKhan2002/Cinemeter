const _cache = new Map();

export function set(key, value, ttlMs = 10 * 60 * 1000) {
  _cache.set(key, { value, expires: Date.now() + ttlMs });
}

export function get(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { _cache.delete(key); return null; }
  return entry.value;
}

export function clear() { _cache.clear(); }
