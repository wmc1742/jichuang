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
  return `用时 ${Math.max(0, Math.floor(Number(elapsedSeconds) || 0))} 秒`;
}
