import { ArtifactWorkbench } from '../components/artifacts.js?v=20260904f';
import { Composer } from '../components/composer.js';
import { MessageFeed } from '../components/messages.js?v=20260904f';
import { icons, media } from '../data/assets.js';
import { project } from '../scenarios/luosifen.js';
import { Button, Icon, IconButton, escapeHtml } from '../ui/primitives.js';

const sections = [
  ['button', 'Button'],
  ['icon-button', 'IconButton'],
  ['composer', 'Composer'],
  ['message', 'Message'],
  ['artifact-card', 'ArtifactCard'],
  ['media-grid', 'MediaGrid'],
  ['workbench', 'Workbench'],
];

function StudioSidebar(state) {
  return `
    <aside class="studio-sidebar">
      <div class="studio-brand"><button data-action="leave-studio" aria-label="返回 Demo">${Icon('logoMark')} ${Icon('logoWord')}</button><span>Components</span></div>
      <nav aria-label="组件目录">${sections.map(([id, label]) => `<button class="${state.studioSection === id ? 'is-active' : ''}" data-action="studio-section" data-section="${id}"><span></span>${label}</button>`).join('')}</nav>
    </aside>`;
}

function Segmented({ field, value, options }) {
  return `<div class="studio-segmented">${options.map((option) => `<button class="${value === option.value ? 'is-active' : ''}" data-action="studio-set" data-field="${field}" data-value="${option.value}">${escapeHtml(option.label)}</button>`).join('')}</div>`;
}

function NumberField({ field, label, value, min, max, suffix = 'px' }) {
  return `<label><span>${escapeHtml(label)}</span><span class="studio-number"><input type="number" min="${min}" max="${max}" data-studio-number="${field}" value="${value}"><em>${suffix}</em></span></label>`;
}

function TextField({ field, label, value }) {
  return `<label><span>${escapeHtml(label)}</span><input type="text" data-studio-input="${field}" value="${escapeHtml(value)}"></label>`;
}

