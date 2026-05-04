import CONFIG from '../config.js';
import { badgeClass } from '../services/scoring.js';
import { isInWatchlist } from '../state.js';

export function MovieCard(movie, scores = {}) {
  const poster = movie.poster_path
    ? `${CONFIG.TMDB_IMAGE_BASE}${movie.poster_path}`
    : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect fill="%2312121a" width="200" height="300"/><text x="100" y="155" text-anchor="middle" fill="%236b6b80" font-size="14" font-family="sans-serif">No Poster</text></svg>';

  const year = (movie.release_date || '').slice(0, 4);
  const { audienceScore, criticScore, label, lowConfidence } = scores;
  const badgeCls = badgeClass(label || 'Balanced');
  const inWl = isInWatchlist(movie.id);

  const badgeHtml = label ? `
    <div style="margin-bottom:8px;">
      <span class="badge ${badgeCls} ${lowConfidence ? 'badge-low-confidence' : ''}">
        ${lowConfidence ? '⚠ ' : ''}${label}
      </span>
    </div>` : '';

  const scoresHtml = (audienceScore !== null && audienceScore !== undefined) ? `
    <div class="score-row">
      <div class="score-label-row"><span>Audience</span><strong>${audienceScore}</strong></div>
      <div class="score-track"><div class="score-fill" data-width="${audienceScore}"></div></div>
    </div>
    ${criticScore !== null && criticScore !== undefined ? `
    <div class="score-row">
      <div class="score-label-row"><span>Critics</span><strong>${criticScore}</strong></div>
      <div class="score-track"><div class="score-fill" data-width="${criticScore}"></div></div>
    </div>` : ''}` : '<p style="font-size:0.72rem;color:var(--text-muted);margin-bottom:8px;">View details for scores</p>';

  return `
    <div class="movie-card" data-id="${movie.id}" data-title="${encodeURIComponent(movie.title || '')}" role="article">
      <img src="${poster}" alt="${movie.title}" loading="lazy" />
      <div class="card-title-bar">
        <h3>${movie.title}</h3>
        <span>${year}</span>
      </div>
      <div class="card-hover-panel">
        ${badgeHtml}
        ${scoresHtml}
        <div class="card-actions">
          <button class="btn btn-grad btn-compare" data-id="${movie.id}">+ Compare</button>
          <button class="btn btn-ghost btn-watchlist ${inWl ? 'active' : ''}" data-id="${movie.id}">
            ${inWl ? '♥' : '♡'}
          </button>
        </div>
      </div>
    </div>`;
}

export function animateScoreBars(container) {
  const fills = container.querySelectorAll('.score-fill[data-width]');
  // slight delay so CSS transition fires
  requestAnimationFrame(() => {
    fills.forEach(el => {
      el.style.width = el.dataset.width + '%';
    });
  });
}
