import { ArtifactWorkbench } from '../components/artifacts.js?v=20260906e';
import { Composer } from '../components/composer.js?v=20260906e';
import { MessageFeed } from '../components/messages.js?v=20260906e';
import { ConversationHeader, TaskSidebar } from '../components/navigation.js?v=20260906e';
import { ConversationEditor } from '../components/conversation-editor.js?v=20260906e';
import { getActiveComposerQuestion, getFeedMessages } from '../conversation/component-registry.js?v=20260906e';
import { SkillChoices } from '../components/task-dialogs.js?v=20260906e';
import { escapeHtml } from '../ui/primitives.js?v=20260906e';

function NewTaskTemplate(state) {
  return `
    <div class="agent-shell ${state.sidebarCollapsed ? 'sidebar-collapsed' : ''}">
      ${TaskSidebar({ ...state, activeTask: 'new' })}
      <section class="new-task-pane">
        <div class="new-task-stage">
          <h1>说出你的想法，开启专业商业化创作</h1>
          ${Composer({ newTask: true, draft: state.draft, attachment: state.attachment, input: state.input, busy: state.busy })}
          <div class="new-task-skill-rail">
            ${SkillChoices()}
          </div>
        </div>
      </section>
    </div>`;
}

export function WorkspaceTemplate(state) {
  if (state.taskMode === 'new' && state.messages.length === 0) return NewTaskTemplate(state);
  const editorOpen = Boolean(state.editor?.enabled);
  const workbenchOpen = !editorOpen && Boolean(state.artifactWorkspace?.open);
  const activeArtifact = state.artifacts.find((item) => item.id === state.artifactWorkspace?.activeTabId);
  const mediaEditor = workbenchOpen && (activeArtifact?.type === 'preview' || (activeArtifact?.type === 'video' && state.artifactWorkspace.activeView === 'edit'));
  const confirmation = getActiveComposerQuestion(state.messages);
  const feedMessages = getFeedMessages(state.messages);
  return `
    <div class="agent-shell ${workbenchOpen ? 'has-workbench' : ''} ${mediaEditor ? `has-media-editor ${state.mediaTaskRailExpanded ? 'media-rail-expanded' : ''}` : ''} ${editorOpen ? 'is-editing' : ''} ${state.sidebarCollapsed ? 'sidebar-collapsed' : ''}">
      ${TaskSidebar({ ...state, compactTaskRail: state.compactTaskRail || (mediaEditor && !state.mediaTaskRailExpanded), activeTask: 'existing' })}
      <section class="conversation-pane ${confirmation ? 'has-confirmation' : ''}">
        ${ConversationHeader({ projectMenuOpen: state.projectMenuOpen, title: state.projectTitle, editorEnabled: editorOpen, workbenchOpen })}
        <main class="conversation-scroll" data-role="conversation-scroll"><div class="conversation-column">${MessageFeed({ messages: feedMessages, artifacts: state.artifacts, busy: state.busy })}</div></main>
        <div class="conversation-composer ${confirmation ? 'has-confirmation' : ''}"><div class="conversation-column">${Composer({ draft: state.draft, attachment: state.attachment, input: state.input, busy: state.busy, confirmation })}</div></div>
      </section>
      ${workbenchOpen ? ArtifactWorkbench(state) : ''}
      ${editorOpen ? ConversationEditor(state) : ''}
    </div>`;
}
