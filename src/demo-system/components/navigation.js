import { Icon, IconButton, escapeHtml } from '../ui/primitives.js?v=20260906c';

export function ProductHeader() {
  return `
    <header class="product-header">
      <button class="brand-lockup" data-action="home" aria-label="返回首页">${Icon('logoMark')} ${Icon('logoWord')}</button>
      <button class="account-pill" aria-label="账户设置"><span class="account-avatar">豆</span><span>爱学习的豆包</span><i></i><small>超管</small><span>这是一个组织名称</span></button>
    </header>`;
}

export function ProductRail({ active = 'home' } = {}) {
  return `
    <nav class="product-rail" aria-label="产品导航">
      ${['home', 'asset', 'tool'].map((item) => `<button class="product-rail__item ${active === item ? 'is-active' : ''}" data-action="${item === 'home' ? 'home' : 'noop'}"><span class="product-rail__icon"></span><span>${item === 'home' ? '首页' : item === 'asset' ? '资产' : '工具'}</span></button>`).join('')}
    </nav>`;
}

export function TaskSidebar({ activeTask = 'existing', tasks = [], taskId, sidebarCollapsed = false, compactTaskRail = false, mobileTasksOpen = false } = {}) {
  const isNewTask = activeTask === 'new';
  return `
    <aside class="task-sidebar ${mobileTasksOpen ? 'mobile-tasks-open' : ''}">
      <div class="task-sidebar__head">
        <button class="brand-lockup" data-action="${sidebarCollapsed || compactTaskRail ? 'toggle-sidebar' : 'home'}" aria-label="${sidebarCollapsed || compactTaskRail ? '展开或收起任务管理' : '返回首页'}">${Icon('logoMark')} ${Icon('logoWord')}</button>
        ${IconButton({ icon: 'collapse', label: '收起任务管理', action: 'toggle-sidebar', className: 'sidebar-collapse' })}
      </div>
      <button class="new-task ${isNewTask ? 'is-active' : ''}" data-action="new-task" aria-label="新建项目">${Icon('newTask')}<span>新建项目</span></button>
      <section class="recent-tasks">
        <h2>最近</h2>
        ${tasks.filter((task) => task.taskMode !== 'new').map((task) => `<button class="recent-task ${task.taskId === taskId ? 'is-active' : ''}" data-action="open-task" data-task="${escapeHtml(task.taskId)}" title="${escapeHtml(task.projectTitle)}">${escapeHtml(task.projectTitle)}</button>`).join('')}
      </section>
    </aside>`;
}

export function ConversationHeader({ projectMenuOpen = false, title = '即创螺蛳粉', editorEnabled = false }) {
  return `
    <header class="conversation-header">
      <div class="project-menu-anchor">
        <button class="project-title" data-action="toggle-project-menu" aria-expanded="${projectMenuOpen ? 'true' : 'false'}"><span>${escapeHtml(title)}</span><i aria-hidden="true"><b></b><b></b><b></b></i></button>
        ${projectMenuOpen ? `<div class="project-menu" role="menu"><button data-action="rename-task">重命名</button><button data-action="share-task">分享任务</button>${editorEnabled ? '' : '<button data-action="enter-editor">编辑组件</button>'}<button data-action="open-conversation-settings">设置</button><button data-action="delete-task">删除</button></div>` : ''}
      </div>
      <button class="generated-content-button" data-action="open-artifact-list" aria-label="查看生成内容">${Icon('workbench')}<span>查看生成内容</span></button>
    </header>`;
}

export function ConversationSettingsModal(settings = { duration: 20, ratio: '9:16', watermark: true }) {
  return `
    <div class="conversation-settings-backdrop">
      <section class="conversation-settings" role="dialog" aria-modal="true" aria-label="会话设置">
        <h2>设置</h2>
        <div class="settings-row settings-row--duration"><div><b>视频时长</b><input data-setting="duration" type="range" min="5" max="60" value="${settings.duration}" aria-label="视频时长"></div><label><input data-setting="duration" type="number" value="${settings.duration}" min="5" max="60" aria-label="视频时长秒数"><span>秒</span></label></div>
        <div class="settings-row settings-row--ratio"><b>视频比例</b><div>${['9:16', '16:9'].map((ratio) => `<label><input type="radio" name="ratio" value="${ratio}" ${settings.ratio === ratio ? 'checked' : ''}>${ratio}</label>`).join('')}</div></div>
        <div class="settings-row settings-row--watermark"><div><b>保留 AI 生成标识</b></div><label class="settings-switch"><input name="watermark" type="checkbox" ${settings.watermark ? 'checked' : ''}><i></i></label></div>
        <footer><button data-action="close-conversation-settings">取消</button><button class="is-primary" data-action="save-settings">确认</button></footer>
      </section>
    </div>`;
}
