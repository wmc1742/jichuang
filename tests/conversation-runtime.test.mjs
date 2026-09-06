import test from 'node:test';
import assert from 'node:assert/strict';

import {
  completedScenarioMessages,
  getScenarioMessage,
  scenarioArtifacts,
  scenarioInteractions,
} from '../src/demo-system/scenarios/luosifen.js';
import { applyConversationEvent, ConversationEvent } from '../src/demo-system/conversation/runtime.js';
import { toConversationRuntimeEvent } from '../src/demo-system/conversation/adapter.js';
import { formatLiveElapsed, getRunSimulationPlan } from '../src/demo-system/conversation/simulation.js';
import { normalizeConversationNodes } from '../src/demo-system/conversation/model.js';
import { resolveConversationPresentation } from '../src/demo-system/conversation/component-registry.js';
import { MessageFeed } from '../src/demo-system/components/messages.js';

const normalizedTimeline = normalizeConversationNodes(completedScenarioMessages);

test('approved conversation contains one final instance for every run and question', () => {
  assert.equal(normalizedTimeline.length, 32);
  const runs = normalizedTimeline.filter((message) => message.kind === 'agent-run');
  assert.deepEqual(runs.map((message) => message.runId), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(new Set(runs.map((message) => message.id)).size, 8);
  assert.ok(runs.every((message) => message.phase === 'completed' && message.expanded === false));

  const questions = normalizedTimeline.filter((message) => message.kind === 'agent-question');
  assert.deepEqual(questions.map((message) => message.id), ['campaign-selection', 'character-confirmation', 'video-confirmation']);
  assert.ok(questions.every((message) => message.phase === 'answered' && message.expanded === false));
});

test('the approved campaign question renders only the four Figma options', () => {
  const html = MessageFeed({ messages: [getScenarioMessage('campaign-selection')] });
  assert.match(html, /question-confirm\.svg/);
  assert.match(html, /双11节点/);
  assert.match(html, /圣诞\/元旦跨年/);
  assert.match(html, /春节\/年货节/);
  assert.match(html, /以上全部/);
  assert.doesNotMatch(html, /自定义/);
});

test('question components expose their icon as an editable presentation property', () => {
  const question = getScenarioMessage('campaign-selection');
  const customHtml = MessageFeed({ messages: [{ ...question, icon: 'selectionForm' }] });
  const hiddenHtml = MessageFeed({ messages: [{ ...question, icon: 'none' }] });

  assert.match(customHtml, /selection-form\.svg/);
  assert.doesNotMatch(hiddenHtml, /question-state-icon/);
});

test('document artifacts hide API status unless the presentation opts in', () => {
  const artifact = scenarioArtifacts.find((item) => item.id === 'requirements-analysis');
  const base = { id: 'artifact-test', role: 'assistant', type: 'artifact', artifactId: artifact.id };
  const defaultHtml = MessageFeed({ messages: [base], artifacts: scenarioArtifacts });
  const optedInHtml = MessageFeed({ messages: [{ ...base, showStatus: true }], artifacts: scenarioArtifacts });

  assert.doesNotMatch(defaultHtml, /已生成/);
  assert.match(optedInHtml, /已生成/);
});

test('submitting a question updates it in place, then appends the user confirmation', () => {
  const question = getScenarioMessage('campaign-selection');
  const result = applyConversationEvent([question], {
    type: ConversationEvent.INTERACTION_SUBMITTED,
    questionId: question.id,
    answer: { selected: ['双11节点', '春节/年货节'] },
    summary: scenarioInteractions[question.id].summary,
    history: scenarioInteractions[question.id].history,
    userMessageId: 'answer-1',
    userText: '我已确认',
  });

  assert.equal(result.length, 2);
  assert.equal(result[0].id, question.id);
  assert.equal(result[0].phase, 'answered');
  assert.equal(result[0].expanded, false);
  assert.equal(result[1].kind, 'user-message');
  assert.equal(result[1].text, '我已确认');
});

test('run lifecycle keeps one stable node while its phase changes', () => {
  let messages = applyConversationEvent([], { type: ConversationEvent.RUN_STARTED, runId: 2, title: '正在思考···' });
  messages = applyConversationEvent(messages, { type: ConversationEvent.RUN_TIMER_TICK, runId: 2, elapsedSeconds: 4, detail: formatLiveElapsed(4) });
  assert.equal(messages.length, 1);
  assert.equal(messages[0].detail, '4 秒');
  assert.equal(messages[0].runtimeElapsedSeconds, 4);
  messages = applyConversationEvent(messages, { type: ConversationEvent.TOOL_STARTED, runId: 2, title: '开始执行···', steps: [] });
  assert.equal(messages.length, 1);
  assert.equal(messages[0].phase, 'executing');
  assert.equal(messages[0].runtimeElapsedSeconds, 4);
  messages = applyConversationEvent(messages, { type: ConversationEvent.RUN_COMPLETED, runId: 2, detail: '用时3m20s' });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].id, 'run-2');
  assert.equal(messages[0].phase, 'completed');
  assert.equal(messages[0].detail, '用时3m20s');
});

