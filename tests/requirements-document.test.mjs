import test from 'node:test';
import assert from 'node:assert/strict';
import { artifactContent } from '../src/demo-system/artifacts/content.js';
import { legacyRequirementsFixture } from '../src/demo-system/scenarios/documents.js';
import { createRequirementsDocument } from '../src/demo-system/scenarios/requirements.js';
import { StructuredDocument } from '../src/demo-system/components/document-blocks.js';
import { validateDocument, appendDocumentReference } from '../src/demo-system/artifacts/document.js';
import { createTask, commitArtifactEdit, readTasks, saveTasks } from '../src/demo-system/tasks/model.js';

const context = { product: '即创螺蛳粉', campaigns: '本次大促', duration: 20, ratio: '9:16' };
const artifact = () => ({ id: 'arbitrary-doc', type: 'document', title: '任意名称', documentTemplate: 'requirements', revision: 1 });
const gallery = doc => doc.blocks[1].children[0].children[0];

test('requirements follow the new typed structure with semantic campaign copy', () => {
  const doc = createRequirementsDocument(context);
  assert.deepEqual(validateDocument(doc), []);
  assert.equal(doc.source.layoutNode, '1466:17458');
  assert.deepEqual(doc.blocks.map(block => block.type), ['paragraph', 'section', 'section']);
  assert.deepEqual(doc.blocks[1].children.map(block => block.title), ['商品参考图', '商品详细信息']);
  assert.deepEqual(doc.blocks[1].children[1].children[0].cards.map(card => card.title), ['产品卖点', '面向人群', '营销活动']);
  assert.equal(gallery(doc).items.length, 3);
  assert.doesNotMatch(JSON.stringify(doc), /无纺布|80抽|荧光剂|真丝般/);
  assert.match(JSON.stringify(doc), /需确认|需核实|待商品资料核实/);
  const other = createRequirementsDocument({ ...context, campaigns: '双11节点', duration: 30, ratio: '16:9' });
  assert.match(JSON.stringify(other), /16:9画幅、约30秒/);
  assert.match(JSON.stringify(other), /双11节点/);
});

test('document blocks render by type, support edit paths and source identity', () => {
  const doc = { ...artifact(), content: createRequirementsDocument(context) };
  const html = StructuredDocument({ artifact: doc, artifacts: [], editing: false });
  assert.match(html, /document-reference-gallery/);
  assert.match(html, /data-source-node="1466:17493"/);
  assert.equal((html.match(/class="document-fact-card"/g) || []).length, 6);
  const edit = StructuredDocument({ artifact: doc, artifacts: [], editing: true });
  assert.match(edit, /data-artifact-field="content.blocks.1.children.1.children.0.cards.0.items.0.text"/);
  assert.match(edit, /data-upload="document-reference"/);
});

test('only exact untouched legacy fixtures upgrade, never edited documents or drafts', () => {
  const old = { ...artifact(), content: legacyRequirementsFixture(context) };
  assert.equal(artifactContent(old).content.source.fixtureVersion, 2);
  const changed = structuredClone(old);
  changed.content.blocks[0].children[0].text = '我的真实商品信息';
  assert.deepEqual(artifactContent(changed).content, changed.content);
  assert.deepEqual(artifactContent(old, { artifactDraft: old }).content, old.content);
  assert.deepEqual(artifactContent({ ...old, updatedAt: '2026-09-07' }).content, old.content);
});

test('adding reference images preserves document identity and survives task storage', () => {
  const doc = artifactContent(artifact());
  const updated = appendDocumentReference(doc, 'product-references', { id: 'uploaded', title: '新图片', url: 'local-media:test' });
  assert.equal(gallery(doc.content).items.length, 3);
  assert.equal(gallery(updated.content).items.length, 4);
  assert.equal(updated.id, doc.id);
  assert.equal(appendDocumentReference(doc, 'missing', { url: 'x' }), null);
  const committed = commitArtifactEdit(doc, updated);
  assert.equal(committed.revision, 2);
  const task = createTask({ artifacts: [committed] });
  const storage = { data: null, setItem(key, value) { this.data = value; }, getItem() { return this.data; } };
  saveTasks(storage, [task], task.taskId);
  assert.equal(gallery(readTasks(storage).tasks[0].artifacts[0].content).items.length, 4);
});

test('a different uploaded product does not inherit the sample reference images', () => {
  const doc = artifactContent(artifact(), { product: { title: '用户商品', thumbnail: 'local-media:other' } });
  assert.deepEqual(gallery(doc.content).items.map(item => item.url), ['local-media:other']);
});
