import { api } from '../api/client.js';
import { createButton } from '../components/Button.js';
import { createForm } from '../components/Form.js';
import { createInputField } from '../components/Input.js';
import { showNotification } from '../components/Modal.js';
import { Profile } from '../types/index.js';
import { storage } from '../utils/storage.js';

/**
 * Защищённая страница профиля музыканта (#/profile)
 */
export async function renderProfilePage(container: HTMLElement): Promise<void> {
  const card = document.createElement('section');
  card.className = 'page-card profile-card fade-in';
  card.innerHTML = '<p class="loading-text">Загрузка профиля...</p>';
  container.appendChild(card);

  let profile: Profile;
  try {
    profile = await api.getProfile();
    storage.setUser(profile);
  } catch {
    const cached = storage.getUser();
    if (!cached) {
      window.location.hash = '#/login';
      return;
    }
    profile = cached;
  }

  let isEditing = false;

  const renderView = () => {
    card.innerHTML = '';

    const headerRow = document.createElement('div');
    headerRow.className = 'profile-header';

    const avatarImg = document.createElement('img');
    avatarImg.className = 'profile-avatar';
    avatarImg.src =
      profile.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=d90429&color=fff&size=128`;
    avatarImg.alt = profile.name;

    const infoBlock = document.createElement('div');
    infoBlock.className = 'profile-info';
    infoBlock.innerHTML = `
      <h2 class="profile-name">${escapeHtml(profile.name)}</h2>
      <span class="badge-spec">${escapeHtml(profile.specialization || 'Участник группы')}</span>
      <p class="profile-email">${escapeHtml(profile.email)}</p>
    `;

    headerRow.append(avatarImg, infoBlock);

    const bioBlock = document.createElement('div');
    bioBlock.className = 'profile-bio';
    bioBlock.innerHTML = `
      <h3>О себе (Bio)</h3>
      <p>${profile.bio ? escapeHtml(profile.bio) : 'Информация о музыканте пока не заполнена.'}</p>
    `;

    const actionsRow = document.createElement('div');
    actionsRow.className = 'profile-actions';

    const editBtn = createButton({
      text: 'Редактировать',
      variant: 'primary',
      onClick: () => {
        isEditing = true;
        renderEditForm();
      },
    });

    const logoutBtn = createButton({
      text: 'Выйти',
      variant: 'danger',
      onClick: async () => {
        try {
          await api.logout();
        } catch {
          // Игнорируем ошибку, если сессия уже истекла
        } finally {
          storage.clearUser();
          showNotification('Вы вышли из аккаунта', 'success');
          window.location.hash = '#/login';
        }
      },
    });

    actionsRow.append(editBtn, logoutBtn);
    card.append(headerRow, bioBlock, actionsRow);
  };

  const renderEditForm = () => {
    card.innerHTML = '';

    const title = document.createElement('h2');
    title.className = 'card-title';
    title.textContent = 'Редактирование профиля';

    const nameField = createInputField({
      id: 'edit-name',
      label: 'Имя',
      value: profile.name,
      required: true,
    });

    const avatarField = createInputField({
      id: 'edit-avatar',
      label: 'Ссылка на аватар (URL)',
      type: 'url',
      placeholder: 'https://example.com/avatar.jpg',
      value: profile.avatar || '',
    });

    // Поле Bio (textarea)
    const bioWrapper = document.createElement('div');
    bioWrapper.className = 'form-group';
    const bioLabel = document.createElement('label');
    bioLabel.htmlFor = 'edit-bio';
    bioLabel.textContent = 'О себе (Bio)';
    const bioTextarea = document.createElement('textarea');
    bioTextarea.id = 'edit-bio';
    bioTextarea.className = 'form-control';
    bioTextarea.rows = 4;
    bioTextarea.value = profile.bio || '';
    bioWrapper.append(bioLabel, bioTextarea);

    const btnGroup = document.createElement('div');
    btnGroup.className = 'profile-actions';

    const saveBtn = createButton({
      text: 'Сохранить изменения',
      type: 'submit',
      variant: 'primary',
    });

    const cancelBtn = createButton({
      text: 'Отмена',
      type: 'button',
      variant: 'secondary',
      onClick: () => {
        isEditing = false;
        renderView();
      },
    });

    btnGroup.append(saveBtn, cancelBtn);

    const { form, apiErrorBox, setApiError } = createForm(async () => {
      if (!nameField.input.value.trim()) {
        nameField.setError('Имя не может быть пустым');
        return;
      }

      saveBtn.disabled = true;
      saveBtn.textContent = 'Сохранение...';

      try {
        const updated = await api.updateProfile({
          name: nameField.input.value.trim(),
          avatar: avatarField.input.value.trim() || undefined,
          bio: bioTextarea.value.trim(),
        });

        profile = { ...profile, ...updated };
        storage.setUser(profile);
        isEditing = false;
        showNotification('Профиль успешно обновлён!', 'success');
        renderView();
      } catch (err) {
        setApiError(err instanceof Error ? err.message : 'Не удалось обновить профиль');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Сохранить изменения';
      }
    });

    form.append(nameField.wrapper, avatarField.wrapper, bioWrapper, btnGroup, apiErrorBox);
    card.append(title, form);
  };

  if (!isEditing) {
    renderView();
  }
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
