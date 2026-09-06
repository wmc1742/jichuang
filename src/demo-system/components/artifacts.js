import { media } from '../data/assets.js?v=20260906e';
import { StructuredDocument } from './document-blocks.js?v=20260906e';
import { artifactContent } from '../artifacts/content.js?v=20260906e';
import {
  ArtifactType,
  ArtifactView,
  artifactById,
  artifactsByType,
  createArtifactWorkspace,
  generatedArtifactTypes,
  getArtifactType,
} from '../artifacts/model.js?v=20260906e';
import { Icon, IconButton, escapeHtml } from '../ui/primitives.js?v=20260906e';

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
    <nav class="artifact-tabs ${workspace.openTabs.length > 3 ? 'is-crowded' : ''}" aria-label="已打开的产物">
      <button class="artifact-root-tab ${rootActive ? 'is-active' : ''} ${workspace.openTabs.length ? 'is-compact' : ''}" data-action="artifact-root" title="生成内容">
        ${Icon('artifactFolder')}<span>生成内容</span>
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
  if (!scenes.length) return '<div class="artifact-empty">暂无画面</div>';
  const index = Math.max(0, Math.min(activeScene, scenes.length - 1));
  const scene = scenes[index];
  const frames = scenes.map((scene) => scene.image);
  const variants = scene.variants || [{ image: scene.image, mediaUrl: scene.mediaUrl || artifact.mediaUrl, generated: true }];
  const references = scene.references || [{ image: artifact.productImage, title: artifact.productName }, { image: artifact.actor?.previewUrl, title: artifact.actor?.title }].filter((item) => item.image);
  return `<div class="artifact-detail artifact-detail--video-editor" data-source-node="1184:130167">
    <div class="artifact-editor-head"><button data-action="cancel-artifact-edit">${Icon('chevronRight')}返回</button><div>${preview ? DetailAction({ label: '≈100 生成成片', action: 'generate-preview-video', primary: true }) : `${DetailAction({ label: '取消', action: 'cancel-artifact-edit' })}${DetailAction({ label: '应用', action: 'apply-artifact-edit', primary: true })}`}</div></div>
    <div class="video-editor-layout">
      <div class="video-editor-player"><video data-editor-video playsinline preload="metadata" poster="${escapeHtml(scene.image)}" src="${escapeHtml(scene.mediaUrl || artifact.mediaUrl || 'assets/demo/luosifen-sample.mp4')}"></video></div>
      <section class="video-editor-controls"><h2>画面${index + 1}</h2><div class="video-editor-scene-tabs"><label class="video-variant-add">${Icon('material')}<span>新增视频</span><input type="file" accept="video/*" data-upload="scene-video" aria-label="为当前画面新增视频"></label>${variants.map((variant, variantIndex) => `<button class="${(scene.variantIndex || 0) === variantIndex ? 'is-active' : ''}" data-action="select-scene-variant" data-index="${variantIndex}" aria-label="选择视频${variantIndex + 1}">${variant.generated ? '<em>AI</em>' : ''}${variant.image ? `<img src="${escapeHtml(variant.image)}" alt="">` : `<video muted preload="metadata" src="${escapeHtml(variant.mediaUrl)}"></video>`}</button>`).join('')}</div><div class="video-editor-prompt"><h3>编辑描述</h3><textarea data-artifact-field="scenes.${index}.text" aria-label="画面描述">${escapeHtml(scene.text)}</textarea><footer><div class="video-reference-list">${references.map((reference) => `<img src="${escapeHtml(reference.image)}" alt="${escapeHtml(reference.title || '参考主体')}" title="${escapeHtml(reference.title || '参考主体')}">`).join('')}<label class="video-reference-add" title="添加参考主体">${Icon('material')}<input type="file" accept="image/*" data-upload="scene-reference" aria-label="添加参考主体"></label></div><div class="video-prompt-send"><span>输入@可引用参考主体</span><button data-action="regenerate-scene" aria-label="生成当前画面">${Icon('send')}</button></div></footer></div></section>
    </div>
    <div class="video-editor-timeline"><button data-action="editor-video-play" aria-label="播放" aria-pressed="false">${Icon('videoPlay')}</button><button data-action="editor-video-mute" aria-label="静音" aria-pressed="false">${Icon('videoMute')}</button><time data-editor-time>00:00 / 00:00</time><div class="video-editor-tools">${[['videoActor', '形象'], ['videoSticker', '贴纸'], ['videoText', '文字'], ['videoMusic', '音乐'], ['videoPackage', '智能包装']].map(([icon, label]) => `<button data-action="video-tool-boundary" data-tool="${label}" title="${label}" aria-label="${label}">${Icon(icon)}${label === '智能包装' ? '<span>智能包装</span>' : ''}</button>`).join('')}</div></div>
    <div class="video-editor-frames">${frames.map((src, frameIndex) => `<button data-action="select-scene" data-index="${frameIndex}" class="${frameIndex === index ? 'is-active' : ''}"><img src="${escapeHtml(src)}" alt="画面${frameIndex + 1}"></button>`).join('')}</div>
  </div>`;
}