test('demo timing separates clock ticks from scheduled tool events', () => {
  assert.deepEqual(getRunSimulationPlan({ elapsed: '用时5s' }), { durationSeconds: 5, events: [] });
  assert.deepEqual(getRunSimulationPlan({
    elapsed: '用时3m20s',
    execution: {},
    simulation: { durationSeconds: 10, toolStartSecond: 4 },
  }), { durationSeconds: 10, events: [{ type: 'tool.started', atSecond: 4 }] });
  assert.equal(formatLiveElapsed(7.9), '7 秒');
});

test('thinking progress exposes animated dots and a live clock target', () => {
  const html = MessageFeed({ messages: [{
    id: 'run-live', role: 'assistant', kind: 'agent-run', variant: 'thinking', phase: 'running',
    title: '正在思考···', detail: '3 秒',
  }] });
  assert.match(html, /progress-copy__dots/);
  assert.match(html, /class="progress-elapsed"/);
  assert.match(html, /data-role="run-elapsed">3 秒/);
});

test('assistant streaming updates one stable message before completing', () => {
  const node = { id: 'assistant-stream-1', role: 'assistant', type: 'text', text: '完整回复' };
  let messages = applyConversationEvent([], {
    type: ConversationEvent.ASSISTANT_STREAM_STARTED,
    id: node.id,
    node,
    text: '',
  });
  messages = applyConversationEvent(messages, {
    type: ConversationEvent.ASSISTANT_STREAM_DELTA,
    id: node.id,
    delta: '完整',
  });
  messages = applyConversationEvent(messages, {
    type: ConversationEvent.ASSISTANT_STREAM_DELTA,
    id: node.id,
    delta: '回',
  });
  assert.equal(messages.length, 1);
  assert.equal(messages[0].phase, 'streaming');
  assert.equal(messages[0].text, '完整回');
  assert.match(MessageFeed({ messages }), /assistant-stream-cursor/);

  messages = applyConversationEvent(messages, {
    type: ConversationEvent.ASSISTANT_STREAM_COMPLETED,
    id: node.id,
    text: node.text,
  });
  assert.equal(messages.length, 1);
  assert.equal(messages[0].phase, 'completed');
  assert.equal(messages[0].text, '完整回复');
  assert.doesNotMatch(MessageFeed({ messages }), /assistant-stream-cursor/);
});

test('tool start reuses the same run node and keeps the thinking clock', () => {
  let messages = applyConversationEvent([], { type: ConversationEvent.RUN_STARTED, runId: 3, detail: '用时 2 秒' });
  messages = applyConversationEvent(messages, { type: ConversationEvent.RUN_TIMER_TICK, runId: 3, elapsedSeconds: 3, detail: '用时 3 秒' });
  messages = applyConversationEvent(messages, { type: ConversationEvent.TOOL_STARTED, runId: 3, title: '开始执行···', detail: '用时 3 秒' });

  assert.equal(messages.length, 1);
  assert.equal(messages[0].id, 'run-3');
  assert.equal(messages[0].phase, 'executing');
  assert.equal(messages[0].detail, '用时 3 秒');
});

