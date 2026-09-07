import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { HomeTemplate } from '../src/demo-system/templates/home.js';
import { TaskSidebar } from '../src/demo-system/components/navigation.js';
import { createTask } from '../src/demo-system/tasks/model.js';
import { homeInspirations, homeSkills } from '../src/demo-system/scenarios/home.js';

test('home has a separate route and does not alias new task', () => {
  const app = readFileSync(new URL('../src/demo-system/app.js', import.meta.url), 'utf8');
  assert.match(app, /action === 'home'\) \{\s*openHome\(\)/);
  assert.doesNotMatch(app, /get\('view'\) === 'home' \? 'new'/);
  assert.match(app, /function openHome\(\) \{\s*pauseCurrentTask\(\);/);
});

test('expanded task logo exposes the source return action, collapsed logo still expands', () => {
  const expanded = TaskSidebar();
  assert.match(expanded, /1466:16465/);
  assert.match(expanded, /home-return\.svg/);
  assert.match(expanded, /brand-home-return/);
  const collapsed = TaskSidebar({ sidebarCollapsed: true });
  assert.doesNotMatch(collapsed, /brand-home-return/);
  assert.match(collapsed, /data-action="toggle-sidebar" aria-label="展开任务管理"/);
});

test('home reuses structured Composer and only maps specified skills to workflows', () => {
  const html = HomeTemplate(createTask({ draft: '未发送的草稿' }));
  assert.match(html, /1466:16472/);
  assert.match(html, /data-role="structured-input"/);
  assert.match(html, /未发送的草稿/);
  assert.doesNotMatch(html, /data-action="use-opportunity"|aria-label="选择技能"/);
  assert.equal(homeSkills.filter(skill => skill.skillId).length, 2);
  assert.equal(homeInspirations.length, 10);
  for (const src of homeInspirations) assert.ok(existsSync(new URL(`../${src}`, import.meta.url)), src);
});
