export function renderScoreWheel(label, value) {
  if (value === null || value === undefined) return '';
  
  // r=100 so circumference = 2π*100 ≈ 628.32
  const circumference = 628.32;
  const offset = circumference * (1 - value / 100);
  
  return `
    <div class="score-wheel">
      <div class="score-wheel-label">${label}</div>
      <div class="wheel-container">
        <svg class="wheel-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#00d9ff;stop-opacity:1" />
              <stop offset="33%" style="stop-color:#8338ec;stop-opacity:1" />
              <stop offset="66%" style="stop-color:#ff006e;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#ffbe0b;stop-opacity:1" />
            </linearGradient>
          </defs>
          <circle class="wheel-circle-bg" cx="100" cy="100" r="100" />
          <circle class="wheel-circle-fill" cx="100" cy="100" r="100" data-offset="${offset}" />
        </svg>
        <div class="wheel-value">
          <div class="wheel-value-num">${value}</div>
          <div class="wheel-value-unit">/ 100</div>
        </div>
      </div>
    </div>`;
}

export function animateWheels() {
  requestAnimationFrame(() => {
    document.querySelectorAll('.wheel-circle-fill[data-offset]').forEach(el => {
      const offset = parseFloat(el.dataset.offset);
      const circumference = 628.32;
      el.style.strokeDasharray = `${circumference - offset} ${circumference}`;
    });
  });
}
