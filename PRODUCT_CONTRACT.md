# Agent 2.0 product contract

## Source of truth

### Mandatory calibration gate

- User clarification: the request to delete the old file-tree icon did not authorize deleting maximize. Never interpret a browser-generated accessible name, selector, or our own component label as the user's business instruction. Use the user's actual comment, target appearance, and Figma annotations together; ask if their meaning remains ambiguous.
- For genuine unresolved decisions, use the grilling clarification skill: first retrieve facts from Figma and the code, then ask only the remaining decision questions and wait. Do not ask the user to restate rules that can already be read from the supplied design. Do not implement an unresolved branch before confirmation.

- Never infer, approximate from memory, or invent a product style, layout, control, copy, or state. This also prohibits silently inheriting an old component's presentation.
- Before each UI edit, inspect the exact current Figma state and annotations. Record the source node, intended state, relevant design properties, and the existing-code differences. A section inventory is not evidence that each state was checked.
- Code reuse requires verified agreement with that exact state. A shared component, familiar name, or passing functional test is not proof of visual agreement.
- If the required source cannot be read, is ambiguous, or conflicts with a later user instruction, stop the affected edit and report the specific uncertainty. Do not fill the gap with a guessed design.
- After editing, inspect the rendered result in the same state against the source. Unchecked states must be labeled unverified; do not claim the component or page has been fully restored.

- Product intent: `agent2-ia-document/即创Agent-2.0信息架构升级方案.md`.
- Figma file: `Alh06MJP5p6N9cZkuHD5I4`.
- Sections: task `1176:118745`, conversation `1176:118746`, artifacts `1176:118747`.
- Preserve approved Conversation 1.0 timing, streaming, message states and question lifecycle.
- Mock is the replaceable service/data boundary. Product actions themselves must operate on real local state.

## Retain / replace audit

| Area | Decision | Reason |
| --- | --- | --- |
| Conversation runtime and render registry | Retain | Stable run/question IDs, confirmed lifecycle and streaming |
| Task storage, artifact tabs, revision storage | Retain | Same-task ownership and recoverability |
| Skill tag outside Composer | Replace | Contradicts `1047:44266` annotation and component ownership |
| Single-text/single-attachment product input | Replace in live pages | Cannot represent preset queries with material slots |
| Document title/id-based layout switch | Remove | Data cannot determine an invented layout |
| Automatic next-stage on arbitrary text | Remove | Feedback is not approval |
| Historical Q3 instructions | Archive as history | Conflict with the latest approved message model |

## Executable contracts

| Entity | Structure / invariant | Implementation |
| --- | --- | --- |
| Input | skill + ordered text/slot/reference parts; required slot gates sending | `composer/model.js` |
| Skill preset | query parts and resource requirements; selection pre-fills; removal clears preset but preserves independent inputs | `scenarios/skills.js` |
| User message | serialized input parts and references, not reconstructed string matching | `components/messages.js` |
| Task decision | named review state + explicit recognized intent; unknown input cannot advance | `conversation/workflow.js`, `scenarios/decisions.js` |
| Document | nested section, paragraph, list, subjects, shots, image, video blocks | `artifacts/document.js`, `components/document-blocks.js` |
| Document reference | stable artifact ID; detail/edit/message resolve the same object | `referencedDocumentArtifacts`, `replaceDocumentReference` |
| API | mock contracts are not connected endpoints; existing conversation inspector remains available | `editor/conversation-api-bindings.js` |

## Calibration for this change

- Composer: `1047:44266`, especially annotations `1047:44296` and `1047:44300`. Skill tag is white/purple, inside the input; product/material slots open the respective selector. Closing the skill removes the preset query.
- Structured document detail: `1184:123591`, content subtree `1184:124104`. Top-level section gap 24, inner gap 16, heading 16, body 14/24; numbered subheadings, subject cards, two-column dialogue/visual tables.
- Structured document edit: `1184:125465`; same block structure, editable fields and actor drill-down, apply commits revision.
- Figma uses mixed example subjects in its document body. Luosifen demonstration copy is separately identified as Mock; it must reuse the extracted structure, not claim literal content parity. On September 7 the user clarified that the wet-wipe copy in `1466:16935` is structural placeholder content and authorized semantic replacement for luosifen. Requirements now follow `1466:17458`: introductory analysis, product references, product details (selling points/audience/campaign), and content preferences. `scenarios/requirements.js` owns this Mock copy; typed `reference-gallery` and `fact-cards` blocks own its presentation. Unverified composition, prices and discounts must remain qualified, not factual promises.
- No mobile Figma frame has been calibrated in this change. Narrow-screen layouts preserve component ownership and source hierarchy; they are responsive adaptations, not claimed pixel-exact mobile designs.

## Release gate

1. Input: choose/replace/remove skill, fill/remove slot, edit text, send, switch task and reload.
2. Flow: explicit accept continues; feedback waits; question submit updates Q, appends user confirmation, then starts Run.
3. Document: source hierarchy, edit/apply/cancel, reference resolution, actor replacement, tab switch and reload.
4. Desktop and mobile geometry: skill remains within composer; text fits; no horizontal page overflow.
5. Separate functional checks from design checks. List unverified states and unsupported mock capabilities rather than silently substituting a different feature.

## Verified scope, 2026-09-06

- Browser: new task, choose campaign skill, fill product slot, send, answer campaign form, requirement output, document edit/apply/reload, quote back to Composer, feedback staying in review, explicit approval creating storyboard.
- Desktop 1440px and mobile 390px: Composer ownership and document structure checked. Mobile scroll region now ends above the input dock; no page-width overflow observed. Referenced storyboard images loaded without errors.
- Automated: input composition/removal/migration, task round-trip, explicit decisions, document grammar/reference replacement, previous conversation and artifact regressions.

## Browser feedback calibration, 2026-09-06c

- Composer `1047:44266`: tag, text and reference share the same vertical center. Enter sends; Shift+Enter inserts a newline; composing IME input never sends. Empty hints disappear on focus and remain hidden after typing. Removed the all-skills recommendation entry, retaining the existing Composer skill selector.
- Conversation `1094:95551`: the design-context screenshot shows a checked stacked-square icon, while its download URL incorrectly returns a product bag. The exact icon was exported read-only via Plugin API from `I1094:95551;718:7284`; both pending and answered questions use that component resource.
- Completed time uses 16px/28px. Welcome and assistant replies stream; execution explanations now stream too. Ordered text/step blocks belong to the existing Run, not additional messages.
- Verified locally: Enter send, Shift+Enter newline, empty/focused/typed placeholder, welcome prefixes, 16px computed font, question icon screenshot, four sequential steps and a 721ms observed reply-to-artifact gap. Desktop 1440px and mobile 390px checked; 40 automated regression tests pass.

## Remaining boundaries (not completion claims)

- The per-state Figma restoration audit is `src/demo-system/design/RESTORATION_AUDIT.md`; raw section/annotation inventory is `src/demo-system/design/figma-inventory.json`. Read both before extending any of the corrected states. Unfinished boundaries in that audit must not be reported as completed features.

- The executable Mock scenario is the campaign-video task. Other skill presets retain their input composition but do not silently run this scenario.
- Natural-language intent recognition is a small explicit Mock rule set, not an LLM. Arbitrary editing instructions are not automatically applied to documents; direct document editing works.
- Conversation visual editing/API inspection is retained. Composer and document blocks have schema/source mappings, but their full visual inspector is not implemented in this change.
- Repeated creative iterations, complete media editing and all task/artifact interaction branches need a separate end-to-end acceptance pass. This change does not certify every screen as Figma-exact.
