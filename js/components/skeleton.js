export function SkeletonCard() {
  return `<div class="skeleton skeleton-card"></div>`;
}

export function SkeletonCards(count = 6) {
  return Array.from({ length: count }, SkeletonCard).join('');
}

export function SkeletonDetail() {
  return `
    <div class="skeleton" style="height:320px;border-radius:0;margin-bottom:0;"></div>
    <div class="page" style="padding-top:16px;">
      <div style="display:flex;gap:28px;">
        <div class="skeleton" style="width:180px;height:270px;flex-shrink:0;border-radius:12px;"></div>
        <div style="flex:1;padding-top:60px;">
          <div class="skeleton skeleton-line" style="width:60%;height:28px;margin-bottom:16px;"></div>
          <div class="skeleton skeleton-line" style="width:40%;"></div>
          <div class="skeleton skeleton-line" style="width:50%;"></div>
        </div>
      </div>
    </div>`;
}
