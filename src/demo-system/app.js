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
} from './scenarios/luosifen.js?v=20260906e';
import { media } from './data/assets.js?v=20260906e';
import { createTask, snapshotTask, upsertTask, readTasks, saveTasks, isTask, commitArtifactEdit } from './tasks/model.js?v=20260906e';
import { TaskDialogs } from './components/task-dialogs.js?v=20260906e';
import { ConversationSettingsModal } from './components/navigation.js?v=20260906e';
import { escapeHtml } from './ui/primitives.js?v=20260906e';
import { nextConversationAction, personalizeText, publishArtifacts } from './conversation/workflow.js?v=20260906e';
import { artifactContent } from './artifacts/content.js?v=20260906e';
import { beginActorDrill, finishActorDrill, ensureActorDraft } from './artifacts/editing.js?v=20260906e';
import { createInput, migrateInput, inputText, inputInstruction, inputReferences, inputRequest, validateInput, selectInputSkill, removeInputSkill, attachInputReference, removeInputReference } from './composer/model.js?v=20260906e';
import { readStructuredEntry } from './components/composer.js?v=20260906e';
import { Message } from './components/messages.js?v=20260906e';
import { skillById, availableSkills } from './scenarios/skills.js?v=20260906e';
import { replaceDocumentReference } from './artifacts/document.js?v=20260906e';
import { phasesAfterRun } from './scenarios/decisions.js?v=20260906e';
import { storeMedia, loadMedia, resolveMedia } from './tasks/media-store.js?v=20260906e';
import { HomeTemplate } from './templates/home.js?v=20260906e';
import { StudioTemplate } from './templates/studio.js?v=20260906e';
import { WorkspaceTemplate } from './templates/workspace.js?v=20260906e';
import { ConversationKind, normalizeConversationNodes } from './conversation/model.js?v=20260906e';
import { appendConversationNodes, applyConversationEvent, ConversationEvent } from './conversation/runtime.js?v=20260906e';
import { createExecutionTimeline, executionFrame, formatLiveElapsed, getRunSimulationPlan } from './conversation/simulation.js?v=20260906e';
import {
  ArtifactView,
  artifactById,
  closeArtifactTab,
  createArtifactWorkspace,
  getArtifactType,
  openArtifactTab,
} from './artifacts/model.js?v=20260906e';

const urlParams = new URLSearchParams(window.location.search);
const studioMode = urlParams.get('studio') === '1';
const viewMode = !urlParams.get('view') || urlParams.get('view') === 'home' ? 'new' : urlParams.get('view');
const stageMode = urlParams.get('stage');
const editorMode = urlParams.get('edit') === '1';
const workspaceView = ['new', 'conversation', 'video-list', 'video-detail'].includes(viewMode);
const newTaskView = viewMode === 'new';
const snapshotMode = urlParams.get('snapshot') === '1' || stageMode === 'complete';
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
  messageFontSize: 16,
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
    if (saved.messageFontSize === 14) saved.messageFontSize = 16;
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
  ...createTask(),
  page: studioMode ? 'studio' : workspaceView ? 'workspace' : 'home',
  draft: interactiveConversationEntry ? '根据 即创螺蛳粉 这个商品为我生成用于大促推广的视频' : '',
  attachment: interactiveConversationEntry ? project.product : null,
  input: migrateInput({ draft: interactiveConversationEntry ? '根据 即创螺蛳粉 这个商品为我生成用于大促推广的视频' : '', attachment: interactiveConversationEntry ? project.product : null }),
  messages: workspaceView && !newTaskView && snapshotMode ? applyConversationConfig(completedScenarioMessages, initialConversationConfig) : [],
  artifacts: snapshotMode || ['video-list', 'video-detail'].includes(viewMode) ? structuredClone(scenarioArtifacts) : [],
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
  artifactWorkspace: createArtifactWorkspace({
    open: !editorMode && ['video-list', 'video-detail'].includes(viewMode),
    selectedCategory: 'video',
    rootMode: ArtifactView.CATEGORY,
    activeView: viewMode === 'video-detail' ? ArtifactView.DETAIL : ArtifactView.CATEGORY,
    activeTabId: viewMode === 'video-detail' ? 'campaign-video-1' : null,
    openTabs: viewMode === 'video-detail' ? ['campaign-video-1'] : [],
  }),
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
  dialog: null,
  products: [project.product],
  selectedProduct: null,
  readOnly: false,
};

const savedTasks = readTasks(window.localStorage);
state.tasks = savedTasks.tasks;
if (!state.tasks.length) state.tasks.push(createTask({ taskId: 'sample-luosifen', projectTitle: '即创螺蛳粉', taskMode: 'existing', messages: applyConversationConfig(completedScenarioMessages), artifacts: structuredClone(scenarioArtifacts), scenarioStage: 8, product: project.product }));
const restoredTask = !snapshotMode && viewMode !== 'new' && state.tasks.find((task) => task.taskId === (urlParams.get('task') || savedTasks.activeId));
if (restoredTask) Object.assign(state, structuredClone(restoredTask));
if (['video-list', 'video-detail'].includes(viewMode)) {
  state.taskMode = 'existing';
  state.artifactWorkspace.open = true;
  state.artifactWorkspace.selectedCategory = 'video';
  if (viewMode === 'video-detail' && state.artifacts.some((item) => item.id === 'campaign-video-1')) state.artifactWorkspace = openArtifactTab(state.artifactWorkspace, 'campaign-video-1');
}
if (!state.product && state.taskMode !== 'new') state.product = state.attachment || project.product;
try { await loadMedia(); } catch { /* Local uploads are optional when IndexedDB is unavailable. */ }
if (window.location.hash.startsWith('#task=')) {
  try {
    if (window.location.hash.length > 100000) throw new Error('Snapshot too large');
    const bytes = Uint8Array.from(atob(window.location.hash.slice(6)), (char) => char.charCodeAt(0));
    const raw = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    if (raw.length > 2000000) throw new Error('Snapshot too large');
    const shared = JSON.parse(raw);
    if (!isTask(shared)) throw new Error('Invalid snapshot');
    Object.assign(state, createTask(shared), { page: 'workspace', readOnly: true, pendingRun: null });
  } catch { state.notice = '分享链接无效或不完整'; }
}

const app = document.querySelector('#app');
try { const saved = JSON.parse(localStorage.getItem('aic-agent-local-skills-v1') || '[]'); state.customSkills = Array.isArray(saved) ? saved : []; } catch { state.customSkills = []; }
state.artifactWorkspace.loadingArtifactId = null;
state.artifactWorkspace.playing = false;
if (state.editor.enabled) state.editor.sourceMessages = structuredClone(state.messages);
let studioInputTimer;
let activeRunTimer = null;
let activeRunOutputTimer = null;
let activeRunToken = 0;
let lastDialog = null;

