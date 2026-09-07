# Figma restoration audit, 2026-09-06

## Authority and scope

File: `Alh06MJP5p6N9cZkuHD5I4`. The inventory in `figma-inventory.json` records the task, conversation and artifact sections and their annotations. State examples are not simultaneous conversation messages. Latest explicit user corrections override older visual examples.

The installed official Figma design-to-code workflow was used for exact-node context, screenshots and SVG exports. Skill discovery was performed with find-skills; no replacement framework or additional plugin was installed.

This audit is not a claim that every screen or interaction has been accepted.

Correction after user review: the deleted control showed an old file-tree icon. That deletion request was incorrectly interpreted as removal of maximize. Maximize remains part of the source design and was restored in the September 7 pass below. Earlier checks asserting its absence must not be used as acceptance criteria.

## September 7 workspace pass, local version 20260907a

| Exact source | Audited difference | Implemented correction |
| --- | --- | --- |
| Empty `1047:46404`, text `1047:46451` | Filled root title and invented empty copy | Plain root title; exact empty text, 16px/16, white 40%, centered in the pane |
| Header `1343:166890`, resize glyph `1343:166900` | Maximize removed because our old file-tree icon was misidentified | Restore the resize action using the original exported SVG |
| Maximized `1250:145002`, glyph `1290:145573` | No verified maximized state | Task rail remains; conversation hidden; artifact width fills the rest; restore preserves context |
| Crowded `1343:167708`, close glyph `1250:145420` | A hard count of more than three tabs hid every title | Width-dependent contraction; fixed root entry; scroll current tab into view on narrow screens |
| Category `1250:143109`, annotation `1343:168665` | Mode copy described the destination instead of current state; reused list icon | Current mode copy and exact switch SVG `1343:168675`; generated categories only |
| List `1347:223013`, card `1347:223301` | Extra heading row, missing group icons, wrong card radius and metadata color | Mode switch beside first typed heading; 20px card radius, 86px minimum card height, source metadata color |
| Document edit `1184:125465` | Rechecked the existing "edit" title prefix rather than assuming it was invented | Retained: the exact edit source does include the prefix |

Functional verification in an isolated browser:

- 1440 x 800: split artifact pane x=740, width=700; maximized pane x=180, width=1260. A conversation scroll position of 240 survives maximize/restore.
- An unfinished document draft survives another tab, root navigation, closing/reopening the workspace and a full page reload. Original artifact content is unchanged until Apply.
- Five open tabs show titles when width permits; at 1057px they compact; maximizing restores visible titles.
- 390 x 844: no horizontal page overflow. The active tab stays entirely inside its scroll track while the root entry remains visible. Empty text stays inside the 338px pane. These are responsive checks, not mobile Figma parity claims.
- A real new task was started through the skill/material Composer flow to verify the zero-artifact state. No storage was cleared.
- Quoting from split view retains the same active tab, workspace and actual scroll position. The artifact remains separately owned by the task.
- 58 automated regression tests pass. Browser application-error output was empty before the final inspection. Test-tool evaluation errors are not application errors.

Verification screenshots: `/private/tmp/workspace-empty-20260907a.png`, `/private/tmp/workspace-list-20260907a.png`, `/private/tmp/workspace-tabs-1057.png`. The mobile tab screenshot predates the final active-tab visibility fix; final DOM geometry was checked after that fix.

This pass does not certify all document bodies, media editors or task interactions. The maximized "reference to conversation" transition is awaiting user clarification; other remaining boundaries below still apply. GitHub Pages remains unchanged.

## September 7 task-sidebar pass, local version 20260907b

- Read exact structure frames `1047:43885` (expanded/new), `1047:44028` (collapsed), `1047:44147` (collapsed logo hover) and `1047:43222` (selected task and task options).
- Expanded rail `1047:43915`: width 180, padding 12/8, gap 12; header 32; new-project row 36 with no persistent selected fill. Recent label is 14/20 at white 60%; task rows are 36px tall with 12px corners and regular 14/20 text.
- Collapsed rail `1047:44058`: width 51 and transparent background, 31.5 x 18 logo, 36px new-task icon button. Removed conflicting 76/54/52px widths and unrelated CSS that silently hid controls in expanded narrow-screen drawers.
- Logo hover `1047:44178`: exact 20px exported toggle asset, with its 12px internal glyph. Exported from `1047:43931`; hover and expanded toggle use the same source glyph.
- Task options `1047:43525` / `1047:43527`: exact more icon; hover/focus entry; menu at x=176/y=140 for the first row at 1440px, width 88 and height 112. Only Share / Settings / Delete are added here. Existing operations target the clicked task ID, not the current conversation.
- At 1440px, new-task Composer x remains 322 before and after collapsing, matching the two source frames. Its existing content and workflow are unchanged.
- Browser checks: 1440 x 800, user-size 1109 x 909, mobile 390 x 844; collapsed background and width, logo hover, expand/collapse, task switching, menu positioning, current selection, and mobile drawer visibility. Fixed the mobile drawer removing the first grid item and incorrectly moving the content into the rail column.
- In an isolated browser, created task B through the actual input flow. While B remained current, changed A's duration to 35 (B stayed 20), decoded A's share snapshot to verify identity, then deleted A without deleting or switching B. No user storage was cleared or altered.
- 62 unit tests pass after this correction. Browser application error output was empty. Mobile is a responsive adaptation, not an exact mobile Figma claim.
- Resolved by user clarification (20260907c): `1047:44066` is the projects entry below New. Restore its 36px button and 20px source glyph; the exported SVG matches `new-task.svg` exactly. Clicking expands the existing task list through `toggle-sidebar`, without starting a new task or replacing Composer content.
- Local deployment checkout is synchronized; GitHub Pages has not been published.

