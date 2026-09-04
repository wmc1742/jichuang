import { Icon, IconButton } from '../ui/primitives.js';

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

export function TaskSidebar({ activeTask = 'existing' } = {}) {
  const isNewTask = activeTask === 'new';
  return `
    <aside class="task-sidebar">
      <div class="task-sidebar__head">
        <button class="brand-lockup" data-action="home" aria-label="返回首页">${Icon('logoMark')} ${Icon('logoWord')}</button>
        ${IconButton({ icon: 'collapse', label: '收起任务管理', action: 'toggle-sidebar', className: 'sidebar-collapse' })}
      </div>
      <button class="new-task ${isNewTask ? 'is-active' : ''}" data-action="new-task"><span class="new-task__icon"></span><span>新建项目</span></button>
      <section class="recent-tasks">
        <h2>最近</h2>
        <button class="recent-task ${activeTask === 'existing' ? 'is-active' : ''}" data-action="open-task">即创螺蛳粉</button>
        <button class="recent-task" data-action="noop">即创减脂蛋白棒</button>
      </section>
    </aside>`;
}

export function ConversationHeader({ projectMenuOpen = false, title = '即创螺蛳粉', editorEnabled = false }) {
  return `
    <header class="conversation-header">
      <div class="project-menu-anchor">
        <button class="project-title" data-action="toggle-project-menu" aria-expanded="${projectMenuOpen ? 'true' : 'false'}"><span>${title}</span><i aria-hidden="true"><b></b><b></b><b></b></i></button>
        ${projectMenuOpen ? `<div class="project-menu" role="menu"><button data-action="share-task">分享任务</button>${editorEnabled ? '' : '<button data-action="enter-editor">编辑组件</button>'}<button data-action="open-conversation-settings">设置</button><button data-action="delete-task">删除</button></div>` : ''}
      </div>
      <button class="generated-content-button" data-action="open-artifact-list">${Icon('workbench')}<span>查看生成内容</span></button>
    </header>`;
}

export function ConversationSettingsModal() {
  return `
    <div class="conversation-settings-backdrop" data-action="close-conversation-settings">
      <section class="conversation-settings" role="dialog" aria-modal="true" aria-label="会话设置">
        <h2>设置</h2>
        <div class="settings-row settings-row--duration"><div><b>视频时长</b><input type="range" min="5" max="60" value="25" aria-label="视频时长"></div><label><input type="number" value="10" min="5" max="60"><span>秒</span></label></div>
        <div class="settings-row settings-row--ratio"><b>视频比例</b><div><button class="is-active"><i></i>9:16</button><button><i></i>16:9</button></div></div>
        <div class="settings-row settings-row--watermark"><div><b>去水印</b><span>将“AI生成”的标识水印从生成内容上去除</span></div><label class="settings-switch"><input type="checkbox" checked><i></i></label></div>
        <footer><button data-action="close-conversation-settings">取消</button><button class="is-primary" data-action="close-conversation-settings">确认</button></footer>
      </section>
    </div>`;
}
