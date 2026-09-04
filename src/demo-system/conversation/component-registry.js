import {
  ConversationKind,
  ConversationPhase,
  ConversationPlacement,
  normalizeConversationNode,
} from './model.js';

export const conversationComponentRegistry = Object.freeze({
  UserMessage: { kinds: [ConversationKind.USER], placement: ConversationPlacement.FEED },
  AssistantMessage: { kinds: [ConversationKind.ASSISTANT], placement: ConversationPlacement.FEED },
  RunMessage: { kinds: [ConversationKind.RUN], placement: ConversationPlacement.FEED },
  QuestionMessage: { kinds: [ConversationKind.QUESTION], placement: 'dynamic' },
  ReceiptMessage: { kinds: [ConversationKind.RECEIPT], placement: ConversationPlacement.FEED },
  ArtifactPresentation: { kinds: [ConversationKind.ARTIFACT_PRESENTATION], placement: ConversationPlacement.FEED },
});

function questionRenderer(node) {
  if (node.phase === ConversationPhase.ANSWERED) return 'AnsweredQuestionMessage';
  if (node.variant === 'confirmation') return 'ConfirmationMessage';
  if (node.variant === 'multi-select') return 'MultiSelectMessage';
  if (node.variant === 'single-select') return 'SingleSelectMessage';
  if (node.variant === 'form') return 'FormMessage';
  return 'FollowUpMessage';
}

function runRenderer(node) {
  if (node.phase === ConversationPhase.COMPLETED || node.phase === ConversationPhase.FAILED) return 'RunCompleteMessage';
  if (node.phase === ConversationPhase.EXECUTING) return 'ExecutionMessage';
  return 'ProgressMessage';
}

function artifactPresentationRenderer(node) {
  if (node.variant === 'video') return 'VideoArtifactPresentation';
  if (node.variant === 'character') return 'CharacterArtifactPresentation';
  if (node.variant === 'image') return 'ImageArtifactPresentation';
  return 'DocumentArtifactPresentation';
}

export function resolveConversationPresentation(input) {
  const node = normalizeConversationNode(input);
  if (node.kind === ConversationKind.USER) return { node, component: 'UserMessage', renderer: 'UserMessage', placement: node.placement };
  if (node.kind === ConversationKind.ASSISTANT) return { node, component: 'AssistantMessage', renderer: 'AssistantText', placement: node.placement };
  if (node.kind === ConversationKind.RUN) return { node, component: 'RunMessage', renderer: runRenderer(node), placement: node.placement };
  if (node.kind === ConversationKind.QUESTION) return { node, component: 'QuestionMessage', renderer: questionRenderer(node), placement: node.placement };
  if (node.kind === ConversationKind.RECEIPT) return { node, component: 'ReceiptMessage', renderer: 'StatusMessage', placement: node.placement };
  if (node.kind === ConversationKind.ARTIFACT_PRESENTATION) {
    return { node, component: 'ArtifactPresentation', renderer: artifactPresentationRenderer(node), placement: node.placement };
  }
  return { node, component: 'AssistantMessage', renderer: 'AssistantText', placement: ConversationPlacement.FEED };
}

export function getFeedMessages(messages = []) {
  return messages.filter((message) => resolveConversationPresentation(message).placement === ConversationPlacement.FEED);
}

export function getActiveComposerQuestion(messages = []) {
  return [...messages].reverse().map(resolveConversationPresentation).find(({ node, placement }) => (
    placement === ConversationPlacement.COMPOSER && node.phase === ConversationPhase.PENDING
  ))?.node || null;
}
