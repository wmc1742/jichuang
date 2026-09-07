const sourceNode = '1466:17458';
const item = (text, tag) => ({ text, ...(tag ? { tag } : {}) });
const card = (title, items) => ({ title, items });

export const requirementReferences = [1, 2, 3].map((index) => ({
  id: `product-reference-${index}`, url: `./assets/agent-2/requirements/reference-${index}.png`,
  title: ['商品包装正面', '米粉与配料展示', '商品手提包装'][index - 1],
}));

// Designer-approved structure; scene-specific recommendations remain replaceable Mock content.
export function createRequirementsDocument({ product, campaigns, duration, ratio, referenceImages = requirementReferences }) {
  return { version: 1, source: { mode: 'mock', layoutNode: sourceNode, fixtureVersion: 2 }, blocks: [
    { id: 'analysis-intro', type: 'paragraph', variant: 'lead', sourceNode: '1466:17460', text:
      `大促期间，消费者除了商品本身的基础信息以外，更加关注的是同价格下的差异化卖点，以及促销活动带来的额外优惠。\n因此，本次围绕${product}的成品食欲、米粉与配料展示及大促购买场景组织内容。成分、规格和优惠以商品资料为准；“零添加”等表述需核实后使用。` },
    { id: 'product', type: 'section', title: '商品信息', level: 1, sourceNode: '1466:17465', children: [
      { id: 'references', type: 'section', title: '商品参考图', level: 2, sourceNode: '1466:17468', children: [
        { id: 'product-references', type: 'reference-gallery', sourceNode: '1466:17472', hint: '上传丰富的参考图有助于提升模型的生成质量', items: structuredClone(referenceImages) },
      ] },
      { id: 'facts', type: 'section', title: '商品详细信息', level: 2, sourceNode: '1466:17489', children: [
        { id: 'product-facts', type: 'fact-cards', sourceNode: '1466:17493', cards: [
          card('产品卖点', [
            item('螺蛳粉的风味与米粉、汤汁、配料组合，构成本次主推方向。', '主推卖点'),
            item('参考图可见米粉与多种独立配料；实际配料种类及数量以包装为准。'),
            item('口味、净含量和配料表待商品资料核实，不预设“零添加”。'),
          ]),
          card('面向人群', [
            item('建议优先面向喜爱螺蛳粉、关注口味与配料的消费者。', '核心人群'),
            item('延伸至居家用餐、下班后备餐等场景下的速食需求。'),
            item('兼顾大促囤货人群，重点回答“买什么、怎么吃、是否划算”。'),
          ]),
          card('营销活动', [
            item(`本次视频用于${campaigns}投放。`, '投放节点'),
            item(campaigns.includes('年货') || campaigns.includes('春节') ? `${campaigns.includes('双11') ? '双11侧重日常备餐与组合囤货；' : ''}年货节侧重家庭储备场景。` : '活动侧重日常备餐与组合囤货，具体组合及优惠方式待确认。'),
            item('活动价、组合规格、优惠门槛和有效期需确认，不编造折扣。'),
          ]),
        ] },
      ] },
    ] },
    { id: 'preferences', type: 'section', title: '内容偏好', level: 1, sourceNode: '1466:17569', children: [
      { id: 'content-preferences', type: 'fact-cards', sourceNode: '1466:17572', cards: [
        card('产品卖点', [
          item('开场用提粉、汤汁及配料特写建立食欲，随后带出商品包装。', '呈现重点'),
          item('通过开袋、备餐和拌粉过程展示商品，画面与实际包装保持一致。'),
          item('字幕只提炼已核实信息，不使用夸大的功效或成分承诺。'),
        ]),
        card('面向人群', [
          item('采用生活化的居家备餐与试吃表达，语气自然、直接。', '表达方式'),
          item('围绕“这一餐吃什么”和“大促如何囤货”展开内容。'),
          item('人物体验作为创意演绎，不冒充真实买家评价或销量证明。'),
        ]),
        card('营销活动', [
          item(`按${ratio}画幅、约${duration}秒组织内容，适配${campaigns}。`, '制作要求'),
          item('结尾预留商品与活动信息位置，优惠确认后再填入具体文案。'),
          item('引导查看商品详情及活动规则，不制造未经确认的限时或库存紧迫感。'),
        ]),
      ] },
    ] },
  ] };
}
