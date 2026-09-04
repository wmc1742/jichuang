import { media } from '../data/assets.js';
import {
  ArtifactType,
  ArtifactView,
  artifactById,
  artifactsByType,
  createArtifactWorkspace,
  generatedArtifactTypes,
  getArtifactType,
} from '../artifacts/model.js';
import { Icon, IconButton, escapeHtml } from '../ui/primitives.js';

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

function SubjectCard({ image, kind, name, voice = false, drill = false }) {
  return `<button class="artifact-subject-card" ${drill ? 'data-action="drill-artifact" data-target="actor"' : ''}>
    <span class="artifact-subject-card__media"><img src="${escapeHtml(image)}" alt="${escapeHtml(name)}">${voice ? `<i>${Icon('play')}</i>` : ''}</span>
    <small>${escapeHtml(kind)}</small><b>${escapeHtml(name)}</b>
  </button>`;
}

function StoryboardDocument({ editing = false } = {}) {
  return `<article class="artifact-document ${editing ? 'is-editing' : ''}">
    <section>
      <h2>创意概述</h2>
      ${editing
        ? '<textarea aria-label="创意概述">视频以小个子女生冬季穿搭困境开场，对比普通长款外套显矮与银灰短外套显高的效果。动态演示袖子脱卸变马甲、半袖的多穿场景，最后强调7天无理由退货的保障，引导点击购买。</textarea>'
        : '<p class="artifact-document__intro">视频以小个子女生冬季穿搭困境开场，对比普通长款外套显矮与银灰短外套显高的效果。动态演示袖子脱卸变马甲、半袖的多穿场景，特写羊羔绒质感及90%灰鹅绒填充细节，最后强调7天无理由退货的保障，引导点击购买。</p>'}
      <button class="artifact-text-link">查看完整创意 <span>›</span></button>
    </section>
    <section>
      <h2>分镜脚本</h2>
      <h3>1&nbsp;&nbsp;主体设定</h3>
      <div class="artifact-subject-grid">
        ${SubjectCard({ image: media.productSquare, kind: '商品', name: '即创螺蛳粉' })}
        ${SubjectCard({ image: media.conversationActors[0], kind: '主角', name: '张楚', drill: true })}
        ${SubjectCard({ image: media.conversationActors[1], kind: '配角', name: '姜楠', drill: true })}
        ${SubjectCard({ image: media.conversationActors[2], kind: '旁白', name: '中性女声', voice: true })}
      </div>
    </section>
    <section>
      <h3>2&nbsp;&nbsp;分镜描述</h3>
      <p>• 镜头1：猎奇开场+夸张演绎，制造悬念和趣味性。</p>
      <div class="storyboard-table">
        <header><span>台词台词</span><span>画面描述</span></header>
        <div><span><i>主角：张楚</i>“姐你这抽屉，你这柜子里这么乱，咋回事啊？”<i>配角：姜楠</i>“你俩的柜子？”</span><span><b>前景：</b>家政大姐正费力地拉开一个被堵塞的抽屉，她回头看向镜头，表情惊讶。<br><b>中景：</b>人物快速进入画面，形成生活化冲突。</span></div>
      </div>
    </section>
  </article>`;
}

function DocumentDetail(artifact, editing = false) {
  const title = editing ? { ...artifact, title: `编辑：${artifact.title}` } : artifact;
  const actions = editing
    ? `${DetailAction({ label: '取消', action: 'cancel-artifact-edit' })}${DetailAction({ label: '应用', action: 'apply-artifact-edit', primary: true })}`
    : `${DetailAction({ label: '引用至会话', action: 'quote-artifact', icon: 'share' })}${DetailAction({ label: '编辑', action: 'edit-artifact', primary: true })}`;
  return `<div class="artifact-detail artifact-detail--document">${DetailTitle(title, actions)}<div class="artifact-detail-scroll">${StoryboardDocument({ editing })}</div></div>`;
}

function VideoDetail(artifact, workspace) {
  return `<div class="artifact-detail artifact-detail--video">
    ${DetailTitle(artifact, `${DetailAction({ label: '引用至会话', action: 'quote-artifact', icon: 'share' })}${DetailAction({ label: '编辑', action: 'edit-artifact', primary: true })}`)}
    <button class="artifact-video-stage ${workspace.playing ? 'is-playing' : ''}" data-action="toggle-play"><img src="${escapeHtml(artifact.previewUrl)}" alt="${escapeHtml(artifact.title)}"><span>${Icon('play')}</span><i>播放中</i></button>
  </div>`;
}

function ImageDetail(artifact) {
  return `<div class="artifact-detail artifact-detail--image">${DetailTitle(artifact, DetailAction({ label: '引用至会话', action: 'quote-artifact', icon: 'share' }))}<img class="artifact-image-stage" src="${escapeHtml(artifact.previewUrl)}" alt="${escapeHtml(artifact.title)}"></div>`;
}

