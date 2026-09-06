import { media } from '../data/assets.js?v=20260906a';

export function artifactContent(artifact, state = {}) {
  const product = state.product?.title || '即创螺蛳粉';
  const campaigns = state.messages?.find((message) => message.id === 'campaign-selection')?.answer?.selected?.join('、') || '双11节点、春节/年货节';
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
    content: artifact.content || (artifact.id.startsWith('requirements')
      ? { intro: `为${product}制作适用于${campaigns}投放的推广视频。用食物特写建立食欲，通过真实备餐过程呈现产品特点，最后引导了解活动。`, body: `投放节点：${campaigns}\n视频时长：${state.settings?.duration || 20}秒\n画面比例：${state.settings?.ratio || '9:16'}\n主要人群：喜欢方便速食的年轻上班族\n表达重点：酸辣风味、丰富配料、便捷备餐\n待补充：商品规格、核实后的卖点、活动到手价与有效时间。未确认的信息不写成确定性宣传承诺。` }
      : { intro: `以“下班后的一碗热粉”为主题，为${product}建立生活化使用场景。前3秒用食物近景吸引注意，中段呈现配料和制作过程，结尾承接大促购买需求。`, body: scenes.map((scene) => scene.text).join('\n\n') }),
    description: artifact.description || '生活化美食分享者，表情自然、动作放松，适合展示备餐和试吃场景。',
    voice: artifact.voice || '自然、清晰、有亲和力的中文口播，语速适中。',
    scenes: artifact.scenes || scenes,
    previewUrl: artifact.previewUrl || media.product,
  };
}