function ControlPanel(state) {
  const s = state.studio;
  const common = TextField({ field: 'sampleText', label: '示例文案', value: s.sampleText });
  let controls = '';

  if (state.studioSection === 'button') {
    controls = `${common}<div class="studio-control"><span>层级</span>${Segmented({ field: 'buttonVariant', value: s.buttonVariant, options: [{ value: 'inverted', label: '主要' }, { value: 'secondary', label: '次要' }] })}</div><label class="studio-check"><input type="checkbox" data-studio-check="showButtonIcon" ${s.showButtonIcon ? 'checked' : ''}><span>显示图标</span></label>`;
  } else if (state.studioSection === 'icon-button') {
    controls = `<div class="studio-control"><span>图标</span><select data-studio-select="selectedIcon">${Object.keys(icons).map((name) => `<option value="${name}" ${s.selectedIcon === name ? 'selected' : ''}>${name}</option>`).join('')}</select></div><label class="studio-check"><input type="checkbox" data-studio-check="iconDisabled" ${s.iconDisabled ? 'checked' : ''}><span>禁用</span></label>`;
  } else if (state.studioSection === 'composer') {
    controls = `${common}
      <div class="studio-control"><span>输入状态</span>${Segmented({ field: 'composerMode', value: s.composerMode, options: [{ value: 'default', label: '默认' }, { value: 'confirmation', label: '确认' }] })}</div>
      ${s.composerMode === 'confirmation' ? `<div class="studio-control-divider"></div>${TextField({ field: 'confirmationPrompt', label: '确认提示', value: s.confirmationPrompt })}<div class="studio-control-grid">${TextField({ field: 'confirmationCancelLabel', label: '次行动点', value: s.confirmationCancelLabel })}${TextField({ field: 'confirmationConfirmLabel', label: '主行动点', value: s.confirmationConfirmLabel })}</div>` : ''}
      <div class="studio-control"><span>内容垂直对齐</span>${Segmented({ field: 'composerAlignment', value: s.composerAlignment, options: [{ value: 'flex-start', label: '顶部' }, { value: 'center', label: '居中' }, { value: 'flex-end', label: '底部' }] })}</div>
      <div class="studio-control-grid">${NumberField({ field: 'composerGap', label: '附件间距', value: s.composerGap, min: 0, max: 32 })}${NumberField({ field: 'composerRadius', label: '容器圆角', value: s.composerRadius, min: 0, max: 48 })}</div>
      <div class="studio-control-grid">${NumberField({ field: 'composerFontSize', label: '文字字号', value: s.composerFontSize, min: 10, max: 28 })}${NumberField({ field: 'composerLineHeight', label: '文字行高', value: s.composerLineHeight, min: 16, max: 40 })}</div>
      <label class="studio-check"><input type="checkbox" data-studio-check="composerAttachment" ${s.composerAttachment ? 'checked' : ''}><span>商品附件</span></label><label class="studio-check"><input type="checkbox" data-studio-check="composerBusy" ${s.composerBusy ? 'checked' : ''}><span>生成中</span></label>`;
  } else if (state.studioSection === 'message') {
    controls = `${common}<div class="studio-control"><span>消息类型</span><select data-studio-select="messageType">
      ${[
        ['all', '全部状态'], ['user', '用户 / 纯文本'], ['user-attachment', '用户 / 带附件'],
        ['assistant', 'AI / 单段回复'], ['assistant-long', 'AI / 多段回复'], ['follow-up', 'AI / 追问'],
        ['single-select', 'AI / 单选'], ['multi-select', 'AI / 多选（默认）'], ['multi-select-selected', 'AI / 多选（已选）'], ['form', 'AI / 结构化表单'],
        ['progress', 'AI / 思考中'], ['thinking-complete', 'AI / 思考结束'], ['execution', 'AI / 执行中'], ['execution-complete', 'AI / 执行完成'], ['question-answered', 'AI / 追问已回答'], ['status', 'AI / 独立状态反馈'],
        ['artifact', 'AI / 结构化产物'], ['images', 'AI / 图片组'], ['videos', 'AI / 视频组'],
      ].map(([value, label]) => `<option value="${value}" ${s.messageType === value ? 'selected' : ''}>${label}</option>`).join('')}
      </select></div>
      <div class="studio-control-grid">${NumberField({ field: 'messageGap', label: '消息间距', value: s.messageGap, min: 0, max: 48 })}${NumberField({ field: 'messageFontSize', label: 'AI 正文字号', value: s.messageFontSize, min: 10, max: 24 })}</div>
      <div class="studio-control-grid">${NumberField({ field: 'userBubbleRadius', label: '用户气泡圆角', value: s.userBubbleRadius, min: 0, max: 40 })}${NumberField({ field: 'userBubblePadding', label: '用户气泡边距', value: s.userBubblePadding, min: 4, max: 32 })}</div>
      ${s.messageType === 'single-select' || s.messageType.startsWith('multi-select') ? `<div class="studio-control-divider"></div>${TextField({ field: 'selectionPrompt', label: '问题标题', value: s.selectionPrompt })}${TextField({ field: 'selectionOptions', label: '选项（逗号分隔）', value: s.selectionOptions })}${s.messageType.startsWith('multi-select') ? TextField({ field: 'selectionCustomLabel', label: '自定义选项', value: s.selectionCustomLabel }) : ''}${TextField({ field: 'selectionConfirmLabel', label: '确定按钮', value: s.selectionConfirmLabel })}` : ''}
      ${s.messageType === 'form' ? `<div class="studio-control-divider"></div>${TextField({ field: 'formPrompt', label: '表单标题', value: s.formPrompt })}${TextField({ field: 'formFields', label: '字段（逗号分隔）', value: s.formFields })}${TextField({ field: 'formSubmitLabel', label: '提交按钮', value: s.formSubmitLabel })}` : ''}`;
  } else if (state.studioSection === 'artifact-card') {
    controls = `${common}<div class="studio-control"><span>产物类型</span>${Segmented({ field: 'artifactType', value: s.artifactType, options: [{ value: 'document', label: '文稿' }, { value: 'video', label: '视频' }, { value: 'image', label: '图片' }, { value: 'actor', label: '形象' }] })}</div>
      <label class="studio-check"><input type="checkbox" data-studio-check="artifactStatusEnabled" ${s.artifactStatusEnabled ? 'checked' : ''}><span>显示状态</span></label>
      ${TextField({ field: 'artifactStatusText', label: '状态名称（可自定义）', value: s.artifactStatusText })}
      <div class="studio-control"><span>状态语义</span>${Segmented({ field: 'artifactStatusTone', value: s.artifactStatusTone, options: [{ value: 'neutral', label: '默认' }, { value: 'progress', label: '进行中' }, { value: 'success', label: '完成' }, { value: 'danger', label: '失败' }] })}</div>
      <div class="studio-control-grid">${NumberField({ field: 'artifactRadius', label: '卡片圆角', value: s.artifactRadius, min: 0, max: 40 })}${NumberField({ field: 'artifactPadding', label: '卡片边距', value: s.artifactPadding, min: 4, max: 32 })}</div>
      ${NumberField({ field: 'artifactTitleSize', label: '标题字号', value: s.artifactTitleSize, min: 10, max: 24 })}`;
  } else if (state.studioSection === 'media-grid') {
    controls = `<div class="studio-control"><span>媒体类型</span>${Segmented({ field: 'mediaType', value: s.mediaType, options: [{ value: 'image', label: '图片' }, { value: 'video', label: '视频' }] })}</div><label><span>数量 <b>${s.mediaCount}</b></span><input type="range" min="1" max="8" step="1" data-studio-range="mediaCount" value="${s.mediaCount}"></label>`;
  } else if (state.studioSection === 'workbench') {
    controls = `<div class="studio-control"><span>产物类型</span>${Segmented({ field: 'artifactType', value: s.artifactType, options: [{ value: 'document', label: '文稿' }, { value: 'video', label: '视频' }, { value: 'image', label: '图片' }, { value: 'actor', label: '演员' }] })}</div><div class="studio-control"><span>视图</span>${Segmented({ field: 'workbenchView', value: s.workbenchView, options: [{ value: 'list', label: '列表' }, { value: 'detail', label: '详情' }] })}</div>`;
  }

  return `<aside class="studio-controls"><div class="studio-controls__head"><div><h2>Props & Style</h2><small>修改会自动保存并应用到 Demo</small></div><button data-action="studio-reset">重置</button></div><div class="studio-sync-status"><i></i> 本机已同步</div>${controls}</aside>`;
}