### Projects icon update, local version 20260907d

- Re-read `1047:44066` after the user's Figma update. Its icon `I1047:44066;718:7284` is now a folder, not the previously exported plus. Downloaded the exact new asset as `task-projects.svg` and assigned the dedicated `taskProjects` icon key.
- Preserve the 20px glyph, 36px action area, rail spacing and existing expand-list action. New project still uses its original plus icon.

### Collapse-button background correction, 20260907e

- Re-read `1047:43931`: no fills/effects; parent `1047:43916` has its fill disabled. The annotation specifies collapsing the task rail.
- Removed inherited generic icon-button hover fill and backdrop blur only for `.sidebar-collapse`. Original glyph, 20px dimensions and toggle action remain unchanged.
- At the reported 1109 x 909 viewport, hovered computed background is transparent and backdrop filter is none; screenshot checked and click still collapses the rail. Six focused sidebar tests pass. Local deployment checkout synchronized; no public publishing.

## Earlier source-to-code map

### Requirements body, September 7

- Read the new `1466:16935` design context and body `1466:17458`. No annotations were present. User clarified that the wet-wipe statements are placeholders and authorized replacing them according to the product-details semantics.
- Removed the previous generic requirements section/video-requirements list. New body: lead paragraphs; purple Product Information heading; numbered Product Reference Images and Product Details subsections; six typed fact cards across product details and Content Preferences. Mock copy lives in `scenarios/requirements.js`, not in the renderer.
- Source gallery `1466:17472`: two 4%-white bands, 12px outer radii, 100px square images, 8px gaps, Add action. Downloaded all three exact image assets plus Add and bullet SVGs. Source cards `1466:17493`/`1466:17572`: 9px gaps, 12/16px padding, 12px radius, 144px minimum height, 14/28 body and 12/22 tags. Cards grow when the authorized replacement copy wraps.
- The new content distinguishes selling points, proposed audiences, campaign conditions and their creative presentation. Ingredient/zero-additive and discount claims are explicitly unverified; selected campaign, duration and ratio remain contextual data.
- Browser checks at 1440 x 800 and 390 x 844: all reference images load, no overflowing cards or horizontal page overflow. Edited a selling point, added an image, reloaded the draft, canceled to restore the original, then applied a text edit and reloaded to confirm the same artifact ID and persisted content. Browser errors empty; 72 tests pass. Original screenshots: `/private/tmp/requirements-0707-desktop.png`, `/private/tmp/requirements-0707-mobile.png` (mobile shows an isolated test edit).
- Local deployment synced; no public publishing. Existing edited documents and unfinished drafts are intentionally preserved, not silently replaced. Conversation states/timing and other artifact workflows unchanged.

### Homepage and return navigation, 20260907e

- Source return action `1466:16465`: expanded logo hover/focus hides the logo and shows the exact left arrow (20px) and 16px return label. Collapsed logo retains its expand-task-rail action.
- Newly supplied homepage `1466:16472`; inspected header `1466:16752`, rail `1466:16740`, Composer `1466:16475`, recommendations `1466:16500`. Replaced historical HomeTemplate content rather than restoring its unrelated opportunity copy.
- Home has its own `view=home` route. Returning saves the active task first; unfinished new-task input is retained. Returning from a conversation stores it and starts a separate homepage input context. Choosing the specified campaign skill enters the new-task view with the same structured input; sending uses the existing workflow.
- Homepage sample opportunities/images and eight skill slots follow the supplied frame. Generic skill labels are retained as design placeholders, without invented workflow mappings. Account, assets, tools, recommendation details, tabs and filters have no supplied destination/data contract; clicks report that boundary. Search does not fabricate results. This pass does not implement those destination pages.
- Exact downloaded homepage resources are under `assets/agent-2/home`; page sections remain DOM, not a whole-page screenshot. Narrow layouts are responsive adaptations, not a mobile-Figma fidelity claim.
- Browser verification: 1440 x 800 homepage and logo-hover screenshots compared with the source; return arrow is 20 x 20 at x=16/y=18 and label begins at x=40. Campaign selection -> new task -> return home preserves the same task ID, skill and unfinished input, including after reload. At 390 x 844, document width remains 390 and all image resources load. No browser application errors were reported. The 66 regression tests pass. Source SVGs provide the Composer and skill-button multi-layer borders; no page-sized screenshot is used as UI.
- Local canonical source and deployment checkout synchronized for 20260907e. GitHub Pages not published in this pass. Recommendation destination pages and data operations are not part of this acceptance.

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
