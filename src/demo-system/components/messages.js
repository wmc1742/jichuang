import { CheckboxOption, CustomOption, FormAction, RadioOption, SelectFieldControl, TextFieldControl } from './form-controls.js';
import { resolveConversationPresentation } from '../conversation/component-registry.js';
import { Icon, ProductAttachment, escapeHtml } from '../ui/primitives.js';

function editorAttributes(message, presentation) {
  const source = message.editorSource || `scenarioMessages.${message.id}`;
  const id = message.id ? ` data-editor-id="${escapeHtml(message.id)}" data-editor-source="${escapeHtml(source)}"` : '';
  return `data-editor-component="${presentation.component}" data-editor-renderer="${presentation.renderer}"${id}`;
}

function editorClass(message) {
  return message.editorSelected ? ' is-editor-selected' : '';
}

function UserMessage(message, presentation) {
  const text = escapeHtml(message.text);
  const attachment = message.attachment ? ProductAttachment(message.attachment) : '';
  const content = message.attachment
    ? text.includes('{attachment}') ? text.replace('{attachment}', attachment) : `${text}${attachment}`
    : text;
  return `<article class="message message--user${editorClass(message)}" ${editorAttributes(message, presentation)}><div class="user-bubble">${content}</div></article>`;
}

function AssistantText(message, presentation) {
  const paragraphs = Array.isArray(message.text) ? message.text : [message.text];
  const streaming = message.phase === 'streaming';
  return `<article class="message message--assistant${streaming ? ' is-streaming' : ''}${editorClass(message)}" ${editorAttributes(message, presentation)}>${paragraphs.map((line, index) => `<p><span${streaming && index === paragraphs.length - 1 ? ' data-role="assistant-stream"' : ''}>${escapeHtml(line)}</span>${streaming && index === paragraphs.length - 1 ? '<i class="assistant-stream-cursor" aria-hidden="true"></i>' : ''}</p>`).join('')}</article>`;
}

function FollowUpMessage(message, presentation) {
  const questions = message.questions || [];
  return `
    <article class="message message--assistant message--follow-up${editorClass(message)}" ${editorAttributes(message, presentation)}>
      <p>${escapeHtml(message.text)}</p>
      <ol>${questions.map((question) => `<li>${escapeHtml(question)}</li>`).join('')}</ol>
    </article>`;
}

function StatusMessage(message, presentation) {
  const expandable = message.expandable !== false && Boolean(message.history);
  const history = message.expanded ? SelectionHistory(message.history) : '';
  const icon = message.icon === 'none' ? '' : `<span class="status-icon">${Icon(message.icon || 'statusConfirmed')}</span>`;
  return `
    <article class="message message--status ${message.expanded ? 'is-expanded' : ''}${editorClass(message)}" ${editorAttributes(message, presentation)}>
      <button class="status-summary" type="button" ${expandable ? `data-action="toggle-status" data-message-id="${escapeHtml(message.id || '')}" aria-expanded="${message.expanded ? 'true' : 'false'}"` : 'disabled'}>
        ${icon}
        <span>${escapeHtml(message.text)}</span>
        ${expandable ? `<span class="status-chevron" aria-hidden="true">${Icon('chevronRight')}</span>` : ''}
      </button>
      ${history}
    </article>`;
}

function ProgressMessage(message, presentation) {
  const icon = message.icon && message.icon !== 'none' ? `<span class="progress-indicator" aria-hidden="true">${Icon(message.icon)}</span>` : '';
  const label = `${message.title || '正在思考'}`.replace(/[.·…]+$/u, '');
  return `
    <article class="message message--progress${editorClass(message)}" ${editorAttributes(message, presentation)}>
      <div class="progress-head">
        ${icon}
        <span class="progress-copy">
          <span class="progress-copy__label">${escapeHtml(label)}</span>
          <span class="progress-copy__dots" aria-hidden="true"><i></i><i></i><i></i></span>
          ${message.detail ? `<small class="progress-elapsed" data-role="run-elapsed">${escapeHtml(message.detail)}</small>` : ''}
        </span>
      </div>
      ${message.thought ? `<p class="progress-thought">${escapeHtml(message.thought)}</p>` : ''}
    </article>`;
}

