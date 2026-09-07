const root = './assets/agent-2/home';

// Figma homepage examples. Unspecified skill placeholders have no workflow mapping.
export const homeSkills = [
  { label: '大促营销视频', skillId: 'campaign-video' },
  { label: '技能名称最多八字' }, { label: '技能名称' }, { label: '技能名称' }, { label: '技能名称最多八字' },
  { label: '大促营销视频', skillId: 'campaign-video' }, { label: '技能名称最多八字' }, { label: '技能名称' },
];

export const homeOpportunities = [
  { title: '拆盒惊呼 + 素人开箱 + 榜单加持', body: '同行近1周日均消耗 ¥10000+，而你这个方向只有 ¥8973，每日漏跑 ¥3.4万', tag: '🔥 同行爆款', images: ['img1011', 'img1011'] },
  { title: '5个爆款视频正在衰减', body: '7 天消耗跌 42%，同套路裂变可延长生命周期 2–3 周', tag: '⚠️ 建议裂变', images: ['img1012', 'img1013'] },
  { title: '一擦见黑水 + 反差实测 + 姐妹回购', body: '近同行近3日消耗涨幅 30%，同行 96 家在跑，竞争度低，抢跑窗口 3-5 天', tag: '✨ 潜力趋势', images: ['img1014'] },
].map((item) => ({ ...item, images: item.images.map((name) => `${root}/home-${name}.png`) }));

export const homeInspirations = Array.from({ length: 10 }, (_, index) => `${root}/home-imgRectangle3462425${String(index + 1).padStart(2, '0')}.png`);
