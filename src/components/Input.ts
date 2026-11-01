import { SpecializationChoiceItem } from '../types/index.js';

export interface InputFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'url';
  placeholder?: string;
  value?: string;
  required?: boolean;
}

/**
 * Создаёт текстовое поле ввода с подписью и блоком под ошибку
 */
export function createInputField(props: InputFieldProps): {
  wrapper: HTMLDivElement;
  input: HTMLInputElement;
  setError: (msg: string) => void;
} {
  const wrapper = document.createElement('div');
  wrapper.className = 'form-group';

  const labelEl = document.createElement('label');
  labelEl.htmlFor = props.id;
  labelEl.textContent = props.label;

  const input = document.createElement('input');
  input.id = props.id;
  input.name = props.id;
  input.type = props.type || 'text';
  input.className = 'form-control';
  input.placeholder = props.placeholder || '';
  input.value = props.value || '';
  if (props.required) input.required = true;

  const errorEl = document.createElement('span');
  errorEl.className = 'field-error';

  wrapper.append(labelEl, input, errorEl);

  return {
    wrapper,
    input,
    setError(msg: string) {
      errorEl.textContent = msg;
      input.classList.toggle('input-invalid', Boolean(msg));
    },
  };
}

/**
 * Создаёт выпадающий список (select) для выбора специализации
 */
export function createSelectField(
  id: string,
  label: string,
  options: SpecializationChoiceItem[],
  selectedValue = ''
): {
  wrapper: HTMLDivElement;
  select: HTMLSelectElement;
  setOptions: (items: SpecializationChoiceItem[], current?: string) => void;
  setError: (msg: string) => void;
} {
  const wrapper = document.createElement('div');
  wrapper.className = 'form-group';

  const labelEl = document.createElement('label');
  labelEl.htmlFor = id;
  labelEl.textContent = label;

  const select = document.createElement('select');
  select.id = id;
  select.name = id;
  select.className = 'form-control';

  const errorEl = document.createElement('span');
  errorEl.className = 'field-error';

  const setOptions = (items: SpecializationChoiceItem[], current = selectedValue) => {
    select.innerHTML = '';
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = '— Выберите специализацию —';
    select.appendChild(defaultOpt);

    items.forEach((item) => {
      const opt = document.createElement('option');
      opt.value = item.value;
      opt.textContent = item.label;
      if (item.value === current) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });
  };

  setOptions(options, selectedValue);
  wrapper.append(labelEl, select, errorEl);

  return {
    wrapper,
    select,
    setOptions,
    setError(msg: string) {
      errorEl.textContent = msg;
      select.classList.toggle('input-invalid', Boolean(msg));
    },
  };
}