test('run start cannot skip thinking and tool events own the execution transition', () => {
  const started = toConversationRuntimeEvent({ type: 'run.started', run_id: 'api-1', mode: 'execution', label: '正在思考···' });
  let messages = applyConversationEvent([], started);
  assert.equal(messages[0].variant, 'thinking');
  assert.equal(messages[0].phase, 'running');

  messages = applyConversationEvent(messages, { type: ConversationEvent.RUN_TIMER_TICK, runId: 'api-1', elapsedSeconds: 2, detail: '用时 2 秒' });
  const toolStarted = toConversationRuntimeEvent({ type: 'skill.started', run_id: 'api-1', label: '开始执行···' });
  messages = applyConversationEvent(messages, toolStarted);
  assert.equal(messages[0].phase, 'executing');
  assert.equal(messages[0].detail, '用时 2 秒');
});

test('artifact presentations only reference artifacts from the separate store', () => {
  const artifactIds = new Set(scenarioArtifacts.map((artifact) => artifact.id));
  const presentations = normalizedTimeline.filter((message) => message.kind === 'artifact-presentation');
  assert.equal(presentations.length, 4);

  for (const presentation of presentations) {
    const ids = presentation.artifactIds || [presentation.artifactId];
    assert.ok(ids.every((id) => artifactIds.has(id)));
    assert.equal('content' in presentation, false);
    assert.equal('previewUrl' in presentation, false);
  }
});

test('each answered question is followed by a user message before the next run', () => {
  const questionIds = ['campaign-selection', 'character-confirmation', 'video-confirmation'];
  for (const questionId of questionIds) {
    const questionIndex = normalizedTimeline.findIndex((message) => message.id === questionId);
    assert.equal(normalizedTimeline[questionIndex + 1].kind, 'user-message');
    assert.equal(normalizedTimeline[questionIndex + 1].text, '我已确认');
    assert.equal(normalizedTimeline[questionIndex + 2].kind, 'agent-run');
  }
});

test('expanded answered selections render as read-only history, not active form controls', () => {
  const answeredQuestion = {
    ...getScenarioMessage('campaign-selection'),
    phase: 'answered',
    text: scenarioInteractions['campaign-selection'].summary,
    history: scenarioInteractions['campaign-selection'].history,
    expanded: true,
  };
  const html = MessageFeed({ messages: [answeredQuestion] });
  const presentation = resolveConversationPresentation(answeredQuestion);

  assert.equal(presentation.component, 'QuestionMessage');
  assert.equal(presentation.renderer, 'AnsweredQuestionMessage');
  assert.match(html, /message--question-answered/);
  assert.doesNotMatch(html, /message--status/);
  assert.match(html, /answered-question__history/);
  assert.match(html, /history-option/);
  assert.match(html, /history-checkbox is-selected/);
  assert.doesNotMatch(html, /type="checkbox"/);
  assert.doesNotMatch(html, /form-option[^\n]*checked/);
});

test('execution steps use the Figma status icons for running and completed phases', () => {
  const html = MessageFeed({ messages: [{
    id: 'run-icons',
    role: 'assistant',
    kind: 'agent-run',
    variant: 'execution',
    phase: 'executing',
    title: '开始执行···',
    steps: [
      { id: 'running', label: '正在生成视频片段', phase: 'running' },
      { id: 'completed', label: '商品图已生成', phase: 'completed' },
    ],
  }] });

  assert.match(html, /execution-running\.svg/);
  assert.match(html, /thinking-complete\.svg/);
  assert.doesNotMatch(html, /<i><\/i>/);
});
