import { Icon, IconButton, escapeHtml } from '../ui/primitives.js?v=20260907f';

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

export function TaskSidebar({ activeTask = 'existing', tasks = [], taskId, sidebarCollapsed = false, compactTaskRail = false, mobileTasksOpen = false, taskMenu = null } = {}) {
  const compact = (sidebarCollapsed || compactTaskRail) && !mobileTasksOpen;
  return `
    <aside class="task-sidebar ${compact ? 'is-collapsed' : ''} ${mobileTasksOpen ? 'mobile-tasks-open' : ''}" data-source-node="${compact ? '1047:44058' : '1047:43915'}" aria-label="任务管理">
      <div class="task-sidebar__head">
        <button class="brand-lockup ${compact ? 'is-compact' : 'has-home-return'}" data-action="${compact ? 'toggle-sidebar' : 'home'}" aria-label="${compact ? '展开任务管理' : '返回首页'}" ${compact ? 'aria-expanded="false" title="展开任务管理" data-source-node="1047:44178"' : 'data-source-node="1466:16465"'}>${Icon('logoMark')} ${compact ? '' : `${Icon('logoWord')}<span class="brand-home-return" aria-hidden="true">${Icon('homeReturn')}<span>返回首页</span></span>`}</button>
        ${compact ? '' : IconButton({ icon: 'taskSidebarToggle', label: '收起任务管理', action: 'toggle-sidebar', className: 'sidebar-collapse' })}
      </div>
      <button class="new-task" data-action="new-task" aria-label="新建项目" title="新建项目">${Icon('newTask')}<span>新建项目</span></button>
      ${compact ? `<button class="task-projects" data-action="toggle-sidebar" aria-label="项目" title="项目" aria-expanded="false" data-source-node="1047:44066">${Icon('taskProjects')}</button>` : ''}
      <section class="recent-tasks">
        <h2>最近</h2>
        ${tasks.filter((task) => task.taskMode !== 'new').map((task) => `<div class="recent-task-row ${activeTask !== 'new' && task.taskId === taskId ? 'is-active' : ''} ${taskMenu?.taskId === task.taskId ? 'is-menu-open' : ''}"><button class="recent-task" data-action="open-task" data-task="${escapeHtml(task.taskId)}" title="${escapeHtml(task.projectTitle)}" ${activeTask !== 'new' && task.taskId === taskId ? 'aria-current="page"' : ''}>${escapeHtml(task.projectTitle)}</button><button class="task-more" data-action="toggle-task-menu" data-task="${escapeHtml(task.taskId)}" aria-label="${escapeHtml(task.projectTitle)}的任务选项" aria-expanded="${taskMenu?.taskId === task.taskId}" title="任务选项">${Icon('taskMore')}</button></div>`).join('')}
      </section>
    </aside>${taskMenu && !compact ? `<div class="task-options-menu" role="menu" aria-label="任务选项" style="top:${Math.max(8, taskMenu.top)}px;left:${taskMenu.left}px" data-source-node="1047:43527">${[['share-task','分享任务'],['open-conversation-settings','设置'],['delete-task','删除']].map(([action,label]) => `<button role="menuitem" data-action="${action}" data-task="${escapeHtml(taskMenu.taskId)}">${label}</button>`).join('')}</div>` : ''}`;
}

export function ConversationHeader({ projectMenuOpen = false, title = '即创螺蛳粉', editorEnabled = false, workbenchOpen = false }) {
  return `
    <header class="conversation-header">
      <div class="project-menu-anchor">
        <button class="project-title" data-action="toggle-project-menu" aria-expanded="${projectMenuOpen ? 'true' : 'false'}"><span>${escapeHtml(title)}</span><i aria-hidden="true"><b></b><b></b><b></b></i></button>
        ${projectMenuOpen ? `<div class="project-menu" role="menu"><button data-action="rename-task">重命名</button><button data-action="share-task">分享任务</button>${editorEnabled ? '' : '<button data-action="enter-editor">编辑组件</button>'}<button data-action="open-conversation-settings">设置</button><button data-action="delete-task">删除</button></div>` : ''}
      </div>
      ${workbenchOpen ? '' : `<button class="generated-content-button" data-action="open-artifact-list" aria-label="查看生成内容">${Icon('artifactFolder')}<span>查看生成内容</span></button>`}
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
