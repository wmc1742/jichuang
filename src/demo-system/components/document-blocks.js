import { escapeHtml } from '../ui/primitives.js?v=20260906b';

function editableText(text, path, editing, label) {
  return editing ? `<textarea data-artifact-field="${path}" aria-label="${escapeHtml(label)}">${escapeHtml(text)}</textarea>` : escapeHtml(text);
}

function resolveReference(item, context) {
  if (item.context === 'product') return { ...context.product, previewUrl: context.product?.thumbnail };
  return context.artifacts.find((artifact) => artifact.id === item.artifactId) || null;
}

const renderers = {
  section: (block, ctx, path) => `<section class="document-section document-section--${block.level || 1}"><h${block.level === 2 ? '3' : '2'}>${escapeHtml(block.title)}</h${block.level === 2 ? '3' : '2'}>${renderBlocks(block.children, ctx, `${path}.children`)}</section>`,
  paragraph: (block, ctx, path) => `<p class="document-paragraph">${editableText(block.text, `${path}.text`, ctx.editing, '正文')}</p>`,
  list: (block, ctx, path) => `<ul class="document-list">${block.items.map((item, i) => `<li><strong>${escapeHtml(item.label)}：</strong>${editableText(item.text, `${path}.items.${i}.text`, ctx.editing, item.label)}</li>`).join('')}</ul>`,
  subjects: (block, ctx) => `<div class="artifact-subject-grid">${block.items.map((item) => {
    const ref = resolveReference(item, ctx);
    if (!ref) return '';
    const action = item.artifactId ? (ctx.editing && ref.type === 'actor' ? 'drill-artifact' : 'open-artifact') : null;
    return `<${action ? 'button' : 'div'} class="artifact-subject-card" ${action ? `data-action="${action}" data-target="actor" data-artifact="${escapeHtml(ref.id)}"` : ''}><span class="artifact-subject-card__media"><img src="${escapeHtml(ref.previewUrl)}" alt="${escapeHtml(ref.title)}"></span><small>${escapeHtml(item.role)}</small><b>${escapeHtml(ref.title)}</b></${action ? 'button' : 'div'}>`;
  }).join('')}</div>`,
  shots: (block, ctx, path) => `<section class="document-shot"><p class="document-shot-title">${editableText(block.title, `${path}.title`, ctx.editing, '镜头标题')}</p><div class="storyboard-table" role="table" aria-label="${escapeHtml(block.title)}"><header role="row"><span role="columnheader">人物台词</span><span role="columnheader">画面描述</span></header>${block.rows.map((row, index) => {
    const actor = ctx.artifacts.find((item) => item.id === row.actorId);
    return `<div role="row"><span role="cell">${actor ? `<button class="document-actor-reference" data-action="open-artifact" data-artifact="${escapeHtml(actor.id)}"><img src="${escapeHtml(actor.previewUrl)}" alt="">${escapeHtml(actor.title)}</button>` : ''}<p>${editableText(row.dialogue, `${path}.rows.${index}.dialogue`, ctx.editing, '人物台词')}</p></span><span role="cell">${editableText(row.visual, `${path}.rows.${index}.visual`, ctx.editing, '画面描述')}</span></div>`;
  }).join('')}</div></section>`,
  image: (block, ctx) => {
    const ref = resolveReference(block, ctx);
    return ref ? `<button class="document-image" data-action="open-artifact" data-artifact="${escapeHtml(ref.id)}"><img src="${escapeHtml(ref.previewUrl)}" alt="${escapeHtml(ref.title)}"></button>` : '';
  },
  video: (block, ctx) => {
    const ref = resolveReference(block, ctx);
    return ref ? `<video class="document-video" controls playsinline src="${escapeHtml(ref.mediaUrl || '')}" poster="${escapeHtml(ref.previewUrl)}" aria-label="${escapeHtml(ref.title)}"></video>` : '';
  },
};

function renderBlocks(blocks, context, path) {
  return (blocks || []).map((block, index) => {
    const renderer = renderers[block.type];
    if (!renderer) return '';
    return `<div class="document-block document-block--${block.type}" data-component="DocumentBlock" data-block-id="${escapeHtml(block.id)}" data-block-type="${block.type}" data-source-node="1184:124104">${renderer(block, context, `${path}.${index}`)}</div>`;
  }).join('');
}

export function StructuredDocument({ artifact, editing, artifacts, product }) {
  return `<article class="artifact-document ${editing ? 'is-editing' : ''}" data-component="StructuredDocument" data-artifact-id="${escapeHtml(artifact.id)}">${renderBlocks(artifact.content?.blocks, { editing, artifacts, product }, 'content.blocks')}</article>`;
}
