import { media } from '../data/assets.js?v=20260907f';
import { Composer } from '../components/composer.js?v=20260907f';
import { Icon, escapeHtml } from '../ui/primitives.js?v=20260907f';
import { homeSkills, homeOpportunities, homeInspirations } from '../scenarios/home.js?v=20260907f';

const root = './assets/agent-2/home';
const arrow = `<img class="home-chevron" src="${root}/home-down.svg" alt="">`;

export function HomeTemplate(state) {
  return `
    <div class="home-page calibrated-home" data-source-node="1466:16472">
      <header class="home-header" data-source-node="1466:16752">
        <button class="home-logo" data-action="home" aria-label="即创首页"><img src="${root}/home-logo.png" alt="即创"></button>
        <button class="home-account" data-action="home-unavailable" aria-label="账户与组织"><img class="home-avatar" src="${root}/home-avatar.png" alt=""><span>爱学习的豆包</span>${arrow}<img class="home-account-divider" src="${root}/home-divider.svg" alt=""><small>超管</small><span>这是一个组织名称</span>${arrow}</button>
      </header>
      <nav class="home-nav" aria-label="产品导航" data-source-node="1466:16740">${[['home-nav','首页'],['home-assets','资产'],['home-tools','工具']].map(([icon,label],index) => `<button data-action="${index ? 'home-unavailable' : 'home'}" ${index ? '' : 'aria-current="page"'}><span class="home-nav-icon"><img src="${root}/${icon}.svg" alt=""></span><span>${label}</span></button>`).join('')}</nav>
      <main class="home-scroll">
        <section class="home-hero">
          <h1>说出你的想法，开启专业商业化创作</h1>
          ${Composer({ home: true, input: state.input, draft: state.draft, attachment: state.attachment })}
          <div class="home-skills" data-source-node="1466:16850">${homeSkills.map((skill) => `<button data-action="${skill.skillId ? 'choose-skill' : 'home-unavailable'}" ${skill.skillId ? `data-skill="${skill.skillId}"` : ''}><img src="${media.skillPreview}" alt=""><span>${skill.label}</span>${Icon('send')}</button>`).join('')}</div>
        </section>
        <section class="home-recommendations" data-source-node="1466:16500">
          <div class="home-insight-header"><h2>今天为 <button data-action="home-unavailable"><img src="${root}/home-imgImage1636404629.png" alt="">即创低脂蛋白棒${arrow}</button><span>洞察到 5 个创意机会</span></h2><div>每日 00:00 更新 <i></i><button data-action="home-unavailable">查看全部<img class="home-chevron" src="${root}/home-return.svg" alt=""></button></div></div>
          <div class="home-opportunities">${homeOpportunities.map((item) => `<article class="home-opportunity"><div class="home-opportunity-images ${item.images.length === 1 ? 'is-single' : ''}">${item.images.map((src) => `<img src="${src}" alt="">`).join('')}</div><div class="home-opportunity-copy"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body)}</p><footer><span>${item.tag}</span><button data-action="home-unavailable">查看详情</button></footer></div></article>`).join('')}</div>
          <div class="home-library" data-source-node="1466:16575">
            <nav class="home-library-tabs" aria-label="推荐内容">${['AI灵感','热门素材','我的收藏'].map((label,index) => `<button class="${index ? '' : 'is-active'}" data-action="home-unavailable">${label}</button>`).join('')}</nav>
            <div class="home-library-filters"><div><div class="home-sort">${['推荐','最新','热度'].map((label,index) => `<button class="${index ? '' : 'is-active'}" data-action="home-unavailable">${label}</button>`).join('')}</div><label class="home-search">${Icon('search')}<input aria-label="查找灵感" data-home-search placeholder="请输入关键词查找"></label></div><div>${['近30天','全部行业','全部节点'].map((label) => `<button data-action="home-unavailable">${label}${arrow}</button>`).join('')}</div></div>
            <div class="home-inspiration-grid">${homeInspirations.map((src,index) => `<button data-action="home-unavailable" aria-label="查看灵感 ${index+1}"><img src="${src}" alt=""></button>`).join('')}</div>
          </div>
        </section>
      </main>
    </div>`;
}
