import test from 'node:test';
import assert from 'node:assert/strict';
import { SkillPopover, SkillChoices } from '../src/demo-system/components/task-dialogs.js';
import { availableSkills, filteredSkills } from '../src/demo-system/scenarios/skills.js';
import { ArtifactWorkbench } from '../src/demo-system/components/artifacts.js';
import { createArtifactWorkspace, ArtifactView } from '../src/demo-system/artifacts/model.js';

test('skill browser uses source categories, list and preview, not a generic card grid', () => {
  const html = SkillPopover({});
  assert.match(html, /1047:44709/);
  assert.match(html, /skill-picker-nav/);
  assert.match(html, /skill-picker-list/);
  assert.match(html, /skill-picker-preview/);
  assert.match(html, /accept="\.zip,application\/zip"/);
  assert.doesNotMatch(html, /<h2>全部技能|skill-library/);
  assert.match(SkillChoices(), /1047:44021/);
  assert.match(SkillChoices(), /<video /);
});

test('skill categories and search filter data without changing preset ownership', () => {
  const custom = { id: 'local', name: 'Local', description: '', category: '我的', localPackage: 'local-media:key', query: [] };
  const state = { customSkills: [custom], skillCategory: '我的' };
  assert.deepEqual(filteredSkills(state), [custom]);
  assert.equal(filteredSkills({ skillCategory: '创意素材' })[0].id, 'scene');
  assert.equal(filteredSkills({ skillSearch: 'no-match' }).length, 0);
  assert.equal(availableSkills()[0].query[1].type, 'slot');
});

function videoState() {
  const artifact = { id: 'video', type: 'video', title: 'Sample', scenes: [{ image: 'one.png', text: 'First' }, { image: 'two.png', text: 'Second' }] };
  return { artifacts: [artifact], artifactDraft: structuredClone(artifact), artifactWorkspace: createArtifactWorkspace({ open: true, activeView: ArtifactView.EDIT, activeTabId: 'video', openTabs: ['video'] }) };
}

test('video editing uses current-scene variants, references and real playback controls', () => {
  const html = ArtifactWorkbench(videoState());
  assert.match(html, /1184:130167/);
  assert.match(html, /data-upload="scene-video"/);
  assert.match(html, /data-upload="scene-reference"/);
  assert.match(html, /data-editor-video/);
  assert.match(html, /editor-video-play/);
  assert.match(html, /editor-video-mute/);
  assert.doesNotMatch(html, /data-action="add-scene"/);
  assert.equal((html.match(/data-action="select-scene"/g) || []).length, 2);
});

test('loading skeleton replaces detail without publishing another artifact', () => {
  const state = videoState();
  state.artifactWorkspace.loadingArtifactId = 'video';
  const html = ArtifactWorkbench(state);
  assert.match(html, /1343:168488/);
  assert.match(html, /artifact-loading-surface/);
  assert.doesNotMatch(html, /data-editor-video/);
  assert.equal(state.artifacts.length, 1);
});

test('crowded artifact tabs retain full titles and stable identity', () => {
  const state = videoState();
  state.artifacts = Array.from({ length: 5 }, (_, index) => ({ id: `d${index}`, type: 'document', title: `Document ${index}` }));
  state.artifactWorkspace.openTabs = state.artifacts.map((item) => item.id);
  state.artifactWorkspace.activeTabId = 'd0';
  state.artifactWorkspace.activeView = ArtifactView.DETAIL;
  const html = ArtifactWorkbench(state);
  assert.match(html, /artifact-tabs has-files/);
  assert.equal((html.match(/data-action="activate-artifact-tab"/g) || []).length, 5);
  assert.match(html, /title="Document 4"/);
  assert.equal((html.match(/data-action="close-artifact-tab"/g) || []).length, 1);
});

test('empty workspace uses the source title and empty copy without invented filters or actions', () => {
  const state = { artifacts: [], artifactWorkspace: createArtifactWorkspace({ open: true }) };
  const html = ArtifactWorkbench(state);
  assert.match(html, /data-source-node="1343:168417"/);
  assert.match(html, /aria-current="page"/);
  assert.match(html, /artifact-empty--workspace/);
  assert.match(html, /暂时没有生成新的内容/);
  assert.doesNotMatch(html, /生成的内容将在这里展示|artifact-type-filters/);
  assert.match(html, /toggle-workbench-size/);
});

test('list overview uses typed group headings and labels its current mode', () => {
  const state = videoState();
  state.artifactWorkspace = createArtifactWorkspace({ open: true, rootMode: ArtifactView.LIST, activeView: ArtifactView.LIST });
  const html = ArtifactWorkbench(state);
  assert.match(html, /1347:223013/);
  assert.match(html, /<h2>.*artifact-video\.svg.*<span>视频<\/span><\/h2>/);
  assert.match(html, /aria-label="切换为分类模式"/);
  assert.match(html, /artifact-view-switch\.svg/);
  assert.match(html, /<span>列表模式<\/span>/);
  assert.doesNotMatch(html, /artifact-overview__label|artifact-type-filters/);
});

test('category overview falls back to an available type without inventing empty categories', () => {
  const state = videoState();
  state.artifactWorkspace = createArtifactWorkspace({ open: true });
  const html = ArtifactWorkbench(state);
  assert.match(html, /artifact-media-tile--video/);
  assert.match(html, /<span>分类模式<\/span>/);
  assert.doesNotMatch(html, /当前任务还没有生成此类内容/);
});
