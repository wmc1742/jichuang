import {
  completedScenarioMessages,
  confirmationScenarioMessages,
  getScenarioMessage,
  implicitInteractionByRun,
  project,
  scenarioInteractions,
  scenarioArtifacts,
  scenarioMessages,
  scenarioRuns,
} from './scenarios/luosifen.js?v=20260904e';
import { media } from './data/assets.js?v=20260904e';
import { HomeTemplate } from './templates/home.js?v=20260904e';
import { StudioTemplate } from './templates/studio.js?v=20260904e';
import { WorkspaceTemplate } from './templates/workspace.js?v=20260904e';
import { normalizeConversationNodes } from './conversation/model.js';
import { appendConversationNodes, applyConversationEvent, ConversationEvent } from './conversation/runtime.js';
import { formatLiveElapsed, getRunSimulationPlan } from './conversation/simulation.js';

const urlParams = new URLSearchParams(window.location.search);
const studioMode = urlParams.get('studio') === '1';
const viewMode = urlParams.get('view') || 'home';
const stageMode = urlParams.get('stage');
const editorMode = urlParams.get('edit') === '1';
const workspaceView = ['new', 'conversation', 'video-list', 'video-detail'].includes(viewMode);
const newTaskView = viewMode === 'new';
const snapshotMode = editorMode || urlParams.get('snapshot') === '1' || stageMode === 'complete';
const interactiveConversationEntry = viewMode === 'conversation' && !snapshotMode;
const STUDIO_STORAGE_KEY = 'aic-agent-component-settings-v1';
const EDITOR_PREVIEW_STORAGE_KEY = 'aic-agent-conversation-overrides-v1';
const EDITOR_CONFIG_URL = './src/demo-system/editor/conversation-overrides.json';
const staticEditorPreview = window.location.hostname.endsWith('.github.io') || window.location.protocol === 'file:';

function loadPreviewConversationConfig() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(EDITOR_PREVIEW_STORAGE_KEY) || '{}');
    return { instances: saved.instances || {}, tokens: saved.tokens || {} };
  } catch {
    return { instances: {}, tokens: {} };
  }
}

