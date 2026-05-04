import CONFIG from '../config.js';
import { getTopRated } from '../services/tmdb.js';
import { computeScoresFromTmdb, badgeClass } from '../services/scoring.js';
import { showToast } from '../components/toast.js';

const TAB_LABELS = ['Overrated', 'Underrated', 'Balanced'];
let _movies = [];
let _activeTab = 0;

export async function renderInsights() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h1 class="syne grad-text">The Verdict</h1>
        <p>Movies the world can't agree on.</p>
      </div>
      <div class="tabs" id="tabs">
        ${TAB_LABELS.map((t, i) => `<button class="tab-btn ${i === _activeTab ? 'active' : ''}" data-tab="${i}">${t}</button>`).join('')}
        <div class="tab-underline" id="tab-underline"></div>
      </div>
      <div id="insights-list">
        <div style="text-align:center;padding:40px;color:var(--text-muted);">Loading…</div>
      </div>
    </div>`;

  positionUnderline(_activeTab);

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _activeTab = Number(btn.dataset.tab);
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      positionUnderline(_activeTab);
      renderList();
    });
  });

  try {
    if (!_movies.length) {
      const [p1, p2] = await Promise.all([getTopRated(1), getTopRated(2)]);
      _movies = [...p1, ...p2];
    }
    renderList();
  } catch (err) {
    showToast('Failed to load top rated movies', 'error');
    document.getElementById('insights-list').innerHTML = `<div class="no-results"><h3>Failed to load</h3></div>`;
  }
}

function renderList() {
  const label = TAB_LABELS[_activeTab];
  const scored = _movies
    .map(m => ({ ...m, scores: computeScoresFromTmdb(m) }))
    .filter(m => m.scores.audienceScore !== null);

  let filtered;
  if (label === 'Balanced') {
    filtered = scored.filter(m => m.scores.label === 'Balanced');
  } else {
    // without OMDb we can't distinguish over/underrated — show all for demo
    filtered = scored;
  }

  const rows = filtered.slice(0, 20).map((m, i) => {
    const { audienceScore, label: lbl, lowConfidence } = m.scores;
    const poster = m.poster_path
      ? `<img class="insight-poster" src="${CONFIG.TMDB_IMAGE_BASE}${m.poster_path}" alt="${m.title}">`
      : `<div class="insight-poster" style="background:var(--bg-card);border-radius:6px;"></div>`;
    const year = (m.release_date || '').slice(0, 4);
    const badgeCls = badgeClass(lbl);

    return `
      <div class="insight-row" data-id="${m.id}">
        <div class="insight-rank">${i + 1}</div>
        ${poster}
        <div class="insight-info">
          <div class="insight-title">${m.title}</div>
          <div class="insight-year">${year}</div>
        </div>
        <div class="insight-bar-wrap">
          <div class="insight-bar-label">Audience</div>
          <div class="score-track" style="height:4px;">
            <div class="score-fill" data-width="${audienceScore ?? 0}"></div>
          </div>
        </div>
        <span class="badge ${badgeCls} ${lowConfidence ? 'badge-low-confidence' : ''}" style="flex-shrink:0;">
          ${lowConfidence ? '⚠ ' : ''}${lbl}
        </span>
      </div>`;
  }).join('');

  const el = document.getElementById('insights-list');
  el.innerHTML = `<div class="insights-list">${rows || '<div class="no-results"><h3>No movies found</h3></div>'}</div>`;

  requestAnimationFrame(() => {
    el.querySelectorAll('.score-fill[data-width]').forEach(f => { f.style.width = f.dataset.width + '%'; });
  });

  el.querySelectorAll('.insight-row').forEach(row => {
    row.addEventListener('click', () => { window.location.hash = `#/movie/${row.dataset.id}`; });
  });
}

function positionUnderline(tabIdx) {
  const btns = document.querySelectorAll('.tab-btn');
  const underline = document.getElementById('tab-underline');
  if (!underline || !btns[tabIdx]) return;
  const btn = btns[tabIdx];
  underline.style.left = btn.offsetLeft + 'px';
  underline.style.width = btn.offsetWidth + 'px';
}