function VideoEditor(artifact, preview = false) {
  const frames = artifact.clips?.length ? artifact.clips : media.conversationProductsAll;
  return `<div class="artifact-detail artifact-detail--video-editor">
    <div class="artifact-editor-head"><button data-action="cancel-artifact-edit">‹&nbsp; 返回</button><div>${preview ? DetailAction({ label: '≈100 生成成片', action: 'generate-preview-video', primary: true }) : `${DetailAction({ label: '取消', action: 'cancel-artifact-edit' })}${DetailAction({ label: '应用', action: 'apply-artifact-edit', primary: true })}`}</div></div>
    <div class="video-editor-layout">
      <div class="video-editor-player"><img src="${escapeHtml(artifact.previewUrl)}" alt=""><span>${Icon('play')}</span></div>
      <section class="video-editor-controls"><h2>画面1</h2><div class="video-editor-scene-tabs"><button>＋<small>新增视频</small></button><button class="is-active"><em>AI</em><img src="${escapeHtml(frames[0])}" alt=""></button></div><div class="video-editor-prompt"><h3>编辑描述</h3><textarea>前3秒：中景镜头，初始静止状态下五个精致的白色小瓷碗分别盛放着五种原料，整齐排列；镜头开始缓慢推进，保持画面稳定无动态，传递天然健康高级的氛围。</textarea><footer><b>参考主体：</b>${media.conversationActors.slice(0, 2).map((src) => `<img src="${src}" alt="">`).join('')}<button>＋</button><span>输入@可引用参考主体</span></footer></div></section>
    </div>
    <div class="video-editor-timeline"><span>▶</span><span>◼</span><b>00:04</b><small>/00:55</small><div class="video-editor-tools"><button>智能包装</button></div></div>
    <div class="video-editor-frames">${frames.slice(0, 8).map((src, index) => `<button class="${index === 0 ? 'is-active' : ''}"><img src="${escapeHtml(src)}" alt="画面${index + 1}"></button>`).join('')}</div>
  </div>`;
}

function ActorDetail(artifact, editing = false, embedded = false) {
  const actions = editing
    ? `${DetailAction({ label: '取消', action: 'cancel-artifact-edit' })}${DetailAction({ label: '应用', action: 'apply-artifact-edit', primary: true })}`
    : `${DetailAction({ label: '引用至会话', action: 'quote-artifact', icon: 'share' })}${DetailAction({ label: '编辑', action: 'edit-artifact', primary: true })}`;
  return `<div class="artifact-detail artifact-detail--actor">${embedded ? '' : DetailTitle(artifact, actions)}<div class="actor-detail-layout"><img class="actor-detail-hero" src="${escapeHtml(artifact.previewUrl)}" alt="${escapeHtml(artifact.title)}"><div class="actor-detail-copy"><div class="actor-variants">${media.conversationActors.slice(0, 5).map((src, index) => `<button class="${index === 0 ? 'is-active' : ''}"><img src="${src}" alt="候选形象${index + 1}"></button>`).join('')}</div><section><header><h2>形象描述</h2><span>保存至演员库　编辑</span></header>${editing ? '<textarea>年轻女性，热爱美食，喜欢分享的年轻女性，妆容自然，笑容亲切有感染力。</textarea>' : '<p>年轻女性，热爱美食，喜欢分享的年轻女性，妆容自然，笑容亲切有感染力。在不同场景下，会穿着符合场景的服装。</p>'}</section><button class="actor-voice">${Icon('play')}带货口播</button><section><header><h2>音色描述</h2><span>编辑</span></header><p>20-30岁青年女性，音色温润明亮，热情真诚有感染力，语速较快。</p></section></div></div></div>`;
}

function DrillEditor(artifact) {
  const actor = { ...artifact, title: '张楚', previewUrl: media.conversationActors[0] };
  return `<div class="artifact-detail artifact-detail--drill"><div class="artifact-editor-head"><button data-action="back-from-artifact-drill">‹&nbsp; 返回</button><div>${DetailAction({ label: '取消', action: 'cancel-artifact-edit' })}${DetailAction({ label: '应用', action: 'apply-artifact-edit', primary: true })}</div></div>${ActorDetail(actor, true, true)}</div>`;
}

function LoadingDetail() {
  return '<div class="artifact-loading"><span></span><p>正在加载产物内容</p></div>';
}

function ArtifactContent(state, workspace) {
  if (workspace.loadingArtifactId) return LoadingDetail();
  const artifact = artifactById(state.artifacts, workspace.activeTabId);
  if (!artifact || [ArtifactView.CATEGORY, ArtifactView.LIST].includes(workspace.activeView)) return ArtifactOverview(state, workspace);
  if (workspace.activeView === ArtifactView.DRILL) return DrillEditor(artifact);
  const type = getArtifactType(artifact.type).id;
  if (workspace.activeView === ArtifactView.EDIT) {
    if (type === ArtifactType.DOCUMENT) return DocumentDetail(artifact, true);
    if (type === ArtifactType.VIDEO) return VideoEditor(artifact);
    if (type === ArtifactType.ACTOR) return ActorDetail(artifact, true);
  }
  if (type === ArtifactType.DOCUMENT) return DocumentDetail(artifact);
  if (type === ArtifactType.VIDEO) return VideoDetail(artifact, workspace);
  if (type === ArtifactType.IMAGE) return ImageDetail(artifact);
  if (type === ArtifactType.PREVIEW) return VideoEditor(artifact, true);
  return ActorDetail(artifact);
}

export function ArtifactWorkbench(state) {
  const workspace = workspaceState(state);
  return `<aside class="artifact-workbench ${workspace.maximized ? 'is-maximized' : ''}">${ArtifactHeader(state, workspace)}<div class="workbench-body">${ArtifactContent(state, workspace)}</div></aside>`;
}
