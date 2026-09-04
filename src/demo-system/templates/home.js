import { media } from '../data/assets.js';
import { Composer } from '../components/composer.js';
import { ProductHeader, ProductRail } from '../components/navigation.js';
import { escapeHtml } from '../ui/primitives.js';

const skills = ['大促营销视频', '商品卖点拆解', '口播脚本', '素材裂变', '爆款复刻', '场景优化'];
const opportunities = [
  ['拆盒惊呼 + 素人开箱 + 榜单加持', '同行近1周日均消耗持续上升，真实开箱更容易建立信任。'],
  ['深夜加班 + 一口解馋 + 到手价', '夜宵场景与年轻上班族高度匹配，建议强化口味与囤货理由。'],
  ['配料铺满桌 + 酸辣反应 + 促销收口', '强视觉特写能快速传递配料丰富，适合大促转化素材。'],
];

export function HomeTemplate(state) {
  return `
    <div class="home-page">
      ${ProductHeader()}
      ${ProductRail()}
      <main class="home-scroll">
        <section class="home-hero">
          <h1>说出你的想法，开启专业商业化创作</h1>
          ${Composer({ home: true, draft: state.draft, attachment: state.attachment })}
          <div class="skill-rail">${skills.map((skill, index) => `<button data-action="choose-skill" data-skill="${escapeHtml(skill)}"><span>${escapeHtml(skill)}</span><i></i></button>`).join('')}</div>
        </section>
        <section class="home-recommendations">
          <div class="section-head"><h2>今天为 <button data-action="select-product"><img src="${media.product}" alt="">即创螺蛳粉</button> 洞察到 5 个创意机会</h2><span>每日 00:00 更新&nbsp;&nbsp;|&nbsp;&nbsp;<button>查看全部 ›</button></span></div>
          <div class="opportunity-row">${opportunities.map((item, index) => `<article class="opportunity-card"><img src="${media.inspirations[index]}" alt=""><div><h3>${escapeHtml(item[0])}</h3><p>${escapeHtml(item[1])}</p><footer><span>🔥 同行爆款</span><button data-action="use-opportunity" data-index="${index}">查看详情</button></footer></div></article>`).join('')}</div>
          <div class="inspiration-head"><h2>AI 灵感</h2><div><button class="is-active">推荐</button><button>最新</button><button>热度</button></div></div>
          <div class="inspiration-grid">${media.inspirations.map((src, index) => `<button data-action="use-opportunity" data-index="${index}"><img src="${src}" alt="灵感视频 ${index + 1}"><span>使用这个灵感</span></button>`).join('')}</div>
        </section>
      </main>
    </div>`;
}
