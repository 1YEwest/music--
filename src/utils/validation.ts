export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Проверка корректности email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Валидация формы регистрации
 */
export function validateRegisterForm(data: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  specialization: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name.trim()) {
    errors.name = 'Введите имя музыканта';
  }

  if (!isValidEmail(data.email)) {
    errors.email = 'Введите корректный email адрес';
  }

  if (data.password.length < 8) {
    errors.password = 'Пароль должен содержать минимум 8 символов';
  }

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Пароли не совпадают';
  }

  if (!data.specialization) {
    errors.specialization = 'Выберите специализацию';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Валидация формы входа
 */
export function validateLoginForm(email: string, password: string): ValidationResult {
  const errors: Record<string, string> = {};

  if (!isValidEmail(email)) {
    errors.email = 'Введите корректный email адрес';
  }

  if (!password) {
    errors.password = 'Введите пароль';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
