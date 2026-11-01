import { initRouter } from './router/router.js';

/**
 * Точка входа SPA-приложения
 */
function bootstrap(): void {
  if (!window.location.hash) {
    window.location.hash = '#/home';
  }
  initRouter();
}

bootstrap();
