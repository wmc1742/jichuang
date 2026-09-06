const DEFAULT_SHORT_SECONDS = 5;
const DEFAULT_LONG_SECONDS = 10;

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : fallback;
}

export function getRunSimulationPlan(run = {}) {
  const fallbackDuration = /m|minute|分/.test(run.elapsed || '') ? DEFAULT_LONG_SECONDS : DEFAULT_SHORT_SECONDS;
  const durationSeconds = positiveInteger(run.simulation?.durationSeconds, fallbackDuration);
  if (!run.execution) return { durationSeconds, events: [] };

  const fallbackStart = Math.max(1, Math.floor(durationSeconds * 0.35));
  const requestedStart = positiveInteger(run.simulation?.toolStartSecond, fallbackStart);
  return {
    durationSeconds,
    events: [{
      type: 'tool.started',
      atSecond: Math.min(requestedStart, Math.max(1, durationSeconds - 1)),
    }],
  };
}

export function formatLiveElapsed(elapsedSeconds) {
  return `${Math.max(0, Math.floor(Number(elapsedSeconds) || 0))} 秒`;
}

export function createExecutionTimeline(run) {
  if (!run.execution) return [];
  const plan = getRunSimulationPlan(run);
  const execution = run.execution;
  const blocks = execution.blocks?.length ? execution.blocks : [
    ...(execution.thought ? [{ type: 'text', text: execution.thought }] : []),
    ...(execution.steps || []).map((step) => ({ ...step, type: 'step' })),
  ];
  const completed = execution.completedBlocks || execution.completedSteps || [];
  const weights = blocks.map((block) => block.type === 'text' ? Math.max(350, Array.from(block.text || '').length * 40) : 1000);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let startMs = plan.events[0].atSecond * 1000;
  // Reserve a short final hold so the last completed step is visible before collapse.
  const availableMs = Math.max(1, plan.durationSeconds * 1000 - startMs - 400);
  return blocks.map((block, index) => {
    const endMs = startMs + availableMs * weights[index] / totalWeight;
    const item = { block, completed: completed.find((item) => item.id && item.id === block.id), startMs, endMs };
    startMs = endMs;
    return item;
  });
}

export function executionFrame(timeline, elapsedMs) {
  const blocks = timeline.filter((item) => elapsedMs >= item.startMs).map((item) => {
    const finished = elapsedMs >= item.endMs;
    if (item.block.type !== 'text') return { ...item.block, ...(finished ? item.completed : {}), phase: finished ? 'completed' : 'running' };
    const characters = Array.from(item.block.text || '');
    const progress = Math.min(1, Math.max(0, (elapsedMs - item.startMs) / (item.endMs - item.startMs)));
    return { ...item.block, text: characters.slice(0, Math.floor(characters.length * progress)).join(''), streaming: !finished };
  });
  return { thought: '', steps: [], blocks };
}
