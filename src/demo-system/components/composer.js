import { Icon, ProductAttachment, escapeHtml } from '../ui/primitives.js?v=20260906b';
import { validateInput } from '../composer/model.js?v=20260906b';

function StructuredEntry(input) {
  const skill = input.skill ? `<span class="composer-skill" contenteditable="false" data-component="SkillTag">${escapeHtml(input.skill.name)}<button data-action="clear-skill" aria-label="移除技能">${Icon('close')}</button></span>` : '';
  const parts = input.parts.map((part) => {
    const attrs = `data-input-part="${escapeHtml(part.id)}"`;
    if (part.type === 'text') return `<span ${attrs} data-input-text>${escapeHtml(part.text)}</span>`;
    if (part.type === 'slot') return `<span ${attrs} contenteditable="false" class="composer-slot"><button data-action="fill-input-slot" data-slot="${escapeHtml(part.id)}" data-accepts="${part.accepts}">${Icon('material')}${escapeHtml(part.label)}</button></span>`;
    const ref = part.reference;
    return `<span ${attrs} contenteditable="false" class="composer-reference"><span>${ref.thumbnail ? `<img src="${escapeHtml(ref.thumbnail)}" alt="">` : Icon(ref.type === 'video' ? 'video' : 'document')}${escapeHtml(ref.title)}</span><button data-action="remove-input-reference" data-part="${escapeHtml(part.id)}" aria-label="移除${escapeHtml(ref.title)}">${Icon('close')}</button></span>`;
  }).join('');
  return `<div class="composer-input" data-role="structured-input" data-component="ComposerInput" contenteditable="true" role="textbox" aria-multiline="true" aria-label="输入创作需求" data-placeholder="上传商品、素材或想法，开始你的创作">${skill}${parts}</div>`;
}

export function readStructuredEntry(element, input) {
  const known = new Map(input.parts.map((part) => [part.id, part]));
  const parts = [];
  const addText = (text) => { if (text) parts.push({ id: `text-${parts.length}`, type: 'text', text }); };
  function visit(node) {
    if (node.nodeType === 3) { addText(node.textContent); return; }
    if (node.nodeType !== 1 || node.matches('.composer-skill')) return;
    const part = known.get(node.dataset.inputPart);
    if (part) { parts.push(part.type === 'text' ? { ...part, text: node.innerText.replaceAll('\u00a0', ' ') } : part); return; }
    if (node.tagName === 'BR') { addText('\n'); return; }
    if (node.tagName === 'DIV' && parts.length) addText('\n');
    node.childNodes.forEach(visit);
  }
  element.childNodes.forEach(visit);
  return { ...input, parts: parts.length ? parts : [{ id: 'text', type: 'text', text: '' }] };
}

function ComposerEntry({ newTask, draft, attachment }) {
  const attachmentTitle = attachment?.title || '';
  const attachmentIndex = newTask && attachmentTitle ? draft.indexOf(attachmentTitle) : -1;

  if (attachmentIndex >= 0) {
    const prefix = draft.slice(0, attachmentIndex);
    const suffix = draft.slice(attachmentIndex + attachmentTitle.length);
    return `
      <span class="composer__prefix">${escapeHtml(prefix)}</span>
      ${ProductAttachment(attachment, true)}
      <textarea name="composer-draft" data-role="composer-input" data-draft-prefix="${escapeHtml(prefix)}" data-draft-attachment="${escapeHtml(attachmentTitle)}" aria-label="输入创作需求" placeholder="上传商品、素材或想法，开始你的创作">${escapeHtml(suffix)}</textarea>`;
  }

  return `
    ${attachment ? ProductAttachment(attachment, true) : ''}
    <textarea name="composer-draft" data-role="composer-input" aria-label="输入创作需求" placeholder="上传商品、素材或想法，开始你的创作">${escapeHtml(draft)}</textarea>`;
}

export function Composer({ home = false, newTask = false, draft = '', attachment = null, input = null, busy = false, confirmation = null }) {
  const variant = newTask ? 'composer--new-task' : home ? 'composer--home' : 'composer--conversation';
  const conversation = !home && !newTask;
  return `
    <div class="composer ${variant} ${confirmation ? 'composer--confirmation' : ''}">
      <div class="composer__glow" aria-hidden="true"></div>
      ${confirmation ? `
        <div class="composer-confirmation__head">
          <span>${escapeHtml(confirmation.prompt || '是否确认并继续？')}</span>
          <div>
            <button class="confirmation-action confirmation-action--cancel" data-interaction="${escapeHtml(confirmation.id || '')}" data-action="${confirmation.cancelAction || 'cancel-confirmation'}">${escapeHtml(confirmation.cancelLabel || '取消')}</button>
            <button class="confirmation-action confirmation-action--confirm" data-action="${confirmation.confirmAction || 'confirm-choice'}" data-interaction="${escapeHtml(confirmation.id || '')}">${escapeHtml(confirmation.confirmLabel || '确认')}</button>
          </div>
        </div>` : ''}
      <div class="composer__surface">
        <div class="composer__entry">
          ${input ? StructuredEntry(input) : ComposerEntry({ newTask, draft, attachment })}
        </div>
        <div class="composer__toolbar">
          <div class="composer__tools">
            ${conversation
              ? `<button class="composer-tool" data-action="open-upload" aria-label="添加素材">${Icon('material')}</button>`
              : `<button class="composer-tool" data-action="select-product" aria-label="上传商品">${Icon('product')}</button><button class="composer-tool" data-action="open-upload" aria-label="添加素材">${Icon('material')}</button><button class="composer-tool" data-action="open-skills" aria-label="选择技能">${Icon('credit')}</button><button class="composer-tool" data-action="open-settings" aria-label="设置">${Icon('settings')}</button>`}
          </div>
          <div class="composer__submit">
            <span class="credits">${Icon('credit')}<b>0</b></span>
            <button class="send-button" data-action="${busy ? 'stop-run' : 'send-message'}" aria-label="${busy ? '停止生成' : '发送'}" ${!busy && !(input ? validateInput(input).valid : draft.trim()) ? 'disabled' : ''}>${busy ? '<span class="stop-symbol"></span>' : Icon('send')}</button>
          </div>
        </div>
      </div>
    </div>`;
}
