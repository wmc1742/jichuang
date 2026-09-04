import { artifactGroups, project } from '../scenarios/luosifen.js';
import { media } from '../data/assets.js';
import { Button, Icon, IconButton, escapeHtml } from '../ui/primitives.js';

const types = [
  { id: 'document', label: '文稿' },
  { id: 'video', label: '视频' },
  { id: 'image', label: '图片' },
  { id: 'actor', label: '演员' },
];

function ArtifactHeader(state) {
  const canToggleTree = state.workbenchView === 'detail' && state.artifactType === 'document';
  return `
    <header class="workbench-header">
      <nav class="artifact-tabs" aria-label="产物类型">
        ${types.map((type) => `<button class="artifact-tab ${state.artifactType === type.id ? 'is-active' : ''}" data-action="set-artifact-type" data-type="${type.id}">${Icon(type.id)}<span>${type.label}</span></button>`).join('')}
      </nav>
      <div class="workbench-actions">
        ${IconButton({
          icon: 'artifactList',
          label: canToggleTree ? (state.artifactTreeOpen ? '收起产物目录' : '展开产物目录') : '产物列表',
          action: canToggleTree ? 'toggle-artifact-tree' : 'open-artifact-list',
          className: state.artifactTreeOpen ? 'is-active' : '',
        })}
        ${IconButton({ icon: 'workbench', label: '收起工作台', action: 'close-workbench' })}
      </div>
    </header>`;
}

function DocumentList() {
  return `<div class="artifact-list">${artifactGroups.document.map((item) => `
    <button class="artifact-list-card" data-action="open-document" data-artifact="${item.id}">
      <span>${Icon('document')}<b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.subtitle)}</small></span>
      <time>${escapeHtml(item.timestamp)}</time>
    </button>`).join('')}</div>`;
}

function MediaGroupList(type) {
  return `<div class="media-groups">${artifactGroups[type].map((group) => `
    <section class="media-group">
      <div class="media-group__head"><span><b>${escapeHtml(group.title)}</b><time>${escapeHtml(group.timestamp)}</time></span><small>${group.items.length} 项</small></div>
      <div class="workbench-media-grid workbench-media-grid--${type}">
        ${group.items.map((item, index) => {
          const src = typeof item === 'string' ? item : item.src;
          const label = typeof item === 'string' ? `${group.title}${index + 1}` : item.title;
          const action = type === 'video' ? 'open-video' : type === 'actor' ? 'open-actor' : 'open-image';
          return `<button data-action="${action}" data-index="${index}"><img src="${src}" alt="${escapeHtml(label)}">${type === 'video' ? `<span class="play-button">${Icon('play')}</span>` : ''}</button>`;
        }).join('')}
      </div>
    </section>`).join('')}</div>`;
}

function ArtifactList(state) {
  return state.artifactType === 'document' ? DocumentList() : MediaGroupList(state.artifactType);
}

function StructuredDocument() {
  return `
    <article class="structured-document">
      <h1>即创螺蛳粉大促视频需求分析</h1>
      <div class="document-intro">
        <p>大促期间，消费者除了商品本身的基础信息以外，更加关注同价格下的差异化卖点，以及促销活动带来的额外优惠。</p>
        <p>因此内容会重点展示螺蛳粉的酸辣口味、丰富配料与零添加特性，并把优惠信息放在前后两个转化节点。</p>
      </div>
      <section><h2>商品信息</h2><h3>1&nbsp;&nbsp;商品参考图</h3><div class="reference-card"><div class="reference-card__head"><span>上传丰富的参考图有助于提升模型的生成质量</span><button>＋ 添加</button></div><div class="reference-images">${media.conversationProducts.map((src) => `<img src="${src}" alt="商品参考图">`).join('')}</div></div></section>
      <section><h3>2&nbsp;&nbsp;商品详细信息</h3><div class="document-card"><h4>产品卖点</h4><ul><li><span>主推卖点</span>酸辣鲜香，配料丰富，一碗更满足</li><li>独立料包，口味浓郁，适合囤货</li><li>大促优惠直接，适合强转化表达</li></ul></div><div class="document-card"><h4>面向人群</h4><ul><li><span>核心人群</span>20-35岁年轻上班族</li><li>偏好方便速食、重口味与高性价比</li></ul></div></section>
      <section><h2>内容偏好</h2><div class="document-card"><h4>表达方式</h4><ul><li>开头3秒使用加班和深夜饥饿场景建立共鸣</li><li>中段快速展示配料和酸辣口感</li><li>结尾集中呈现大促到手价与行动指令</li></ul></div></section>
    </article>`;
}

