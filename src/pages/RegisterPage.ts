import { api } from '../api/client.js';
import { createButton } from '../components/Button.js';
import { createForm } from '../components/Form.js';
import { createInputField, createSelectField } from '../components/Input.js';
import { storage } from '../utils/storage.js';
import { validateRegisterForm } from '../utils/validation.js';

/**
 * Страница регистрации нового музыканта (#/register)
 */
export async function renderRegisterPage(container: HTMLElement): Promise<void> {
  const card = document.createElement('section');
  card.className = 'page-card auth-card fade-in';

  const title = document.createElement('h2');
  title.className = 'card-title';
  title.textContent = 'Регистрация музыканта';

  const nameField = createInputField({
    id: 'name',
    label: 'Имя / Сценический псевдоним',
    placeholder: 'Алекс Тёрнер',
    required: true,
  });

  const emailField = createInputField({
    id: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'musician@band.rock',
    required: true,
  });

  const passwordField = createInputField({
    id: 'password',
    label: 'Пароль (мин. 8 символов)',
    type: 'password',
    placeholder: '••••••••',
    required: true,
  });

  const confirmField = createInputField({
    id: 'confirmPassword',
    label: 'Подтверждение пароля',
    type: 'password',
    placeholder: '••••••••',
    required: true,
  });

  const specField = createSelectField('specialization', 'Специализация в группе', []);

  const submitBtn = createButton({
    text: 'Зарегистрироваться',
    type: 'submit',
    variant: 'primary',
  });

  const { form, apiErrorBox, setApiError } = createForm(async () => {
    // Сброс прежних ошибок
    nameField.setError('');
    emailField.setError('');
    passwordField.setError('');
    confirmField.setError('');
    specField.setError('');

    const values = {
      name: nameField.input.value,
      email: emailField.input.value,
      password: passwordField.input.value,
      confirmPassword: confirmField.input.value,
      specialization: specField.select.value,
    };

    const validation = validateRegisterForm(values);
    if (!validation.valid) {
      if (validation.errors.name) nameField.setError(validation.errors.name);
      if (validation.errors.email) emailField.setError(validation.errors.email);
      if (validation.errors.password) passwordField.setError(validation.errors.password);
      if (validation.errors.confirmPassword) confirmField.setError(validation.errors.confirmPassword);
      if (validation.errors.specialization) specField.setError(validation.errors.specialization);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Регистрация...';

    try {
      await api.register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        specialization: values.specialization,
      });

      storage.setFlashMessage('Регистрация прошла успешно! Теперь войдите в аккаунт.');
      window.location.hash = '#/login';
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка регистрации';
      setApiError(msg);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Зарегистрироваться';
    }
  });

  form.append(
    nameField.wrapper,
    emailField.wrapper,
    specField.wrapper,
    passwordField.wrapper,
    confirmField.wrapper,
    submitBtn,
    apiErrorBox
  );

  const footerLink = document.createElement('p');
  footerLink.className = 'auth-switch';
  footerLink.innerHTML = 'Уже есть аккаунт? <a href="#/login">Войти</a>';

  card.append(title, form, footerLink);
  container.appendChild(card);

  // Загружаем список специализаций с API
  const specializations = await api.getSpecializations();
  specField.setOptions(specializations);
}