function persistCurrentTask() {
  if (state.page === 'studio' || state.readOnly) return;
  state.tasks = upsertTask(state.tasks, snapshotTask(state));
  try { saveTasks(window.localStorage, state.tasks, state.taskId); }
  catch { state.notice = '浏览器存储空间不足，本次修改尚未保存，请勿关闭页面'; }
}

function pauseCurrentTask() {
  syncDraft();
  cancelActiveRun();
  if (state.busy && state.pendingRun) state.messages = applyConversationEvent(state.messages, { type: ConversationEvent.RUN_FAILED, runId: state.pendingRun, title: '已暂停', detail: '生成已暂停' });
  state.busy = false;
  persistCurrentTask();
}

function notify(message) {
  state.notice = message;
  window.clearTimeout(state.noticeTimer);
  state.noticeTimer = window.setTimeout(() => { state.notice = ''; document.querySelector('.demo-notice')?.remove(); }, 4000);
}

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
  url.searchParams.delete('task');
  url.hash = '';
  url.searchParams.set('view', view);
  window.history.replaceState({}, '', url);
}

const artifactScrollPositions = new Map();
const artifactScrollSelectors = ['.workbench-body', '.artifact-detail-scroll', '.actor-variants', '.actor-description--description p', '.actor-description--voice p'];

