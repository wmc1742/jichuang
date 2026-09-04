# Agent 2.0 Demo System

The demo is split by responsibility instead of by screenshot:

- `foundations/`: tokens and base visual rules.
- `ui/`: reusable controls such as icon buttons and attachments.
- `components/`: task navigation, composer, semantic message renderers, and artifact viewers.
- `templates/`: product home and the three-part Agent workspace.
- `scenarios/`: mock task data and conversation progression.
- `figma-map.json`: source Figma node for each major template.

Update shared appearance in `foundations/tokens.css` or `styles.css`. The current conversation scenario, eight Run definitions, three interactions, and separate Artifact Store live in `scenarios/luosifen.js`.

Conversation rendering follows `API event -> adapter -> runtime -> component registry -> renderer`. Artifact entities do not live inside messages: the timeline uses `ArtifactPresentation` references and resolves them from the task's Artifact Store. The approved rules and exact scenario order are documented in `CONVERSATION_MODEL.md`.

Open `index.html?studio=1` for the component acceptance workbench. Open `index.html?view=conversation&edit=1` for the conversation visual editor; selecting a rendered instance reveals its business component, state, renderer, source, editable design props, and API/event contract.
