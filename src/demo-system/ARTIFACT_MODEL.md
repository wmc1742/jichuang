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
- The live workspace has no maximize control (user correction, 2026-09-06); historical saved maximize flags do not hide the conversation.
- Loading and tab-overflow are supported boundary states.

## Interaction rules

1. `查看生成内容` uses the Figma folder icon and opens the root without discarding open tabs. Hide this entry while the workspace is open. The root tab uses the same folder icon.
2. Opening an artifact reuses its tab or appends a new tab.
3. Closing the active tab selects its nearest neighbor; closing all tabs returns to the root.
4. Collapsing the workspace preserves tabs, root mode and selection.
5. `引用至会话` places an artifact reference in the composer; it does not create a message until the user sends. Keep the workspace open, its current tab and scroll position unchanged.
6. Actions come from the artifact type capabilities. An image must not receive an invented Edit action.
7. Applying edits updates the artifact revision metadata and returns to detail.
8. A preview's final action creates a video artifact and keeps the source preview relationship.
9. Actor references in document subjects and shot rows enter Drill in the original document tab, both from Detail and Edit. They never add an actor tab. Directly opening an actor from the artifact collection remains a separate artifact action.
10. Drill keeps the caller view and any parent document draft. Back/Cancel discard only child changes. Apply commits only the referenced actor revision and restores the caller view/draft; it must not commit unsaved parent document text.
11. Actor Drill follows `1184:124561`: Back/Cancel/Apply, portrait, appearance selection, appearance description, voice choice and voice description. Description sections own their local Edit actions. No generic top-level actor Edit button.

## September 6 correction verification

- Header source: `1250:143843`, folder export: `1343:168585`.
- Document drill source: `1184:124561`, local edit: `1184:124841`, save: `763:41667`, voice: `1184:124874`.
- Appearance candidates are mock data, not generated alternatives from an algorithm. Uploaded images remain local browser media. Save to actor library is browser-local; no remote asset-library API is connected.
- Regression tests: `tests/artifact-drill.test.mjs` covers tab identity, parent draft preservation, child-only apply, cancel, document references and control structure.

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
