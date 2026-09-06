import { Icon, escapeHtml } from '../ui/primitives.js?v=20260906c';
import { media } from '../data/assets.js?v=20260906c';
import { skills } from '../scenarios/skills.js?v=20260906c';
export { skills } from '../scenarios/skills.js?v=20260906c';

export function SkillChoices() {
  return `<div class="new-task-skill-track">${skills.map((skill) => `<div class="skill-choice"><button class="new-task-skill" data-action="choose-skill" data-skill="${skill.name}"><img src="${skill.image}" alt=""><span>${skill.name}</span>${Icon('send')}</button><div class="skill-preview"><img src="${skill.image}" alt=""><b>${skill.name}</b><p>${skill.description}</p></div></div>`).join('')}</div>`;
}

export function TaskDialogs(state) {
  if (!state.dialog) return '';
  let body = '';
  const close = '<button class="dialog-close" data-action="close-dialog" aria-label="关闭">×</button>';
  if (state.dialog === 'product') {
    body = `<h2>选择商品</h2><div class="dialog-tabs"><button class="is-active">从商品库选择</button><label>从本地上传<input type="file" accept="image/*" data-upload="product" hidden></label></div><input class="dialog-search" data-product-search placeholder="搜索商品" aria-label="搜索商品"><div class="product-library">${state.products.map((product, index) => `<button class="product-library-item ${state.selectedProduct === index ? 'is-active' : ''}" data-action="pick-product" data-index="${index}" data-name="${escapeHtml(product.title)}"><img src="${escapeHtml(product.thumbnail)}" alt=""><span>${escapeHtml(product.title)}</span><input type="checkbox" tabindex="-1" ${state.selectedProduct === index ? 'checked' : ''} aria-label="${escapeHtml(product.title)}"></button>`).join('')}</div><footer><button data-action="close-dialog">取消</button><button class="is-primary" data-action="apply-product" ${state.selectedProduct == null ? 'disabled' : ''}>确定</button></footer>`;
  } else if (state.dialog === 'skills') {
    body = `<h2>全部技能</h2><input class="dialog-search" data-skill-search placeholder="搜索技能" aria-label="搜索技能"><div class="skill-library">${skills.map((skill) => `<button data-action="choose-skill" data-skill="${skill.name}"><img src="${skill.image}" alt=""><strong>${skill.name}</strong><span>${skill.description}</span></button>`).join('')}</div>`;
  } else if (state.dialog === 'upload') {
    body = `<h2>添加素材</h2><div class="upload-choices"><label>${Icon('image')}添加图片<input type="file" accept="image/*" data-upload="image" hidden></label><label>${Icon('video')}添加视频<input type="file" accept="video/*" data-upload="video" hidden></label><button data-action="add-text">${Icon('document')}添加文本</button></div>`;
  } else if (state.dialog === 'text') {
    body = '<h2>添加文本</h2><textarea data-text-attachment aria-label="文本素材" placeholder="输入商品资料、活动信息或参考文案"></textarea><footer><button data-action="close-dialog">取消</button><button class="is-primary" data-action="apply-text">添加</button></footer>';
  } else if (state.dialog === 'rename') {
    body = `<h2>重命名任务</h2><input data-task-name maxlength="80" aria-label="任务名称" value="${escapeHtml(state.projectTitle)}"><footer><button data-action="close-dialog">取消</button><button class="is-primary" data-action="apply-task-name">保存</button></footer>`;
  } else if (state.dialog === 'delete') {
    body = `<h2>删除任务</h2><p>确认删除“${escapeHtml(state.projectTitle)}”及其会话和产物？</p><footer><button data-action="close-dialog">取消</button><button class="is-danger" data-action="confirm-delete-task">删除</button></footer>`;
  } else if (state.dialog === 'share') {
    body = `<h2>分享任务</h2><p>此链接包含当前任务的只读快照，收到链接的人可以查看会话和产物。不会包含后续修改。</p><textarea readonly aria-label="任务分享链接">${escapeHtml(state.shareUrl || '')}</textarea><footer><button data-action="close-dialog">关闭</button><button class="is-primary" data-action="copy-share">复制链接</button></footer>`;
  }
  return `<div class="task-dialog-backdrop"><section class="task-dialog task-dialog--${state.dialog}" role="dialog" aria-modal="true">${close}${body}</section></div>`;
}