function RunBlocks(message) {
  const step = (item) => {
    const phase = item.phase || 'running';
    const icon = phase === 'completed' ? 'executionComplete' : phase === 'failed' ? null : 'executionRunning';
    return `<div class="execution-step execution-step--${escapeHtml(phase)}">${icon ? `<span class="execution-step__icon" aria-hidden="true">${Icon(icon)}</span>` : '<span class="execution-step__icon execution-step__icon--failed" aria-hidden="true"></span>'}<span>${escapeHtml(item.label)}</span></div>`;
  };
  if (message.blocks?.length) {
    return message.blocks.map((block) => block.type === 'text'
      ? `<p>${escapeHtml(block.text)}</p>`
      : step(block)).join('');
  }
  return `${message.thought ? `<p>${escapeHtml(message.thought)}</p>` : ''}${(message.steps || []).map(step).join('')}`;
}

function RunCompleteMessage(message, presentation) {
  const expandable = Boolean(message.thought || message.steps?.length || message.blocks?.length);
  return `
    <article class="message message--thinking-complete ${message.expanded ? 'is-expanded' : ''}${editorClass(message)}" ${editorAttributes(message, presentation)}>
      <button class="thinking-complete__summary" type="button" ${expandable ? `data-action="toggle-run" data-message-id="${escapeHtml(message.id || '')}" aria-expanded="${message.expanded ? 'true' : 'false'}"` : 'disabled'}>
        <b>${escapeHtml(message.detail || message.title || '已完成')}</b>
        ${expandable ? `<span class="thinking-complete__chevron" aria-hidden="true">${Icon('chevronRight')}</span>` : ''}
      </button>
      ${message.expanded ? `<div class="execution-details run-history">${RunBlocks(message)}</div>` : ''}
    </article>`;
}

function ExecutionMessage(message, presentation) {
  const completed = message.phase === 'completed';
  const failed = message.phase === 'failed';
  const steps = message.steps || [];
  const showDetails = !completed || message.expanded;
  const title = message.title || (failed ? '执行失败' : completed ? '执行完成' : '开始执行...');
  return `
    <article class="message message--execution ${completed ? 'is-completed' : ''} ${message.expanded ? 'is-expanded' : ''}${editorClass(message)}" ${editorAttributes(message, presentation)}>
      <button class="execution-summary" type="button" ${completed ? `data-action="toggle-run" data-message-id="${escapeHtml(message.id || '')}" aria-expanded="${message.expanded ? 'true' : 'false'}"` : 'disabled'}>
        <span class="execution-summary__live"><span>${escapeHtml(title)}</span>${message.detail ? `<small data-role="run-elapsed">${escapeHtml(message.detail)}</small>` : ''}</span>
        ${completed ? `<span class="execution-summary__chevron">${Icon('chevronRight')}</span>` : ''}
      </button>
      ${showDetails ? `<div class="execution-details">${RunBlocks(message)}</div>` : ''}
    </article>`;
}

function SelectionHistory(history = {}, className = 'status-history') {
  if (history.type === 'multi-select') {
    const selected = new Set(history.selected || []);
    const options = (history.options || []).map((label, index) => {
      const checked = selected.has(index) || selected.has(label);
      return `<div class="history-option"><span>${escapeHtml(label)}</span><span class="history-checkbox ${checked ? 'is-selected' : ''}" aria-hidden="true">${checked ? Icon('checkboxSelected') : ''}</span></div>`;
    }).join('');
    return `
      <div class="${className}">
        <div class="question-form question-form--history">
          <div class="question-form__prompt">${escapeHtml(history.prompt || '历史选择')}</div>
          <div class="question-form__controls">${options}</div>
        </div>
      </div>`;
  }

  if (history.type === 'confirmation') {
    return `<div class="${className}"><div class="confirmation-history">${escapeHtml(history.prompt || '')}</div></div>`;
  }

  const fields = (history.fields || []).map((field) => `
    <div class="status-history__field"><span>${escapeHtml(field.label)}</span><b>${escapeHtml(field.value)}</b></div>`).join('');
  return fields ? `<div class="${className}"><div class="question-form question-form--history"><div class="question-form__title">${Icon('selectionForm')}<span>${escapeHtml(history.prompt || '历史填写')}</span></div><div class="question-form__controls">${fields}</div></div></div>` : '';
}

