/**
 * Схема запроса на вход (POST /api/login/)
 */
export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

/**
 * Схема запроса на регистрацию (POST /api/register/)
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  specialization: string;
}

/**
 * Схема профиля пользователя (GET /api/profile/)
 */
export interface Profile {
  id: number;
  name: string;
  email: string;
  specialization: string;
  avatar?: string;
  bio?: string;
}

/**
 * Схема частичного обновления профиля (PATCH /api/profile/)
 */
export interface PatchedProfile {
  name?: string;
  bio?: string;
  avatar?: string;
  specialization?: string;
}

/**
 * Элемент списка специализаций (GET /api/specializations/)
 */
export interface SpecializationChoiceItem {
  label: string;
  value: string;
}

/**
 * Стандартная структура ошибки API
 */
export interface ApiErrorData {
  detail?: string;
  message?: string;
  [key: string]: unknown;
}
