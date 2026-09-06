import { createArtifactWorkspace } from '../artifacts/model.js?v=20260906b';
import { migrateInput } from '../composer/model.js?v=20260906b';
import { phasesAfterRun } from '../scenarios/decisions.js?v=20260906b';

export const TASK_STORAGE_KEY = 'agent2-tasks-v1';
const fields = ['taskId', 'projectTitle', 'taskMode', 'messages', 'artifacts', 'scenarioStage', 'workflow', 'pendingRunSpec', 'draft', 'input', 'request', 'attachment', 'product', 'settings', 'artifactWorkspace', 'pendingRun', 'selectedSkill', 'artifactDraft', 'selectedActorIndex', 'questionDrafts'];

export function createTask(overrides = {}) {
  return {
    taskId: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    projectTitle: '新的项目', taskMode: 'new', messages: [], artifacts: [], scenarioStage: 0,
    draft: '', attachment: null, product: null, selectedSkill: null, pendingRun: null,
    settings: { duration: 20, ratio: '9:16', watermark: true },
    artifactWorkspace: createArtifactWorkspace(), artifactDraft: null,
    selectedActorIndex: 0, questionDrafts: {},
    ...overrides,
    input: migrateInput(overrides),
    workflow: overrides.workflow || { phase: phasesAfterRun[overrides.scenarioStage] || 'new' },
  };
}

export function snapshotTask(state) {
  return structuredClone(Object.fromEntries(fields.map((key) => [key, state[key]])));
}

export function upsertTask(tasks, task) {
  return [structuredClone(task), ...tasks.filter((item) => item.taskId !== task.taskId)];
}

export function readTasks(storage) {
  try {
    const data = JSON.parse(storage.getItem(TASK_STORAGE_KEY) || '{}');
    if (data.version !== 1 || !Array.isArray(data.tasks)) return { tasks: [], activeId: null };
    return { tasks: data.tasks.filter(isTask).map((task) => createTask(task)), activeId: data.activeId };
  } catch { return { tasks: [], activeId: null }; }
}

export function isTask(task) {
  return task && typeof task.taskId === 'string' && typeof task.projectTitle === 'string'
    && Array.isArray(task.messages) && Array.isArray(task.artifacts);
}

export function saveTasks(storage, tasks, activeId) {
  storage.setItem(TASK_STORAGE_KEY, JSON.stringify({ version: 1, tasks, activeId }));
}

export function commitArtifactEdit(artifact, draft, now = new Date().toISOString()) {
  const { history, ...previous } = artifact;
  return { ...artifact, ...structuredClone(draft), id: artifact.id,
    revision: (artifact.revision || 1) + 1, updatedAt: now,
    history: [...(history || []), previous].slice(-20) };
}