async function loadConversationConfig() {
  try {
    const response = await fetch(`${EDITOR_CONFIG_URL}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Unable to load editor config');
    const config = await response.json();
    const preview = loadPreviewConversationConfig();
    return {
      instances: { ...(config.instances || {}), ...preview.instances },
      tokens: { ...(config.tokens || {}), ...preview.tokens },
    };
  } catch {
    const preview = loadPreviewConversationConfig();
    return { instances: preview.instances, tokens: { messageGap: 12, ...preview.tokens } };
  }
}

const initialConversationConfig = await loadConversationConfig();

function applyConversationConfig(messages, config = initialConversationConfig) {
  return normalizeConversationNodes(messages.flatMap((message) => {
    const override = config.instances?.[message.id] || {};
    if (override.hidden) return [];
    return [{ ...message, ...override, hidden: undefined }];
  }));
}

function applyConversationTokens(config) {
  const messageGap = Number(config.tokens?.messageGap);
  if (Number.isFinite(messageGap)) document.documentElement.style.setProperty('--message-stack-gap', `${messageGap}px`);
}

function cloneEditorConfig(config) {
  return JSON.parse(JSON.stringify(config));
}

const studioDefaults = {
  sampleText: '确认并继续',
  buttonVariant: 'inverted',
  showButtonIcon: true,
  selectedIcon: 'video',
  iconDisabled: false,
  composerAttachment: true,
  composerBusy: false,
  composerMode: 'default',
  composerAlignment: 'center',
  composerGap: 8,
  composerRadius: 24,
  composerFontSize: 16,
  composerLineHeight: 28,
  messageType: 'all',
  messageGap: 12,
  messageFontSize: 14,
  statusHistoryExpanded: false,
  userBubbleRadius: 20,
  userBubblePadding: 16,
  confirmationPrompt: '是否确认开始成片，预计消耗100积分',
  confirmationCancelLabel: '取消',
  confirmationConfirmLabel: '确认',
  selectionPrompt: '请确认视频用于哪类大促投放',
  selectionOptions: '双11节点,圣诞/元旦跨年,春节/年货节',
  selectionCustomLabel: '自定义',
  selectionConfirmLabel: '确定',
  formPrompt: '请补充本次视频投放信息',
  formFields: '主要目标人群,期望视频时长,核心促销利益点',
  formSubmitLabel: '提交',
  artifactType: 'video',
  artifactStatusEnabled: true,
  artifactStatusText: '已生成',
  artifactStatusTone: 'success',
  artifactRadius: 20,
  artifactPadding: 16,
  artifactTitleSize: 16,
  mediaType: 'video',
  mediaCount: 5,
  workbenchView: 'detail',
  workbenchTreeOpen: false,
};

function loadStudioSettings() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STUDIO_STORAGE_KEY) || '{}');
    if (saved.selectionOptions) {
      saved.selectionOptions = saved.selectionOptions.split(',').map((item) => item.trim()).filter((item) => item && item !== '以上全部').join(',');
    }
    if (saved.messageType === 'confirmation') saved.messageType = 'all';
    return { ...studioDefaults, ...saved };
  } catch {
    return { ...studioDefaults };
  }
}

function applyStudioSettings(settings) {
  const variables = {
    '--composer-entry-align': settings.composerAlignment,
    '--composer-entry-gap': `${settings.composerGap}px`,
    '--composer-radius': `${settings.composerRadius}px`,
    '--composer-font-size': `${settings.composerFontSize}px`,
    '--composer-line-height': `${settings.composerLineHeight}px`,
    '--message-stack-gap': `${settings.messageGap}px`,
    '--message-font-size': `${settings.messageFontSize}px`,
    '--user-bubble-radius': `${settings.userBubbleRadius}px`,
    '--user-bubble-padding': `${settings.userBubblePadding}px`,
    '--artifact-card-radius': `${settings.artifactRadius}px`,
    '--artifact-card-padding': `${settings.artifactPadding}px`,
    '--artifact-title-size': `${settings.artifactTitleSize}px`,
  };
  Object.entries(variables).forEach(([name, value]) => document.documentElement.style.setProperty(name, value));
}

function persistStudioSettings() {
  try {
    window.localStorage.setItem(STUDIO_STORAGE_KEY, JSON.stringify(state.studio));
  } catch {
    // The workbench remains usable when storage is unavailable.
  }
  applyStudioSettings(state.studio);
}

const state = {
  page: studioMode ? 'studio' : workspaceView ? 'workspace' : 'home',
  draft: interactiveConversationEntry ? '根据 即创螺蛳粉 这个商品为我生成用于大促推广的视频' : '',
  attachment: interactiveConversationEntry ? project.product : null,
  messages: workspaceView && !newTaskView && snapshotMode ? applyConversationConfig(completedScenarioMessages, initialConversationConfig) : [],
  artifacts: structuredClone(scenarioArtifacts),
  scenarioStage: workspaceView && !newTaskView && snapshotMode ? 8 : 1,
  taskMode: newTaskView || interactiveConversationEntry ? 'new' : workspaceView ? 'existing' : null,
  projectTitle: newTaskView || interactiveConversationEntry ? '新的项目' : '即创螺蛳粉',
  busy: false,
  projectMenuOpen: false,
  settingsOpen: false,
  sidebarCollapsed: false,
  workbenchView: editorMode ? null : viewMode === 'video-list' ? 'list' : viewMode === 'video-detail' ? 'detail' : null,
  artifactType: 'video',
  activeArtifact: null,
  activeVideo: 0,
  activeMedia: 0,
  playing: false,
  artifactTreeOpen: false,
  studioSection: 'button',
  studio: loadStudioSettings(),
  editor: {
    enabled: editorMode && workspaceView && !newTaskView,
    selectedId: null,
    selectedComponent: null,
    selectedSource: null,
    config: initialConversationConfig,
    history: [],
    saveState: 'saved',
    localOnly: staticEditorPreview,
  },
};

const app = document.querySelector('#app');
let studioInputTimer;
let activeRunTimer = null;
let activeRunOutputTimer = null;
let activeRunToken = 0;

function cancelActiveRun() {
  activeRunToken += 1;
  window.clearInterval(activeRunTimer);
  window.clearTimeout(activeRunOutputTimer);
  activeRunTimer = null;
  activeRunOutputTimer = null;
}

function setViewMode(view) {
  const url = new URL(window.location.href);
  url.searchParams.delete('studio');
  url.searchParams.delete('stage');
  url.searchParams.set('view', view);
  window.history.replaceState({}, '', url);
}

function render({ keepScroll = true, scrollToEnd = false } = {}) {
  const previous = document.querySelector('[data-role="conversation-scroll"]');
  const scrollTop = previous?.scrollTop || 0;
  const renderState = state.editor.enabled
    ? { ...state, messages: state.messages.map((message) => ({ ...message, editorSelected: message.id === state.editor.selectedId })) }
    : state;
  app.innerHTML = state.page === 'studio' ? StudioTemplate(renderState) : state.page === 'home' ? HomeTemplate(renderState) : WorkspaceTemplate(renderState);
  const next = document.querySelector('[data-role="conversation-scroll"]');
  if (next && keepScroll) next.scrollTop = scrollToEnd ? next.scrollHeight : scrollTop;
  document.querySelectorAll('.question-form').forEach(updateQuestionFormState);
}

function updateQuestionFormState(form) {
  const optionInputs = [...form.querySelectorAll('.form-option > input')];
  let complete;
  if (optionInputs.length) {
    const hasSelection = optionInputs.some((input) => input.checked);
    const customEnabled = form.querySelector('.form-custom__toggle')?.checked;
    const customValue = form.querySelector('.form-custom__input')?.value.trim();
    complete = hasSelection || Boolean(customEnabled && customValue);
  } else {
    const fields = [...form.querySelectorAll('.form-field input, .form-field select')];
    complete = fields.length > 0 && fields.every((field) => field.value.trim());
  }
  form.classList.toggle('is-complete', Boolean(complete));
  const action = form.querySelector('[data-action="form-submit"]');
  if (action) action.disabled = !complete;
}

function syncDraft() {
  const selector = state.page === 'workspace'
    ? '.conversation-composer [data-role="composer-input"], .new-task-stage [data-role="composer-input"]'
    : '[data-role="composer-input"]';
  const input = document.querySelector(selector);
  if (input) state.draft = `${input.dataset.draftPrefix || ''}${input.dataset.draftAttachment || ''}${input.value}`;
}

function openExistingTask() {
  cancelActiveRun();
  setViewMode('conversation');
  Object.assign(state, {
    page: 'workspace',
    messages: applyConversationConfig(completedScenarioMessages, state.editor.config),
    artifacts: structuredClone(scenarioArtifacts),
    scenarioStage: 8,
    taskMode: 'existing',
    projectTitle: '即创螺蛳粉',
    workbenchView: null,
    projectMenuOpen: false,
    settingsOpen: false,
    draft: '',
    attachment: null,
    busy: false,
  });
  render({ keepScroll: false });
}

function openNewTask() {
  cancelActiveRun();
  setViewMode('new');
  Object.assign(state, {
    page: 'workspace',
    taskMode: 'new',
    projectTitle: '新的项目',
    messages: [],
    scenarioStage: 1,
    workbenchView: null,
    draft: '',
    attachment: null,
    busy: false,
    projectMenuOpen: false,
    settingsOpen: false,
  });
  render({ keepScroll: false });
}

function startScenario() {
  cancelActiveRun();
  setViewMode('conversation');
  const request = state.draft.trim() || '根据 即创螺蛳粉 这个商品为我生成用于大促推广的视频';
  const firstMessage = { ...scenarioMessages[0], text: request.includes('即创螺蛳粉') ? scenarioMessages[0].text : request, attachment: state.attachment || project.product };
  const configuredFirstMessage = applyConversationConfig([firstMessage], state.editor.config)[0] || firstMessage;
  Object.assign(state, {
    page: 'workspace',
    taskMode: 'existing',
    projectTitle: '即创螺蛳粉',
    messages: [configuredFirstMessage, getScenarioMessage('welcome')],
    artifacts: structuredClone(scenarioArtifacts),
    scenarioStage: 1,
    draft: '',
    attachment: null,
  });
  render({ keepScroll: false, scrollToEnd: true });
  runAgentStage(1);
}

function runAgentStage(runId) {
  const run = scenarioRuns[runId];
  if (!run) return;
  cancelActiveRun();
  const runToken = activeRunToken;
  const simulation = getRunSimulationPlan(run);
  const progress = run.thinking;
  state.messages = applyConversationEvent(state.messages, {
    type: ConversationEvent.RUN_STARTED,
    runId,
    variant: 'thinking',
    title: '正在思考···',
    detail: formatLiveElapsed(0),
    ...progress,
    editorSource: `scenarioRuns.${runId}.thinking`,
  });
  state.busy = true;
  render({ scrollToEnd: true });
  const completeRun = () => {
    window.clearInterval(activeRunTimer);
    activeRunTimer = null;
    state.messages = applyConversationEvent(state.messages, {
      type: ConversationEvent.RUN_COMPLETED,
      runId,
      detail: run.elapsed,
      steps: run.execution?.completedSteps,
      blocks: run.execution?.completedBlocks,
    });
    render({ scrollToEnd: true });
    activeRunOutputTimer = window.setTimeout(() => {
      if (runToken !== activeRunToken) return;
      state.messages = appendConversationNodes(
        state.messages,
        applyConversationConfig(run.outputIds.map(getScenarioMessage).filter(Boolean), state.editor.config),
      );
      state.scenarioStage = runId;
      state.busy = false;
      activeRunOutputTimer = null;
      render({ scrollToEnd: true });
    }, 520);
  };
  const startedAt = performance.now();
  let previousElapsed = -1;
  let executionStarted = false;
  const tick = () => {
    if (runToken !== activeRunToken) return;
    const elapsedSeconds = Math.min(simulation.durationSeconds, Math.floor((performance.now() - startedAt) / 1000));
    if (elapsedSeconds !== previousElapsed) {
      const detail = formatLiveElapsed(elapsedSeconds);
      previousElapsed = elapsedSeconds;
      state.messages = applyConversationEvent(state.messages, {
        type: ConversationEvent.RUN_TIMER_TICK,
        runId,
        elapsedSeconds,
        detail,
      });
      const clock = document.querySelector(`[data-editor-id="run-${runId}"] [data-role="run-elapsed"]`);
      if (clock) clock.textContent = detail;
    }
    if (run.execution && !executionStarted && elapsedSeconds >= simulation.executionStartSecond) {
      executionStarted = true;
      state.messages = applyConversationEvent(state.messages, {
        type: ConversationEvent.RUN_EXECUTING,
        runId,
        ...run.execution,
        detail: formatLiveElapsed(elapsedSeconds),
      });
      render({ scrollToEnd: true });
    }
    if (elapsedSeconds >= simulation.durationSeconds) completeRun();
  };
  tick();
  activeRunTimer = window.setInterval(tick, 200);
}

function advanceScenario(text, interactionId = null) {
  const interaction = interactionId ? scenarioInteractions[interactionId] : null;
  const nextRun = interaction?.nextRun || Math.min(state.scenarioStage + 1, 8);
  state.messages = appendConversationNodes(state.messages, [{ id: `custom-${Date.now()}`, role: 'user', type: 'text', text, attachment: state.attachment }]);
  state.draft = '';
  state.attachment = null;
  runAgentStage(nextRun);
}

function openWorkbench(type = 'video', detail = false) {
  Object.assign(state, {
    page: 'workspace',
    artifactType: type,
    workbenchView: detail ? 'detail' : 'list',
    artifactTreeOpen: false,
    playing: false,
  });
}

function getEditorBaseMessage(id) {
  return [...completedScenarioMessages, ...confirmationScenarioMessages].find((message) => message.id === id) || null;
}

function pushEditorHistory() {
  state.editor.history.push(cloneEditorConfig(state.editor.config));
  if (state.editor.history.length > 30) state.editor.history.shift();
}

function applyEditorConfigToConversation() {
  const sourceMessages = completedScenarioMessages;
  state.messages = applyConversationConfig(sourceMessages, state.editor.config);
  applyConversationTokens(state.editor.config);
}

async function persistConversationConfig() {
  state.editor.saveState = 'saving';
  render();
  try {
    window.localStorage.setItem(EDITOR_PREVIEW_STORAGE_KEY, JSON.stringify(state.editor.config));
  } catch {
    // Preview edits still remain active for the current page session.
  }
  if (state.editor.localOnly) {
    state.editor.saveState = 'local';
    render();
    return;
  }
  try {
    const response = await fetch('/__editor/conversation-overrides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state.editor.config),
    });
    if (!response.ok) throw new Error('Unable to save editor config');
    state.editor.saveState = 'saved';
  } catch {
    state.editor.saveState = 'error';
  }
  render();
}

function normalizeEditorValue(baseMessage, key, value) {
  if (key === 'text' && Array.isArray(baseMessage?.text)) {
    return value.split('\n').map((line) => line.trim()).filter(Boolean);
  }
  return value;
}

app.addEventListener('input', (event) => {
  const questionForm = event.target.closest('.question-form');
  if (questionForm) updateQuestionFormState(questionForm);
  if (event.target.matches('[data-role="composer-input"]')) {
    state.draft = `${event.target.dataset.draftPrefix || ''}${event.target.dataset.draftAttachment || ''}${event.target.value}`;
    const composer = event.target.closest('.composer');
    const sendButton = composer?.querySelector('[data-action="send-message"]');
    if (sendButton) sendButton.disabled = state.busy || !state.draft.trim();
  }
  if (event.target.matches('[data-studio-input]')) {
    const field = event.target.dataset.studioInput;
    const selectionStart = event.target.selectionStart;
    const selectionEnd = event.target.selectionEnd;
    state.studio[field] = event.target.value;
    persistStudioSettings();
    if (!event.isComposing) {
      window.clearTimeout(studioInputTimer);
      studioInputTimer = window.setTimeout(() => {
        render();
        const nextInput = document.querySelector(`[data-studio-input="${field}"]`);
        nextInput?.focus();
        nextInput?.setSelectionRange(selectionStart, selectionEnd);
      }, 300);
    }
  }
  if (event.target.matches('[data-studio-number]') && event.target.value !== '') {
    state.studio[event.target.dataset.studioNumber] = Number(event.target.value);
    persistStudioSettings();
  }
  if (event.target.matches('[data-studio-range]')) {
    state.studio[event.target.dataset.studioRange] = Number(event.target.value);
    persistStudioSettings();
    render();
  }
});

app.addEventListener('change', (event) => {
  const questionForm = event.target.closest('.question-form');
  if (questionForm) updateQuestionFormState(questionForm);
  if (event.target.matches('[data-studio-input]')) {
    state.studio[event.target.dataset.studioInput] = event.target.value;
    persistStudioSettings();
    render();
  }
  if (event.target.matches('[data-studio-check]')) {
    state.studio[event.target.dataset.studioCheck] = event.target.checked;
    persistStudioSettings();
    render();
  }
  if (event.target.matches('[data-studio-select]')) {
    state.studio[event.target.dataset.studioSelect] = event.target.value;
    persistStudioSettings();
    render();
  }
  if (event.target.matches('[data-studio-number]')) {
    state.studio[event.target.dataset.studioNumber] = Number(event.target.value);
    persistStudioSettings();
    render();
  }
});

app.addEventListener('click', async (event) => {
  if (state.editor.enabled && !event.target.closest('.conversation-editor')) {
    const editable = event.target.closest('[data-editor-id]');
    if (editable) {
      state.editor.selectedId = editable.dataset.editorId;
      state.editor.selectedComponent = editable.dataset.editorComponent;
      state.editor.selectedSource = editable.dataset.editorSource;
      render();
      return;
    }
  }

  const target = event.target.closest('[data-action]');
  if (!target) return;
  syncDraft();
  const action = target.dataset.action;

  if (action === 'exit-editor') {
    const url = new URL(window.location.href);
    url.searchParams.delete('edit');
    window.history.replaceState({}, '', url);
    state.editor.enabled = false;
    state.editor.selectedId = null;
    state.editor.selectedComponent = null;
    state.editor.selectedSource = null;
  } else if (action === 'enter-editor') {
    const url = new URL(window.location.href);
    url.searchParams.set('edit', '1');
    window.history.replaceState({}, '', url);
    state.editor.enabled = true;
    state.editor.selectedId = null;
    state.editor.selectedComponent = null;
    state.editor.selectedSource = null;
    state.editor.saveState = state.editor.localOnly ? 'local' : 'saved';
    state.projectMenuOpen = false;
    state.workbenchView = null;
  } else if (action === 'editor-save') {
    const form = target.closest('[data-role="conversation-editor-form"]');
    const messageId = form?.dataset.messageId;
    if (!form || !messageId) return;
    pushEditorHistory();
    const baseMessage = getEditorBaseMessage(messageId);
    const override = { ...(state.editor.config.instances?.[messageId] || {}) };
    form.querySelectorAll('[data-editor-prop]').forEach((field) => {
      if (field.type === 'radio' && !field.checked) return;
      override[field.dataset.editorProp] = normalizeEditorValue(baseMessage, field.dataset.editorProp, field.value);
    });
    state.editor.config.instances[messageId] = override;
    const gapInput = form.querySelector('[data-editor-token="messageGap"]');
    if (gapInput && gapInput.value !== '') state.editor.config.tokens.messageGap = Number(gapInput.value);
    applyEditorConfigToConversation();
    await persistConversationConfig();
    return;
  } else if (action === 'editor-delete') {
    const messageId = target.closest('[data-role="conversation-editor-form"]')?.dataset.messageId;
    if (!messageId) return;
    pushEditorHistory();
    state.editor.config.instances[messageId] = { ...(state.editor.config.instances[messageId] || {}), hidden: true };
    state.editor.selectedId = null;
    state.editor.selectedComponent = null;
    state.editor.selectedSource = null;
    applyEditorConfigToConversation();
    await persistConversationConfig();
    return;
  } else if (action === 'editor-reset') {
    const messageId = target.closest('[data-role="conversation-editor-form"]')?.dataset.messageId;
    if (!messageId) return;
    pushEditorHistory();
    delete state.editor.config.instances[messageId];
    applyEditorConfigToConversation();
    await persistConversationConfig();
    return;
  } else if (action === 'editor-undo') {
    const previous = state.editor.history.pop();
    if (!previous) return;
    state.editor.config = previous;
    applyEditorConfigToConversation();
    await persistConversationConfig();
    return;
  } else if (action === 'leave-studio') {
    window.history.replaceState({}, '', window.location.pathname);
    Object.assign(state, { page: 'home', workbenchView: null });
  } else if (action === 'studio-section') {
    state.studioSection = target.dataset.section;
  } else if (action === 'studio-set') {
    const current = state.studio[target.dataset.field];
    state.studio[target.dataset.field] = typeof current === 'number' ? Number(target.dataset.value) : target.dataset.value;
    persistStudioSettings();
  } else if (action === 'studio-reset') {
    state.studio = { ...studioDefaults };
    persistStudioSettings();
  } else if (state.page === 'studio' && action === 'toggle-status') {
    state.studio.statusHistoryExpanded = !state.studio.statusHistoryExpanded;
    persistStudioSettings();
  } else if (state.page === 'studio' && action === 'toggle-artifact-tree') {
    state.studio.workbenchTreeOpen = !state.studio.workbenchTreeOpen;
    persistStudioSettings();
  } else if (state.page === 'studio') {
    return;
  } else if (action === 'home') {
    cancelActiveRun();
    setViewMode('home');
    Object.assign(state, { page: 'home', workbenchView: null, messages: [], draft: '', attachment: null, busy: false });
  } else if (action === 'new-task') {
    openNewTask();
    return;
  } else if (action === 'open-task') {
    openExistingTask();
    return;
  } else if (action === 'toggle-project-menu') {
    state.projectMenuOpen = !state.projectMenuOpen;
  } else if (action === 'share-task') {
    state.projectMenuOpen = false;
  } else if (action === 'open-conversation-settings') {
    state.projectMenuOpen = false;
    state.settingsOpen = true;
  } else if (action === 'close-conversation-settings') {
    state.settingsOpen = false;
  } else if (action === 'delete-task') {
    state.projectMenuOpen = false;
  } else if (action === 'toggle-sidebar') {
    state.sidebarCollapsed = !state.sidebarCollapsed;
  } else if (action === 'select-product') {
    state.attachment = project.product;
  } else if (action === 'clear-attachment') {
    state.attachment = null;
  } else if (action === 'choose-skill') {
    state.draft = `根据 即创螺蛳粉 这个商品为我生成${target.dataset.skill}`;
    state.attachment = project.product;
  } else if (action === 'scroll-skills') {
    const track = target.parentElement.querySelector('.new-task-skill-track');
    track?.scrollBy({ left: target.dataset.direction === 'left' ? -336 : 336, behavior: 'smooth' });
    return;
  } else if (action === 'send-message') {
    if (state.busy) return;
    if (state.page === 'home' || state.taskMode === 'new') {
      startScenario();
      return;
    }
    if (!state.draft.trim()) return;
    advanceScenario(state.draft.trim(), implicitInteractionByRun[state.scenarioStage] || null);
    return;
  } else if (action === 'form-submit') {
    const form = target.closest('.question-form');
    if (!form || target.disabled) return;
    const messageId = form.dataset.messageId;
    const optionInputs = [...form.querySelectorAll('.form-option > input:checked')];
    let answer = null;
    const interaction = scenarioInteractions[messageId];
    if (optionInputs.length || form.querySelector('.form-custom__toggle')) {
      const values = optionInputs.map((input) => input.value);
      const customEnabled = form.querySelector('.form-custom__toggle')?.checked;
      const customValue = form.querySelector('.form-custom__input')?.value.trim();
      if (customEnabled && customValue) values.push(customValue);
      if (!values.length) return;
      answer = { selected: values };
    } else {
      const values = Object.fromEntries([...form.querySelectorAll('.form-field input, .form-field select')].map((field) => [field.name, field.value.trim()]));
      if (Object.values(values).some((value) => !value)) return;
      if (messageId === 'audience-form') {
        answer = values;
      } else if (messageId === 'direction-form') {
        answer = values;
      } else {
        answer = values;
      }
    }
    const submittedHistory = interaction?.history?.type === 'multi-select'
      ? { ...interaction.history, selected: answer.selected }
      : interaction?.history;
    const submittedSummary = interaction?.history?.type === 'multi-select'
      ? `已确认：视频用于${answer.selected.join('、')}`
      : interaction?.summary;
    state.messages = applyConversationEvent(state.messages, {
      type: ConversationEvent.INTERACTION_SUBMITTED,
      questionId: messageId,
      answer,
      summary: submittedSummary || '已确认',
      history: submittedHistory,
      userText: '我已确认',
      userMessageId: `${messageId}-answer-${Date.now()}`,
    });
    state.draft = '';
    runAgentStage(interaction?.nextRun || Math.min(state.scenarioStage + 1, 8));
    return;
  } else if (action === 'toggle-status') {
    const messageId = target.dataset.messageId;
    state.messages = applyConversationEvent(state.messages, { type: ConversationEvent.TOGGLE_EXPANDED, id: messageId });
  } else if (action === 'toggle-run') {
    const messageId = target.dataset.messageId;
    state.messages = applyConversationEvent(state.messages, { type: ConversationEvent.TOGGLE_EXPANDED, id: messageId });
  } else if (action === 'confirm-choice') {
    const interactionId = target.dataset.interaction || 'requirements-confirmation';
    const interaction = scenarioInteractions[interactionId];
    state.messages = applyConversationEvent(state.messages, {
      type: ConversationEvent.INTERACTION_SUBMITTED,
      questionId: interactionId,
      answer: { confirmed: true },
      summary: interaction?.summary || '已确认',
      history: interaction?.history,
      userText: target.dataset.reply || '我已确认',
      userMessageId: `${interactionId}-answer-${Date.now()}`,
    });
    state.draft = '';
    state.attachment = null;
    runAgentStage(interaction?.nextRun || Math.min(state.scenarioStage + 1, 8));
    return;
  } else if (action === 'cancel-confirmation') {
    const interactionId = target.dataset.interaction;
    state.messages = state.messages.filter((message) => message.id !== interactionId);
    state.draft = '我想先补充一些信息：';
  } else if (action === 'open-artifact-list') {
    openWorkbench(state.artifactType || 'video', false);
  } else if (action === 'close-workbench') {
    state.workbenchView = null;
    state.artifactTreeOpen = false;
    state.playing = false;
  } else if (action === 'toggle-artifact-tree') {
    state.artifactTreeOpen = !state.artifactTreeOpen;
  } else if (action === 'set-artifact-type') {
    state.artifactType = target.dataset.type;
    state.workbenchView = 'list';
    state.artifactTreeOpen = false;
  } else if (action === 'open-artifact') {
    state.activeArtifact = target.dataset.artifact;
    openWorkbench(target.dataset.type || 'document', true);
  } else if (action === 'open-document') {
    state.activeArtifact = target.dataset.artifact;
    openWorkbench('document', true);
  } else if (action === 'open-video') {
    state.activeVideo = Number(target.dataset.index || 0);
    openWorkbench('video', true);
  } else if (action === 'open-image') {
    state.activeMedia = Number(target.dataset.index || 0);
    openWorkbench('image', true);
  } else if (action === 'open-actor') {
    state.activeMedia = Number(target.dataset.index || 0);
    openWorkbench('actor', true);
  } else if (action === 'select-video') {
    state.activeVideo = Number(target.dataset.index || 0);
    state.playing = false;
  } else if (action === 'select-media') {
    state.activeMedia = Number(target.dataset.index || 0);
  } else if (action === 'toggle-play') {
    state.playing = !state.playing;
  } else if (action === 'quote-artifact') {
    const titles = {
      video: `推广大促成片${state.activeVideo + 1}`,
      actor: `演员候选${state.activeMedia + 1}`,
      image: `商品参考图${state.activeMedia + 1}`,
      document: '即创螺蛳粉大促视频需求分析',
    };
    const thumbnails = {
      video: media.conversationVideos[state.activeVideo % media.conversationVideos.length],
      actor: media.conversationActors[state.activeMedia % media.conversationActors.length],
      image: media.conversationProducts[state.activeMedia % media.conversationProducts.length],
      document: project.product.thumbnail,
    };
    state.attachment = { title: titles[state.artifactType] || '当前产物', thumbnail: thumbnails[state.artifactType] || project.product.thumbnail };
    state.workbenchView = null;
    state.artifactTreeOpen = false;
  } else if (action === 'edit-artifact') {
    state.draft = `请继续编辑当前${state.artifactType === 'video' ? '视频' : '产物'}：`;
    state.workbenchView = null;
    state.artifactTreeOpen = false;
  } else if (action === 'use-opportunity') {
    state.draft = '根据这个灵感，为即创螺蛳粉生成一组大促推广视频';
    state.attachment = project.product;
  }

  render();
});

document.addEventListener('keydown', (event) => {
  if (event.target.closest?.('.conversation-editor')) return;
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    syncDraft();
    if (state.page === 'home' || state.taskMode === 'new') startScenario();
    else if (state.draft.trim()) advanceScenario(state.draft.trim(), implicitInteractionByRun[state.scenarioStage] || null);
  }
  if (event.key === 'Escape' && state.workbenchView) {
    state.workbenchView = null;
    state.artifactTreeOpen = false;
    render();
  }
});

applyStudioSettings(state.studio);
applyConversationTokens(state.editor.config);
render({ keepScroll: false });
