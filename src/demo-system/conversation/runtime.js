import { ConversationKind, ConversationPhase, normalizeConversationNode, normalizeConversationNodes } from './model.js';

export const ConversationEvent = Object.freeze({
  APPEND: 'conversation.node.appended',
  UPDATE: 'conversation.node.updated',
  RUN_STARTED: 'run.started',
  TOOL_STARTED: 'tool.started',
  RUN_TIMER_TICK: 'run.timer.tick',
  RUN_COMPLETED: 'run.completed',
  RUN_FAILED: 'run.failed',
  STEP_UPDATED: 'run.step.updated',
  INTERACTION_SUBMITTED: 'interaction.submitted',
  TOGGLE_EXPANDED: 'conversation.node.expanded.toggled',
});

function upsert(messages, node) {
  const normalized = normalizeConversationNode(node);
  const index = messages.findIndex((message) => message.id === normalized.id);
  if (index < 0) return [...messages, normalized];
  return messages.map((message, currentIndex) => currentIndex === index ? { ...message, ...normalized } : message);
}

function update(messages, id, patch) {
  return messages.map((message) => message.id === id ? normalizeConversationNode({ ...message, ...patch, id }) : message);
}

function updateStep(message, event) {
  const steps = [...(message.steps || [])];
  const index = steps.findIndex((step) => step.id === event.step.id);
  if (index < 0) steps.push(event.step);
  else steps[index] = { ...steps[index], ...event.step };
  return { ...message, steps };
}

export function applyConversationEvent(currentMessages = [], event) {
  const messages = normalizeConversationNodes(currentMessages);
  if (event.type === ConversationEvent.APPEND) return upsert(messages, event.node);
  if (event.type === ConversationEvent.UPDATE) return update(messages, event.id, event.patch);

  if (event.type === ConversationEvent.RUN_STARTED) {
    return upsert(messages, {
      id: `run-${event.runId}`,
      runId: event.runId,
      role: 'assistant',
      kind: ConversationKind.RUN,
      variant: 'thinking',
      phase: ConversationPhase.RUNNING,
      title: event.title || '正在思考...',
      detail: event.detail,
      thought: event.thought,
      steps: event.steps || [],
      blocks: event.blocks || [],
      expanded: true,
      editorSource: event.editorSource,
    });
  }

  if (event.type === ConversationEvent.TOOL_STARTED) {
    return update(messages, `run-${event.runId}`, {
      variant: 'execution',
      phase: ConversationPhase.EXECUTING,
      title: event.title || '开始执行...',
      ...(event.detail !== undefined ? { detail: event.detail } : {}),
      ...(event.thought !== undefined ? { thought: event.thought } : {}),
      ...(event.steps !== undefined ? { steps: event.steps } : {}),
      ...(event.blocks !== undefined ? { blocks: event.blocks } : {}),
      expanded: true,
    });
  }

  if (event.type === ConversationEvent.RUN_TIMER_TICK) {
    return update(messages, `run-${event.runId}`, {
      detail: event.detail,
      runtimeElapsedSeconds: event.elapsedSeconds,
    });
  }

  if (event.type === ConversationEvent.STEP_UPDATED) {
    return messages.map((message) => message.id === `run-${event.runId}` ? normalizeConversationNode(updateStep(message, event)) : message);
  }

  if (event.type === ConversationEvent.RUN_COMPLETED || event.type === ConversationEvent.RUN_FAILED) {
    return update(messages, `run-${event.runId}`, {
      phase: event.type === ConversationEvent.RUN_FAILED ? ConversationPhase.FAILED : ConversationPhase.COMPLETED,
      title: event.title || (event.type === ConversationEvent.RUN_FAILED ? '执行失败' : ''),
      detail: event.detail,
      ...(event.steps ? { steps: event.steps } : {}),
      ...(event.blocks ? { blocks: event.blocks } : {}),
      expanded: false,
    });
  }

  if (event.type === ConversationEvent.INTERACTION_SUBMITTED) {
    const answered = update(messages, event.questionId, {
      kind: ConversationKind.QUESTION,
      phase: ConversationPhase.ANSWERED,
      placement: 'feed',
      expanded: false,
      text: event.summary,
      history: event.history,
      answer: event.answer,
      transient: false,
    });
    return upsert(answered, {
      id: event.userMessageId || `${event.questionId}-answer-${Date.now()}`,
      role: 'user',
      kind: ConversationKind.USER,
      variant: 'interaction-answer',
      type: 'text',
      text: event.userText || '我已确认',
      interactionId: event.questionId,
    });
  }

  if (event.type === ConversationEvent.TOGGLE_EXPANDED) {
    return messages.map((message) => message.id === event.id ? { ...message, expanded: !message.expanded } : message);
  }

  return messages;
}

export function appendConversationNodes(messages, nodes) {
  return nodes.reduce((current, node) => applyConversationEvent(current, { type: ConversationEvent.APPEND, node }), messages);
}
