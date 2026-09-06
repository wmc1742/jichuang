import { media } from '../data/assets.js?v=20260906c';
import { StructuredDocument } from './document-blocks.js?v=20260906c';
import { artifactContent } from '../artifacts/content.js?v=20260906c';
import {
  ArtifactType,
  ArtifactView,
  artifactById,
  artifactsByType,
  createArtifactWorkspace,
  generatedArtifactTypes,
  getArtifactType,
} from '../artifacts/model.js?v=20260906c';
import { Icon, IconButton, escapeHtml } from '../ui/primitives.js?v=20260906c';

function workspaceState(state) {
  if (state.artifactWorkspace) return state.artifactWorkspace;
  return createArtifactWorkspace({
    open: true,
    selectedCategory: state.artifactType || ArtifactType.DOCUMENT,
    rootMode: state.workbenchView === 'list' ? ArtifactView.CATEGORY : ArtifactView.DETAIL,
    activeView: state.workbenchView === 'detail' ? ArtifactView.DETAIL : ArtifactView.CATEGORY,
    activeTabId: state.activeArtifact || null,
    openTabs: state.activeArtifact ? [state.activeArtifact] : [],
  });
}

function ArtifactTabs(state, workspace) {
  const artifacts = state.artifacts || [];
  const rootActive = !workspace.activeTabId || [ArtifactView.CATEGORY, ArtifactView.LIST].includes(workspace.activeView);
  return `
    <nav class="artifact-tabs" aria-label="已打开的产物">
      <button class="artifact-root-tab ${rootActive ? 'is-active' : ''} ${workspace.openTabs.length ? 'is-compact' : ''}" data-action="artifact-root" title="生成内容">
        ${Icon('artifactList')}<span>生成内容</span>
      </button>
      ${workspace.openTabs.map((id) => {
        const artifact = artifactById(artifacts, id);
        if (!artifact) return '';
        const definition = getArtifactType(artifact.type);
        const active = workspace.activeTabId === id && !rootActive;
        return `<button class="artifact-file-tab ${active ? 'is-active' : ''}" data-action="activate-artifact-tab" data-artifact="${escapeHtml(id)}" title="${escapeHtml(artifact.title)}">
          ${Icon(definition.icon)}<span>${escapeHtml(artifact.title)}</span>${active ? '<i data-action="close-artifact-tab" aria-label="关闭产物">×</i>' : ''}
        </button>`;
      }).join('')}
    </nav>`;
}

function ArtifactHeader(state, workspace) {
  return `
    <header class="workbench-header">
      ${ArtifactTabs(state, workspace)}
      <div class="workbench-actions">
        ${IconButton({ icon: 'artifactList', label: workspace.maximized ? '恢复分栏' : '最大化产物窗口', action: 'toggle-workbench-size', className: workspace.maximized ? 'is-active' : '' })}
        ${IconButton({ icon: 'workbench', label: '收起产物窗口', action: 'close-workbench' })}
      </div>
    </header>`;
}

function TypeFilters(state, workspace) {
  return `<nav class="artifact-type-filters" aria-label="产物分类">
    ${generatedArtifactTypes(state.artifacts).map((type) => `<button class="${workspace.selectedCategory === type.id ? 'is-active' : ''}" data-action="set-artifact-type" data-type="${type.id}">${Icon(type.icon)}<span>${type.label}</span></button>`).join('')}
  </nav>`;
}

function DocumentCard(artifact) {
  return `<button class="artifact-list-card" data-action="open-artifact" data-artifact="${escapeHtml(artifact.id)}">
    <span class="artifact-list-card__copy"><span>${Icon('document')}<b>${escapeHtml(artifact.title)}</b></span><time>${escapeHtml(artifact.createdAt || '')}</time></span>
  </button>`;
}

function MediaTile(artifact) {
  const type = getArtifactType(artifact.type).id;
  const preview = artifact.previewUrl || media.productSquare;
  return `<button class="artifact-media-tile artifact-media-tile--${type}" data-action="open-artifact" data-artifact="${escapeHtml(artifact.id)}" title="${escapeHtml(artifact.title)}">
    <img src="${escapeHtml(preview)}" alt="${escapeHtml(artifact.title)}">
    ${type === ArtifactType.VIDEO ? `<span class="play-button">${Icon('play')}</span>` : ''}
    ${type === ArtifactType.ACTOR ? `<span class="artifact-media-name">${escapeHtml(artifact.title)}</span>` : ''}
  </button>`;
}

function PreviewCard(artifact) {
  const clips = artifact.clips || [];
  return `<button class="artifact-preview-card" data-action="open-artifact" data-artifact="${escapeHtml(artifact.id)}">
    <strong>${Icon('video')}${escapeHtml(artifact.title)}</strong>
    <span class="artifact-preview-card__stage"><img src="${escapeHtml(artifact.previewUrl)}" alt="">${Icon('play')}</span>
    <span class="artifact-preview-card__clips">${clips.slice(0, 3).map((src) => `<img src="${escapeHtml(src)}" alt="">`).join('')}</span>
  </button>`;
}

