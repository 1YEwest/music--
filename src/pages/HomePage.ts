import { storage } from '../utils/storage.js';

/**
 * Главная страница рок-группы (#/home)
 */
export function renderHomePage(container: HTMLElement): void {
  const user = storage.getUser();

  const section = document.createElement('section');
  section.className = 'page-card home-hero fade-in';

  section.innerHTML = `
    <p class="hero-subtitle">OFFICIAL BAND PORTAL</p>
    <h1 class="hero-title">CRIMSON <span>ECHO</span></h1>
    <p class="hero-description">
      Закрытая платформа для музыкантов и участников коллектива. 
      Управляйте своим профилем, специализацией и расписанием репетиций.
    </p>
    <div class="hero-actions">
      ${
        user
          ? `<a href="#/profile" class="btn btn-primary">Перейти в профиль (${user.name})</a>`
          : `<a href="#/login" class="btn btn-primary">Войти в систему</a>
             <a href="#/register" class="btn btn-secondary">Стать участником</a>`
      }
    </div>
  `;

  container.appendChild(section);
}
