export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  const remove = () => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 280);
  };

  setTimeout(remove, 3000);
  toast.addEventListener('click', remove);
}