function TypeCollection(state, type) {
  const artifacts = artifactsByType(state.artifacts, type);
  if (!artifacts.length) return '<div class="artifact-empty">当前任务还没有生成此类内容</div>';
  if (type === ArtifactType.DOCUMENT) return `<div class="artifact-document-list">${artifacts.map(DocumentCard).join('')}</div>`;
  if (type === ArtifactType.PREVIEW) return `<div class="artifact-preview-grid">${artifacts.map(PreviewCard).join('')}</div>`;
  return `<div class="artifact-media-grid artifact-media-grid--${type}">${artifacts.map(MediaTile).join('')}</div>`;
}

function ArtifactOverview(state, workspace) {
  if (!state.artifacts.length) return '<div class="artifact-empty">生成的内容将在这里展示</div>';
  const listMode = workspace.rootMode === ArtifactView.LIST;
  return `<section class="artifact-overview">
    <div class="artifact-overview__toolbar">
      ${listMode ? '<span class="artifact-overview__label">生成内容</span>' : TypeFilters(state, workspace)}
      <button class="artifact-view-toggle" data-action="toggle-artifact-list-mode">${Icon('artifactList')}<span>${listMode ? '分类模式' : '列表模式'}</span></button>
    </div>
    ${listMode
      ? `<div class="artifact-groups">${generatedArtifactTypes(state.artifacts).map((type) => `<section><h2>${type.label}</h2>${TypeCollection(state, type.id)}</section>`).join('')}</div>`
      : TypeCollection(state, workspace.selectedCategory)}
  </section>`;
}

function DetailAction({ label, action, primary = false, icon = null }) {
  return `<button class="artifact-action ${primary ? 'is-primary' : ''}" data-action="${action}">${icon ? Icon(icon) : ''}<span>${escapeHtml(label)}</span></button>`;
}

function DetailTitle(artifact, actions = '') {
  return `<div class="artifact-detail-title"><h1>${escapeHtml(artifact.title)}</h1><div>${actions}</div></div>`;
}

function DocumentDetail(artifact, editing = false, state) {
  const title = editing ? { ...artifact, title: `编辑：${artifact.title}` } : artifact;
  const actions = editing
    ? `${DetailAction({ label: '取消', action: 'cancel-artifact-edit' })}${DetailAction({ label: '应用', action: 'apply-artifact-edit', primary: true })}`
    : `${DetailAction({ label: '引用至会话', action: 'quote-artifact', icon: 'share' })}${DetailAction({ label: '编辑', action: 'edit-artifact', primary: true })}`;
  return `<div class="artifact-detail artifact-detail--document">${DetailTitle(title, actions)}<div class="artifact-detail-scroll">${StructuredDocument({ editing, artifact, artifacts: state.artifacts, product: state.product })}</div></div>`;
}

function VideoDetail(artifact, workspace) {
  return `<div class="artifact-detail artifact-detail--video">
    ${DetailTitle(artifact, `${DetailAction({ label: '引用至会话', action: 'quote-artifact', icon: 'share' })}${DetailAction({ label: '编辑', action: 'edit-artifact', primary: true })}`)}
    <video class="artifact-video-stage" controls playsinline preload="metadata" poster="${escapeHtml(artifact.previewUrl)}" src="${escapeHtml(artifact.mediaUrl || 'assets/demo/luosifen-sample.mp4')}"></video>
  </div>`;
}

function ImageDetail(artifact) {
  return `<div class="artifact-detail artifact-detail--image">${DetailTitle(artifact, DetailAction({ label: '引用至会话', action: 'quote-artifact', icon: 'share' }))}<img class="artifact-image-stage" src="${escapeHtml(artifact.previewUrl)}" alt="${escapeHtml(artifact.title)}"></div>`;
}

function VideoEditor(artifact, preview = false, activeScene = 0) {
  const scenes = artifact.scenes;
  const index = Math.min(activeScene, scenes.length - 1);
  const frames = scenes.map((scene) => scene.image);
  return `<div class="artifact-detail artifact-detail--video-editor">
    <div class="artifact-editor-head"><button data-action="cancel-artifact-edit">‹&nbsp; 返回</button><div>${preview ? DetailAction({ label: '≈100 生成成片', action: 'generate-preview-video', primary: true }) : `${DetailAction({ label: '取消', action: 'cancel-artifact-edit' })}${DetailAction({ label: '应用', action: 'apply-artifact-edit', primary: true })}`}</div></div>
    <div class="video-editor-layout">
      <div class="video-editor-player"><img src="${escapeHtml(frames[index])}" alt="画面${index + 1}"></div>
      <section class="video-editor-controls"><h2>画面${index + 1}</h2><div class="video-editor-scene-tabs"><button data-action="add-scene" aria-label="新增画面">${Icon('material')}</button><button class="is-active" data-action="select-scene" data-index="${index}"><em>AI</em><img src="${escapeHtml(frames[index])}" alt=""></button></div><div class="video-editor-prompt"><h3>编辑描述</h3><textarea data-artifact-field="scenes.${index}.text" aria-label="画面描述">${escapeHtml(scenes[index].text)}</textarea></div></section>
    </div>
    <div class="video-editor-timeline"><span>画面 ${index + 1} / ${frames.length}</span><div class="video-editor-tools"><button data-action="package-video" aria-pressed="${Boolean(artifact.packaging)}">${artifact.packaging ? '已启用智能包装' : '智能包装'}</button></div></div>
    <div class="video-editor-frames">${frames.map((src, frameIndex) => `<button data-action="select-scene" data-index="${frameIndex}" class="${frameIndex === index ? 'is-active' : ''}"><img src="${escapeHtml(src)}" alt="画面${frameIndex + 1}"></button>`).join('')}</div>
  </div>`;
}

