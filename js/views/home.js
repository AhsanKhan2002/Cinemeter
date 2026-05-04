import { searchMovies } from '../services/tmdb.js';
import { MovieCard, animateScoreBars } from '../components/card.js';
import { SkeletonCards } from '../components/skeleton.js';
import { showToast } from '../components/toast.js';
import { AppState } from '../state.js';
import { handleCompareClick, handleWatchlistClick } from '../main.js';

export async function renderHome() {
  const app = document.getElementById('app');
  const hasResults = AppState.searchResults.length > 0;

  app.innerHTML = `
    <div class="page">
      <div class="hero">
        <h1>What does the crowd<br><span class="grad-text">really think?</span></h1>
        <p>Discover the gap between critics and audiences.</p>
      </div>

      <div class="search-wrap">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input id="search-input" type="search" placeholder="Search any movie..." autocomplete="off"
          value="${AppState.lastQuery || ''}" />
      </div>

      <div id="results-grid">
        ${hasResults ? renderGrid(AppState.searchResults) : ''}
      </div>
    </div>`;

  // events
  const input = document.getElementById('search-input');
  let debounceTimer;

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      clearTimeout(debounceTimer);
      doSearch(input.value.trim());
    }
  });

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (q.length >= 3) {
      debounceTimer = setTimeout(() => doSearch(q), 450);
    }
  });

  if (hasResults) {
    bindCardEvents();
    animateScoreBars(document.getElementById('results-grid'));
  }
}

function renderGrid(movies) {
  if (!movies.length) return `<div class="no-results"><h3>No results found</h3><p>Try a different title.</p></div>`;
  return `<div class="grid">${movies.map(m => MovieCard(m, {})).join('')}</div>`;
}

async function doSearch(query) {
  if (!query) return;
  AppState.lastQuery = query;
  const grid = document.getElementById('results-grid');
  grid.innerHTML = `<div class="grid">${SkeletonCards(6)}</div>`;

  try {
    const results = await searchMovies(query);
    AppState.searchResults = results;
    grid.innerHTML = renderGrid(results);
    bindCardEvents();
    animateScoreBars(grid);
  } catch (err) {
    showToast('Search failed. Check your API key.', 'error');
    grid.innerHTML = '';
  }
}

function bindCardEvents() {
  document.querySelectorAll('.movie-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.btn-compare') || e.target.closest('.btn-watchlist')) return;
      const id = card.dataset.id;
      window.location.hash = `#/movie/${id}`;
    });
  });

  document.querySelectorAll('.btn-compare').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      handleCompareClick(btn.dataset.id);
    });
  });

  document.querySelectorAll('.btn-watchlist').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      handleWatchlistClick(btn);
    });
  });
}
