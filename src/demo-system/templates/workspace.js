import { ArtifactWorkbench } from '../components/artifacts.js?v=20260903i';
import { Composer } from '../components/composer.js?v=20260903i';
import { MessageFeed } from '../components/messages.js?v=20260903i';
import { ConversationHeader, ConversationSettingsModal, TaskSidebar } from '../components/navigation.js?v=20260903i';
import { ConversationEditor } from '../components/conversation-editor.js?v=20260903i';
import { getActiveComposerQuestion, getFeedMessages } from '../conversation/component-registry.js';

const newTaskSkills = ['场景优化', '家清剧情视频', '服饰多场景试穿', '爆款裂变', '商品卖点拆解', '口播脚本'];

function NewTaskTemplate(state) {
  return `
    <div class="agent-shell ${state.sidebarCollapsed ? 'sidebar-collapsed' : ''}">
      ${TaskSidebar({ activeTask: 'new' })}
      <section class="new-task-pane">
        <div class="new-task-stage">
          <h1>说出你的想法，开启专业商业化创作</h1>
          ${Composer({ newTask: true, draft: state.draft, attachment: state.attachment, busy: state.busy })}
          <div class="new-task-skill-rail">
            <button class="skill-rail-arrow" data-action="scroll-skills" data-direction="left" aria-label="向左查看更多">‹</button>
            <div class="new-task-skill-track">${newTaskSkills.map((skill) => `<button class="new-task-skill" data-action="choose-skill" data-skill="${skill}"><span>${skill}</span><i></i></button>`).join('')}</div>
            <button class="skill-rail-arrow" data-action="scroll-skills" data-direction="right" aria-label="向右查看更多">›</button>
          </div>
        </div>
      </section>
    </div>`;
}

export function WorkspaceTemplate(state) {
  if (state.taskMode === 'new' && state.messages.length === 0) return NewTaskTemplate(state);
  const editorOpen = Boolean(state.editor?.enabled);
  const workbenchOpen = !editorOpen && state.workbenchView !== null;
  const confirmation = getActiveComposerQuestion(state.messages);
  const feedMessages = getFeedMessages(state.messages);
  return `
    <div class="agent-shell ${workbenchOpen ? 'has-workbench' : ''} ${editorOpen ? 'is-editing' : ''} ${state.sidebarCollapsed ? 'sidebar-collapsed' : ''}">
      ${TaskSidebar({ activeTask: 'existing' })}
      <section class="conversation-pane ${confirmation ? 'has-confirmation' : ''}">
        ${ConversationHeader({ projectMenuOpen: state.projectMenuOpen, title: state.projectTitle })}
        <main class="conversation-scroll" data-role="conversation-scroll"><div class="conversation-column">${MessageFeed({ messages: feedMessages, artifacts: state.artifacts, busy: state.busy })}</div></main>
        <div class="conversation-composer ${confirmation ? 'has-confirmation' : ''}"><div class="conversation-column">${Composer({ draft: state.draft, attachment: state.attachment, busy: state.busy, confirmation })}</div></div>
      </section>
      ${workbenchOpen ? ArtifactWorkbench(state) : ''}
      ${editorOpen ? ConversationEditor(state) : ''}
      ${state.settingsOpen ? ConversationSettingsModal() : ''}
    </div>`;
}