function AnsweredQuestionMessage(message, presentation) {
  const expandable = Boolean(message.history);
  const icon = message.icon === 'none' ? '' : `<span class="answered-question__icon">${Icon(message.icon || 'questionConfirm')}</span>`;
  return `
    <article class="message message--question-answered ${message.expanded ? 'is-expanded' : ''}${editorClass(message)}" ${editorAttributes(message, presentation)}>
      <button class="answered-question__summary" type="button" ${expandable ? `data-action="toggle-status" data-message-id="${escapeHtml(message.id || '')}" aria-expanded="${message.expanded ? 'true' : 'false'}"` : 'disabled'}>
        ${icon}<span>${escapeHtml(message.text)}</span>
        ${expandable ? `<span class="answered-question__chevron" aria-hidden="true">${Icon('chevronRight')}</span>` : ''}
      </button>
      ${message.expanded ? SelectionHistory(message.history, 'answered-question__history') : ''}
    </article>`;
}

function QuestionForm({ message, body, presentation }) {
  const icon = message.icon === 'none' ? '' : Icon(message.icon || 'questionConfirm');
  return `
    <article class="message message--question-form${editorClass(message)}" ${editorAttributes(message, presentation)}>
      <div class="question-state-title">${icon ? `<span class="question-state-icon" aria-hidden="true">${icon}</span>` : ''}<span>请确认</span></div>
      <form class="question-form" data-message-id="${escapeHtml(message.id || '')}" onsubmit="return false">
        <div class="question-form__prompt">${escapeHtml(message.prompt || '请确认以下信息')}</div>
        <div class="question-form__controls">${body}</div>
        ${FormAction({ label: message.submitLabel })}
      </form>
    </article>`;
}

function MultiSelectMessage(message, presentation) {
  const name = message.id || 'multi-select';
  const selected = new Set(message.selected || []);
  const options = (message.options || []).map((label, index) => CheckboxOption({ name, label, checked: selected.has(index) || selected.has(label) })).join('');
  const customOption = message.allowCustom
    ? CustomOption({ name, label: message.customLabel || '自定义', value: message.customValue || '', open: Boolean(message.customOpen) })
    : '';
  const body = options + customOption;
  return QuestionForm({ message, body, presentation });
}

function SingleSelectMessage(message, presentation) {
  const name = message.id || 'single-select';
  const selected = new Set(message.selected || []);
  const body = (message.options || []).map((label, index) => RadioOption({
    name,
    label,
    checked: selected.has(index) || selected.has(label),
  })).join('');
  return QuestionForm({ message, body, presentation });
}

function FormMessage(message, presentation) {
  const body = (message.fields || []).map((field) => field.type === 'select'
    ? SelectFieldControl({ ...field, name: field.name || field.label })
    : TextFieldControl({ ...field, name: field.name || field.label })).join('');
  return QuestionForm({ message, body, presentation });
}

function ConfirmationMessage(message, presentation) {
  const credit = message.credit ? `<span class="confirmation-credit">${Icon('credit')}<b>${escapeHtml(message.credit)}</b></span>` : '';
  const icon = message.icon === 'none' ? '' : Icon(message.icon || 'questionConfirm');
  return `
    <article class="message message--confirmation${editorClass(message)}" ${editorAttributes(message, presentation)}>
      <div class="question-state-title">${icon ? `<span class="question-state-icon" aria-hidden="true">${icon}</span>` : ''}<span>请确认</span></div>
      <div class="confirmation-card">
        <p>${escapeHtml(message.prompt || '')}</p>
        <div class="confirmation-card__actions">
          <button class="confirmation-card__cancel" type="button" data-action="cancel-confirmation" data-interaction="${escapeHtml(message.id || '')}">${escapeHtml(message.cancelLabel || '取消')}</button>
          <button class="confirmation-card__confirm" type="button" data-action="confirm-choice" data-interaction="${escapeHtml(message.id || '')}">${credit}${escapeHtml(message.confirmLabel || '确认')}</button>
        </div>
      </div>
    </article>`;
}