function ActorDetail(artifact, editing = false, embedded = false) {
  const actions = editing
    ? `${DetailAction({ label: '取消', action: 'cancel-artifact-edit' })}${DetailAction({ label: '应用', action: 'apply-artifact-edit', primary: true })}`
    : `${DetailAction({ label: '引用至会话', action: 'quote-artifact', icon: 'share' })}${DetailAction({ label: '编辑', action: 'edit-artifact', primary: true })}`;
  return `<div class="artifact-detail artifact-detail--actor">${embedded ? '' : DetailTitle(artifact, actions)}<div class="actor-detail-layout"><img class="actor-detail-hero" src="${escapeHtml(artifact.previewUrl)}" alt="${escapeHtml(artifact.title)}"><div class="actor-detail-copy">${editing ? `<div class="actor-variants">${media.conversationActors.slice(0, 5).map((src, index) => `<button data-action="choose-actor-variant" data-index="${index}" class="${src === artifact.previewUrl ? 'is-active' : ''}"><img src="${src}" alt="候选形象${index + 1}"></button>`).join('')}</div>` : ''}<section><header><h2>形象描述</h2></header>${editing ? `<textarea data-artifact-field="description" aria-label="形象描述">${escapeHtml(artifact.description)}</textarea>` : `<p>${escapeHtml(artifact.description)}</p>`}</section><button class="actor-voice" data-action="preview-voice">${Icon('play')}试听口播</button><section><header><h2>音色描述</h2></header>${editing ? `<textarea data-artifact-field="voice" aria-label="音色描述">${escapeHtml(artifact.voice)}</textarea>` : `<p>${escapeHtml(artifact.voice)}</p>`}</section></div></div></div>`;
}

function DrillEditor(artifact) {
  const actor = artifact.actor;
  return `<div class="artifact-detail artifact-detail--drill"><div class="artifact-editor-head"><button data-action="back-from-artifact-drill">‹&nbsp; 返回</button><div>${DetailAction({ label: '取消', action: 'cancel-artifact-edit' })}${DetailAction({ label: '应用', action: 'apply-artifact-edit', primary: true })}</div></div>${ActorDetail(actor, true, true).replaceAll('data-artifact-field="', 'data-artifact-field="actor.')}</div>`;
}

function LoadingDetail() {
  return '<div class="artifact-loading"><span></span><p>正在加载产物内容</p></div>';
}

function ArtifactContent(state, workspace) {
  if (workspace.loadingArtifactId) return LoadingDetail();
  const original = artifactById(state.artifacts, workspace.activeTabId);
  const draftVisible = [ArtifactView.EDIT, ArtifactView.DRILL].includes(workspace.activeView) || original?.type === ArtifactType.PREVIEW;
  const artifact = original ? artifactContent(draftVisible && state.artifactDraft?.id === original.id ? state.artifactDraft : original, state) : null;
  if (!artifact || [ArtifactView.CATEGORY, ArtifactView.LIST].includes(workspace.activeView)) return ArtifactOverview(state, workspace);
  if (workspace.activeView === ArtifactView.DRILL) return DrillEditor(artifact);
  const type = getArtifactType(artifact.type).id;
  if (workspace.activeView === ArtifactView.EDIT) {
    if (type === ArtifactType.DOCUMENT) return DocumentDetail(artifact, true, state);
    if (type === ArtifactType.VIDEO || type === ArtifactType.PREVIEW) return VideoEditor(artifact, type === ArtifactType.PREVIEW, state.activeScene || 0);
    if (type === ArtifactType.ACTOR) return ActorDetail(artifact, true);
  }
  if (type === ArtifactType.DOCUMENT) return DocumentDetail(artifact, false, state);
  if (type === ArtifactType.VIDEO) return VideoDetail(artifact, workspace);
  if (type === ArtifactType.IMAGE) return ImageDetail(artifact);
  if (type === ArtifactType.PREVIEW) return VideoEditor(artifact, true, state.activeScene || 0);
  return ActorDetail(artifact);
}

export function ArtifactWorkbench(state) {
  const workspace = workspaceState(state);
  return `<aside class="artifact-workbench ${workspace.maximized ? 'is-maximized' : ''}">${ArtifactHeader(state, workspace)}<div class="workbench-body">${ArtifactContent(state, workspace)}</div></aside>`;
}
