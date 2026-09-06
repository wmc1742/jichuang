# Figma restoration audit, 2026-09-06

## Authority and scope

File: `Alh06MJP5p6N9cZkuHD5I4`. The inventory in `figma-inventory.json` records the task, conversation and artifact sections and their annotations. State examples are not simultaneous conversation messages. Latest explicit user corrections override older visual examples.

The installed official Figma design-to-code workflow was used for exact-node context, screenshots and SVG exports. Skill discovery was performed with find-skills; no replacement framework or additional plugin was installed.

This audit is not a claim that every screen or interaction has been accepted.

## Source-to-code map

| Source state | Component | Decision and result |
| --- | --- | --- |
| New task `1047:43885` | WorkspaceTemplate, Composer | Retain inline input ownership and approved input behavior. |
| Skill hover `1047:44021` | SkillChoices | Replace old vertical tooltip with source left-media/right-copy layout, 240 x 186. Export source poster. |
| Skill picker `1047:44709` | SkillPopover | Replace generic dark modal/grid with source search + categories/list/preview, 508 x 322. |
| Collapsed task rail `1047:44178` | TaskSidebar | Logo hover exposes the existing source collapse/expand glyph. |
| Answered expanded form `1167:118132` | QuestionMessage presentation | Re-read source; retain the existing disabled historical choices and stable question identity. No conversation lifecycle changes. |
| Artifact skeleton `1343:168488` | LoadingDetail | Replace invented spinner with source 4% white skeleton surface. |
| Crowded tabs `1343:167708` | ArtifactTabs | Equal-width compact tabs retain icons, full hover titles and stable IDs. |
| Actor drill `1184:124561` | DrillEditor, ActorDetail | Previous local correction retained: same document tab, parent draft restoration, appearance choices and local field edits. |
| Video editing `1184:130167` | VideoEditor | Replace simplified image/text editor with player, current-scene video candidates, description, reference subjects, playback controls and scene strip. Export exact toolbar icons. |

## Browser checks performed

- Desktop 1440 x 800: skill picker categories, text search, selection preview and source poster rendering.
- Video editor desktop: workbench width 920, main editor height 510, timeline candidates 120 x 96 after removing conflicting legacy CSS.
- Real sample-video playback advances from 00:00 to 00:20 and ends; displayed time reads the HTML video element.
- Editing a scene description, selecting another scene and returning retains the draft.
- Cancel then reopen restores original text; Apply retains uploaded candidate video in the artifact revision.
- Uploading a video changes current-scene candidates from one to two while keeping four timeline scenes.
- Desktop media-editor task rail expands from 54 to 180 without page overflow.
- Mobile 390 x 844: workbench width 338; scene prompt, reference controls, playback controls and horizontal scene strip stay within viewport. Controls are reachable by scrolling.
- Browser error collection was empty during the checked flows.
- 51 automated tests pass, including five source-structure regressions. These tests do not establish pixel-perfect acceptance.

## Remaining work and explicit boundaries

- The source provides a poster for the skill preview; no playable example video was obtained for it. The video presentation supports a preview URL, but the current preset has a static Figma poster. ZIP import stores the package locally and does not execute a skill.
- Scene media, actor profiles and document copy remain named Mock data, not literal reproductions of every Figma example. The source contains more than one example subject. They must not be represented as visually verified content parity.
- Video description @-reference token insertion and the actor/sticker/text/music/packaging subpanels are not calibrated or implemented here. Their toolbar presence does not mean those features are complete. Generation actions explicitly state that the service is not connected instead of claiming a new result.
- Full media generation, packaging, and repeated creative iterations still require a complete scenario/provider implementation and an end-to-end pass.
- Composer and document-block visual inspectors remain outside this correction; conversation component/API inspection remains available.
- Mobile is a responsive adaptation. No mobile source frame was supplied or claimed as pixel-exact.
- This change is local. GitHub Pages publication is pending explicit approval after the previous publishing operation was blocked.
