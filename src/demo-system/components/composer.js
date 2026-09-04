import { Icon, ProductAttachment, escapeHtml } from '../ui/primitives.js';

export function Composer({ home = false, newTask = false, draft = '', attachment = null, busy = false, confirmation = null }) {
  const variant = newTask ? 'composer--new-task' : home ? 'composer--home' : 'composer--conversation';
  const conversation = !home && !newTask;
  return `
    <div class="composer ${variant} ${confirmation ? 'composer--confirmation' : ''}">
      <div class="composer__glow" aria-hidden="true"></div>
      ${confirmation ? `
        <div class="composer-confirmation__head">
          <span>${escapeHtml(confirmation.prompt || '是否确认并继续？')}</span>
          <div>
            <button class="confirmation-action confirmation-action--cancel" data-action="${confirmation.cancelAction || 'cancel-confirmation'}">${escapeHtml(confirmation.cancelLabel || '取消')}</button>
            <button class="confirmation-action confirmation-action--confirm" data-action="${confirmation.confirmAction || 'confirm-choice'}" data-interaction="${escapeHtml(confirmation.id || '')}">${escapeHtml(confirmation.confirmLabel || '确认')}</button>
          </div>
        </div>` : ''}
      <div class="composer__surface">
        <div class="composer__entry">
          ${attachment ? ProductAttachment(attachment, true) : ''}
          <textarea name="composer-draft" data-role="composer-input" aria-label="输入创作需求" placeholder="上传商品、素材或想法，开始你的创作">${draft}</textarea>
        </div>
        <div class="composer__toolbar">
          <div class="composer__tools">
            ${conversation
              ? `<button class="composer-tool" data-action="select-product" aria-label="添加素材">${Icon('material')}</button>`
              : `<button class="composer-tool" data-action="select-product" aria-label="上传商品">${Icon('product')}</button><button class="composer-tool" data-action="select-product" aria-label="添加素材">${Icon('material')}</button><button class="composer-tool" data-action="open-settings" aria-label="设置">${Icon('settings')}</button>`}
          </div>
          <div class="composer__submit">
            <span class="credits">${Icon('credit')}<b>0</b></span>
            <button class="send-button" data-action="send-message" aria-label="发送" ${busy || (conversation && !draft.trim()) ? 'disabled' : ''}>${Icon('send')}</button>
          </div>
        </div>
      </div>
    </div>`;
}
