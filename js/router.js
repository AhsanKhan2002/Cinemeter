import { renderHome } from './views/home.js';
import { renderDetail } from './views/detail.js';
import { renderInsights } from './views/insights.js';
import { renderCompare } from './views/compare.js';

const routes = {
  '/home': renderHome,
  '/insights': renderInsights,
  '/compare': renderCompare,
};

function getRoute() {
  const hash = window.location.hash || '#/home';
  const path = hash.slice(1); // remove '#'
  return path;
}

async function navigate() {
  const app = document.getElementById('app');
  app.classList.add('fading');

  await new Promise(r => setTimeout(r, 180));

  const path = getRoute();

  // update nav active state
  document.querySelectorAll('.nav-links a[data-route]').forEach(a => {
    const route = '/' + a.dataset.route;
    a.classList.toggle('active', path === route || path.startsWith(route + '/'));
  });

  // movie detail route
  const detailMatch = path.match(/^\/movie\/(\d+)$/);
  if (detailMatch) {
    await renderDetail(detailMatch[1]);
    app.classList.remove('fading');
    return;
  }

  const handler = routes[path] || renderHome;
  await handler();
  app.classList.remove('fading');
}

export function initRouter() {
  window.addEventListener('hashchange', navigate);
  navigate();
}

export function go(path) {
  window.location.hash = '#' + path;
}
