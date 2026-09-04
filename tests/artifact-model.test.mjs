import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ArtifactType,
  ArtifactView,
  artifactTypeDefinitions,
  closeArtifactTab,
  createArtifactWorkspace,
  generatedArtifactTypes,
  openArtifactTab,
} from '../src/demo-system/artifacts/model.js';
import { ArtifactWorkbench } from '../src/demo-system/components/artifacts.js';
import { scenarioArtifacts } from '../src/demo-system/scenarios/luosifen.js';

test('artifact registry exposes all five Figma types and their capabilities', () => {
  assert.deepEqual(artifactTypeDefinitions.map((type) => type.id), [
    ArtifactType.DOCUMENT,
    ArtifactType.VIDEO,
    ArtifactType.IMAGE,
    ArtifactType.PREVIEW,
    ArtifactType.ACTOR,
  ]);
  assert.equal(artifactTypeDefinitions.find((type) => type.id === ArtifactType.IMAGE).canEdit, false);
  assert.equal(artifactTypeDefinitions.find((type) => type.id === ArtifactType.PREVIEW).canReference, false);
});

test('overview derives category tabs from generated artifact data', () => {
  assert.deepEqual(
    generatedArtifactTypes(scenarioArtifacts).map((type) => type.id),
    ['document', 'video', 'image', 'preview', 'actor'],
  );
});

test('opening an existing artifact reuses its tab', () => {
  let workspace = createArtifactWorkspace();
  workspace = openArtifactTab(workspace, 'requirements-analysis');
  workspace = openArtifactTab(workspace, 'requirements-analysis');
  assert.deepEqual(workspace.openTabs, ['requirements-analysis']);
  assert.equal(workspace.activeTabId, 'requirements-analysis');
  assert.equal(workspace.activeView, ArtifactView.DETAIL);
});

test('closing the active tab selects its neighbor and closing the last returns to root', () => {
  let workspace = createArtifactWorkspace({ open: true });
  workspace = openArtifactTab(workspace, 'requirements-analysis');
  workspace = openArtifactTab(workspace, 'creative-storyboard');
  workspace = closeArtifactTab(workspace, 'creative-storyboard');
  assert.equal(workspace.activeTabId, 'requirements-analysis');
  assert.equal(workspace.activeView, ArtifactView.DETAIL);
  workspace = closeArtifactTab(workspace, 'requirements-analysis');
  assert.equal(workspace.activeTabId, null);
  assert.equal(workspace.activeView, ArtifactView.CATEGORY);
});

test('image detail only offers reference while preview detail offers final generation', () => {
  const imageHtml = ArtifactWorkbench({
    artifacts: scenarioArtifacts,
    artifactWorkspace: createArtifactWorkspace({
      open: true,
      openTabs: ['product-image-1'],
      activeTabId: 'product-image-1',
      activeView: ArtifactView.DETAIL,
    }),
  });
  assert.match(imageHtml, /引用至会话/);
  assert.doesNotMatch(imageHtml, /data-action="edit-artifact"/);

  const previewHtml = ArtifactWorkbench({
    artifacts: scenarioArtifacts,
    artifactWorkspace: createArtifactWorkspace({
      open: true,
      openTabs: ['preview-1'],
      activeTabId: 'preview-1',
      activeView: ArtifactView.DETAIL,
    }),
  });
  assert.match(previewHtml, /生成成片/);
  assert.doesNotMatch(previewHtml, /引用至会话/);
});
