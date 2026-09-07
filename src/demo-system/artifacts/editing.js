import { artifactById, ArtifactView, openArtifactTab, closeArtifactTab } from './model.js?v=20260907f';
import { artifactContent } from './content.js?v=20260907f';
import { commitArtifactEdit } from '../tasks/model.js?v=20260907f';

function rememberTab(state) {
  const workspace = state.artifactWorkspace;
  if (!workspace.activeTabId) return workspace;
  return { ...workspace, tabStates: { ...workspace.tabStates, [workspace.activeTabId]: {
    view: workspace.activeView, drillTarget: structuredClone(workspace.drillTarget),
    draft: state.artifactDraft?.id === workspace.activeTabId ? structuredClone(state.artifactDraft) : null,
    activeScene: state.activeScene || 0, actorEditingField: state.actorEditingField || null,
  } } };
}

function restoreTab(state, workspace) {
  const artifact = artifactById(state.artifacts, workspace.activeTabId);
  const saved = workspace.tabStates?.[workspace.activeTabId];
  return {
    artifactWorkspace: { ...workspace, activeView: saved?.view || workspace.activeView, drillTarget: saved?.drillTarget || null, loadingArtifactId: null },
    artifactDraft: saved?.draft ? structuredClone(saved.draft) : artifact?.type === 'preview' ? structuredClone(artifactContent(artifact, state)) : null,
    activeScene: saved?.activeScene || 0, actorEditingField: saved?.actorEditingField || null,
  };
}

export function activateArtifact(state, artifactId) {
  if (!artifactById(state.artifacts, artifactId)) return {};
  return restoreTab(state, openArtifactTab(rememberTab(state), artifactId));
}

export function returnToArtifactRoot(state) {
  const workspace = rememberTab(state);
  return { artifactWorkspace: { ...workspace, activeTabId: null, activeView: workspace.rootMode, drillTarget: null, loadingArtifactId: null }, artifactDraft: null, actorEditingField: null };
}

export function closeArtifact(state, artifactId) {
  const workspace = rememberTab(state);
  const next = closeArtifactTab(workspace, artifactId);
  // Closing a view does not discard its unsaved data; reopening restores the draft.
  return workspace.activeTabId === artifactId ? restoreTab(state, next) : { artifactWorkspace: next };
}

export function beginActorDrill(state, actorId) {
  const workspace = state.artifactWorkspace;
  const owner = artifactById(state.artifacts, workspace.activeTabId);
  const actor = artifactById(state.artifacts, actorId);
  if (owner?.type !== 'document' || actor?.type !== 'actor' || workspace.activeView === ArtifactView.DRILL) return {};
  const parentDraft = state.artifactDraft?.id === owner.id ? structuredClone(state.artifactDraft) : null;
  return {
    artifactDraft: { ...structuredClone(parentDraft || artifactContent(owner, state)), actor: structuredClone(artifactContent(actor, state)) },
    actorEditingField: null,
    artifactWorkspace: {
      ...workspace,
      activeView: ArtifactView.DRILL,
      drillTarget: { artifactId: actorId, returnView: workspace.activeView, parentDraft },
    },
  };
}

export function finishActorDrill(state, apply = false) {
  const workspace = state.artifactWorkspace;
  if (workspace.activeView !== ArtifactView.DRILL) return {};
  const context = workspace.drillTarget;
  const draft = state.artifactDraft?.actor;
  const legacyDraft = context && typeof context === 'string' ? { ...state.artifactDraft } : null;
  if (legacyDraft) delete legacyDraft.actor;
  // Applying the child must not commit an unfinished parent document draft.
  const artifacts = apply && draft
    ? state.artifacts.map((item) => item.id === draft.id ? commitArtifactEdit(item, draft) : item)
    : state.artifacts;
  return {
    artifacts,
    artifactDraft: context?.parentDraft || legacyDraft || null,
    actorEditingField: null,
    artifactWorkspace: { ...workspace, activeView: context?.returnView || (legacyDraft ? ArtifactView.EDIT : ArtifactView.DETAIL), drillTarget: null },
  };
}

export function ensureActorDraft(state) {
  if (state.artifactWorkspace.activeView === ArtifactView.DRILL) {
    const actor = state.artifactDraft?.actor;
    if (actor && !actor.appearanceOptions) Object.assign(actor, artifactContent({ ...actor, type: 'actor' }, state));
    return actor;
  }
  const actor = artifactById(state.artifacts, state.artifactWorkspace.activeTabId);
  if (actor?.type !== 'actor') return null;
  if (state.artifactDraft?.id !== actor.id) state.artifactDraft = structuredClone(artifactContent(actor, state));
  state.artifactWorkspace.activeView = ArtifactView.EDIT;
  return state.artifactDraft;
}
