import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TaskSidebar } from '../src/demo-system/components/navigation.js';

const tasks = [{ taskId: 'a', taskMode: 'existing', projectTitle: 'Task A' }, { taskId: 'b', taskMode: 'existing', projectTitle: 'Task B' }];

test('sidebar collapse does not inherit generic icon-button hover fill or blur', () => {
  const css = readFileSync(new URL('../src/demo-system/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.sidebar-collapse, \.sidebar-collapse:hover\s*\{\s*background: transparent;\s*backdrop-filter: none;/);
});

test('new task navigation does not invent a selected new-project pill', () => {
  const html = TaskSidebar({ activeTask: 'new', tasks });
  assert.match(html, /1047:43915/);
  assert.match(html, /class="new-task"/);
  assert.doesNotMatch(html, /new-task is-active|aria-current="page"/);
});

test('collapsed logo is an expand action using the source rail state', () => {
  const html = TaskSidebar({ sidebarCollapsed: true, tasks });
  assert.match(html, /task-sidebar is-collapsed/);
  assert.match(html, /1047:44058/);
  assert.match(html, /data-action="toggle-sidebar" aria-label="展开任务管理"/);
  assert.doesNotMatch(html, /sidebar-collapse"/);
});

test('opening the narrow task drawer exposes expanded controls', () => {
  const html = TaskSidebar({ compactTaskRail: true, mobileTasksOpen: true });
  assert.doesNotMatch(html, /task-sidebar is-collapsed/);
  assert.match(html, /aria-label="收起任务管理"/);
  assert.match(html, /task-sidebar-toggle\.svg/);
});

test('collapsed projects entry follows new task and opens the existing task list', () => {
  for (const mode of [{ sidebarCollapsed: true }, { compactTaskRail: true }]) {
    const html = TaskSidebar({ ...mode, tasks });
    assert.match(html, /class="new-task"[\s\S]*class="task-projects" data-action="toggle-sidebar" aria-label="项目"/);
    assert.match(html, /data-source-node="1047:44066"><img[^>]*task-projects\.svg/);
    assert.match(html, /class="new-task"[^>]*><img[^>]*new-task\.svg/);
  }
  assert.doesNotMatch(TaskSidebar({ tasks }), /class="task-projects"/);
  assert.doesNotMatch(TaskSidebar({ compactTaskRail: true, mobileTasksOpen: true, tasks }), /class="task-projects"/);
});

test('task menu actions belong to the selected row, not the current conversation', () => {
  const html = TaskSidebar({ tasks, taskId: 'a', taskMenu: { taskId: 'b', top: 184, left: 176 } });
  assert.match(html, /data-task="a"[^>]*aria-current="page"/);
  assert.match(html, /1047:43527/);
  assert.match(html, /data-action="share-task" data-task="b"/);
  assert.match(html, /data-action="open-conversation-settings" data-task="b"/);
  assert.match(html, /data-action="delete-task" data-task="b"/);
  assert.doesNotMatch(html, /重命名/);
});
