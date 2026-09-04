import { Icon, escapeHtml } from '../ui/primitives.js';
import { getConversationApiBinding } from '../editor/conversation-api-bindings.js';
import { resolveConversationPresentation } from '../conversation/component-registry.js';

const iconOptions = [
  { value: 'none', label: '无图标' },
  { value: 'statusConfirmed', label: '确认状态' },
  { value: 'selectionForm', label: '选择/表单' },
  { value: 'thinkingComplete', label: '思考完成' },
  { value: 'thinkingProgress', label: '思考中' },
  { value: 'document', label: '文档' },
  { value: 'video', label: '视频' },
  { value: 'image', label: '图片' },
  { value: 'actor', label: '演员' },
  { value: 'product', label: '商品' },
];

const componentDefaultIcons = {
  StatusMessage: 'statusConfirmed',
  DocumentArtifactPresentation: 'document',
};

function IconPicker(message, renderer) {
  const fallback = componentDefaultIcons[renderer];
  if (!fallback) return '';
  const selectedIcon = message.icon || fallback;
  return `
    <fieldset class="editor-icon-field">
      <legend>图标</legend>
      <div class="editor-icon-grid" role="radiogroup" aria-label="图标">
        ${iconOptions.map((option) => `
          <label class="editor-icon-option" title="${escapeHtml(option.label)}">
            <input data-editor-prop="icon" type="radio" name="editor-icon" value="${escapeHtml(option.value)}" ${option.value === selectedIcon ? 'checked' : ''}>
            <span>${option.value === 'none' ? '<i aria-hidden="true">×</i>' : Icon(option.value)}</span>
            <small>${escapeHtml(option.label)}</small>
          </label>`).join('')}
      </div>
    </fieldset>`;
}

const editableProperties = [
  { key: 'text', label: '内容', multiline: true },
  { key: 'title', label: '标题' },
  { key: 'detail', label: '辅助信息' },
  { key: 'thought', label: '思考摘要', multiline: true },
  { key: 'prompt', label: '追问文案', multiline: true },
  { key: 'status', label: '产物状态' },
  { key: 'timestamp', label: '时间' },
];

function PropertyField(message, property) {
  if (!(property.key in message)) return '';
  const rawValue = message[property.key];
  const value = Array.isArray(rawValue) ? rawValue.join('\n') : rawValue;
  const control = property.multiline
    ? `<textarea name="editor-${property.key}" data-editor-prop="${property.key}" rows="4">${escapeHtml(value)}</textarea>`
    : `<input name="editor-${property.key}" data-editor-prop="${property.key}" type="text" value="${escapeHtml(value)}">`;
  return `<label class="editor-field"><span>${property.label}</span>${control}</label>`;
}

function ApiBindingPanel(message, component, source) {
  const binding = getConversationApiBinding(message, component, source);
  const endpoint = escapeHtml(binding.endpoint).replaceAll('\n', '<br>');
  return `
    <details class="editor-api-panel" open>
      <summary class="editor-api-panel__head">
        <div><small>Data & API</small><h3>数据与接口绑定</h3></div>
        <span>契约待接入</span>
      </summary>
      <div class="editor-api-panel__body">
        <div class="editor-api-notice"><i></i><span>当前由 Mock 场景驱动，以下 API 是组件需要遵循的接口契约。</span></div>
        <dl class="editor-api-meta">
          <div><dt>Mock 来源</dt><dd><code>${escapeHtml(binding.mock.source)}</code></dd></div>
          <div><dt>控制器</dt><dd><code>${escapeHtml(binding.controller)}</code></dd></div>
          <div><dt>触发条件</dt><dd>${escapeHtml(binding.trigger)}</dd></div>
          <div><dt>传输方式</dt><dd>${escapeHtml(binding.transport)}</dd></div>
          <div><dt>接口</dt><dd><code>${endpoint}</code></dd></div>
          <div><dt>事件</dt><dd><code>${escapeHtml(binding.event)}</code></dd></div>
        </dl>
        <div class="editor-api-mapping">
          <h4>Props 字段映射</h4>
          ${binding.fields.map(([property, field, transform]) => `
            <div class="editor-api-map-row">
              <code>${escapeHtml(property)}</code>
              <span>←</span>
              <div><code>${escapeHtml(field)}</code><small>${escapeHtml(transform)}</small></div>
            </div>`).join('')}
        </div>
        <details class="editor-api-payload">
          <summary>查看事件示例</summary>
          <pre>${escapeHtml(JSON.stringify(binding.sample, null, 2))}</pre>
        </details>
      </div>
    </details>`;
}

export function ConversationEditor(state) {
  const editor = state.editor;
  const selected = state.messages.find((message) => message.id === editor.selectedId) || null;
  const currentOverride = selected ? editor.config.instances?.[selected.id] : null;
  const statusText = editor.saveState === 'saving' ? '正在写入源码' : editor.saveState === 'error' ? '写入失败' : '源码已同步';
  const presentation = selected ? resolveConversationPresentation(selected) : null;

  return `
    <aside class="conversation-editor" aria-label="会话可视化编辑器">
      <header class="conversation-editor__head">
        <div><small>Visual Editor</small><h2>会话编辑</h2></div>
        <button data-action="exit-editor" aria-label="退出编辑模式">×</button>
      </header>
      <div class="editor-save-state editor-save-state--${escapeHtml(editor.saveState || 'saved')}"><i></i>${statusText}</div>
      ${selected ? `
        <form class="editor-inspector" data-role="conversation-editor-form" data-message-id="${escapeHtml(selected.id)}" onsubmit="return false">
          <section class="editor-identity">
            <span><small>业务组件</small><b>${escapeHtml(presentation?.component || editor.selectedComponent || 'Message')}</b></span>
            <span><small>当前状态</small><code>${escapeHtml(`${selected.variant} / ${selected.phase}`)}</code></span>
            <span><small>渲染组件</small><code>${escapeHtml(presentation?.renderer || 'AssistantText')}</code></span>
            <span><small>实例</small><code>${escapeHtml(selected.id)}</code></span>
            <span><small>数据源</small><code>${escapeHtml(editor.selectedSource || `scenarioMessages.${selected.id}`)}</code></span>
          </section>
          ${ApiBindingPanel(selected, presentation?.component || editor.selectedComponent || 'AssistantMessage', editor.selectedSource)}
          <div class="editor-fields">
            ${editableProperties.map((property) => PropertyField(selected, property)).join('')}
            ${IconPicker(selected, presentation?.renderer)}
            <label class="editor-field editor-field--number"><span>消息间距</span><div><input name="editor-message-gap" data-editor-token="messageGap" type="number" min="0" max="48" value="${Number(editor.config.tokens?.messageGap ?? 12)}"><em>px</em></div></label>
          </div>
          <footer class="editor-actions">
            <button class="editor-button editor-button--primary" data-action="editor-save">保存到源码</button>
            <button class="editor-button" data-action="editor-reset" ${currentOverride ? '' : 'disabled'}>重置实例</button>
            <button class="editor-button" data-action="editor-undo" ${editor.history.length ? '' : 'disabled'}>撤销</button>
            <button class="editor-button editor-button--danger" data-action="editor-delete">删除实例</button>
          </footer>
        </form>` : `
        <div class="editor-empty">
          <b>选择一条会话内容</b>
          <p>可编辑用户消息、思考、AI 回复、追问、回执和产物卡。</p>
          <button class="editor-button" data-action="editor-undo" ${editor.history.length ? '' : 'disabled'}>撤销上一步</button>
        </div>`}
    </aside>`;
}
