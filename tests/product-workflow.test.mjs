import test from 'node:test';
import assert from 'node:assert/strict';
import { createTask, snapshotTask, upsertTask, saveTasks, readTasks, commitArtifactEdit } from '../src/demo-system/tasks/model.js';
import { nextConversationAction, publishArtifacts, personalizeText } from '../src/demo-system/conversation/workflow.js';
import { scenarioArtifacts } from '../src/demo-system/scenarios/luosifen.js';
import { artifactContent } from '../src/demo-system/artifacts/content.js';

test('new tasks have isolated empty stores and independent settings', () => {
  const first = createTask(); const second = createTask();
  first.messages.push({ id: 'a' }); first.settings.duration = 30;
  assert.notEqual(first.taskId, second.taskId);
  assert.deepEqual(second.artifacts, []); assert.deepEqual(second.messages, []);
  assert.equal(second.settings.duration, 20);
});
test('task snapshots round-trip without editor or transient UI state', () => {
  const storage = new Map(); storage.getItem = storage.get.bind(storage); storage.setItem = storage.set.bind(storage);
  const task = createTask({ projectTitle: '测试', draft: '未发送', pendingRun: 2, editor: { enabled: true } });
  const snapshot = snapshotTask(task);
  saveTasks(storage, upsertTask([], snapshot), task.taskId);
  const restored = readTasks(storage).tasks[0];
  assert.equal(restored.draft, '未发送'); assert.equal(restored.pendingRun, 2);
  assert.equal(restored.editor, undefined);
});
test('malformed storage is ignored', () => {
  assert.deepEqual(readTasks({ getItem: () => 'broken' }).tasks, []);
});
test('pending questions block arbitrary progression and interrupted runs can resume', () => {
  const state = createTask({ scenarioStage: 1, messages: [{ id: 'q', kind: 'agent-question', phase: 'pending' }] });
  assert.equal(nextConversationAction(state, '继续').type, 'question');
  state.pendingRun = 2;
  assert.deepEqual(nextConversationAction(state, '继续'), { type: 'resume', runId: 2 });
});
test('accepting a storyboard skips actor regeneration while requesting a new actor does not', () => {
  const state = createTask({ scenarioStage: 3 });
  assert.equal(nextConversationAction(state, '没问题继续').runId, 7);
  assert.equal(nextConversationAction(state, '换一个年轻主角').runId, 4);
  state.scenarioStage = 8;
  assert.equal(nextConversationAction(state, '你好').type, 'reply');
});
test('artifacts only publish when an output references them and publication is idempotent', () => {
  const task = createTask();
  const output = [{ artifactId: 'requirements-analysis' }];
  const published = publishArtifacts([], output, scenarioArtifacts, task, 2);
  assert.deepEqual(published.map((item) => item.id), ['requirements-analysis']);
  assert.equal(publishArtifacts(published, output, scenarioArtifacts, task, 2).length, 1);
});
test('campaign choice personalizes subsequent copy', () => {
  const task = createTask({ messages: [{ id: 'campaign-selection', answer: { selected: ['圣诞/元旦跨年'] } }] });
  assert.equal(personalizeText('根据双11节点和春节/年货节需求', task), '根据圣诞/元旦跨年需求');
});
test('artifact edit commits content and previous version without mutating the original', () => {
  const artifact = artifactContent(scenarioArtifacts[0]);
  const draft = structuredClone(artifact); draft.content.blocks[0].text = '更新后的方案';
  const updated = commitArtifactEdit(artifact, draft, 'now');
  assert.equal(updated.content.blocks[0].text, '更新后的方案');
  assert.notEqual(artifact.content.blocks[0].text, updated.content.blocks[0].text);
  assert.deepEqual(updated.history[0].content, artifact.content);
  assert.equal(updated.revision, 2);
});
