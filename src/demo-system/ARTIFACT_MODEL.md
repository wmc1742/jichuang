# Artifact 1.0

Authoritative design source: Figma `Agent-2.0`, section `3·产物内容` (`1176:118747`).

## Domain boundary

An Artifact is a task-owned output. Conversation messages never duplicate artifact content. An `ArtifactPresentation` only stores `artifactId` or `artifactIds` and chooses the in-conversation presentation for that artifact type.

```text
Task
  -> ArtifactCollection
      -> Artifact
          -> ArtifactRevision

ConversationNode
  -> ArtifactPresentation
      -> artifactId / revisionId
```

## Artifact types

| Type | Overview | Detail | Edit | Conversation presentation |
| --- | --- | --- | --- | --- |
| document | versioned cards | structured document | inline structured editor and drill-down | reference card |
| video | portrait video grid | large player | scene, prompt, references and packaging editor | direct video preview |
| image | image grid | large image | no generic editor in the approved design | direct image preview |
| preview | recommendation groups | generation editor | edit prompt/references, then generate video | collection preview when needed |
| actor | portrait grid | actor profile | appearance and voice drill-down editor | direct actor preview |

## Workspace states

- Closed: the conversation uses the full content width.
- Root/category: generated artifact types are available as filters.
- Root/list: artifacts are grouped by type and ordered newest first.
- Detail: one artifact is selected in an artifact tab.
- Edit: the selected type's registered editor is active.
- Drill: edits a nested entity such as an actor referenced by a document.
- Maximized: the workspace fills the area beside the task sidebar.
- Loading and tab-overflow are supported boundary states.

## Interaction rules

1. `查看生成内容` opens the root without discarding open tabs.
2. Opening an artifact reuses its tab or appends a new tab.
3. Closing the active tab selects its nearest neighbor; closing all tabs returns to the root.
4. Collapsing the workspace preserves tabs, root mode and selection.
5. `引用至会话` places an artifact reference in the composer; it does not create a message until the user sends.
6. Actions come from the artifact type capabilities. An image must not receive an invented Edit action.
7. Applying edits updates the artifact revision metadata and returns to detail.
8. A preview's final action creates a video artifact and keeps the source preview relationship.

## API mapping

| UI event | Suggested API event |
| --- | --- |
| Open workspace | `artifact.workspace.opened` |
| Select category | `artifact.collection.filtered` |
| Open artifact | `artifact.opened` |
| Open/close tab | `artifact.tab.opened` / `artifact.tab.closed` |
| Reference in composer | `artifact.reference.attached` |
| Enter editor | `artifact.edit.started` |
| Apply edit | `artifact.revision.updated` |
| Generate from preview | `artifact.generation.requested` |

The demo adapter may mock these events locally, but components consume this contract rather than branching on page-specific markup.
