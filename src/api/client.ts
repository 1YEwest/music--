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

    // Собираем ошибки по полям формы
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
 * Методы API согласно Swagger документации
 */
export const api = {
  /**
   * POST /api/register/ — регистрация нового музыканта
   */
  register(payload: RegisterRequest): Promise<Profile> {
    return request<Profile>('/register/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * POST /api/login/ — вход в систему
   */
  login(payload: LoginRequest): Promise<Profile> {
    return request<Profile>(
      '/login/',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      true // обрабатываем 401 локально на странице логина
    );
  },

  /**
   * POST /api/logout/ — выход из системы
   */
  logout(): Promise<void> {
    return request<void>('/logout/', {
      method: 'POST',
    });
  },

  /**
   * GET /api/profile/ — получить профиль текущего пользователя
   */
  getProfile(): Promise<Profile> {
    return request<Profile>('/profile/', {
      method: 'GET',
    });
  },

  /**
   * PATCH /api/profile/ — обновить профиль
   */
  updateProfile(payload: PatchedProfile): Promise<Profile> {
    return request<Profile>('/profile/', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
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
      // Если API возвращает словарь { value: label }
      return Object.entries(res).map(([value, label]) => ({
        value,
        label: String(label),
      }));
    } catch {
      // Резервный список на случай недоступности эндпоинта
      return [
        { value: 'vocal', label: 'Вокал' },
        { value: 'guitar', label: 'Гитара' },
        { value: 'bass', label: 'Бас-гитара' },
        { value: 'drums', label: 'Ударные' },
        { value: 'keys', label: 'Клавишные' },
        { value: 'sound_engineer', label: 'Звукорежиссёр' },
      ];
    }
  },
};
