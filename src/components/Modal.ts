/**
 * Показывает всплывающее уведомление или модальное сообщение
 */
export function showNotification(message: string, type: 'success' | 'error' = 'success'): void {
  const root = document.getElementById('modal-root');
  if (!root) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  root.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-hide');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
