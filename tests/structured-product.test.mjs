import test from 'node:test';
import assert from 'node:assert/strict';
import { createInput, selectInputSkill, attachInputReference, removeInputReference, removeInputSkill, validateInput, inputRequest, inputInstruction, migrateInput } from '../src/demo-system/composer/model.js';
import { skillById } from '../src/demo-system/scenarios/skills.js';
import { Composer } from '../src/demo-system/components/composer.js';
import { createTask, snapshotTask } from '../src/demo-system/tasks/model.js';
import { nextConversationAction, publishArtifacts } from '../src/demo-system/conversation/workflow.js';
import { scenarioArtifacts } from '../src/demo-system/scenarios/luosifen.js';
import { validateDocument, referencedDocumentArtifacts, replaceDocumentReference, migrateDocument } from '../src/demo-system/artifacts/document.js';
import { StructuredDocument } from '../src/demo-system/components/document-blocks.js';

const product = { type: 'product', title: '测试商品', thumbnail: 'test.png' };
const preset = () => selectInputSkill(createInput(), skillById('campaign-video'));

test('a skill owns its inline query and required material slot', () => {
  const input = preset();
  assert.equal(validateInput(input).valid, false);
  const html = Composer({ newTask: true, input });
  assert.match(html, /data-role="structured-input"[^>]*>[\s\S]*composer-skill/);
  assert.match(html, /data-action="fill-input-slot"/);
  const filled = attachInputReference(input, product);
  assert.equal(validateInput(filled).valid, true);
  assert.equal(inputRequest(filled).text, '根据 测试商品 为我生成用于大促推广的视频');
  assert.equal(inputRequest(filled).skill.id, 'campaign-video');
});

test('removing an attachment restores its required slot, but removing the skill detaches ownership', () => {
  const input = attachInputReference(preset(), product);
  const ref = input.parts.find((part) => part.type === 'reference');
  assert.equal(validateInput(removeInputReference(input, ref.id)).valid, false);
  input.parts.at(-1).text = '我补充的内容';
  const detached = removeInputSkill(input);
  assert.equal(inputRequest(detached).text, '测试商品我补充的内容');
  assert.deepEqual(inputRequest(detached).attachments, [product]);
  assert.equal(removeInputReference(detached, ref.id).parts.some((part) => part.type === 'slot'), false);
});

test('multiple references, workflow phase and unsent text survive a task snapshot', () => {
  let input = attachInputReference(preset(), product);
  input = attachInputReference(input, { type: 'video', artifactId: 'video-1', title: '参考视频' });
  const task = createTask({ input, workflow: { phase: 'requirements-review' } });
  const restored = createTask(JSON.parse(JSON.stringify(snapshotTask(task))));
  assert.deepEqual(inputRequest(restored.input), inputRequest(input));
  assert.equal(restored.workflow.phase, 'requirements-review');
  const legacy = migrateInput({ draft: '根据 测试商品 做视频', attachment: product });
  assert.equal(inputRequest(legacy).text, '根据 测试商品 做视频');
});

test('feedback is never interpreted as approval or a numbered execution', () => {
  for (const phase of ['requirements-review', 'storyboard-review', 'actor-selection', 'completed']) {
    const state = createTask({ workflow: { phase } });
    assert.equal(nextConversationAction(state, '时长改为30秒').type, 'reply');
    assert.equal(nextConversationAction(state, '取消').type, 'reply');
  }
  assert.equal(nextConversationAction(createTask({ workflow: { phase: 'requirements-review' } }), '确认').runId, 3);
  assert.equal(nextConversationAction(createTask({ workflow: { phase: 'actor-selection' } }), '选第二个').actorIndex, 1);
});

test('document references publish their dependencies and render independently of artifact names', () => {
  const task = createTask({ product });
  const artifacts = publishArtifacts([], [{ artifactId: 'creative-storyboard' }], scenarioArtifacts, task, 3);
  const document = artifacts.find((artifact) => artifact.id === 'creative-storyboard');
  assert.deepEqual(validateDocument(document.content), []);
  for (const id of referencedDocumentArtifacts(document.content)) assert.ok(artifacts.some((artifact) => artifact.id === id));
  const renamed = { ...document, id: 'arbitrary-document', title: '任意新文稿名' };
  const html = StructuredDocument({ artifact: renamed, editing: false, artifacts, product });
  assert.match(html, /创意概述/);
  assert.match(html, /人物台词/);
  assert.match(html, /主体设定/);
  const updated = replaceDocumentReference(document.content, 'character-1', 'character-2');
  assert.ok(referencedDocumentArtifacts(updated).includes('character-2'));
  assert.ok(!referencedDocumentArtifacts(updated).includes('character-1'));
  assert.ok(referencedDocumentArtifacts(document.content).includes('character-1'));
});

test('legacy document edits are preserved instead of replaced by fixtures', () => {
  const migrated = migrateDocument({ intro: '用户保存的介绍', body: '用户保存的正文' });
  assert.deepEqual(migrated.blocks.map((block) => block.text), ['用户保存的介绍', '用户保存的正文']);
  assert.deepEqual(validateDocument(migrated), []);
});

test('referenced artifact titles do not change the meaning of an explicit confirmation', () => {
  const input = attachInputReference(createInput('确认'), { artifactId: 'requirements-analysis', type: 'document', title: '视频需求分析' });
  assert.equal(inputInstruction(input), '确认');
  assert.equal(nextConversationAction(createTask({ workflow: { phase: 'requirements-review' } }), inputInstruction(input)).runId, 3);
});