function ActorDetail(artifact, editing = false, embedded = false, editingField = null) {
  const actions = editing
    ? `${DetailAction({ label: '取消', action: 'cancel-artifact-edit' })}${DetailAction({ label: '应用', action: 'apply-artifact-edit', primary: true })}`
    : DetailAction({ label: '引用至会话', action: 'quote-artifact', icon: 'share' });
  const panel = (field, title) => `<section class="actor-description actor-description--${field}">
    <header><h2>${title}</h2><div class="actor-description-actions">${field === 'description' ? `<button data-action="save-actor-library">${Icon('actorSave')}保存至演员库</button>` : ''}<button data-action="edit-actor-field" data-field="${field}" aria-label="编辑${title}" aria-pressed="${editingField === field}">${Icon('actorEdit')}编辑</button></div></header>
    ${editing && editingField === field ? `<textarea data-artifact-field="${embedded ? 'actor.' : ''}${field}" aria-label="${title}">${escapeHtml(artifact[field])}</textarea>` : `<p>${escapeHtml(artifact[field])}</p>`}
  </section>`;
  return `<div class="artifact-detail artifact-detail--actor" data-source-node="1184:124561">${embedded ? '' : DetailTitle(artifact, actions)}
    <div class="actor-detail-layout"><img class="actor-detail-hero" src="${escapeHtml(artifact.previewUrl)}" alt="${escapeHtml(artifact.title)}"><div class="actor-detail-copy">
      <div class="actor-settings-group"><div class="actor-variants" aria-label="形象选择">
        <label class="actor-variant-add" title="添加形象">${Icon('material')}<input type="file" accept="image/*" data-upload="actor-variant" aria-label="添加形象"></label>
        ${(artifact.appearanceOptions || []).map((option, index) => `<button data-action="choose-actor-variant" data-index="${index}" aria-label="选择形象${index + 1}" aria-pressed="${option.previewUrl === artifact.previewUrl}" class="${option.previewUrl === artifact.previewUrl ? 'is-active' : ''}"><img src="${escapeHtml(option.previewUrl)}" alt="形象${index + 1}"></button>`).join('')}
      </div>${panel('description', '形象描述')}</div>
      <div class="actor-settings-group"><button class="actor-voice" data-action="preview-voice" aria-label="试听带货口播">${Icon('actorVoice')}带货口播</button>${panel('voice', '音色描述')}</div>
    </div></div></div>`;
}

function DrillEditor(artifact, editingField) {
  const actor = artifactContent({ ...artifact.actor, type: ArtifactType.ACTOR });
  return `<div class="artifact-detail artifact-detail--drill"><div class="artifact-editor-head"><button data-action="back-from-artifact-drill">${Icon('chevronRight')}返回</button><div>${DetailAction({ label: '取消', action: 'cancel-artifact-edit' })}${DetailAction({ label: '应用', action: 'apply-artifact-edit', primary: true })}</div></div>${ActorDetail(actor, true, true, editingField)}</div>`;
}

function LoadingDetail() {
  return '<div class="artifact-loading" role="status" aria-label="正在加载产物内容" data-source-node="1343:168488"><div class="artifact-loading-title"></div><div class="artifact-loading-surface"></div></div>';
}

function ArtifactContent(state, workspace) {
  if (workspace.loadingArtifactId) return LoadingDetail();
  const original = artifactById(state.artifacts, workspace.activeTabId);
  const draftVisible = [ArtifactView.EDIT, ArtifactView.DRILL].includes(workspace.activeView) || original?.type === ArtifactType.PREVIEW;
  const artifact = original ? artifactContent(draftVisible && state.artifactDraft?.id === original.id ? state.artifactDraft : original, state) : null;
  if (!artifact || [ArtifactView.CATEGORY, ArtifactView.LIST].includes(workspace.activeView)) return ArtifactOverview(state, workspace);
  if (workspace.activeView === ArtifactView.DRILL) return DrillEditor(artifact, state.actorEditingField);
  const type = getArtifactType(artifact.type).id;
  if (workspace.activeView === ArtifactView.EDIT) {
    if (type === ArtifactType.DOCUMENT) return DocumentDetail(artifact, true, state);
    if (type === ArtifactType.VIDEO || type === ArtifactType.PREVIEW) return VideoEditor(artifact, type === ArtifactType.PREVIEW, state.activeScene || 0);
    if (type === ArtifactType.ACTOR) return ActorDetail(artifact, true, false, state.actorEditingField);
  }
  if (type === ArtifactType.DOCUMENT) return DocumentDetail(artifact, false, state);
  if (type === ArtifactType.VIDEO) return VideoDetail(artifact, workspace);
  if (type === ArtifactType.IMAGE) return ImageDetail(artifact);
  if (type === ArtifactType.PREVIEW) return VideoEditor(artifact, true, state.activeScene || 0);
  return ActorDetail(artifact);
}

export function ArtifactWorkbench(state) {
  const workspace = workspaceState(state);
  const viewKey = [state.taskId, workspace.activeTabId, workspace.activeView, workspace.drillTarget?.artifactId].join(':');
  return `<aside class="artifact-workbench" data-workspace-view="${escapeHtml(viewKey)}">${ArtifactHeader(state, workspace)}<div class="workbench-body">${ArtifactContent(state, workspace)}</div></aside>`;
}
