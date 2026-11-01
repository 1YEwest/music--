import { renderHeader } from '../components/Header.js';
import { renderHomePage } from '../pages/HomePage.js';
import { renderLoginPage } from '../pages/LoginPage.js';
import { renderProfilePage } from '../pages/ProfilePage.js';
import { renderRegisterPage } from '../pages/RegisterPage.js';
import { storage } from '../utils/storage.js';

type RoutePath = '#/home' | '#/login' | '#/register' | '#/profile';

/**
 * Инициализация Hash-роутера с защитой приватных маршрутов
 */
export function initRouter(): void {
  const handleRoute = () => {
    const root = document.getElementById('app-root');
    if (!root) return;

    let hash = (window.location.hash || '#/home') as RoutePath;
    const isAuth = storage.isAuthenticated();

    // Проверка авторизации перед показом защищённого роута #/profile
    if (hash === '#/profile' && !isAuth) {
      window.location.hash = '#/login';
      return;
    }

    // Если пользователь уже авторизован и открывает login/register — перенаправляем в профиль
    if ((hash === '#/login' || hash === '#/register') && isAuth) {
      window.location.hash = '#/profile';
      return;
    }

    // Обновляем навигационную шапку
    renderHeader();

    // Очищаем контейнер перед рендером новой страницы
    root.innerHTML = '';

    switch (hash) {
      case '#/login':
        renderLoginPage(root);
        break;
      case '#/register':
        void renderRegisterPage(root);
        break;
      case '#/profile':
        void renderProfilePage(root);
        break;
      case '#/home':
      default:
        renderHomePage(root);
        break;
    }
  };

  window.addEventListener('hashchange', handleRoute);
  window.addEventListener('DOMContentLoaded', handleRoute);
  handleRoute();
}
