import test from 'node:test';
import assert from 'node:assert/strict';
import { createExecutionTimeline, executionFrame } from '../src/demo-system/conversation/simulation.js';
import { scenarioRuns } from '../src/demo-system/scenarios/luosifen.js';
import { applyConversationEvent, ConversationEvent } from '../src/demo-system/conversation/runtime.js';
import { Composer } from '../src/demo-system/components/composer.js';
import { SkillChoices } from '../src/demo-system/components/task-dialogs.js';
import { createInput } from '../src/demo-system/composer/model.js';

test('thinking-only runs never expose execution blocks', () => {
  assert.deepEqual(createExecutionTimeline(scenarioRuns[1]), []);
});

test('execution text streams before sequential steps complete in place', () => {
  const timeline = createExecutionTimeline(scenarioRuns[3]);
  assert.deepEqual(executionFrame(timeline, 0).blocks, []);
  for (const item of timeline) {
    const frame = executionFrame(timeline, (item.startMs + item.endMs) / 2);
    assert.equal(frame.blocks.length, timeline.indexOf(item) + 1);
    if (item.block.type === 'text') {
      assert.ok(frame.blocks.at(-1).text.length > 0);
      assert.ok(frame.blocks.at(-1).text.length < item.block.text.length);
      assert.equal(frame.blocks.at(-1).streaming, true);
    } else {
      assert.equal(frame.blocks.at(-1).phase, 'running');
      assert.ok(frame.blocks.slice(0, -1).filter((block) => block.type !== 'text').every((block) => block.phase === 'completed'));
    }
  }
  assert.deepEqual(executionFrame(timeline, Infinity).blocks.filter((block) => block.type !== 'text').map((block) => block.label), scenarioRuns[3].execution.completedSteps.map((step) => step.label));
});

test('interleaved video explanations and tool steps keep source order', () => {
  const timeline = createExecutionTimeline(scenarioRuns[8]);
  const finished = executionFrame(timeline, Infinity).blocks;
  assert.deepEqual(finished.map((block) => block.type), scenarioRuns[8].execution.blocks.map((block) => block.type));
  assert.deepEqual(finished.filter((block) => block.type === 'text').map((block) => block.text), scenarioRuns[8].execution.blocks.filter((block) => block.type === 'text').map((block) => block.text));
  assert.ok(timeline.at(-1).endMs <= 9601);
});

test('incremental execution frames update the same Run without adding outputs', () => {
  let messages = applyConversationEvent([], { type: ConversationEvent.RUN_STARTED, runId: 3 });
  messages = applyConversationEvent(messages, { type: ConversationEvent.TOOL_STARTED, runId: 3 });
  const timeline = createExecutionTimeline(scenarioRuns[3]);
  for (let ms = 3000; ms <= 10000; ms += 100) {
    messages = applyConversationEvent(messages, { type: ConversationEvent.UPDATE, id: 'run-3', patch: executionFrame(timeline, ms) });
    assert.equal(messages.length, 1);
    assert.equal(messages[0].id, 'run-3');
    assert.ok(messages[0].blocks.filter((block) => block.type !== 'text' && block.phase === 'running').length <= 1);
  }
});

test('placeholder state is explicit and the recommendation rail has no all-skills entry', () => {
  assert.match(Composer({ input: createInput() }), /data-empty="true"/);
  const input = createInput();
  input.parts = [{ id: 'text', type: 'text', text: '不用了' }];
  assert.match(Composer({ input }), /data-empty="false"/);
  assert.doesNotMatch(SkillChoices(), /全部技能|open-skills/);
});