function render({ keepScroll = true, scrollToEnd = false } = {}) {
  state.compactMobile = window.innerWidth <= 760;
  state.compactTaskRail = state.compactMobile || (window.innerWidth < 1200 && (state.artifactWorkspace.open || state.editor.enabled));
  persistCurrentTask();
  const previous = document.querySelector('[data-role="conversation-scroll"]');
  const scrollTop = previous?.scrollTop || 0;
  const previousWorkbench = document.querySelector('[data-workspace-view]');
  if (previousWorkbench) artifactScrollPositions.set(previousWorkbench.dataset.workspaceView, artifactScrollSelectors.map((selector) => {
    const element = previousWorkbench.querySelector(selector);
    return [selector, element?.scrollTop || 0, element?.scrollLeft || 0];
  }));
  const renderState = state.editor.enabled
    ? { ...state, messages: state.messages.map((message) => ({ ...message, editorSelected: message.id === state.editor.selectedId })) }
    : state;
  app.innerHTML = resolveMedia((state.page === 'studio' ? StudioTemplate(renderState) : state.page === 'home' ? HomeTemplate(renderState) : WorkspaceTemplate(renderState))
    + (state.settingsOpen ? ConversationSettingsModal(state.settings) : '') + TaskDialogs(state)
    + (state.pendingRun && !state.busy ? '<div class="resume-run"><button data-action="resume-run">继续未完成的生成</button></div>' : '')
    + (state.readOnly ? '<div class="shared-task-banner">任务快照 · 只读<button data-action="new-task">开始新任务</button></div>' : '')
    + (state.notice ? `<div class="demo-notice" role="status">${escapeHtml(state.notice)}</div>` : ''));
  const next = document.querySelector('[data-role="conversation-scroll"]');
  if (next && keepScroll) next.scrollTop = scrollToEnd ? next.scrollHeight : scrollTop;
  const workbench = document.querySelector('[data-workspace-view]');
  for (const [selector, top, left] of artifactScrollPositions.get(workbench?.dataset.workspaceView) || []) {
    const element = workbench?.querySelector(selector);
    if (element) { element.scrollTop = top; element.scrollLeft = left; }
  }
  document.querySelectorAll('.question-form').forEach((form) => {
    const saved = state.questionDrafts?.[form.dataset.messageId];
    if (saved) form.querySelectorAll('input,select').forEach((field) => {
      const value = saved[`${field.name}:${field.value}`] ?? saved[field.name];
      if (value === undefined) return;
      if (field.type === 'checkbox' || field.type === 'radio') field.checked = Boolean(value);
      else field.value = value;
    });
    updateQuestionFormState(form);
  });
  if (state.readOnly) document.querySelectorAll('#app input, #app textarea, #app select').forEach((field) => { field.disabled = true; });
  if (state.readOnly) document.querySelectorAll('[contenteditable]').forEach((field) => { field.contentEditable = 'false'; });
  const dialog = state.dialog || (state.settingsOpen ? 'settings' : null);
  const shell = document.querySelector('.agent-shell');
  if (shell) shell.inert = Boolean(dialog);
  if (dialog && dialog !== lastDialog) document.querySelector('[role="dialog"] input:not([type=checkbox]), [role="dialog"] textarea, [role="dialog"] button')?.focus();
  lastDialog = dialog;
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

function saveQuestionDraft(form) {
  if (!form.dataset.messageId) return;
  state.questionDrafts ||= {};
  state.questionDrafts[form.dataset.messageId] = Object.fromEntries([...form.querySelectorAll('input,select')].map((field) => ['checkbox','radio'].includes(field.type) ? [`${field.name}:${field.value}`,field.checked] : [field.name,field.value]));
  persistCurrentTask();
}

function syncDraft() {
  const structured = document.querySelector('[data-role="structured-input"]');
  if (structured) {
    state.input = readStructuredEntry(structured, state.input);
    structured.dataset.empty = String(!structured.textContent.trim());
    state.draft = inputText(state.input);
    state.attachment = inputReferences(state.input)[0] || null;
    return;
  }
  const selector = state.page === 'workspace'
    ? '.conversation-composer [data-role="composer-input"], .new-task-stage [data-role="composer-input"]'
    : '[data-role="composer-input"]';
  const input = document.querySelector(selector);
  if (input) state.draft = `${input.dataset.draftPrefix || ''}${input.dataset.draftAttachment || ''}${input.value}`;
}

function setInput(input) {
  state.input = input;
  state.draft = inputText(input);
  state.attachment = inputReferences(input)[0] || null;
  state.selectedSkill = input.skill?.name || null;
}

function attachReference(reference) {
  setInput(attachInputReference(state.input, reference, state.inputSlotId));
  state.inputSlotId = null;
}

function openExistingTask(taskId) {
  pauseCurrentTask();
  const task = state.tasks.find((item) => item.taskId === taskId);
  if (!task) return;
  Object.assign(state.editor, { enabled: false, selectedId: null, sourceMessages: null });
  setViewMode('conversation');
  Object.assign(state, {
    page: 'workspace',
    ...structuredClone(task),
    projectMenuOpen: false,
    settingsOpen: false,
    busy: false,
    dialog: null, readOnly: false, mobileTasksOpen: false,
  });
  render({ keepScroll: false });
}

function openNewTask() {
  pauseCurrentTask();
  Object.assign(state.editor, { enabled: false, selectedId: null, sourceMessages: null });
  setViewMode('new');
  Object.assign(state, {
    ...createTask(),
    page: 'workspace',
    taskMode: 'new',
    projectTitle: '新的项目',
    messages: [],
    scenarioStage: 0,
    pendingRun: null,
    workbenchView: null,
    artifactWorkspace: createArtifactWorkspace(),
    draft: '',
    attachment: null,
    busy: false,
    projectMenuOpen: false,
    settingsOpen: false,
    dialog: null, readOnly: false, mobileTasksOpen: false,
  });
  render({ keepScroll: false });
}

function startScenario() {
  if (state.busy || !validateInput(state.input).valid) return;
  if (state.input.skill && state.input.skill.id !== 'campaign-video') {
    notify('该技能尚未配置可执行流程，输入内容已保留。');
    return;
  }
  cancelActiveRun();
  setViewMode('conversation');
  const request = state.draft.trim() || '根据 即创螺蛳粉 这个商品为我生成用于大促推广的视频';
  const submitted = inputRequest(state.input);
  const firstMessage = { ...scenarioMessages[0], text: request, content: submitted.content, attachments: submitted.attachments, skill: submitted.skill, attachment: null, editorSource: `tasks.${state.taskId}.request` };
  const configuredFirstMessage = applyConversationConfig([firstMessage], state.editor.config)[0] || firstMessage;
  const welcome = applyConversationConfig([getScenarioMessage('welcome')], state.editor.config)[0];
  Object.assign(state, {
    page: 'workspace',
    taskMode: 'existing',
    projectTitle: state.attachment?.title || request.slice(0, 18),
    product: submitted.attachments.find((item) => item.type === 'product') || state.product || { title: request.slice(0, 18), thumbnail: '' },
    request: submitted,
    messages: [configuredFirstMessage],
    artifacts: [],
    scenarioStage: 1,
    pendingRun: 1,
    draft: '',
    attachment: null,
    input: createInput(),
    selectedSkill: null,
    busy: true,
  });
  render({ keepScroll: false, scrollToEnd: true });
  if (welcome) streamAssistantNode(welcome, activeRunToken, () => runAgentStage(1));
  else runAgentStage(1);
}

function updateStreamingText(messageId, text) {
  const target = document.querySelector(`[data-editor-id="${messageId}"] [data-role="assistant-stream"]`);
  if (target) target.textContent = text;
  const scroll = document.querySelector('[data-role="conversation-scroll"]');
  if (scroll) scroll.scrollTop = scroll.scrollHeight;
}

function streamAssistantNode(node, runToken, onComplete) {
  const finalText = Array.isArray(node.text) ? node.text.join('\n') : `${node.text || ''}`;
  const characters = Array.from(finalText);
  let cursor = 0;
  let visibleText = '';
  state.messages = applyConversationEvent(state.messages, {
    type: ConversationEvent.ASSISTANT_STREAM_STARTED,
    id: node.id,
    node,
    text: '',
  });
  render({ scrollToEnd: true });

  const writeNext = () => {
    if (runToken !== activeRunToken) return;
    if (cursor >= characters.length) {
      state.messages = applyConversationEvent(state.messages, {
        type: ConversationEvent.ASSISTANT_STREAM_COMPLETED,
        id: node.id,
        text: node.text,
      });
      render({ scrollToEnd: true });
      activeRunOutputTimer = window.setTimeout(() => {
        activeRunOutputTimer = null;
        onComplete();
      }, 700);
      return;
    }

    const character = characters[cursor];
    visibleText += character;
    cursor += 1;
    state.messages = applyConversationEvent(state.messages, {
      type: ConversationEvent.ASSISTANT_STREAM_DELTA,
      id: node.id,
      text: visibleText,
    });
    updateStreamingText(node.id, visibleText);
    const delay = /[，。！？；：,.!?]/u.test(character) ? 160 : 55;
    activeRunOutputTimer = window.setTimeout(writeNext, delay);
  };

  activeRunOutputTimer = window.setTimeout(writeNext, 250);
}

function revealRunOutputs(run, runId, runToken) {
  const outputs = applyConversationConfig((run.outputNodes || run.outputIds.map(getScenarioMessage)).filter(Boolean).map((node) => {
    const next = node.text ? { ...node, text: personalizeText(node.text, state) } : node;
    if (runId === 5) {
      if (next.prompt) next.prompt = `是否将形象${(state.selectedActorIndex || 0) + 1}用在创意分镜中`;
      if (next.text) next.text = `需要将第${(state.selectedActorIndex || 0) + 1}个替换进创意分镜吗？`;
    }
    return next;
  }), state.editor.config);
  const revealAt = (index) => {
    if (runToken !== activeRunToken) return;
    if (index >= outputs.length) {
      if (phasesAfterRun[runId]) state.scenarioStage = runId;
      if (phasesAfterRun[runId]) state.workflow = { phase: phasesAfterRun[runId] };
      state.busy = false;
      state.pendingRun = null;
      state.pendingRunSpec = null;
      activeRunOutputTimer = null;
      render({ scrollToEnd: true });
      return;
    }

    const node = outputs[index];
    if (node.kind === ConversationKind.ASSISTANT) {
      streamAssistantNode(node, runToken, () => revealAt(index + 1));
      return;
    }

    state.artifacts = publishArtifacts(state.artifacts, [node], scenarioArtifacts, state, runId);
    state.messages = appendConversationNodes(state.messages, [node]);
    render({ scrollToEnd: true });
    activeRunOutputTimer = window.setTimeout(() => revealAt(index + 1), 700);
  };
  revealAt(0);
}

function runAgentStage(runId, specification = null) {
  const run = specification || scenarioRuns[runId] || state.pendingRunSpec;
  if (!run) return;
  cancelActiveRun();
  const runToken = activeRunToken;
  const simulation = getRunSimulationPlan(run);
  const timeline = createExecutionTimeline(run).map((item) => ({ ...item, block: item.block.type === 'text' ? { ...item.block, text: personalizeText(item.block.text, state) } : item.block }));
  const progress = run.thinking;
  state.pendingRun = runId;
  state.pendingRunSpec = scenarioRuns[runId] ? null : run;
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
    if (runId === 6) {
      const storyboard = artifactById(state.artifacts, 'creative-storyboard');
      if (storyboard) {
        const hydrated = artifactContent(storyboard, state);
        const actorId = `character-${(state.selectedActorIndex || 0) + 1}`;
        const draft = { ...hydrated, actorId, content: replaceDocumentReference(hydrated.content, hydrated.actorId || 'character-1', actorId) };
        state.artifacts = state.artifacts.map((item) => item.id === storyboard.id ? commitArtifactEdit(item, draft) : item);
      }
    }
    state.messages = applyConversationEvent(state.messages, {
      type: ConversationEvent.RUN_COMPLETED,
      runId,
      detail: run.elapsed,
      steps: run.execution ? [] : undefined,
      blocks: run.execution ? executionFrame(timeline, Infinity).blocks : undefined,
    });
    render({ scrollToEnd: true });
    activeRunOutputTimer = window.setTimeout(() => {
      if (runToken !== activeRunToken) return;
      activeRunOutputTimer = null;
      revealRunOutputs(run, runId, runToken);
    }, 520);
  };
  const startedAt = performance.now();
  let previousElapsed = -1;
  const dispatchedSimulationEvents = new Set();
  const dispatchSimulationEvent = (scheduledEvent, elapsedSeconds) => {
    if (scheduledEvent.type !== 'tool.started' || !run.execution) return;
    state.messages = applyConversationEvent(state.messages, {
      type: ConversationEvent.TOOL_STARTED,
      runId,
      title: run.execution.title,
      thought: '',
      steps: [],
      blocks: [],
      detail: formatLiveElapsed(elapsedSeconds),
    });
    render({ scrollToEnd: true });
  };
  const tick = () => {
    if (runToken !== activeRunToken) return;
    const elapsedMs = performance.now() - startedAt;
    const elapsedSeconds = Math.min(simulation.durationSeconds, Math.floor(elapsedMs / 1000));
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
    simulation.events.forEach((scheduledEvent, index) => {
      if (dispatchedSimulationEvents.has(index) || elapsedSeconds < scheduledEvent.atSecond) return;
      dispatchedSimulationEvents.add(index);
      dispatchSimulationEvent(scheduledEvent, elapsedSeconds);
    });
    if (timeline.length && dispatchedSimulationEvents.size) {
      state.messages = applyConversationEvent(state.messages, {
        type: ConversationEvent.UPDATE,
        id: `run-${runId}`,
        patch: executionFrame(timeline, elapsedMs),
      });
      const target = document.querySelector(`[data-editor-id="run-${runId}"]`);
      const scroll = document.querySelector('[data-role="conversation-scroll"]');
      const follow = scroll && scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight < 80;
      if (target) {
        const message = state.messages.find((message) => message.id === `run-${runId}`);
        target.outerHTML = Message({ ...message, editorSelected: state.editor.enabled && state.editor.selectedId === message.id }, state.artifacts);
      }
      if (follow) scroll.scrollTop = scroll.scrollHeight;
    }
    if (elapsedSeconds >= simulation.durationSeconds) completeRun();
  };
  tick();
  activeRunTimer = window.setInterval(tick, 60);
}