function ButtonsPreview(state) {
  const s = state.studio;
  return `<div class="studio-button-row">${Button({ label: s.sampleText, action: 'noop', icon: s.showButtonIcon ? 'video' : null, variant: s.buttonVariant })}${Button({ label: s.sampleText, action: 'noop', icon: s.showButtonIcon ? 'video' : null, variant: s.buttonVariant, className: 'is-hovered' })}<button class="aic-button aic-button--${s.buttonVariant}" disabled>${s.showButtonIcon ? Icon('video') : ''}<span>${escapeHtml(s.sampleText)}</span></button></div><div class="studio-state-labels"><span>Default</span><span>Hover</span><span>Disabled</span></div>`;
}

function IconButtonsPreview(state) {
  const s = state.studio;
  return `<div class="studio-button-row">${IconButton({ icon: s.selectedIcon, label: s.selectedIcon, action: 'noop', disabled: s.iconDisabled })}${IconButton({ icon: s.selectedIcon, label: s.selectedIcon, action: 'noop', className: 'is-hovered', disabled: s.iconDisabled })}<button class="aic-icon-button" disabled>${Icon(s.selectedIcon)}</button></div><div class="studio-state-labels"><span>Default</span><span>Hover</span><span>Disabled</span></div><div class="studio-icon-grid">${Object.keys(icons).map((name) => `<button data-action="studio-set" data-field="selectedIcon" data-value="${name}" title="${name}">${Icon(name)}<span>${name}</span></button>`).join('')}</div>`;
}

