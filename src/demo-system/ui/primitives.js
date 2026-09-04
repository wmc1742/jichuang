import { icons } from '../data/assets.js';

export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function Icon(name, className = '') {
  const src = icons[name];
  if (!src) return '<span class="aic-icon-slot" aria-hidden="true"></span>';
  return `<img class="aic-icon ${className}" src="${src}" alt="" draggable="false">`;
}

export function IconButton({ icon, label, action, className = '', disabled = false }) {
  return `<button class="aic-icon-button ${className}" data-action="${action}" aria-label="${escapeHtml(label)}" ${disabled ? 'disabled' : ''}>${Icon(icon)}</button>`;
}

export function Button({ label, action, icon = null, variant = 'secondary', className = '' }) {
  return `<button class="aic-button aic-button--${variant} ${className}" data-action="${action}">${icon ? Icon(icon) : ''}<span>${escapeHtml(label)}</span></button>`;
}

export function ProductAttachment(product, removable = false) {
  return `<span class="product-attachment"><img src="${product.thumbnail}" alt=""><span>${escapeHtml(product.title)}</span>${removable ? '<button data-action="clear-attachment" aria-label="移除附件">×</button>' : ''}</span>`;
}