function ArtifactTree() {
  return `
    <aside class="artifact-tree">
      <details open><summary>${escapeHtml(project.title)}</summary>
        <details open><summary>文稿</summary><button class="is-active">即创螺蛳粉大促视频需求分析</button><button>创意方向</button><button>创意分镜</button></details>
        <details open><summary>图片</summary>${Array.from({ length: 5 }, (_, i) => `<button>商品图${i + 1}</button>`).join('')}</details>
        <details open><summary>演员</summary><button>林若曦</button><button>姜楠</button></details>
        <details open><summary>视频</summary>${Array.from({ length: 5 }, (_, i) => `<button>推广大促成片${i + 1}</button>`).join('')}</details>
      </details>
    </aside>`;
}

function DocumentDetail(state) {
  return `<div class="document-detail ${state.artifactTreeOpen ? 'has-artifact-tree' : ''}"><div class="document-scroll">${StructuredDocument()}</div>${state.artifactTreeOpen ? ArtifactTree() : ''}</div>`;
}

function VideoDetail(state) {
  const videos = artifactGroups.video[0].items;
  const active = videos[state.activeVideo] || videos[0];
  return `
    <div class="video-detail">
      <div class="video-thumbs">${videos.map((video, index) => `<button class="${state.activeVideo === index ? 'is-active' : ''}" data-action="select-video" data-index="${index}"><img src="${video.src}" alt="${escapeHtml(video.title)}"></button>`).join('')}</div>
      <button class="video-stage ${state.playing ? 'is-playing' : ''}" data-action="toggle-play"><img src="${active.src}" alt="${escapeHtml(active.title)}"><span class="play-button play-button--large">${Icon('play')}</span><span class="playing-label">播放中</span></button>
    </div>`;
}

function ImageDetail(state, actor = false) {
  const list = actor ? media.conversationActors : media.conversationProducts;
  const src = list[state.activeMedia % list.length];
  return `<div class="single-media-detail"><div class="single-media-thumbs">${list.slice(0, 5).map((item, index) => `<button class="${state.activeMedia === index ? 'is-active' : ''}" data-action="select-media" data-index="${index}"><img src="${item}" alt="预览 ${index + 1}"></button>`).join('')}</div><img class="single-media-hero" src="${src}" alt="${actor ? '演员详情' : '图片详情'}">${actor ? '<div class="actor-meta"><h2>姜楠</h2><p>25岁，年轻上班族形象；自然、松弛，适合生活化剧情。</p><dl><dt>声音</dt><dd>清爽青年音</dd><dt>风格</dt><dd>真实感、轻喜剧</dd></dl></div>' : ''}</div>`;
}

function DetailBody(state) {
  if (state.artifactType === 'document') return DocumentDetail(state);
  if (state.artifactType === 'video') return VideoDetail(state);
  if (state.artifactType === 'actor') return ImageDetail(state, true);
  return ImageDetail(state, false);
}

function DetailActions(state) {
  const label = state.artifactType === 'video' ? '编辑视频' : state.artifactType === 'image' ? '编辑图片' : state.artifactType === 'actor' ? '编辑演员' : '编辑文稿';
  return `<footer class="detail-actions">${Button({ label: '引用至会话', action: 'quote-artifact', variant: 'inverted' })}${Button({ label, action: 'edit-artifact', variant: 'inverted' })}</footer>`;
}

export function ArtifactWorkbench(state) {
  const detail = state.workbenchView === 'detail';
  return `<aside class="artifact-workbench">${ArtifactHeader(state)}<div class="workbench-body">${detail ? DetailBody(state) : ArtifactList(state)}</div>${detail ? DetailActions(state) : ''}</aside>`;
}
