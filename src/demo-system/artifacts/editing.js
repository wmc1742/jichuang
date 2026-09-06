import { artifactById, ArtifactView } from './model.js?v=20260906e';
import { artifactContent } from './content.js?v=20260906e';
import { commitArtifactEdit } from '../tasks/model.js?v=20260906e';

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
