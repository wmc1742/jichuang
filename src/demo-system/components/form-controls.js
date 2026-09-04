import { Icon, escapeHtml } from '../ui/primitives.js';

export function CheckboxOption({ name, label, value = label, checked = false, disabled = false }) {
  return `
    <label class="form-option ${disabled ? 'is-readonly' : ''}">
      <span>${escapeHtml(label)}</span>
      <input type="checkbox" name="${escapeHtml(name)}" value="${escapeHtml(value)}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}>
      <i class="form-checkbox" aria-hidden="true">${Icon('checkboxSelected')}</i>
    </label>`;
}

export function RadioOption({ name, label, value = label, checked = false, disabled = false }) {
  return `
    <label class="form-option ${disabled ? 'is-readonly' : ''}">
      <span>${escapeHtml(label)}</span>
      <input type="radio" name="${escapeHtml(name)}" value="${escapeHtml(value)}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}>
      <i class="form-checkbox form-radio" aria-hidden="true"></i>
    </label>`;
}

export function CustomOption({ name, label = '自定义', value = '', open = false }) {
  return `
    <div class="form-custom ${open ? 'is-open' : ''}">
      <input class="form-custom__toggle" id="${escapeHtml(name)}-custom" type="checkbox" ${open ? 'checked' : ''}>
      <label class="form-custom__trigger" for="${escapeHtml(name)}-custom">${escapeHtml(label)}</label>
      <input class="form-custom__input" type="text" name="${escapeHtml(name)}-custom-value" aria-label="${escapeHtml(label)}" placeholder="请输入" value="${escapeHtml(value)}">
    </div>`;
}

export function TextFieldControl({ name = label, label, placeholder = '请输入', value = '' }) {
  return `
    <label class="form-field">
      <span>${escapeHtml(label)}</span>
      <input type="text" name="${escapeHtml(name)}" aria-label="${escapeHtml(label)}" placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(value)}" required>
    </label>`;
}

export function SelectFieldControl({ name = label, label, options = [], value = '' }) {
  return `
    <label class="form-field">
      <span>${escapeHtml(label)}</span>
      <span class="form-select">
        <select name="${escapeHtml(name)}" aria-label="${escapeHtml(label)}" required>
          <option value="">请选择</option>
          ${options.map((option) => `<option value="${escapeHtml(option)}" ${option === value ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}
        </select>
        <i aria-hidden="true"></i>
      </span>
    </label>`;
}

export function FormAction({ label = '确定' }) {
  return `<div class="question-form__footer"><button class="form-action" type="button" data-action="form-submit">${escapeHtml(label)}</button></div>`;
}
