import { initRouter } from './router.js';
import { AppState, toggleWatchlist } from './state.js';
import { renderBanner, updateCompareDot } from './components/banner.js';
import { showToast } from './components/toast.js';

// Hamburger menu
document.getElementById('hamburger')?.addEventListener('click', () => {
  document.getElementById('nav-links')?.classList.toggle('open');
});

// Close mobile menu on nav click
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => document.getElementById('nav-links')?.classList.remove('open'));
});

// Global compare handler — exported so views can import
export function handleCompareClick(id) {
  const numId = Number(id);
  const { status, movieA } = AppState.comparison;

  if (status === 'empty' || status === 'one_selected' && movieA?.id !== numId) {
    // find movie data from search results or current movie state
    const movie = findMovieById(numId);

    if (status === 'empty') {
      AppState.comparison.movieA = movie || { id: numId };
      AppState.comparison.status = 'one_selected';
      renderBanner();
      updateCompareDot();
      showToast(`${movie?.title || 'Movie'} selected — pick a second film`, 'info');
    } else if (status === 'one_selected') {
      if (movieA?.id === numId) {
        showToast("You've already selected this film", 'error');
        return;
      }
      AppState.comparison.movieB = movie || { id: numId };
      AppState.comparison.status = 'ready';
      renderBanner();
      updateCompareDot();
      window.location.hash = '#/compare';
    }
  } else if (status === 'one_selected' && movieA?.id === numId) {
    showToast("You've already selected this film", 'error');
  } else {
    // ready — reset and start over
    AppState.comparison = { movieA: null, movieB: null, status: 'empty' };
    handleCompareClick(id);
  }
}

export function handleWatchlistClick(btn) {
  const id = Number(btn.dataset.id);
  const movie = findMovieById(id) || { id };
  const added = toggleWatchlist(movie);
  btn.classList.toggle('active', added);
  btn.textContent = added ? '♥' : '♡';
  showToast(added ? 'Added to watchlist' : 'Removed from watchlist', 'success');
}

function findMovieById(id) {
  // Check search results
  const fromSearch = AppState.searchResults.find(m => m.id === id);
  if (fromSearch) return fromSearch;
  // Check current movie
  if (AppState.currentMovie?.id === id) return AppState.currentMovie;
  return null;
}

// Boot
initRouter();
