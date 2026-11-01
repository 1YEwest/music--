export interface ButtonProps {
  text: string;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'danger';
  onClick?: (e: MouseEvent) => void;
  disabled?: boolean;
}

/**
 * Создаёт HTML-элемент кнопки
 */
export function createButton(props: ButtonProps): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = props.type || 'button';
  btn.textContent = props.text;
  btn.className = `btn btn-${props.variant || 'primary'}`;
  if (props.disabled) {
    btn.disabled = true;
  }
  if (props.onClick) {
    btn.addEventListener('click', props.onClick);
  }
  return btn;
}
