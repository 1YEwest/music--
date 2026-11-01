import {
  LoginRequest,
  RegisterRequest,
  Profile,
  PatchedProfile,
  SpecializationChoiceItem,
} from '../types/index.js';
import { storage } from '../utils/storage.js';

const BASE_URL = 'https://inai-col2.fishrungames.com/api';

/**
 * Реальная схема ответа бэкенда (Swagger: UserProfile).
 * Внутри приложения мы работаем с плоской моделью Profile,
 * а этот интерфейс — только для маппинга ответов API.
 */
interface ApiUserProfile {
  id: number;
  username: string;
  profile?: {
    first_name?: string;
    specialization?: string;
    specialization_display?: string;
    bio?: string;
    fee?: string;
  };
}

/** Допустимые значения специализаций (Swagger: SpecializationEnum) */
const SPEC_ENUM = ['vocals', 'guitar', 'bass', 'drums', 'keys', 'other'];

/**
 * Кастомный класс ошибки API со статусом ответа
 */
export class ApiError extends Error {
  public status: number;
  public data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

/**
 * Универсальная функция запроса с credentials: 'include' и обработкой 401
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  skipAuthRedirect = false
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Обязательная передача cookies для сессии
    });

    // Interceptor 401: очистка сессии и редирект на #/login
    if (response.status === 401) {
      storage.clearUser();
      if (!skipAuthRedirect && window.location.hash !== '#/login') {
        window.location.hash = '#/login';
      }
      throw new ApiError(401, 'Неверный email или пароль');
    }

    // Пустой ответ (например, 204 No Content при logout)
    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const errorMessage = extractErrorMessage(data) || `Ошибка сервера (${response.status})`;
      throw new ApiError(response.status, errorMessage, data);
    }

    return data as T;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(0, 'Ошибка сети. Проверьте подключение к интернету.');
  }
}

/**
 * Извлекает читаемое сообщение об ошибке из ответа бэкенда (Django/DRF формат)
 */
function extractErrorMessage(data: unknown): string {
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (typeof obj.detail === 'string') return obj.detail;
    if (typeof obj.message === 'string') return obj.message;

    const fieldMessages: string[] = [];
    for (const [key, val] of Object.entries(obj)) {
      if (Array.isArray(val)) {
        fieldMessages.push(`${key}: ${val.join(', ')}`);
      } else if (typeof val === 'string') {
        fieldMessages.push(`${key}: ${val}`);
      }
    }
    if (fieldMessages.length > 0) {
      return fieldMessages.join(' | ');
    }
  }
  return '';
}

/**
 * Маппинг ответа бэкенда (UserProfile) -> внутренняя модель Profile.
 * email у бэкенда нет — его роль играет username; имя лежит в profile.first_name.
 */
function toProfile(u: ApiUserProfile): Profile {
  const p = u.profile ?? {};
  return {
    id: u.id,
    name: p.first_name || u.username,
    email: u.username,
    specialization: p.specialization_display || p.specialization || '',
    bio: p.bio || '',
  };
}

/**
 * Методы API согласно Swagger документации.
 * ВАЖНО: бэкенд принимает ТОЛЬКО { username, password } в login/register
 * и { first_name, bio, specialization, fee } в PATCH /profile/.
 */
export const api = {
  /**
   * POST /api/register/ — регистрация нового музыканта.
   * Бэкенд принимает только username+password, поэтому имя и специализацию
   * сохраняем отдельно: входим -> PATCH профиля -> выходим.
   */
  async register(payload: RegisterRequest): Promise<Profile> {
    const username = payload.email.trim();

    const created = await request<ApiUserProfile>('/register/', {
      method: 'POST',
      body: JSON.stringify({ username, password: payload.password }),
    });

    // Пытаемся сразу сохранить имя и специализацию в профиле
    try {
      await request<ApiUserProfile>(
        '/login/',
        { method: 'POST', body: JSON.stringify({ username, password: payload.password }) },
        true
      );
      await request<ApiUserProfile>(
        '/profile/',
        {
          method: 'PATCH',
          body: JSON.stringify({
            first_name: payload.name.trim(),
            specialization: payload.specialization,
          }),
        },
        true
      );
      await request<void>('/logout/', { method: 'POST' }, true);
    } catch {
      // Некритично: аккаунт уже создан, остальное можно заполнить в профиле позже
    }

    return toProfile(created);
  },

  /**
   * POST /api/login/ — вход в систему.
   * КЛЮЧЕВОЙ ФИКС: отправляем username (=email), а не email.
   */
  async login(payload: LoginRequest): Promise<Profile> {
    const u = await request<ApiUserProfile>(
      '/login/',
      {
        method: 'POST',
        body: JSON.stringify({
          username: payload.email.trim(), // ← было: email
          password: payload.password,
        }),
      },
      true // 401 обрабатываем локально на странице логина
    );
    return toProfile(u);
  },

  /**
   * POST /api/logout/ — выход из системы
   */
  logout(): Promise<void> {
    return request<void>('/logout/', { method: 'POST' });
  },

  /**
   * GET /api/profile/ — получить профиль текущего пользователя
   */
  async getProfile(): Promise<Profile> {
    const u = await request<ApiUserProfile>('/profile/', { method: 'GET' });
    return toProfile(u);
  },

  /**
   * PATCH /api/profile/ — обновить профиль.
   * Маппим name -> first_name; avatar бэкендом не поддерживается.
   */
  async updateProfile(payload: PatchedProfile): Promise<Profile> {
    const body: Record<string, string> = {};
    if (payload.name !== undefined) body.first_name = payload.name;
    if (payload.bio !== undefined) body.bio = payload.bio;
    if (payload.specialization && SPEC_ENUM.includes(payload.specialization)) {
      body.specialization = payload.specialization;
    }

    const u = await request<ApiUserProfile>('/profile/', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });

    // avatar не хранится на бэкенде — возвращаем локальное значение для UI
    return { ...toProfile(u), avatar: payload.avatar };
  },

  /**
   * GET /api/specializations/ — список доступных специализаций
   */
  async getSpecializations(): Promise<SpecializationChoiceItem[]> {
    try {
      const res = await request<SpecializationChoiceItem[] | Record<string, string>>(
        '/specializations/',
        { method: 'GET' },
        true
      );
      if (Array.isArray(res)) {
        return res;
      }
      return Object.entries(res).map(([value, label]) => ({
        value,
        label: String(label),
      }));
    } catch {
      // Резервный список СТРОГО из Swagger-enum (SpecializationEnum)
      return [
        { value: 'vocals', label: 'Вокал' },
        { value: 'guitar', label: 'Гитара' },
        { value: 'bass', label: 'Бас-гитара' },
        { value: 'drums', label: 'Ударные' },
        { value: 'keys', label: 'Клавишные' },
        { value: 'other', label: 'Другое' },
      ];
    }
  },
};