function resolveArtifacts(message, artifacts = []) {
  const map = new Map(artifacts.map((artifact) => [artifact.id, artifact]));
  const ids = message.artifactIds || (message.artifactId ? [message.artifactId] : []);
  const resolved = ids.map((id) => map.get(id)).filter(Boolean);
  if (resolved.length) return resolved;
  return (message.items || []).map((item, index) => typeof item === 'string'
    ? { id: `${message.id || 'artifact'}-${index}`, title: `${message.itemLabel || '图片'}${index + 1}`, previewUrl: item }
    : { ...item, previewUrl: item.previewUrl || item.src });
}

function DocumentArtifactPresentation(message, presentation, context) {
  const artifact = resolveArtifacts(message, context.artifacts)[0] || message;
  const status = message.showStatus === true ? (message.status || artifact.statusLabel) : '';
  const statusMarkup = status
    ? `<span class="artifact-card__status artifact-card__status--success">${escapeHtml(status)}</span>`
    : '';
  return `
    <article class="message message--artifact${editorClass(message)}" ${editorAttributes(message, presentation)}>
      <button class="artifact-card" data-action="open-artifact" data-artifact="${escapeHtml(artifact.id || message.artifactId || '')}" data-type="${escapeHtml(artifact.type || 'document')}">
        <span class="artifact-card__main"><span class="artifact-card__title">${message.icon === 'none' ? '' : Icon(message.icon || 'document')}<b>${escapeHtml(artifact.title || message.title)}</b>${statusMarkup}</span><span class="artifact-card__time">${escapeHtml(artifact.createdAt || message.timestamp || '')}</span></span>
        <span class="artifact-card__view">查看</span>
      </button>
    </article>`;
}

function ArtifactImageGrid(message, presentation, context, character = false) {
  const artifacts = resolveArtifacts(message, context.artifacts);
  const action = character ? 'open-actor' : 'open-image';
  return `<article class="message media-grid media-grid--images ${character ? 'media-grid--actors' : 'media-grid--products'}${editorClass(message)}" ${editorAttributes(message, presentation)}>${artifacts.map((artifact, index) => `<button data-action="${action}" data-index="${index}" data-artifact="${escapeHtml(artifact.id || '')}"><img src="${escapeHtml(artifact.previewUrl || '')}" alt="${escapeHtml(artifact.title || `图片${index + 1}`)}"></button>`).join('')}</article>`;
}

function CharacterArtifactPresentation(message, presentation, context) {
  return ArtifactImageGrid(message, presentation, context, true);
}

function ImageArtifactPresentation(message, presentation, context) {
  return ArtifactImageGrid(message, presentation, context, false);
}

function VideoArtifactPresentation(message, presentation, context) {
  const artifacts = resolveArtifacts(message, context.artifacts);
  return `<article class="message media-grid media-grid--videos${editorClass(message)}" ${editorAttributes(message, presentation)}>${artifacts.map((artifact, index) => `<button data-action="open-video" data-index="${index}" data-artifact="${escapeHtml(artifact.id || '')}"><img src="${escapeHtml(artifact.previewUrl || '')}" alt="${escapeHtml(artifact.title || `视频${index + 1}`)}"><span class="play-button">${Icon('play')}</span></button>`).join('')}</article>`;
}

const renderers = Object.freeze({
  UserMessage,
  AssistantText,
  FollowUpMessage,
  StatusMessage,
  AnsweredQuestionMessage,
  ProgressMessage,
  RunCompleteMessage,
  ExecutionMessage,
  MultiSelectMessage,
  SingleSelectMessage,
  FormMessage,
  ConfirmationMessage,
  DocumentArtifactPresentation,
  ImageArtifactPresentation,
  CharacterArtifactPresentation,
  VideoArtifactPresentation,
});

export function MessageFeed({ messages, artifacts = [] }) {
  const body = messages.map((input) => {
    const presentation = resolveConversationPresentation(input);
    if (presentation.placement !== 'feed') return '';
    const renderer = renderers[presentation.renderer] || AssistantText;
    return renderer(presentation.node, presentation, { artifacts });
  }).join('');

  return `<div class="message-feed">${body}</div>`;
}
