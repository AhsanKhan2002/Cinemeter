import { AppState } from '../state.js';

export function renderBanner() {
  const container = document.getElementById('banner-container');
  if (!container) return;

  if (AppState.comparison.status !== 'one_selected') {
    const existing = container.querySelector('.comparison-banner');
    if (existing) {
      existing.classList.add('banner-removing');
      setTimeout(() => { container.innerHTML = ''; }, 320);
    }
    return;
  }

  const title = AppState.comparison.movieA?.title || 'Movie';
  container.innerHTML = `
    <div class="comparison-banner">
      <div class="banner-text">
        <strong>${title}</strong>
        <span> selected — pick a second film to compare</span>
      </div>
      <button class="banner-dismiss" id="banner-dismiss">✕</button>
    </div>`;

  document.getElementById('banner-dismiss')?.addEventListener('click', () => {
    AppState.comparison = { movieA: null, movieB: null, status: 'empty' };
    renderBanner();
    updateCompareDot();
  });
}

export function updateCompareDot() {
  const dot = document.getElementById('compare-dot');
  if (!dot) return;
  if (AppState.comparison.status === 'one_selected') {
    dot.classList.add('visible');
  } else {
    dot.classList.remove('visible');
  }
}