function ComposerPreview(state) {
  const s = state.studio;
  const confirmation = s.composerMode === 'confirmation'
    ? { prompt: s.confirmationPrompt, cancelLabel: s.confirmationCancelLabel, confirmLabel: s.confirmationConfirmLabel }
    : null;
  return `<div class="studio-composer-stage">${Composer({ draft: s.sampleText, attachment: s.composerAttachment ? project.product : null, busy: s.composerBusy, confirmation })}</div>`;
}

function MessagesPreview(state) {
  const s = state.studio;
  const images = media.actors.slice(0, 4);
  const videos = Array.from({ length: 3 }, (_, index) => ({ id: `studio-message-${index}`, title: `视频 ${index + 1}`, src: media.product }));
  const options = s.selectionOptions.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 3);
  const messages = [
    { studioKind: 'user', id: 'studio-user', role: 'user', type: 'text', text: s.sampleText },
    { studioKind: 'user-attachment', id: 'studio-user-attachment', role: 'user', type: 'text', text: `${s.sampleText} {attachment}`, attachment: project.product },
    { studioKind: 'assistant', id: 'studio-assistant', role: 'assistant', type: 'text', text: s.sampleText },
    { studioKind: 'assistant-long', id: 'studio-assistant-long', role: 'assistant', type: 'text', text: ['我已经理解你的目标，会先结合商品信息与大促节点梳理内容方向。', '接下来将给出几个可以选择的创意方案。'] },
    { studioKind: 'follow-up', id: 'studio-open-question', role: 'assistant', type: 'follow-up', text: '为了生成更符合要求的视频，我需要再确认几个信息：', questions: ['视频计划在哪个大促节点投放？', '主要面向哪一类目标人群？', '期望的视频时长是多少？'] },
    { studioKind: 'single-select', id: 'studio-single-select', role: 'assistant', type: 'single-select', prompt: s.selectionPrompt, options, submitLabel: s.selectionConfirmLabel },
    { studioKind: 'multi-select', id: 'studio-multi-select-default', role: 'assistant', type: 'multi-select', prompt: s.selectionPrompt, options, allowCustom: true, customLabel: s.selectionCustomLabel, submitLabel: s.selectionConfirmLabel },
    { studioKind: 'multi-select-selected', id: 'studio-multi-select-selected', role: 'assistant', type: 'multi-select', prompt: s.selectionPrompt, options, selected: [0, 2], allowCustom: true, customLabel: s.selectionCustomLabel, customOpen: true, submitLabel: s.selectionConfirmLabel },
    { studioKind: 'form', id: 'studio-form', role: 'assistant', type: 'form', prompt: s.formPrompt, fields: s.formFields.split(',').map((item, index) => ({ type: index === 1 ? 'select' : 'text', label: item.trim(), placeholder: index === 0 ? '例如：20-35岁年轻上班族' : '请输入', options: index === 1 ? ['15秒', '20秒', '30秒'] : undefined })).filter((item) => item.label), submitLabel: s.formSubmitLabel },
    { studioKind: 'progress', id: 'studio-run-thinking', role: 'assistant', kind: 'agent-run', variant: 'thinking', phase: 'running', title: '正在思考···' },
    { studioKind: 'thinking-complete', id: 'studio-run-completed', role: 'assistant', kind: 'agent-run', variant: 'thinking', phase: 'completed', detail: '用时5s' },
    { studioKind: 'execution', id: 'studio-run-executing', role: 'assistant', kind: 'agent-run', variant: 'execution', phase: 'executing', title: '开始执行···', detail: '1m30s', thought: '根据大促节点和产品特征，我会先深入分析成片诉求。', steps: [{ id: 'analysis', label: '正在进行需求分析', phase: 'running' }] },
    { studioKind: 'execution-complete', id: 'studio-run-execution-completed', role: 'assistant', kind: 'agent-run', variant: 'execution', phase: 'completed', detail: '用时3m20s', expanded: false, thought: '根据大促节点和产品特征，我会先深入分析成片诉求。', steps: [{ id: 'analysis', label: '需求分析已完成', phase: 'completed' }] },
    { studioKind: 'question-answered', id: 'studio-question-answered', role: 'assistant', kind: 'agent-question', variant: 'multi-select', phase: 'answered', placement: 'feed', text: '已确认：视频将用于双11节点和年货节投放', expanded: s.statusHistoryExpanded, history: { type: 'multi-select', prompt: s.selectionPrompt, options, selected: [0, 2] } },
    { studioKind: 'status', id: 'studio-status', role: 'assistant', type: 'status', text: '商品信息读取完成' },
    { studioKind: 'artifact', id: 'studio-artifact', role: 'assistant', type: 'artifact', artifactId: 'studio-message', artifactType: 'document', title: '即创螺蛳粉大促视频需求分析', timestamp: '2月5日 17:42', status: '已生成', statusTone: 'success', showStatus: true },
    { studioKind: 'images', id: 'studio-images', role: 'assistant', type: 'images', items: images },
    { studioKind: 'videos', id: 'studio-videos', role: 'assistant', type: 'videos', items: videos },
  ].filter((message) => s.messageType === 'all' || message.studioKind === s.messageType);
  return `<div class="studio-message-stage">${MessageFeed({ messages })}</div>`;
}

