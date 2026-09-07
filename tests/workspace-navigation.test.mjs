import test from 'node:test';
import assert from 'node:assert/strict';
import { createArtifactWorkspace, toggleArtifactWorkspaceSize, ArtifactView } from '../src/demo-system/artifacts/model.js';
import { activateArtifact, returnToArtifactRoot, closeArtifact, beginActorDrill } from '../src/demo-system/artifacts/editing.js';
import { createTask, snapshotTask } from '../src/demo-system/tasks/model.js';
import { ArtifactWorkbench } from '../src/demo-system/components/artifacts.js';

function fixture() {
  return createTask({ taskMode: 'existing', artifacts: [
    { id: 'a', type: 'document', title: 'A', content: { version: 1, blocks: [{ id: 'p', type: 'paragraph', text: 'Original' }] } },
    { id: 'b', type: 'document', title: 'B', content: { version: 1, blocks: [] } },
    { id: 'actor', type: 'actor', title: 'Actor' },
  ], artifactWorkspace: createArtifactWorkspace({ open: true, openTabs: ['a', 'b'], activeTabId: 'a', activeView: ArtifactView.EDIT }),
  artifactDraft: { id: 'a', type: 'document', title: 'Draft', content: { version: 1, blocks: [{ id: 'p', type: 'paragraph', text: 'Unsaved' }] } } });
}

test('maximize is a view-only reversible transition', () => {
  const state = fixture();
  const original = structuredClone(state);
  state.artifactWorkspace = toggleArtifactWorkspaceSize(state.artifactWorkspace);
  assert.equal(state.artifactWorkspace.maximized, true);
  assert.equal(state.artifactWorkspace.activeView, ArtifactView.EDIT);
  assert.match(ArtifactWorkbench(state), /aria-label="还原产物窗口"/);
  state.artifactWorkspace = toggleArtifactWorkspaceSize(state.artifactWorkspace);
  assert.deepEqual(state, original);
});

test('tab switch and root navigation preserve unfinished editor state', () => {
  const state = fixture();
  Object.assign(state, activateArtifact(state, 'b'));
  assert.equal(state.artifactDraft, null);
  Object.assign(state, returnToArtifactRoot(state));
  Object.assign(state, activateArtifact(state, 'a'));
  assert.equal(state.artifactWorkspace.activeView, ArtifactView.EDIT);
  assert.equal(state.artifactDraft.content.blocks[0].text, 'Unsaved');
  assert.equal(state.artifacts[0].content.blocks[0].text, 'Original');
});

test('closing a tab hides the view, but does not delete user draft', () => {
  const state = fixture();
  Object.assign(state, closeArtifact(state, 'a'));
  assert.equal(state.artifactWorkspace.activeTabId, 'b');
  Object.assign(state, activateArtifact(state, 'a'));
  assert.equal(state.artifactDraft.title, 'Draft');
  assert.deepEqual(state.artifactWorkspace.openTabs, ['b', 'a']);
});

test('drill context survives another tab and a task snapshot', () => {
  const state = fixture();
  Object.assign(state, beginActorDrill(state, 'actor'));
  state.artifactDraft.actor.description = 'Unsaved actor';
  Object.assign(state, activateArtifact(state, 'b'));
  const restored = createTask(snapshotTask(state));
  Object.assign(restored, activateArtifact(restored, 'a'));
  assert.equal(restored.artifactWorkspace.activeView, ArtifactView.DRILL);
  assert.equal(restored.artifactDraft.actor.description, 'Unsaved actor');
  assert.equal(restored.artifactWorkspace.drillTarget.parentDraft.title, 'Draft');
});
