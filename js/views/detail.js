import CONFIG from '../config.js';
import { getMovieDetails } from '../services/tmdb.js';
import { getMovieRatings } from '../services/omdb.js';
import { getInsight } from '../services/groq.js';
import { computeScores, badgeClass } from '../services/scoring.js';
import { SkeletonDetail } from '../components/skeleton.js';
import { showToast } from '../components/toast.js';
import { AppState, isInWatchlist, toggleWatchlist } from '../state.js';
import { handleCompareClick } from '../main.js';

export async function renderDetail(id) {
  const app = document.getElementById('app');
  app.innerHTML = SkeletonDetail();

  try {
    const [movie, omdb] = await Promise.all([
      getMovieDetails(id),
      getMovieDetails(id).then(m => m.external_ids?.imdb_id
        ? getMovieRatings(m.external_ids.imdb_id) : null)
    ]);

    const scores = omdb ? computeScores(omdb) : { audienceScore: null, criticScore: null, controversyScore: null, label: 'Balanced', lowConfidence: false };
    const { audienceScore, criticScore, controversyScore, label, lowConfidence } = scores;
    const badgeCls = badgeClass(label);
    const inWl = isInWatchlist(Number(id));

    const poster = movie.poster_path ? `${CONFIG.TMDB_IMAGE_BASE}${movie.poster_path}` : '';
    const backdrop = movie.backdrop_path ? `${CONFIG.TMDB_BACKDROP_BASE}${movie.backdrop_path}` : poster;
    const year = (movie.release_date || '').slice(0, 4);
    const runtime = movie.runtime ? `${movie.runtime}m` : '';
    const genres = (movie.genres || []).map(g => `<span class="pill">${g.name}</span>`).join('');
    const imdbId = movie.external_ids?.imdb_id;

    const rtRating = omdb?.Ratings?.find(r => r.Source === 'Rotten Tomatoes');

    const cast = (movie.credits?.cast || []).slice(0, 12).map(c => {
      const photo = c.profile_path
        ? `<img class="cast-photo" src="${CONFIG.TMDB_IMAGE_BASE}${c.profile_path}" alt="${c.name}" loading="lazy">`
        : `<div class="cast-photo-placeholder">🎭</div>`;
      return `<div class="cast-card">${photo}<div class="cast-name">${c.name}</div><div class="cast-char">${c.character || ''}</div></div>`;
    }).join('');

    app.innerHTML = `
      <div class="detail-backdrop">
        <img class="backdrop-img" src="${backdrop}" alt="" />
        <div class="detail-backdrop-overlay"></div>
      </div>

      <div class="detail-header">
        <div class="detail-poster">
          ${poster ? `<img src="${poster}" alt="${movie.title}" />` : '<div style="height:300px;background:var(--bg-card);"></div>'}
        </div>
        <div class="detail-meta">
          <h1 class="syne">${movie.title}</h1>
          <div class="pills">
            ${year ? `<span class="pill">${year}</span>` : ''}
            ${runtime ? `<span class="pill">${runtime}</span>` : ''}
            ${genres}
          </div>
          <div class="ratings-row">
            ${omdb?.imdbRating && omdb.imdbRating !== 'N/A' ? `<div class="rating-item"><span class="rating-icon">⭐</span><span class="rating-value">${omdb.imdbRating}</span><span style="color:var(--text-muted);font-size:0.75rem;"> IMDb</span></div>` : ''}
            ${rtRating ? `<div class="rating-item"><span class="rating-icon">🍅</span><span class="rating-value">${rtRating.Value}</span></div>` : ''}
            ${omdb?.Metascore && omdb.Metascore !== 'N/A' ? `<div class="rating-item"><span class="rating-icon">📊</span><span class="rating-value">${omdb.Metascore}</span><span style="color:var(--text-muted);font-size:0.75rem;"> Meta</span></div>` : ''}
          </div>
          <div class="detail-actions">
            <button class="btn btn-grad btn-lg" id="detail-compare" data-id="${id}">+ Compare</button>
            <button class="btn btn-ghost btn-lg ${inWl ? 'active' : ''}" id="detail-watchlist" data-id="${id}">
              ${inWl ? '♥ In Watchlist' : '♡ Watchlist'}
            </button>
          </div>
        </div>
      </div>

      <div class="detail-body">
        <div class="section">
          <div class="section-title">Score Analysis</div>
          <div class="score-bars-block">
            ${scoreBar('Audience', audienceScore)}
            ${scoreBar('Critics', criticScore)}
            ${scoreBar('Controversy', controversyScore)}
          </div>
          <span class="badge badge-large ${badgeCls} ${lowConfidence ? 'badge-low-confidence' : ''}">
            ${lowConfidence ? '⚠ ' : ''}${label}
          </span>
        </div>

        <div class="section">
          <div class="section-title">✦ CineScope AI</div>
          <div class="ai-card">
            <div class="ai-label">✦ CineMeter AI</div>
            <div id="ai-content">
              <button class="btn-insight" id="btn-insight">Generate Insight</button>
            </div>
          </div>
        </div>

        ${cast ? `<div class="section"><div class="section-title">Cast</div><div class="cast-scroll">${cast}</div></div>` : ''}
      </div>`;

    // animate score bars
    requestAnimationFrame(() => {
      if (audienceScore) document.querySelector('[data-bar="Audience"]')?.style && (document.querySelector('[data-bar="Audience"]').style.width = audienceScore + '%');
      document.querySelectorAll('.score-fill-large[data-width]').forEach(el => {
        el.style.width = el.dataset.width + '%';
      });
    });

    // compare button
    document.getElementById('detail-compare')?.addEventListener('click', () => handleCompareClick(String(id)));

    // watchlist button
    document.getElementById('detail-watchlist')?.addEventListener('click', btn => {
      const added = toggleWatchlist({ id: Number(id), title: movie.title, poster_path: movie.poster_path });
      const el = document.getElementById('detail-watchlist');
      el.classList.toggle('active', added);
      el.textContent = added ? '♥ In Watchlist' : '♡ Watchlist';
      showToast(added ? 'Added to watchlist' : 'Removed from watchlist', 'success');
    });

    // AI insight
    document.getElementById('btn-insight')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-insight');
      btn.disabled = true;
      btn.classList.add('loading');
      btn.textContent = 'Generating…';

      const cached = AppState.insightCache[id];
      if (cached) {
        showInsight(cached);
        return;
      }

      try {
        const text = await getInsight(id, movie.title, audienceScore, criticScore, controversyScore, label);
        AppState.insightCache[id] = text;
        showInsight(text);
      } catch (err) {
        showToast('AI insight failed. Check your Groq key.', 'error');
        btn.disabled = false;
        btn.classList.remove('loading');
        btn.textContent = 'Generate Insight';
      }
    });

  } catch (err) {
    app.innerHTML = `<div class="page"><div class="no-results"><h3>Failed to load movie</h3><p>${err.message}</p></div></div>`;
    showToast('Failed to load movie details', 'error');
  }
}

function scoreBar(label, value) {
  if (value === null || value === undefined) return '';
  return `
    <div class="score-row-large">
      <div class="score-label-row-large"><span>${label}</span><strong>${value}</strong></div>
      <div class="score-track-large"><div class="score-fill-large" data-width="${value}"></div></div>
    </div>`;
}

function showInsight(text) {
  const content = document.getElementById('ai-content');
  if (content) content.innerHTML = `<p class="ai-insight-text">${text}</p>`;
}