function ArtifactCardPreview(state) {
  const s = state.studio;
  const message = { role: 'assistant', type: 'artifact', artifactId: 'studio', artifactType: s.artifactType, title: s.sampleText, timestamp: '2月5日 17:42', status: s.artifactStatusText, statusTone: s.artifactStatusTone, showStatus: s.artifactStatusEnabled };
  return `<div class="studio-message-stage">${MessageFeed({ messages: [message] })}</div>`;
}

function MediaGridPreview(state) {
  const s = state.studio;
  const images = Array.from({ length: s.mediaCount }, (_, index) => media.actors[index % media.actors.length]);
  const videos = Array.from({ length: s.mediaCount }, (_, index) => ({ id: `studio-${index}`, title: `视频 ${index + 1}`, src: media.product }));
  const message = s.mediaType === 'video' ? { role: 'assistant', type: 'videos', items: videos } : { role: 'assistant', type: 'images', items: images };
  return `<div class="studio-message-stage">${MessageFeed({ messages: [message] })}</div>`;
}

function WorkbenchPreview(state) {
  const previewState = { artifactType: state.studio.artifactType, workbenchView: state.studio.workbenchView, artifactTreeOpen: state.studio.workbenchTreeOpen, activeVideo: 0, activeMedia: 0, playing: false };
  return `<div class="studio-workbench-stage">${ArtifactWorkbench(previewState)}</div>`;
}

function Preview(state) {
  if (state.studioSection === 'button') return ButtonsPreview(state);
  if (state.studioSection === 'icon-button') return IconButtonsPreview(state);
  if (state.studioSection === 'composer') return ComposerPreview(state);
  if (state.studioSection === 'message') return MessagesPreview(state);
  if (state.studioSection === 'artifact-card') return ArtifactCardPreview(state);
  if (state.studioSection === 'media-grid') return MediaGridPreview(state);
  return WorkbenchPreview(state);
}

export function StudioTemplate(state) {
  const current = sections.find(([id]) => id === state.studioSection)?.[1] || 'Components';
  return `
    <div class="studio-shell">
      ${StudioSidebar(state)}
      <main class="studio-main">
        <header class="studio-head"><div><span>Agent 2.0 / Components</span><h1>${current}</h1></div><button data-action="leave-studio">返回 Demo</button></header>
        <div class="studio-canvas"><section class="studio-preview"><div class="studio-preview__head"><span>Preview</span><small>实际页面组件</small></div><div class="studio-preview__body">${Preview(state)}</div></section>${ControlPanel(state)}</div>
      </main>
    </div>`;
}
