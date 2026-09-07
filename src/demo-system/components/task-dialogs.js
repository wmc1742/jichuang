import { Icon, escapeHtml } from '../ui/primitives.js?v=20260907f';
import { media } from '../data/assets.js?v=20260907f';
import { skills, filteredSkills, skillCategories } from '../scenarios/skills.js?v=20260907f';
export { skills } from '../scenarios/skills.js?v=20260907f';

export function SkillChoices() {
  return `<div class="new-task-skill-track">${skills.map((skill) => `<div class="skill-choice"><button class="new-task-skill" data-action="choose-skill" data-skill="${skill.name}"><img src="${media.skillPreview}" alt=""><span>${skill.name}</span>${Icon('send')}</button><div class="skill-preview" data-source-node="1047:44021"><video muted loop playsinline preload="none" poster="${media.skillPreview}" ${skill.previewUrl ? `src="${escapeHtml(skill.previewUrl)}"` : ''}></video><div><b>${skill.name}</b><p>${skill.description}</p></div></div></div>`).join('')}</div>`;
}

export function SkillPopover(state) {
  const list = filteredSkills(state);
  const preview = list.find((skill) => skill.id === state.previewSkillId) || list[0];
  return `<div class="skill-popover-backdrop"><section class="skill-popover" role="dialog" aria-label="选择技能" data-source-node="1047:44709" style="--anchor-x:${state.skillAnchor?.x || 16}px;--anchor-y:${state.skillAnchor?.y || 160}px">
    <label class="skill-search">${Icon('skillSearch')}<input data-skill-search aria-label="搜索技能" placeholder="搜索" value="${escapeHtml(state.skillSearch || '')}"></label>
    <div class="skill-picker-layout"><div class="skill-picker-nav"><nav>${skillCategories.map((category) => `<button data-action="filter-skills" data-category="${category}" class="${(state.skillCategory || '全部') === category ? 'is-active' : ''}">${category}</button>`).join('')}</nav><label class="skill-import">添加<input type="file" accept=".zip,application/zip" data-upload="skill-package" aria-label="添加技能压缩包"></label></div>
    <div class="skill-picker-list">${list.map((skill) => `<button class="${preview?.id === skill.id ? 'is-active' : ''}" data-action="choose-skill" data-skill="${escapeHtml(skill.id)}" data-preview-skill="${escapeHtml(skill.id)}"><strong>${escapeHtml(skill.name)}</strong><span>${escapeHtml(skill.description)}</span></button>`).join('')}${list.length ? '' : '<p class="skill-picker-empty">暂无技能</p>'}</div>
    <video class="skill-picker-preview" muted loop playsinline preload="none" poster="${escapeHtml(preview?.previewPoster || media.skillPreview)}" ${preview?.previewUrl ? `src="${escapeHtml(preview.previewUrl)}"` : ''}></video></div>
  </section></div>`;
}

export function TaskDialogs(state) {
  if (!state.dialog) return '';
  if (state.dialog === 'skills') return SkillPopover(state);
  let body = '';
  const close = '<button class="dialog-close" data-action="close-dialog" aria-label="关闭">×</button>';
  if (state.dialog === 'product') {
    body = `<h2>选择商品</h2><div class="dialog-tabs"><button class="is-active">从商品库选择</button><label>从本地上传<input type="file" accept="image/*" data-upload="product" hidden></label></div><input class="dialog-search" data-product-search placeholder="搜索商品" aria-label="搜索商品"><div class="product-library">${state.products.map((product, index) => `<button class="product-library-item ${state.selectedProduct === index ? 'is-active' : ''}" data-action="pick-product" data-index="${index}" data-name="${escapeHtml(product.title)}"><img src="${escapeHtml(product.thumbnail)}" alt=""><span>${escapeHtml(product.title)}</span><input type="checkbox" tabindex="-1" ${state.selectedProduct === index ? 'checked' : ''} aria-label="${escapeHtml(product.title)}"></button>`).join('')}</div><footer><button data-action="close-dialog">取消</button><button class="is-primary" data-action="apply-product" ${state.selectedProduct == null ? 'disabled' : ''}>确定</button></footer>`;
  } else if (state.dialog === 'upload') {
    body = `<h2>添加素材</h2><div class="upload-choices"><label>${Icon('image')}添加图片<input type="file" accept="image/*" data-upload="image" hidden></label><label>${Icon('video')}添加视频<input type="file" accept="video/*" data-upload="video" hidden></label><button data-action="add-text">${Icon('document')}添加文本</button></div>`;
  } else if (state.dialog === 'text') {
    body = '<h2>添加文本</h2><textarea data-text-attachment aria-label="文本素材" placeholder="输入商品资料、活动信息或参考文案"></textarea><footer><button data-action="close-dialog">取消</button><button class="is-primary" data-action="apply-text">添加</button></footer>';
  } else if (state.dialog === 'rename') {
    body = `<h2>重命名任务</h2><input data-task-name maxlength="80" aria-label="任务名称" value="${escapeHtml(state.projectTitle)}"><footer><button data-action="close-dialog">取消</button><button class="is-primary" data-action="apply-task-name">保存</button></footer>`;
  } else if (state.dialog === 'delete') {
    body = `<h2>删除任务</h2><p>确认删除“${escapeHtml(state.actionTask?.projectTitle || state.projectTitle)}”及其会话和产物？</p><footer><button data-action="close-dialog">取消</button><button class="is-danger" data-action="confirm-delete-task">删除</button></footer>`;
  } else if (state.dialog === 'share') {
    body = `<h2>分享任务</h2><p>此链接包含当前任务的只读快照，收到链接的人可以查看会话和产物。不会包含后续修改。</p><textarea readonly aria-label="任务分享链接">${escapeHtml(state.shareUrl || '')}</textarea><footer><button data-action="close-dialog">关闭</button><button class="is-primary" data-action="copy-share">复制链接</button></footer>`;
  }
  return `<div class="task-dialog-backdrop"><section class="task-dialog task-dialog--${state.dialog}" role="dialog" aria-modal="true">${close}${body}</section></div>`;
}
