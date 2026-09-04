import { ConversationEvent } from './runtime.js';

const interactionVariants = Object.freeze({
  questions: 'open',
  open: 'open',
  single_select: 'single-select',
  multi_select: 'multi-select',
  form: 'form',
  confirmation: 'confirmation',
});

function append(node) {
  return { type: ConversationEvent.APPEND, node };
}

export function inferInteractionVariant(event) {
  if (interactionVariants[event.mode]) return interactionVariants[event.mode];
  if (event.requires_confirmation || (event.actions?.primary && event.actions?.secondary && !event.options && !event.schema)) return 'confirmation';
  if (event.schema?.fields?.length) return 'form';
  if (event.options?.length) return event.multiple ? 'multi-select' : 'single-select';
  return 'open';
}

function interactionNode(event) {
  const variant = inferInteractionVariant(event);
  return {
    id: event.interaction_id,
    interactionId: event.interaction_id,
    role: 'assistant',
    kind: 'agent-question',
    variant,
    phase: 'pending',
    placement: 'feed',
    text: event.text,
    questions: event.questions,
    prompt: event.prompt,
    options: event.options,
    fields: event.schema?.fields,
    cancelLabel: event.actions?.secondary?.label,
    confirmLabel: event.actions?.primary?.label,
    submitLabel: event.actions?.primary?.label,
  };
}

export function toConversationRuntimeEvent(event) {
  if (event.type === 'message.delta') {
    return {
      type: ConversationEvent.ASSISTANT_STREAM_DELTA,
      id: event.message_id,
      delta: event.content?.text || event.delta || '',
    };
  }

  if (event.type === 'message.completed') {
    return {
      type: ConversationEvent.ASSISTANT_STREAM_COMPLETED,
      id: event.message_id,
      text: event.content?.text || event.content || '',
    };
  }

  if (event.type === 'message.accepted' || event.type === 'message.created') {
    if (event.type === 'message.created' && (event.role || event.message?.role) === 'assistant') {
      return {
        type: ConversationEvent.ASSISTANT_STREAM_STARTED,
        id: event.message_id || event.message?.id,
        node: {
          id: event.message_id || event.message?.id,
          role: 'assistant',
          kind: 'assistant-message',
          variant: 'text',
        },
        text: event.content?.text || event.message?.content || '',
      };
    }
    return append({
      id: event.message_id || event.message?.id,
      role: event.role || event.message?.role,
      kind: (event.role || event.message?.role) === 'user' ? 'user-message' : 'assistant-message',
      variant: event.attachments?.length ? 'attachment' : 'text',
      text: event.content?.text || event.message?.content,
      attachment: event.attachments?.[0],
    });
  }

  if (event.type === 'run.started' || event.type === 'run.thinking.started') {
    return {
      type: ConversationEvent.RUN_STARTED,
      runId: event.run_id,
      title: event.label,
      detail: event.eta,
      thought: event.summary,
      steps: event.steps,
    };
  }

  if (event.type === 'tool.started' || event.type === 'skill.started' || event.type === 'run.execution.started') {
    return {
      type: ConversationEvent.TOOL_STARTED,
      runId: event.run_id,
      title: event.label,
      detail: event.elapsed,
      thought: event.summary,
      steps: event.steps,
      blocks: event.blocks,
    };
  }

  if (event.type === 'run.step.updated') {
    return {
      type: ConversationEvent.STEP_UPDATED,
      runId: event.run_id,
      step: { ...event.step, phase: event.step.phase || event.step.status },
    };
  }

  if (event.type === 'run.completed' || event.type === 'run.failed') {
    return {
      type: event.type === 'run.failed' ? ConversationEvent.RUN_FAILED : ConversationEvent.RUN_COMPLETED,
      runId: event.run_id,
      title: event.label,
      detail: event.elapsed,
    };
  }

  if (event.type === 'interaction.required') return append(interactionNode(event));

  if (event.type === 'interaction.submitted') {
    return {
      type: ConversationEvent.INTERACTION_SUBMITTED,
      questionId: event.interaction_id,
      answer: event.submission,
      summary: event.summary,
      history: event.history,
      userText: event.user_text || '我已确认',
      userMessageId: event.user_message_id,
    };
  }

  if (event.type === 'artifact.created') {
    return append({
      id: event.message_id || `artifact-${event.artifact.id}`,
      role: 'assistant',
      kind: 'artifact-presentation',
      variant: event.artifact.type === 'document' ? 'document' : event.artifact.type,
      artifactId: event.artifact.id,
    });
  }

  if (event.type === 'artifact.batch.created') {
    const mediaType = event.media_type || event.artifacts?.[0]?.type || 'image';
    return append({
      id: event.message_id || `media-${event.batch_id}`,
      role: 'assistant',
      kind: 'artifact-presentation',
      variant: mediaType === 'actor' ? 'character' : mediaType,
      artifactIds: (event.artifacts || []).map((item) => item.id),
    });
  }

  if (event.type === 'status.created') {
    return append({
      id: event.message_id,
      role: 'assistant',
      kind: 'interaction-receipt',
      variant: 'status',
      text: event.summary,
      history: event.history,
    });
  }

  return null;
}
