const paragraph = (id, text) => ({ id, type: 'paragraph', text });
const section = (id, title, children, level = 1) => ({ id, type: 'section', title, level, children });

// Scene-specific copy is Mock data; the block grammar and presentation come from Figma.
export function createDocumentFixture(template, context) {
  const { product, campaigns, duration, ratio } = context;
  if (template === 'requirements') return { version: 1, source: { mode: 'mock', layoutNode: '1184:124104' }, blocks: [
    section('requirements', '需求分析', [paragraph('goal', `根据${product}的商品信息，为${campaigns}制作推广视频。内容需要清晰呈现商品、使用场景和大促利益点。`)]),
    section('product', '商品信息', [
      section('references', '商品参考图', [{ id: 'product-reference', type: 'subjects', items: [{ context: 'product', role: '商品' }] }], 2),
      section('facts', '商品详细信息', [paragraph('facts-copy', '当前已提供商品名称及参考图片。商品规格、活动价格及有效期需要以实际提供的信息为准。')], 2),
    ]),
    section('video', '视频需求', [{ id: 'requirements-list', type: 'list', items: [
      { label: '投放节点', text: campaigns }, { label: '视频时长', text: `${duration}秒` }, { label: '画面比例', text: ratio },
      { label: '表达方式', text: '围绕商品展示、使用场景和促销信息组织内容。未确认的商品功效与优惠不作确定性表达。' },
    ] }]),
  ] };
  return { version: 1, source: { mode: 'mock', layoutNode: '1184:124104' }, blocks: [
    section('concept', '创意概述', [paragraph('concept-copy', `围绕“下班后的一碗热粉”呈现${product}。开场用成品近景建立食欲，随后展示备餐与试吃，结尾回到商品及${campaigns}推广信息。`)]),
    section('storyboard', '分镜脚本', [
      section('subjects', '主体设定', [{ id: 'subject-cards', type: 'subjects', items: [{ context: 'product', role: '商品' }, { artifactId: 'character-1', role: '主角' }] }], 2),
      section('shots', '分镜内容', [
        { id: 'shot-1', type: 'shots', title: '镜头1：成品展示，吸引注意。', rows: [
          { actorId: 'character-1', dialogue: '忙了一天，先好好吃一顿。', visual: '前景：筷子提起米粉，展示成品的细节。' },
          { actorId: 'character-1', dialogue: '今天给自己安排一碗热粉。', visual: '中景：人物坐到桌前，打开商品包装。' },
        ] },
        { id: 'shot-2', type: 'shots', title: '镜头2：备餐与试吃，呈现使用场景。', rows: [
          { actorId: 'character-1', dialogue: '把配料拌匀，就可以开动了。', visual: '近景：展示备餐、倒入配料和拌粉的连续动作。' },
          { actorId: 'character-1', dialogue: '大促期间，看看有没有适合你的组合。', visual: '后景：商品包装与成品同框，活动信息以已确认内容为准。' },
        ] },
      ], 2),
    ]),
  ] };
}
