export function renderScoreWheel(label, value) {
  if (value === null || value === undefined) return '';
  
  // r=90 so circumference = 2π*90 ≈ 565.49
  const circumference = 565.49;
  const offset = circumference * (1 - value / 100);
  
  return `
    <div class="score-wheel">
      <div class="score-wheel-label">${label}</div>
      <div class="wheel-container">
        <svg class="wheel-svg" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
              <stop offset="50%" style="stop-color:#ec4899;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
            </linearGradient>
          </defs>
          <circle class="wheel-circle-bg" cx="90" cy="90" r="90" />
          <circle class="wheel-circle-fill" cx="90" cy="90" r="90" data-offset="${offset}" />
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
      const circumference = 565.49;
      el.style.strokeDasharray = `${circumference - offset} ${circumference}`;
    });
  });
}
