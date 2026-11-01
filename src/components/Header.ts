import { storage } from '../utils/storage.js';
import { api } from '../api/client.js';
import { showNotification } from './Modal.js';

/**
 * Отрисовывает навигационную панель в зависимости от статуса авторизации
 */
export function renderHeader(): void {
  const headerEl = document.getElementById('app-header');
  if (!headerEl) return;

  const isAuth = storage.isAuthenticated();
  const currentHash = window.location.hash || '#/home';

  headerEl.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'nav-container';

  const brand = document.createElement('a');
  brand.href = '#/home';
  brand.className = 'brand-logo';
  brand.innerHTML = 'CRIMSON <span>ECHO</span>';

  const nav = document.createElement('nav');
  nav.className = 'nav-links';

  // Ссылка "Главная" доступна всегда
  nav.appendChild(createNavLink('Главная', '#/home', currentHash === '#/home'));

  if (isAuth) {
    // Если авторизован: показываем "Профиль" и "Выход"
    nav.appendChild(createNavLink('Профиль', '#/profile', currentHash === '#/profile'));

    const logoutBtn = document.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.className = 'nav-logout-btn';
    logoutBtn.textContent = 'Выход';
    logoutBtn.addEventListener('click', async () => {
      try {
        await api.logout();
      } catch {
        // Даже если сервер вернул ошибку сессии, очищаем локально
      } finally {
        storage.clearUser();
        showNotification('Вы вышли из системы', 'success');
        window.location.hash = '#/login';
      }
    });
    nav.appendChild(logoutBtn);
  } else {
    // Если НЕ авторизован: показываем "Вход" и "Регистрация"
    nav.appendChild(createNavLink('Вход', '#/login', currentHash === '#/login'));
    nav.appendChild(createNavLink('Регистрация', '#/register', currentHash === '#/register'));
  }

  container.append(brand, nav);
  headerEl.appendChild(container);
}

function createNavLink(label: string, href: string, isActive: boolean): HTMLAnchorElement {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = label;
  a.className = `nav-item ${isActive ? 'active' : ''}`;
  return a;
}