function advanceScenario(text, interactionId = null) {
  if (state.busy || state.readOnly) return;
  const transition = nextConversationAction(state, inputInstruction(state.input) || text);
  if (transition.actorIndex != null) state.selectedActorIndex = transition.actorIndex;
  if (transition.type === 'resume') { runAgentStage(transition.runId); return; }
  if (transition.type === 'question') { notify('请先完成当前追问或确认，再继续。你的输入已保留。'); render(); return; }
  const reference = state.attachment?.artifactId;
  if (reference) {
    const artifact = artifactById(state.artifacts, reference);
    if (artifact) artifact.feedback = [...(artifact.feedback || []), { text, createdAt: new Date().toISOString() }];
  }
  const request = inputRequest(state.input);
  state.messages = appendConversationNodes(state.messages, [{ id: `custom-${Date.now()}`, role: 'user', type: 'text', text, content: request.content, attachments: request.attachments, editorSource: `tasks.${state.taskId}.messages` }]);
  setInput(createInput());
  if (transition.type === 'run') runAgentStage(transition.runId);
  else {
    runAgentStage(`reply-${Date.now()}`, { thinking: { title: '正在思考···' }, simulation: { durationSeconds: 5 }, elapsed: '用时5s', outputNodes: [{ id: `reply-text-${Date.now()}`, role: 'assistant', type: 'text', kind: ConversationKind.ASSISTANT, text: transition.text }] });
  }
}

function openWorkbench(type = 'video', detail = false) {
  state.page = 'workspace';
  if (!state.artifactWorkspace.open && state.artifactWorkspace.activeTabId) {
    state.artifactWorkspace.open = true;
    return;
  }
  state.artifactWorkspace = {
    ...state.artifactWorkspace,
    open: true,
    selectedCategory: type === 'character' ? 'actor' : type,
    activeTabId: detail ? state.artifactWorkspace.activeTabId : null,
    activeView: detail ? ArtifactView.DETAIL : state.artifactWorkspace.rootMode,
    drillTarget: null,
    playing: false,
  };
}

function showArtifact(artifactId) {
  const artifact = artifactById(state.artifacts, artifactId);
  if (!artifact) return;
  state.artifactDraft = artifact.type === 'preview' ? structuredClone(artifactContent(artifact, state)) : null;
  state.activeScene = 0;
  const taskId = state.taskId;
  state.artifactWorkspace = openArtifactTab(state.artifactWorkspace, artifact.id);
  state.artifactWorkspace.loadingArtifactId = artifact.id;
  window.setTimeout(() => {
    if (state.taskId !== taskId || state.artifactWorkspace.loadingArtifactId !== artifact.id) return;
    state.artifactWorkspace.loadingArtifactId = null;
    render();
  }, 320);
}

function getEditorBaseMessage(id) {
  return (state.editor.sourceMessages || state.messages).find((message) => message.id === id) || null;
}

function pushEditorHistory() {
  state.editor.history.push(cloneEditorConfig(state.editor.config));
  if (state.editor.history.length > 30) state.editor.history.shift();
}

