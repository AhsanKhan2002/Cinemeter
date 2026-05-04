import CONFIG from '../config.js';
import { getMovieDetails } from '../services/tmdb.js';
import { getMovieRatings } from '../services/omdb.js';
import { getInsight } from '../services/groq.js';
import { computeScores, badgeClass } from '../services/scoring.js';
import { AppState } from '../state.js';
import { showToast } from '../components/toast.js';
import * as Cache from '../cache.js';

export async function renderCompare() {
  const app = document.getElementById('app');
  const { movieA, movieB, status } = AppState.comparison;

  if (status !== 'ready' || !movieA || !movieB) {
    renderEmpty(app);
    return;
  }

  app.innerHTML = `<div class="page"><div style="text-align:center;padding:40px;color:var(--text-muted);">Loading comparison…</div></div>`;

  try {
    const idA = movieA.id, idB = movieB.id;
    const cacheKey = `compare:${[idA, idB].sort().join('-')}`;
    let data = Cache.get(cacheKey);

    if (!data) {
      const [detailA, detailB] = await Promise.all([getMovieDetails(idA), getMovieDetails(idB)]);
      const [omdbA, omdbB] = await Promise.all([
        detailA.external_ids?.imdb_id ? getMovieRatings(detailA.external_ids.imdb_id) : null,
        detailB.external_ids?.imdb_id ? getMovieRatings(detailB.external_ids.imdb_id) : null,
      ]);
      data = { detailA, detailB, omdbA, omdbB };
      Cache.set(cacheKey, data);
    }

    const { detailA, detailB, omdbA, omdbB } = data;
    const scoresA = omdbA ? computeScores(omdbA) : {};
    const scoresB = omdbB ? computeScores(omdbB) : {};

    app.innerHTML = `
      <div class="page">
        <div class="page-header">
          <h1 class="syne">Head to <span class="grad-text">Head</span></h1>
        </div>
        <div class="compare-grid">
          ${compareCol('A', detailA, scoresA)}
          <div class="compare-divider"></div>
          ${compareCol('B', detailB, scoresB)}
        </div>
        ${scoreCompareRows(scoresA, scoresB)}
        <div class="compare-actions">
          <button class="btn btn-ghost btn-lg" id="btn-swap">⇄ Swap</button>
          <button class="btn btn-grad btn-lg" id="btn-clear">✕ Clear</button>
        </div>
      </div>`;

    animateBars();

    // AI buttons
    ['A', 'B'].forEach(side => {
      const btn = document.getElementById(`btn-ai-${side}`);
      const detail = side === 'A' ? detailA : detailB;
      const scores = side === 'A' ? scoresA : scoresB;
      btn?.addEventListener('click', async () => {
        btn.disabled = true; btn.classList.add('loading'); btn.textContent = 'Generating…';
        try {
          const text = await getInsight(detail.id, detail.title, scores.audienceScore, scores.criticScore, scores.controversyScore, scores.label);
          document.getElementById(`ai-text-${side}`).innerHTML = `<p class="ai-insight-text">${text}</p>`;
          btn.style.display = 'none';
        } catch { showToast('AI insight failed', 'error'); btn.disabled = false; btn.classList.remove('loading'); btn.textContent = '✦ Get AI Insight'; }
      });
    });

    document.getElementById('btn-swap')?.addEventListener('click', () => {
      const tmp = AppState.comparison.movieA;
      AppState.comparison.movieA = AppState.comparison.movieB;
      AppState.comparison.movieB = tmp;
      renderCompare();
    });

    document.getElementById('btn-clear')?.addEventListener('click', () => {
      AppState.comparison = { movieA: null, movieB: null, status: 'empty' };
      window.location.hash = '#/home';
    });

  } catch (err) {
    showToast('Failed to load comparison', 'error');
    app.innerHTML = `<div class="page"><div class="no-results"><h3>Failed to load</h3><p>${err.message}</p></div></div>`;
  }
}

function compareCol(side, detail, scores) {
  const poster = detail.poster_path ? `${CONFIG.TMDB_IMAGE_BASE}${detail.poster_path}` : '';
  const year = (detail.release_date || '').slice(0, 4);
  const genres = (detail.genres || []).slice(0, 3).map(g => `<span class="pill">${g.name}</span>`).join('');
  const { label, lowConfidence } = scores;
  const badgeCls = label ? badgeClass(label) : 'badge-balanced';

  return `
    <div class="compare-col">
      ${poster ? `<img class="compare-poster" src="${poster}" alt="${detail.title}">` : ''}
      <div class="compare-title">${detail.title}</div>
      <div class="pills compare-pills">${year ? `<span class="pill">${year}</span>` : ''}${genres}</div>
      ${label ? `<div style="text-align:center;margin-top:8px;"><span class="badge ${badgeCls} ${lowConfidence ? 'badge-low-confidence' : ''}">${lowConfidence ? '⚠ ' : ''}${label}</span></div>` : ''}
      <div class="ai-card" style="margin-top:16px;">
        <div class="ai-label">✦ CineMeter AI</div>
        <div id="ai-text-${side}">
          <button class="btn-insight" id="btn-ai-${side}">✦ Get AI Insight</button>
        </div>
      </div>
    </div>`;
}

function scoreCompareRows(sA, sB) {
  const rows = [
    { label: 'Audience', a: sA.audienceScore, b: sB.audienceScore, lowerWins: false },
    { label: 'Critics', a: sA.criticScore, b: sB.criticScore, lowerWins: false },
    { label: 'Controversy', a: sA.controversyScore, b: sB.controversyScore, lowerWins: true },
  ];

  return `<div style="max-width:700px;margin:24px auto 0;">${rows.map(r => {
    if (r.a === null || r.a === undefined || r.b === null || r.b === undefined) return '';
    const aWins = r.lowerWins ? r.a < r.b : r.a > r.b;
    const bWins = r.lowerWins ? r.b < r.a : r.b > r.a;
    return `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        <span class="score-val ${!aWins ? 'dim' : ''}">${r.a}</span>
        <div style="flex:1;">
          <div style="font-size:0.72rem;color:var(--text-muted);text-align:center;margin-bottom:4px;">${r.label}${r.lowerWins ? ' (lower = better)' : ''}</div>
          <div style="display:flex;gap:4px;">
            <div class="score-track" style="flex:1;"><div class="score-fill" data-width="${r.a}" style="${aWins ? '' : 'opacity:0.4'}"></div></div>
            <div class="score-track" style="flex:1;"><div class="score-fill" data-width="${r.b}" style="${bWins ? '' : 'opacity:0.4'}"></div></div>
          </div>
        </div>
        <span class="score-val ${!bWins ? 'dim' : ''}">${r.b}</span>
      </div>`;
  }).join('')}</div>`;
}

function animateBars() {
  requestAnimationFrame(() => {
    document.querySelectorAll('.score-fill[data-width]').forEach(el => {
      el.style.width = el.dataset.width + '%';
    });
  });
}

function renderEmpty(app) {
  app.innerHTML = `
    <div class="page">
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="20" width="28" height="40" rx="4" stroke="currentColor" stroke-width="2"/>
          <rect x="44" y="20" width="28" height="40" rx="4" stroke="currentColor" stroke-width="2"/>
          <path d="M36 40h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M33 36l-4 4 4 4M47 36l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h2>Pick two movies to go head to head</h2>
        <p>Use the "+ Compare" button on any movie card or detail page.</p>
        <a href="#/home" class="btn btn-grad btn-lg" style="text-decoration:none;display:inline-block;">Browse Movies</a>
      </div>
    </div>`;
}
