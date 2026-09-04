export const ConversationKind = Object.freeze({
  USER: 'user-message',
  ASSISTANT: 'assistant-message',
  RUN: 'agent-run',
  QUESTION: 'agent-question',
  RECEIPT: 'interaction-receipt',
  ARTIFACT_PRESENTATION: 'artifact-presentation',
});

export const ConversationPhase = Object.freeze({
  PENDING: 'pending',
  STREAMING: 'streaming',
  RUNNING: 'running',
  EXECUTING: 'executing',
  COMPLETED: 'completed',
  ANSWERED: 'answered',
  FAILED: 'failed',
});

export const ConversationPlacement = Object.freeze({
  FEED: 'feed',
  COMPOSER: 'composer',
});

const legacyTypeMap = Object.freeze({
  'follow-up': { kind: ConversationKind.QUESTION, variant: 'open' },
  progress: { kind: ConversationKind.RUN, variant: 'thinking', phase: ConversationPhase.RUNNING },
  'thinking-complete': { kind: ConversationKind.RUN, variant: 'thinking', phase: ConversationPhase.COMPLETED },
  execution: { kind: ConversationKind.RUN, variant: 'execution', phase: ConversationPhase.EXECUTING },
  'multi-select': { kind: ConversationKind.QUESTION, variant: 'multi-select' },
  'single-select': { kind: ConversationKind.QUESTION, variant: 'single-select' },
  form: { kind: ConversationKind.QUESTION, variant: 'form' },
  confirmation: { kind: ConversationKind.QUESTION, variant: 'confirmation' },
  status: { kind: ConversationKind.RECEIPT, variant: 'status', phase: ConversationPhase.COMPLETED },
  artifact: { kind: ConversationKind.ARTIFACT_PRESENTATION, variant: 'document' },
  images: { kind: ConversationKind.ARTIFACT_PRESENTATION, variant: 'image' },
  videos: { kind: ConversationKind.ARTIFACT_PRESENTATION, variant: 'video' },
});

function inferSemantics(message) {
  if (message.role === 'user') return { kind: ConversationKind.USER, variant: message.attachment ? 'attachment' : 'text' };
  if (message.type === 'text' || !message.type) return { kind: ConversationKind.ASSISTANT, variant: 'text' };
  return legacyTypeMap[message.type] || { kind: ConversationKind.ASSISTANT, variant: 'text' };
}

function inferPhase(message, semantics) {
  if (message.phase) return message.phase;
  if (semantics.phase) return semantics.phase;
  if (semantics.kind === ConversationKind.QUESTION) return ConversationPhase.PENDING;
  if (semantics.kind === ConversationKind.ARTIFACT_PRESENTATION) {
    if (message.statusTone === 'danger') return ConversationPhase.FAILED;
    if (message.statusTone === 'progress') return ConversationPhase.RUNNING;
    return ConversationPhase.COMPLETED;
  }
  return ConversationPhase.COMPLETED;
}

function inferPlacement(message, semantics, phase) {
  if (message.placement) return message.placement;
  return ConversationPlacement.FEED;
}

export function normalizeConversationNode(message) {
  const semantics = message.kind
    ? { kind: message.kind, variant: message.variant || 'default' }
    : inferSemantics(message);
  const phase = inferPhase(message, semantics);
  return {
    ...message,
    role: message.role || (semantics.kind === ConversationKind.USER ? 'user' : 'assistant'),
    kind: semantics.kind,
    variant: message.variant || semantics.variant,
    phase,
    placement: inferPlacement(message, semantics, phase),
    expanded: Boolean(message.expanded),
  };
}

export function normalizeConversationNodes(messages = []) {
  return messages.map(normalizeConversationNode);
}

export function validateConversationNode(input) {
  const node = normalizeConversationNode(input);
  const errors = [];
  if (!node.id) errors.push('Conversation nodes require a stable id.');
  if (node.kind === ConversationKind.QUESTION && !node.interactionId) node.interactionId = node.id;
  if (node.kind === ConversationKind.ARTIFACT_PRESENTATION && !node.artifactId && !node.artifactIds?.length && !node.items?.length) {
    errors.push(`Artifact presentation "${node.id}" requires artifactId or artifactIds.`);
  }
  return { node, errors };
}