function applyEditorConfigToConversation() {
  const sourceMessages = state.editor.sourceMessages || state.messages;
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
  if (state.readOnly) return;
  if (event.target.closest('[data-role="structured-input"]')) {
    syncDraft();
    const send = document.querySelector('.composer [data-action="send-message"]');
    if (send) send.disabled = state.busy || !validateInput(state.input).valid;
    persistCurrentTask();
  }
  if (event.target.matches('[data-skill-search]')) {
    const position = event.target.selectionStart;
    state.skillSearch = event.target.value;
    render();
    const input = document.querySelector('[data-skill-search]');
    input?.focus(); input?.setSelectionRange(position, position);
  }
  if (event.target.matches('[data-product-search]')) {
    const query = event.target.value.trim();
    document.querySelectorAll('.product-library-item, .skill-library > button').forEach((item) => { item.hidden = !item.textContent.includes(query); });
  }
  if (event.target.matches('[data-setting="duration"]')) document.querySelectorAll('[data-setting="duration"]').forEach((input) => { input.value = event.target.value; });
  if (event.target.matches('[data-artifact-field]') && state.artifactDraft) {
    const path = event.target.dataset.artifactField.split('.');
    let target = state.artifactDraft;
    path.slice(0, -1).forEach((key) => { target = target[key]; });
    target[path.at(-1)] = event.target.value;
    persistCurrentTask();
  }
  const questionForm = event.target.closest('.question-form');
  if (questionForm) { updateQuestionFormState(questionForm); saveQuestionDraft(questionForm); }
  if (event.target.matches('[data-role="composer-input"]')) {
    state.draft = `${event.target.dataset.draftPrefix || ''}${event.target.dataset.draftAttachment || ''}${event.target.value}`;
    const composer = event.target.closest('.composer');
    const sendButton = composer?.querySelector('[data-action="send-message"]');
    if (sendButton) sendButton.disabled = state.busy || !state.draft.trim();
    persistCurrentTask();
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

function updateSkillPreview(event) {
  const option = event.target.closest('[data-preview-skill]');
  if (!option || state.previewSkillId === option.dataset.previewSkill) return;
  state.previewSkillId = option.dataset.previewSkill;
  const skill = availableSkills(state).find((item) => item.id === state.previewSkillId);
  document.querySelectorAll('[data-preview-skill]').forEach((item) => item.classList.toggle('is-active', item === option));
  const video = document.querySelector('.skill-picker-preview');
  if (video && skill) {
    video.poster = skill.previewPoster || media.skillPreview;
    if (skill.previewUrl) { video.src = skill.previewUrl; video.play().catch(() => {}); }
    else { video.removeAttribute('src'); video.load(); }
  }
}
app.addEventListener('mouseover', updateSkillPreview);
app.addEventListener('focusin', updateSkillPreview);
app.addEventListener('timeupdate', updateEditorPlayback, true);
app.addEventListener('loadedmetadata', updateEditorPlayback, true);
app.addEventListener('ended', updateEditorPlayback, true);
function updateEditorPlayback(event) {
  if (!event.target.matches('[data-editor-video]')) return;
  const video = event.target;
  const format = (seconds) => `${Math.floor((seconds || 0) / 60).toString().padStart(2, '0')}:${Math.floor((seconds || 0) % 60).toString().padStart(2, '0')}`;
  const label = app.querySelector('[data-editor-time]');
  if (label) label.textContent = `${format(video.currentTime)} / ${format(Number.isFinite(video.duration) ? video.duration : 0)}`;
  const play = app.querySelector('[data-action="editor-video-play"]');
  if (play) { play.setAttribute('aria-pressed', String(!video.paused)); play.setAttribute('aria-label', video.paused ? '播放' : '暂停'); }
}

app.addEventListener('change', async (event) => {
  if (state.readOnly) return;
  if (event.target.matches('[data-upload]')) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (event.target.dataset.upload === 'skill-package') {
      if (!file.name.toLowerCase().endsWith('.zip') || file.size > 50 * 1024 * 1024) { notify('请选择 50MB 以内的 ZIP 技能包'); render(); return; }
      try {
        const localPackage = await storeMedia(file);
        state.customSkills.push({ id: `local-skill-${Date.now()}`, name: file.name.replace(/\.zip$/i, ''), description: '', category: '我的', localPackage, previewPoster: media.skillPreview, query: [] });
        localStorage.setItem('aic-agent-local-skills-v1', JSON.stringify(state.customSkills));
        state.skillCategory = '我的';
        notify('技能包已保存到此浏览器，执行服务尚未接入');
      } catch { notify('技能包保存失败'); }
      render(); return;
    }
    if (file.size > 50 * 1024 * 1024 || !/^(image|video)\//.test(file.type)) { notify('请选择 50MB 以内的图片或视频'); render(); return; }
    const taskId = state.taskId;
    const uploadKind = event.target.dataset.upload;
    const sceneDraft = ['scene-video', 'scene-reference'].includes(uploadKind) ? state.artifactDraft : null;
    const sceneIndex = state.activeScene || 0;
    if (['scene-video', 'scene-reference'].includes(uploadKind) && (!sceneDraft?.scenes?.[sceneIndex] || !file.type.startsWith(uploadKind === 'scene-video' ? 'video/' : 'image/'))) return;
    const actorDraft = uploadKind === 'actor-variant' ? ensureActorDraft(state) : null;
    if (uploadKind === 'actor-variant' && (!actorDraft || !file.type.startsWith('image/'))) return;
    try {
      const url = await storeMedia(file);
      if (taskId !== state.taskId) return;
      if (sceneDraft) {
        if (sceneDraft !== state.artifactDraft) return;
        const scene = sceneDraft.scenes[sceneIndex];
        if (uploadKind === 'scene-video') {
          scene.variants ||= [{ image: scene.image, mediaUrl: scene.mediaUrl || sceneDraft.mediaUrl, generated: true }];
          scene.variants.push({ mediaUrl: url, title: file.name, generated: false });
          scene.variantIndex = scene.variants.length - 1;
          scene.mediaUrl = url;
        } else {
          scene.references ||= [{ image: sceneDraft.productImage, title: sceneDraft.productName }, { image: sceneDraft.actor?.previewUrl, title: sceneDraft.actor?.title }].filter((item) => item.image);
          scene.references.push({ image: url, title: file.name });
        }
        render(); return;
      }
      if (uploadKind === 'actor-variant') {
        const currentDraft = state.artifactWorkspace.activeView === ArtifactView.DRILL ? state.artifactDraft?.actor : state.artifactDraft;
        if (currentDraft !== actorDraft) return;
        actorDraft.appearanceOptions = [...(actorDraft.appearanceOptions || []), { id: `upload-${Date.now()}`, previewUrl: url }];
        actorDraft.previewUrl = url;
        render(); return;
      }
      const product = { title: file.name.replace(/\.[^.]+$/, ''), thumbnail: file.type.startsWith('image/') ? url : '', mediaUrl: url, type: event.target.dataset.upload === 'product' ? 'product' : file.type.startsWith('image/') ? 'image' : 'video' };
      if (event.target.dataset.upload === 'product') state.products.push(product);
      attachReference(product);
      state.dialog = null;
      notify('素材已添加并保存在此浏览器');
    } catch { notify('素材保存失败，请检查浏览器存储权限后重试'); }
    render(); return;
  }
  const questionForm = event.target.closest('.question-form');
  if (questionForm) { updateQuestionFormState(questionForm); saveQuestionDraft(questionForm); }
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
  if (event.target.classList.contains('skill-popover-backdrop')) { state.dialog = null; render(); return; }
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
  if (action === 'editor-video-play' || action === 'editor-video-mute') {
    const video = app.querySelector('[data-editor-video]');
    if (!video) return;
    if (action === 'editor-video-play') { if (video.paused) await video.play().catch(() => notify('视频暂时无法播放')); else video.pause(); }
    else { video.muted = !video.muted; target.setAttribute('aria-pressed', String(video.muted)); target.setAttribute('aria-label', video.muted ? '取消静音' : '静音'); }
    updateEditorPlayback({ target: video });
    return;
  }
  const readOnlyActions = ['open-artifact-list', 'close-workbench', 'toggle-workbench-size', 'artifact-root', 'toggle-artifact-list-mode', 'activate-artifact-tab', 'close-artifact-tab', 'set-artifact-type', 'open-artifact', 'open-document', 'open-video', 'open-image', 'open-actor', 'toggle-status', 'toggle-run', 'toggle-play', 'new-task', 'toggle-sidebar'];
  if (state.readOnly && !readOnlyActions.includes(action)) { notify('这是只读任务快照'); render(); return; }

  if (action === 'close-dialog') state.dialog = null;
  else if (action === 'open-upload') state.dialog = 'upload';
  else if (action === 'open-skills') {
    const anchor = target.getBoundingClientRect();
    state.skillAnchor = { x: Math.max(12, Math.min(anchor.left, innerWidth - 520)), y: anchor.bottom + 12 + 322 < innerHeight ? anchor.bottom + 12 : Math.max(12, anchor.top - 334) };
    state.dialog = 'skills';
    state.skillSearch = '';
  }
  else if (action === 'filter-skills') { state.skillCategory = target.dataset.category; state.previewSkillId = null; }
  else if (action === 'clear-skill') setInput(removeInputSkill(state.input));
  else if (action === 'fill-input-slot') { state.inputSlotId = target.dataset.slot; state.dialog = target.dataset.accepts === 'product' ? 'product' : 'upload'; state.selectedProduct = null; }
  else if (action === 'remove-input-reference') setInput(removeInputReference(state.input, target.dataset.part));
  else if (action === 'pick-product') state.selectedProduct = Number(target.dataset.index);
  else if (action === 'apply-product') { attachReference({ ...state.products[state.selectedProduct], type: 'product' }); state.dialog = null; }
  else if (action === 'add-text') state.dialog = 'text';
  else if (action === 'apply-text') {
    const text = document.querySelector('[data-text-attachment]')?.value.trim();
    if (!text) return;
    attachReference({ title: '参考文案', text, type: 'document' });
    state.dialog = null;
  } else if (action === 'rename-task') { state.dialog = 'rename'; state.projectMenuOpen = false; }
  else if (action === 'apply-task-name') {
    const name = document.querySelector('[data-task-name]')?.value.trim();
    if (!name) return;
    state.projectTitle = name; state.dialog = null;
  } else if (action === 'confirm-delete-task') {
    cancelActiveRun();
    state.tasks = state.tasks.filter((task) => task.taskId !== state.taskId);
    Object.assign(state, createTask(), { dialog: null, busy: false });
    setViewMode('new');
  } else if (action === 'save-settings') {
    const modal = document.querySelector('.conversation-settings');
    const duration = Number(modal.querySelector('input[type="number"]').value);
    state.settings = { duration: Math.max(5, Math.min(60, duration || 20)), ratio: modal.querySelector('[name="ratio"]:checked').value, watermark: modal.querySelector('[name="watermark"]').checked };
    state.settingsOpen = false;
  } else if (action === 'copy-share') {
    try { await navigator.clipboard.writeText(state.shareUrl); notify('分享链接已复制'); }
    catch { document.querySelector('[aria-label="任务分享链接"]')?.select(); notify('请选择并复制分享链接'); }
  } else if (action === 'stop-run') {
    pauseCurrentTask(); notify('已停止，已生成的内容保留');
  } else if (action === 'resume-run') { runAgentStage(state.pendingRun); return; }
  else if (action === 'select-scene') { state.activeScene = Number(target.dataset.index); }
  else if (action === 'select-scene-variant' && state.artifactDraft) {
    const scene = state.artifactDraft.scenes[state.activeScene || 0];
    const variant = scene?.variants?.[Number(target.dataset.index)];
    if (variant) { scene.variantIndex = Number(target.dataset.index); scene.mediaUrl = variant.mediaUrl; if (variant.image) scene.image = variant.image; }
  } else if (action === 'regenerate-scene') {
    notify('描述已保存在草稿中，视频生成服务尚未接入');
  } else if (action === 'video-tool-boundary') {
    notify(`${target.dataset.tool}的后续编辑面板尚未校准，暂不提供模拟操作`);
  } else if (action === 'choose-actor-variant') {
    const draft = ensureActorDraft(state);
    const option = draft?.appearanceOptions?.[Number(target.dataset.index)];
    if (option) draft.previewUrl = option.previewUrl;
  } else if (action === 'edit-actor-field') {
    if (ensureActorDraft(state) && ['description', 'voice'].includes(target.dataset.field)) state.actorEditingField = state.actorEditingField === target.dataset.field ? null : target.dataset.field;
  } else if (action === 'save-actor-library') {
    const actor = state.artifactWorkspace.activeView === ArtifactView.DRILL ? state.artifactDraft?.actor : state.artifactDraft || artifactById(state.artifacts, state.artifactWorkspace.activeTabId);
    if (actor?.type === 'actor') {
      try {
        const saved = JSON.parse(localStorage.getItem('aic-agent-actor-library-v1') || '{}');
        saved[actor.id] = structuredClone(actor);
        localStorage.setItem('aic-agent-actor-library-v1', JSON.stringify(saved));
        notify('已保存至此浏览器的演员库');
      } catch { notify('保存失败，请检查浏览器存储空间'); }
    }
  } else if (action === 'preview-voice') {
    if ('speechSynthesis' in window) { speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance('下班回家，来一碗热气腾腾的螺蛳粉。'); utterance.lang = 'zh-CN'; speechSynthesis.speak(utterance); }
    else notify('当前浏览器不支持语音试听');
  } else if (action === 'package-video' && state.artifactDraft) {
    state.artifactDraft.packaging = !state.artifactDraft.packaging;
  } else if (action === 'download-artifact') {
    const artifact = artifactById(state.artifacts, state.artifactWorkspace.activeTabId);
    if (artifact) {
      const blob = new Blob([JSON.stringify(artifactContent(artifact, state), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${artifact.title}.json`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  else if (action === 'exit-editor') {
    const url = new URL(window.location.href);
    url.searchParams.delete('edit');
    window.history.replaceState({}, '', url);
    state.editor.enabled = false;
    state.editor.selectedId = null;
    state.editor.selectedComponent = null;
    state.editor.selectedSource = null;
    state.editor.sourceMessages = null;
  } else if (action === 'enter-editor') {
    if (state.busy) pauseCurrentTask();
    state.editor.sourceMessages = structuredClone(state.messages);
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
    state.artifactWorkspace.open = false;
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
    if (Array.isArray(baseMessage.content)) {
      override.content = structuredClone(baseMessage.content);
      form.querySelectorAll('[data-editor-content-index]').forEach((field) => {
        const part = override.content[Number(field.dataset.editorContentIndex)];
        if (part?.type === 'text') part.text = field.value;
      });
      override.text = inputText({ parts: override.content });
    }
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
    openNewTask(); return;
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
    openNewTask(); return;
  } else if (action === 'new-task') {
    openNewTask();
    return;
  } else if (action === 'open-task') {
    openExistingTask(target.dataset.task);
    return;
  } else if (action === 'toggle-project-menu') {
    state.projectMenuOpen = !state.projectMenuOpen;
  } else if (action === 'share-task') {
    state.projectMenuOpen = false;
    const task = snapshotTask(state);
    const raw = JSON.stringify(task);
    if (raw.includes('local-media:')) { notify('任务含本地上传素材，暂不能生成跨设备分享链接'); render(); return; }
    try {
      const bytes = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
      const encoded = btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));
      const url = new URL(window.location.href); url.search = '?view=conversation'; url.hash = `task=${encoded}`;
      state.shareUrl = url.href; state.dialog = 'share';
    } catch { notify('当前浏览器无法生成分享链接'); }
  } else if (action === 'open-conversation-settings' || action === 'open-settings') {
    state.projectMenuOpen = false;
    state.settingsOpen = true;
  } else if (action === 'close-conversation-settings') {
    state.settingsOpen = false;
  } else if (action === 'delete-task') {
    state.projectMenuOpen = false;
    state.dialog = 'delete';
  } else if (action === 'toggle-sidebar') {
    if (innerWidth >= 1200 && document.querySelector('.has-media-editor')) state.mediaTaskRailExpanded = !state.mediaTaskRailExpanded;
    else if (state.compactTaskRail) state.mobileTasksOpen = !state.mobileTasksOpen;
    else state.sidebarCollapsed = !state.sidebarCollapsed;
  } else if (action === 'select-product') {
    state.selectedProduct = null;
    state.dialog = 'product';
  } else if (action === 'clear-attachment') {
    const reference = state.input.parts.find((part) => part.type === 'reference');
    if (reference) setInput(removeInputReference(state.input, reference.id));
  } else if (action === 'choose-skill') {
    const skill = availableSkills(state).find((item) => item.id === target.dataset.skill || item.name === target.dataset.skill) || skillById(target.dataset.skill);
    if (!skill) return;
    const references = inputReferences(state.input);
    let input = selectInputSkill(state.input, skill);
    references.forEach((reference) => { input = attachInputReference(input, reference); });
    setInput(input);
    state.dialog = null;
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
    if (!validateInput(state.input).valid) return;
    advanceScenario(state.draft.trim(), implicitInteractionByRun[state.scenarioStage] || null);
    return;
  } else if (action === 'form-submit') {
    if (state.busy) return;
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
    setInput(createInput());
    if (interaction?.nextRun) runAgentStage(interaction.nextRun);
    else render();
    return;
  } else if (action === 'toggle-status') {
    const messageId = target.dataset.messageId;
    state.messages = applyConversationEvent(state.messages, { type: ConversationEvent.TOGGLE_EXPANDED, id: messageId });
  } else if (action === 'toggle-run') {
    const messageId = target.dataset.messageId;
    state.messages = applyConversationEvent(state.messages, { type: ConversationEvent.TOGGLE_EXPANDED, id: messageId });
  } else if (action === 'confirm-choice') {
    if (state.busy) return;
    const interactionId = target.dataset.interaction || 'requirements-confirmation';
    const interaction = scenarioInteractions[interactionId];
    const currentQuestion = state.messages.find((message) => message.id === interactionId);
    state.messages = applyConversationEvent(state.messages, {
      type: ConversationEvent.INTERACTION_SUBMITTED,
      questionId: interactionId,
      answer: { confirmed: true },
      summary: interactionId === 'character-confirmation' ? `已确认：将形象${(state.selectedActorIndex || 0) + 1}用在创意分镜` : interaction?.summary || '已确认',
      history: interaction?.history ? { ...interaction.history, prompt: currentQuestion?.prompt || interaction.history.prompt } : undefined,
      userText: target.dataset.reply || '我已确认',
      userMessageId: `${interactionId}-answer-${Date.now()}`,
    });
    setInput(createInput());
    if (interaction?.nextRun) runAgentStage(interaction.nextRun);
    else render();
    return;
  } else if (action === 'cancel-confirmation') {
    const interactionId = target.dataset.interaction;
    state.messages = state.messages.map((message) => message.id === interactionId ? { ...message, phase: 'answered', text: '已取消', expanded: false, history: { type: 'confirmation', prompt: message.prompt, value: '取消' } } : message);
    state.messages = appendConversationNodes(state.messages, [{ id: `cancel-${Date.now()}`, role: 'user', type: 'text', text: '先不生成，我想补充信息' }]);
    setInput(createInput('我想先补充一些信息：'));
  } else if (action === 'open-artifact-list') {
    openWorkbench(state.artifactWorkspace.selectedCategory || 'document', false);
  } else if (action === 'close-workbench') {
    state.artifactWorkspace.open = false;
    state.artifactWorkspace.playing = false;
  } else if (action === 'artifact-root') {
    state.artifactWorkspace.activeTabId = null;
    state.artifactWorkspace.activeView = state.artifactWorkspace.rootMode;
    state.artifactWorkspace.drillTarget = null;
  } else if (action === 'toggle-artifact-list-mode') {
    const next = state.artifactWorkspace.rootMode === ArtifactView.LIST ? ArtifactView.CATEGORY : ArtifactView.LIST;
    state.artifactWorkspace.rootMode = next;
    state.artifactWorkspace.activeView = next;
  } else if (action === 'activate-artifact-tab') {
    state.artifactWorkspace.activeTabId = target.dataset.artifact;
    state.artifactWorkspace.activeView = ArtifactView.DETAIL;
    state.artifactWorkspace.drillTarget = null;
    state.artifactWorkspace.playing = false;
  } else if (action === 'close-artifact-tab') {
    const artifactId = target.closest('[data-artifact]')?.dataset.artifact;
    state.artifactWorkspace = closeArtifactTab(state.artifactWorkspace, artifactId);
  } else if (action === 'toggle-artifact-tree') {
    state.artifactTreeOpen = !state.artifactTreeOpen;
  } else if (action === 'set-artifact-type') {
    state.artifactWorkspace.selectedCategory = target.dataset.type;
    state.artifactWorkspace.activeTabId = null;
    state.artifactWorkspace.rootMode = ArtifactView.CATEGORY;
    state.artifactWorkspace.activeView = ArtifactView.CATEGORY;
  } else if (action === 'open-artifact') {
    showArtifact(target.dataset.artifact);
  } else if (action === 'open-document') {
    showArtifact(target.dataset.artifact || 'requirements-analysis');
  } else if (action === 'open-video') {
    showArtifact(target.dataset.artifact || `campaign-video-${Number(target.dataset.index || 0) + 1}`);
  } else if (action === 'open-image') {
    showArtifact(target.dataset.artifact || `product-image-${Number(target.dataset.index || 0) + 1}`);
  } else if (action === 'open-actor') {
    showArtifact(target.dataset.artifact || `character-${Number(target.dataset.index || 0) + 1}`);
  } else if (action === 'select-video') {
    state.activeVideo = Number(target.dataset.index || 0);
    state.playing = false;
  } else if (action === 'select-media') {
    state.activeMedia = Number(target.dataset.index || 0);
  } else if (action === 'toggle-play') {
    state.artifactWorkspace.playing = !state.artifactWorkspace.playing;
  } else if (action === 'quote-artifact') {
    const artifact = artifactById(state.artifacts, state.artifactWorkspace.activeTabId);
    if (artifact) attachReference({ artifactId: artifact.id, revisionId: artifact.revision, type: artifact.type, title: artifact.title, thumbnail: artifact.previewUrl });
  } else if (action === 'edit-artifact') {
    const artifact = artifactById(state.artifacts, state.artifactWorkspace.activeTabId);
    if (artifact && getArtifactType(artifact.type).canEdit) {
      state.artifactDraft = structuredClone(artifactContent(artifact, state));
      state.activeScene = 0;
      state.artifactWorkspace.activeView = ArtifactView.EDIT;
    }
  } else if (action === 'cancel-artifact-edit') {
    if (state.artifactWorkspace.activeView === ArtifactView.DRILL) {
      Object.assign(state, finishActorDrill(state));
      render(); return;
    }
    const current = artifactById(state.artifacts, state.artifactWorkspace.activeTabId);
    state.artifactWorkspace.activeView = current?.type === 'preview' ? state.artifactWorkspace.rootMode : ArtifactView.DETAIL;
    if (current?.type === 'preview') state.artifactWorkspace.activeTabId = null;
    state.artifactWorkspace.drillTarget = null;
    state.artifactDraft = null;
  } else if (action === 'apply-artifact-edit') {
    if (state.artifactWorkspace.activeView === ArtifactView.DRILL) {
      Object.assign(state, finishActorDrill(state, true));
      render(); return;
    }
    const artifact = artifactById(state.artifacts, state.artifactWorkspace.activeTabId);
    if (artifact) {
      const updated = commitArtifactEdit(artifact, state.artifactDraft || artifact);
      state.artifacts = state.artifacts.map((item) => item.id === artifact.id ? updated : item);
      notify(`已保存版本 ${updated.revision}`);
    }
    state.artifactDraft = null;
    state.artifactWorkspace.activeView = ArtifactView.DETAIL;
    state.artifactWorkspace.drillTarget = null;
  } else if (action === 'drill-artifact') {
    Object.assign(state, beginActorDrill(state, target.dataset.artifact));
  } else if (action === 'back-from-artifact-drill') {
    Object.assign(state, finishActorDrill(state));
  } else if (action === 'generate-preview-video') {
    const source = artifactById(state.artifacts, state.artifactWorkspace.activeTabId);
    const id = `campaign-video-${Date.now()}`;
    state.artifacts.push({ ...(state.artifactDraft || artifactContent(source, state)), id, type: 'video', title: `${state.product?.title || state.projectTitle}新成片`, createdAt: '刚刚', sortOrder: Date.now(), status: 'generated', sourceArtifactId: source?.id, previewUrl: source?.previewUrl || media.conversationVideos[0] });
    state.artifactDraft = null;
    state.artifactWorkspace = openArtifactTab(state.artifactWorkspace, id);
  } else if (action === 'use-opportunity') {
    setInput(migrateInput({ draft: '根据这个灵感，为即创螺蛳粉生成一组大促推广视频', attachment: project.product }));
  }

  render();
});

document.addEventListener('keydown', (event) => {
  if (event.target.closest?.('.conversation-editor')) return;
  if (event.key === 'Escape' && (state.dialog || state.settingsOpen)) { state.dialog = null; state.settingsOpen = false; render(); return; }
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.keyCode !== 229 && !event.target.closest?.('button') && event.target.closest?.('[data-role="structured-input"], [data-role="composer-input"]')) {
    event.preventDefault();
    if (event.repeat || state.busy || state.readOnly || state.dialog || state.settingsOpen) return;
    syncDraft();
    if (state.page === 'home' || state.taskMode === 'new') startScenario();
    else if (state.draft.trim()) advanceScenario(state.draft.trim(), implicitInteractionByRun[state.scenarioStage] || null);
  }
  if (event.key === 'Escape' && state.artifactWorkspace.open) {
    state.artifactWorkspace.open = false;
    render();
  }
  if (event.key === 'Escape' && (state.dialog || state.settingsOpen)) { state.dialog = null; state.settingsOpen = false; render(); }
});

window.addEventListener('pagehide', persistCurrentTask);
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => render(), 150); });

applyStudioSettings(state.studio);
applyConversationTokens(state.editor.config);
render({ keepScroll: false });
