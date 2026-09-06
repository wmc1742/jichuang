import { media } from '../data/assets.js?v=20260906d';
import { createDocumentFixture } from '../scenarios/documents.js?v=20260906d';
import { migrateDocument } from './document.js?v=20260906d';

export function artifactContent(artifact, state = {}) {
  const product = state.product?.title || '即创螺蛳粉';
  const selected = state.messages?.find((message) => message.id === 'campaign-selection')?.answer?.selected || [];
  const campaigns = (selected.includes('以上全部') ? ['双11节点', '圣诞/元旦跨年', '春节/年货节'] : selected).join('、') || '本次大促';
  if (artifact.type === 'document') return {
    ...artifact,
    content: artifact.content ? migrateDocument(artifact.content)
      : artifact.documentTemplate ? createDocumentFixture(artifact.documentTemplate, { product, campaigns, duration: state.settings?.duration || 20, ratio: state.settings?.ratio || '9:16' })
        : { version: 1, blocks: [] },
  };
  if (artifact.type === 'actor') return {
    ...artifact,
    description: artifact.description ?? '生活化美食分享者，表情自然、动作放松，适合展示备餐和试吃场景。',
    voice: artifact.voice ?? '自然、清晰、有亲和力的中文口播，语速适中。',
    previewUrl: artifact.previewUrl || media.conversationActors[0],
    appearanceOptions: artifact.appearanceOptions || [...new Set([artifact.previewUrl, ...media.conversationActors].filter(Boolean))].map((previewUrl, index) => ({ id: `appearance-${index}`, previewUrl })),
  };
  const scenes = [
    { image: media.product, text: '0-3秒：热气升起的螺蛳粉特写，筷子提起米粉。字幕：大促囤点好吃的。' },
    { image: media.conversationProductsAll[0], text: '3-8秒：依次展示米粉和独立配料包，突出配料丰富。' },
    { image: media.conversationProductsAll[1], text: '8-15秒：人物打开包装、煮粉并拌匀，展示下班后的用餐场景。' },
    { image: media.product, text: '15-20秒：包装与成品同框。字幕：活动优惠以商品页面为准。' },
  ];
  return {
    ...artifact,
    productImage: state.product?.thumbnail || media.product,
    productName: product,
    actor: artifact.actor || (() => {
      const selected = state.artifacts?.find((item) => item.id === (artifact.actorId || 'character-1'));
      return { id: selected?.id || 'character-1', title: selected?.title || '姜楠', previewUrl: selected?.previewUrl || media.conversationActors[0], description: selected?.description || '自然、有亲和力的美食分享者。', voice: selected?.voice || '自然清晰的中文口播，语速适中。' };
    })(),
    description: artifact.description || '生活化美食分享者，表情自然、动作放松，适合展示备餐和试吃场景。',
    voice: artifact.voice || '自然、清晰、有亲和力的中文口播，语速适中。',
    scenes: artifact.scenes || scenes,
    previewUrl: artifact.previewUrl || media.product,
  };
}
