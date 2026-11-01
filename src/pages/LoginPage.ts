import { api, ApiError } from '../api/client.js';
import { createButton } from '../components/Button.js';
import { createForm } from '../components/Form.js';
import { createInputField } from '../components/Input.js';
import { showNotification } from '../components/Modal.js';
import { storage } from '../utils/storage.js';
import { validateLoginForm } from '../utils/validation.js';

/**
 * Страница входа в систему (#/login)
 */
export function renderLoginPage(container: HTMLElement): void {
  // Проверяем flash-уведомление после успешной регистрации
  const flash = storage.consumeFlashMessage();
  if (flash) {
    showNotification(flash, 'success');
  }

  const card = document.createElement('section');
  card.className = 'page-card auth-card fade-in';

  const title = document.createElement('h2');
  title.className = 'card-title';
  title.textContent = 'Вход в систему';

  const emailField = createInputField({
    id: 'login-email',
    label: 'Email',
    type: 'email',
    placeholder: 'musician@band.rock',
    required: true,
  });

  const passwordField = createInputField({
    id: 'login-password',
    label: 'Пароль',
    type: 'password',
    placeholder: '••••••••',
    required: true,
  });

  // Чекбокс "Запомнить меня"
  const rememberGroup = document.createElement('div');
  rememberGroup.className = 'checkbox-group';
  const rememberInput = document.createElement('input');
  rememberInput.type = 'checkbox';
  rememberInput.id = 'remember-me';
  rememberInput.checked = storage.getRememberMe();
  const rememberLabel = document.createElement('label');
  rememberLabel.htmlFor = 'remember-me';
  rememberLabel.textContent = 'Запомнить меня';
  rememberGroup.append(rememberInput, rememberLabel);

  const submitBtn = createButton({
    text: 'Войти',
    type: 'submit',
    variant: 'primary',
  });

  const { form, apiErrorBox, setApiError } = createForm(async () => {
    emailField.setError('');
    passwordField.setError('');

    const email = emailField.input.value;
    const password = passwordField.input.value;

    const validation = validateLoginForm(email, password);
    if (!validation.valid) {
      if (validation.errors.email) emailField.setError(validation.errors.email);
      if (validation.errors.password) passwordField.setError(validation.errors.password);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Вход...';

    try {
      storage.setRememberMe(rememberInput.checked);

      const loginRes = await api.login({
        email: email.trim(),
        password,
        remember: rememberInput.checked,
      });

      // Запрашиваем актуальный профиль после входа
      let profile = loginRes;
      if (!profile || !profile.email) {
        profile = await api.getProfile();
      }

      storage.setUser(profile);
      showNotification('Добро пожаловать в группу!', 'success');
      window.location.hash = '#/profile';
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setApiError('Неверный email или пароль');
      } else {
        setApiError(err instanceof Error ? err.message : 'Ошибка при входе');
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Войти';
    }
  });

  form.append(emailField.wrapper, passwordField.wrapper, rememberGroup, submitBtn, apiErrorBox);

  const footerLink = document.createElement('p');
  footerLink.className = 'auth-switch';
  footerLink.innerHTML = 'Нет аккаунта? <a href="#/register">Зарегистрироваться</a>';

  card.append(title, form, footerLink);
  container.appendChild(card);
}
