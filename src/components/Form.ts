/**
 * Создаёт обёртку формы с блоком для вывода ошибок API под формой
 */
export function createForm(onSubmit: (e: SubmitEvent) => void): {
  form: HTMLFormElement;
  apiErrorBox: HTMLDivElement;
  setApiError: (msg: string) => void;
} {
  const form = document.createElement('form');
  form.className = 'app-form';
  form.noValidate = true;

  const apiErrorBox = document.createElement('div');
  apiErrorBox.className = 'api-error-box hidden';

  form.addEventListener('submit', (e: SubmitEvent) => {
    e.preventDefault();
    apiErrorBox.classList.add('hidden');
    apiErrorBox.textContent = '';
    onSubmit(e);
  });

  return {
    form,
    apiErrorBox,
    setApiError(msg: string) {
      if (msg) {
        apiErrorBox.textContent = msg;
        apiErrorBox.classList.remove('hidden');
      } else {
        apiErrorBox.textContent = '';
        apiErrorBox.classList.add('hidden');
      }
    },
  };
}
