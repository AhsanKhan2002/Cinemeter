export const AppState = {
  currentView: 'home',
  currentMovie: null,
  searchResults: [],
  insightCache: {},
  watchlist: JSON.parse(localStorage.getItem('cm_watchlist') || '[]'),
  comparison: {
    movieA: null,
    movieB: null,
    status: 'empty' // 'empty' | 'one_selected' | 'ready'
  }
};

export function saveWatchlist() {
  localStorage.setItem('cm_watchlist', JSON.stringify(AppState.watchlist));
}

export function isInWatchlist(id) {
  return AppState.watchlist.some(m => m.id === id);
}

export function toggleWatchlist(movie) {
  const idx = AppState.watchlist.findIndex(m => m.id === movie.id);
  if (idx >= 0) {
    AppState.watchlist.splice(idx, 1);
  } else {
    AppState.watchlist.push(movie);
  }
  saveWatchlist();
  return idx < 0; // true = added
}
