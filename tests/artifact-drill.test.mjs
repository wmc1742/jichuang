import test from 'node:test';
import assert from 'node:assert/strict';
import { beginActorDrill, finishActorDrill } from '../src/demo-system/artifacts/editing.js';
import { createArtifactWorkspace, ArtifactView } from '../src/demo-system/artifacts/model.js';
import { ArtifactWorkbench } from '../src/demo-system/components/artifacts.js';
import { ConversationHeader } from '../src/demo-system/components/navigation.js';
import { StructuredDocument } from '../src/demo-system/components/document-blocks.js';

function fixture(view = ArtifactView.DETAIL) {
  const document = { id: 'doc', type: 'document', title: 'Storyboard', revision: 1, content: { version: 1, blocks: [{ id: 'p', type: 'paragraph', text: 'Original' }] } };
  const actor = { id: 'actor', type: 'actor', title: 'Actor', revision: 1, previewUrl: 'actor.png', description: 'Original actor', voice: 'Voice' };
  return { artifacts: [document, actor], artifactDraft: view === ArtifactView.EDIT ? { ...structuredClone(document), content: { version: 1, blocks: [{ id: 'p', type: 'paragraph', text: 'Unsaved' }] } } : null,
    artifactWorkspace: createArtifactWorkspace({ open: true, openTabs: ['doc'], activeTabId: 'doc', activeView: view }) };
}

test('actor drill keeps document identity and one tab; cancel changes neither artifact', () => {
  const state = fixture();
  const before = structuredClone(state.artifacts);
  Object.assign(state, beginActorDrill(state, 'actor'));
  assert.equal(state.artifactWorkspace.activeTabId, 'doc');
  assert.deepEqual(state.artifactWorkspace.openTabs, ['doc']);
  state.artifactDraft.actor.description = 'Discard';
  Object.assign(state, finishActorDrill(state));
  assert.equal(state.artifactWorkspace.activeView, ArtifactView.DETAIL);
  assert.equal(state.artifactDraft, null);
  assert.deepEqual(state.artifacts, before);
});

test('child apply updates only actor and restores the unfinished document draft', () => {
  const state = fixture(ArtifactView.EDIT);
  const parentDraft = structuredClone(state.artifactDraft);
  Object.assign(state, beginActorDrill(state, 'actor'));
  state.artifactDraft.actor.description = 'Updated';
  Object.assign(state, finishActorDrill(state, true));
  assert.equal(state.artifactWorkspace.activeView, ArtifactView.EDIT);
  assert.deepEqual(state.artifactDraft, parentDraft);
  assert.equal(state.artifacts[0].revision, 1);
  assert.equal(state.artifacts[0].content.blocks[0].text, 'Original');
  assert.equal(state.artifacts[1].description, 'Updated');
  assert.equal(state.artifacts[1].revision, 2);
});

test('cancel from parent edit preserves unsaved text; invalid child does not navigate', () => {
  const state = fixture(ArtifactView.EDIT);
  const original = structuredClone(state);
  assert.deepEqual(beginActorDrill(state, 'missing'), {});
  Object.assign(state, beginActorDrill(state, 'actor'));
  Object.assign(state, finishActorDrill(state));
  assert.deepEqual(state.artifactDraft, original.artifactDraft);
  assert.deepEqual(state.artifacts, original.artifacts);
});

test('artifact controls follow source structure', () => {
  const state = fixture();
  assert.match(ConversationHeader({}), /artifact-folder\.svg/);
  assert.doesNotMatch(ConversationHeader({ workbenchOpen: true }), /open-artifact-list/);
  Object.assign(state, beginActorDrill(state, 'actor'));
  const html = ArtifactWorkbench(state);
  assert.match(html, /artifact-folder\.svg/);
  assert.doesNotMatch(html, /toggle-workbench-size|data-action="edit-artifact"/);
  assert.match(html, /aria-label="形象选择"/);
  assert.match(html, /aria-label="编辑形象描述"/);
  assert.match(html, /aria-label="编辑音色描述"/);
  assert.match(html, /data-action="back-from-artifact-drill"/);
});

test('legacy drill state returns the existing parent draft instead of deleting it', () => {
  const state = fixture(ArtifactView.EDIT);
  state.artifactWorkspace.activeView = ArtifactView.DRILL;
  state.artifactWorkspace.drillTarget = 'actor';
  state.artifactDraft.actor = structuredClone(state.artifacts[1]);
  Object.assign(state, finishActorDrill(state));
  assert.equal(state.artifactWorkspace.activeView, ArtifactView.EDIT);
  assert.equal(state.artifactDraft.content.blocks[0].text, 'Unsaved');
});

test('document actor references drill in both viewing and editing modes', () => {
  for (const editing of [false, true]) {
    const state = fixture();
    state.artifacts[0].content.blocks = [{ id: 'subjects', type: 'subjects', items: [{ artifactId: 'actor', role: 'Lead' }] }, { id: 'shot', type: 'shots', title: 'Shot', rows: [{ actorId: 'actor', dialogue: 'Hello', visual: 'Scene' }] }];
    const html = StructuredDocument({ artifact: state.artifacts[0], artifacts: state.artifacts, editing });
    assert.equal((html.match(/data-action="drill-artifact"/g) || []).length, 2);
    assert.doesNotMatch(html, /data-action="open-artifact"/);
  }
});
