import { Profile } from '../types/index.js';

const AUTH_KEY = 'rock_band_auth_user';
const REMEMBER_KEY = 'rock_band_remember_me';
const FLASH_MESSAGE_KEY = 'rock_band_flash_msg';

/**
 * Управление состоянием авторизации на клиенте
 */
export const storage = {
  setRememberMe(remember: boolean): void {
    localStorage.setItem(REMEMBER_KEY, JSON.stringify(remember));
  },

  getRememberMe(): boolean {
    const raw = localStorage.getItem(REMEMBER_KEY);
    return raw ? JSON.parse(raw) : false;
  },

  setUser(profile: Profile): void {
    const targetStorage = this.getRememberMe() ? localStorage : sessionStorage;
    targetStorage.setItem(AUTH_KEY, JSON.stringify(profile));
  },

  getUser(): Profile | null {
    const raw = sessionStorage.getItem(AUTH_KEY) || localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Profile;
    } catch {
      return null;
    }
  },

  clearUser(): void {
    sessionStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_KEY);
  },

  isAuthenticated(): boolean {
    return this.getUser() !== null;
  },

  setFlashMessage(msg: string): void {
    sessionStorage.setItem(FLASH_MESSAGE_KEY, msg);
  },

  consumeFlashMessage(): string | null {
    const msg = sessionStorage.getItem(FLASH_MESSAGE_KEY);
    if (msg) {
      sessionStorage.removeItem(FLASH_MESSAGE_KEY);
    }
    return msg;
  }
};
