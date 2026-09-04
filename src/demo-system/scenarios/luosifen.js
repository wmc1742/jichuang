import { media } from '../data/assets.js';

export const project = {
  id: 'luosifen-campaign',
  title: '即创螺蛳粉',
  product: { title: '即创螺蛳粉', thumbnail: media.product },
};

export const scenarioArtifacts = [
  { id: 'requirements-analysis', type: 'document', title: '即创螺蛳粉大促视频需求分析', status: 'generated', statusLabel: '已生成', createdAt: '2月5日 17:42' },
  { id: 'creative-storyboard', type: 'document', title: '即创螺蛳粉大促视频创意分镜', status: 'generated', statusLabel: '已生成', createdAt: '2月5日 17:42' },
  ...media.conversationActors.slice(0, 3).map((previewUrl, index) => ({ id: `character-${index + 1}`, type: 'character', title: `形象${index + 1}`, status: 'generated', previewUrl })),
  ...Array.from({ length: 5 }, (_, index) => ({
    id: `campaign-video-${index + 1}`,
    type: 'video',
    title: `推广大促成片${index + 1}`,
    status: 'generated',
    previewUrl: media.conversationVideos[index % media.conversationVideos.length],
  })),
];

const campaignQuestion = {
  id: 'campaign-selection', role: 'assistant', kind: 'agent-question', variant: 'multi-select', phase: 'pending', placement: 'feed',
  prompt: '视频用于哪类大促投放',
  options: ['双11节点', '圣诞/元旦跨年', '春节/年货节', '以上全部'],
  allowCustom: false,
  submitLabel: '确定',
};

const characterConfirmation = {
  id: 'character-confirmation', role: 'assistant', kind: 'agent-question', variant: 'confirmation', phase: 'pending', placement: 'feed',
  prompt: '是否将形象1用在创意分镜中', cancelLabel: '取消', confirmLabel: '确认',
};

const videoConfirmation = {
  id: 'video-confirmation', role: 'assistant', kind: 'agent-question', variant: 'confirmation', phase: 'pending', placement: 'feed',
  prompt: '是否开始生成最终成片，预计消耗100积分', cancelLabel: '取消', confirmLabel: '确认', credit: '≈100',
};

const messages = [
  { id: 'request', role: 'user', type: 'text', text: '根据 {attachment} 为我生成用于大促推广的视频', attachment: project.product },
  { id: 'welcome', role: 'assistant', type: 'text', text: '好的！没问题，生成用于大促的推广视频我最擅长了～' },
  { id: 'campaign-question-copy', role: 'assistant', type: 'text', text: '为了生成更符合要求的视频，我需要了解你希望在什么时候投放视频。' },
  campaignQuestion,
  { id: 'requirements-summary', role: 'assistant', type: 'text', text: '我针对双11节点和春节/年货节大促活动的特点不同，并结合要推广的产品特征，分析了一下大促视频的要点及需求，你看需不需要补充。' },
  { id: 'requirements-presentation', role: 'assistant', kind: 'artifact-presentation', variant: 'document', artifactId: 'requirements-analysis' },
  { id: 'storyboard-summary', role: 'assistant', type: 'text', text: '我已经根据商品信息，生成了我觉得合适的主角，并完成了创意分镜。' },
  { id: 'storyboard-presentation', role: 'assistant', kind: 'artifact-presentation', variant: 'document', artifactId: 'creative-storyboard' },
  { id: 'characters-summary', role: 'assistant', type: 'text', text: '生成了三个形象，你看哪个比较好。' },
  { id: 'characters-presentation', role: 'assistant', kind: 'artifact-presentation', variant: 'character', artifactIds: ['character-1', 'character-2', 'character-3'] },
  { id: 'character-confirm-copy', role: 'assistant', type: 'text', text: '需要将第一个替换进创意分镜吗' },
  characterConfirmation,
  { id: 'character-replaced', role: 'assistant', type: 'text', text: '形象已替换，现在创意分镜还有需要修改的地方吗？' },
  { id: 'video-suggestion', role: 'assistant', type: 'text', text: '接下来，我建议可以直接产出成片，看看最终效果是否符合预期，如果有需要调整还可以交给我修改。' },
  videoConfirmation,
  { id: 'videos-summary', role: 'assistant', type: 'text', text: '最终生成了5条大促推广视频，运用了资产库中已上传的商品素材，并生成了一些特殊的剧情和画面。看看怎么样，如果需要修改可以随时告诉我。' },
  { id: 'videos-presentation', role: 'assistant', kind: 'artifact-presentation', variant: 'video', artifactIds: Array.from({ length: 5 }, (_, index) => `campaign-video-${index + 1}`) },
];

export const scenarioMessages = messages;
const messageById = new Map(messages.map((message) => [message.id, message]));

export function getScenarioMessage(id) {
  const message = messageById.get(id);
  return message ? structuredClone(message) : null;
}

const completed = (id, label) => ({ id, label, phase: 'completed' });

export const scenarioRuns = Object.freeze({
  1: { thinking: { title: '正在思考···' }, simulation: { durationSeconds: 5 }, elapsed: '用时5s', outputIds: ['campaign-question-copy', 'campaign-selection'] },
  2: {
    thinking: { title: '正在思考···' }, simulation: { durationSeconds: 10, executionStartSecond: 4 }, elapsed: '用时3m20s',
    execution: {
      title: '开始执行···', detail: '1m30s',
      thought: '根据双11节点和春节/年货节期间大促活动的特点不同，消费者心理特征也有所差异，所以视频突出的内容也应该有所侧重，接下来我会先深入分析成片诉求。',
      steps: [{ id: 'requirements', label: '正在进行需求分析', phase: 'running' }],
      completedSteps: [completed('requirements', '需求分析已完成')],
    },
    outputIds: ['requirements-summary', 'requirements-presentation'],
  },
  3: {
    thinking: { title: '正在思考···' }, simulation: { durationSeconds: 10, executionStartSecond: 3 }, elapsed: '用时4m12s',
    execution: {
      title: '开始执行···', detail: '1m30s',
      thought: '好的，这份需求分析看来是比较准确的。接下来我会根据需求分析中的内容，先出几个创意分镜，这样可以进一步直观的校准最终的视频。',
      steps: [
        { id: 'product-image', label: '正在生成商品图', phase: 'running' },
        { id: 'concept', label: '正在进行创意发散', phase: 'running' },
        { id: 'character', label: '正在创建主角', phase: 'running' },
        { id: 'storyboard', label: '正在生成分镜', phase: 'running' },
      ],
      completedSteps: [completed('product-image', '商品图已生成'), completed('concept', '创意发散已完成'), completed('character', '主角已创建'), completed('storyboard', '分镜已生成')],
    },
    outputIds: ['storyboard-summary', 'storyboard-presentation'],
  },
  4: {
    thinking: { title: '正在思考···' }, simulation: { durationSeconds: 10, executionStartSecond: 4 }, elapsed: '用时1m2s',
    execution: {
      title: '开始执行···', detail: '30s', thought: '没问题，现在的主角形象确实有些老气，我生成几个年轻的面孔。',
      steps: [{ id: 'characters', label: '正在生成商品图', phase: 'running' }],
      completedSteps: [completed('characters', '商品图已生成')],
    },
    outputIds: ['characters-summary', 'characters-presentation'],
  },
  5: { thinking: { title: '正在思考···' }, simulation: { durationSeconds: 10 }, elapsed: '用时12s', outputIds: ['character-confirm-copy', 'character-confirmation'] },
  6: {
    thinking: { title: '正在思考···' }, simulation: { durationSeconds: 10, executionStartSecond: 4 }, elapsed: '用时20s',
    execution: {
      title: '开始执行···', detail: '1m30s',
      steps: [{ id: 'character-update', label: '正在重新优化主角', phase: 'running' }],
      completedSteps: [completed('character-update', '主角形象已优化')],
    },
    outputIds: ['character-replaced'],
  },
  7: { thinking: { title: '正在思考···' }, simulation: { durationSeconds: 5 }, elapsed: '用时5s', outputIds: ['video-suggestion', 'video-confirmation'] },
  8: {
    thinking: { title: '正在思考···' }, simulation: { durationSeconds: 10, executionStartSecond: 3 }, elapsed: '用时9m12s',
    execution: {
      title: '开始执行···', detail: '1m30s',
      blocks: [
        { type: 'text', text: '我会先根据分镜脚本生成缺少的素材。' },
        { type: 'step', id: 'clips', label: '正在生成视频片段', phase: 'running' },
        { type: 'text', text: '我发现资产库中，又许多和商品相关的素材，我会使用其中合适的素材用到我们的最终成片里。' },
        { type: 'step', id: 'assets', label: '正在提取商品素材', phase: 'running' },
        { type: 'step', id: 'compose', label: '正在合成视频', phase: 'running' },
        { type: 'text', text: '最终成片已生成，我先预览一遍，在需要强化的地方增加合适的包装，让整体视频看起来更加有吸引力。' },
        { type: 'step', id: 'preview', label: '正在预览视频', phase: 'running' },
        { type: 'step', id: 'packaging', label: '增加包装元素', phase: 'running' },
      ],
      completedBlocks: [
        { type: 'text', text: '我会先根据分镜脚本生成缺少的素材。' },
        { type: 'step', id: 'clips', label: '视频片段已生成', phase: 'completed' },
        { type: 'text', text: '我发现资产库中，又许多和商品相关的素材，我会使用其中合适的素材用到我们的最终成片里。' },
        { type: 'step', id: 'assets', label: '商品素材已提取', phase: 'completed' },
        { type: 'step', id: 'compose', label: '视频已合成', phase: 'completed' },
        { type: 'text', text: '最终成片已生成，我先预览一遍，在需要强化的地方增加合适的包装，让整体视频看起来更加有吸引力。' },
        { type: 'step', id: 'preview', label: '已完成预览', phase: 'completed' },
        { type: 'step', id: 'packaging', label: '包装已增加', phase: 'completed' },
      ],
    },
    outputIds: ['videos-summary', 'videos-presentation'],
  },
});

export const scenarioInteractions = Object.freeze({
  'campaign-selection': {
    nextRun: 2,
    summary: '已确认：视频用于双11节点、春节/年货节',
    history: { type: 'multi-select', prompt: '视频用于哪类大促投放', options: campaignQuestion.options, selected: [0, 2] },
  },
  'character-confirmation': {
    nextRun: 6,
    summary: '已确认：将形象1用在创意分镜',
    history: { type: 'confirmation', prompt: characterConfirmation.prompt, value: '确认' },
  },
  'video-confirmation': {
    nextRun: 8,
    summary: '已确认：开始最终成片',
    history: { type: 'confirmation', prompt: videoConfirmation.prompt, value: '确认' },
  },
});

export const implicitInteractionByRun = Object.freeze({});

function run(id, { variant = 'thinking', thought = '', steps = [], blocks = [] } = {}) {
  return {
    id: `run-${id}`, runId: id, role: 'assistant', kind: 'agent-run', variant, phase: 'completed',
    detail: scenarioRuns[id].elapsed, thought, steps, blocks, expanded: false, editorSource: `scenarioRuns.${id}`,
  };
}

function answered(question, interactionId) {
  const interaction = scenarioInteractions[interactionId];
  return { ...question, phase: 'answered', text: interaction.summary, history: interaction.history, expanded: false };
}

const user = (id, text) => ({ id, role: 'user', type: 'text', text });

export const completedScenarioMessages = [
  getScenarioMessage('request'), getScenarioMessage('welcome'), run(1), getScenarioMessage('campaign-question-copy'),
  answered(campaignQuestion, 'campaign-selection'), user('campaign-selection-answer', '我已确认'),
  run(2, { variant: 'execution', thought: scenarioRuns[2].execution.thought, steps: scenarioRuns[2].execution.completedSteps }),
  getScenarioMessage('requirements-summary'), getScenarioMessage('requirements-presentation'), user('requirements-feedback', '不用，挺好'),
  run(3, { variant: 'execution', thought: scenarioRuns[3].execution.thought, steps: scenarioRuns[3].execution.completedSteps }),
  getScenarioMessage('storyboard-summary'), getScenarioMessage('storyboard-presentation'), user('character-revision-request', '这个主角有点老了，给我改几个年轻有活力的。'),
  run(4, { variant: 'execution', thought: scenarioRuns[4].execution.thought, steps: scenarioRuns[4].execution.completedSteps }),
  getScenarioMessage('characters-summary'), getScenarioMessage('characters-presentation'), user('character-choice', '第一个比较好'),
  run(5), getScenarioMessage('character-confirm-copy'), answered(characterConfirmation, 'character-confirmation'), user('character-confirmation-answer', '我已确认'),
  run(6, { variant: 'execution', steps: scenarioRuns[6].execution.completedSteps }), getScenarioMessage('character-replaced'), user('storyboard-finished', '没有了继续'),
  run(7), getScenarioMessage('video-suggestion'), answered(videoConfirmation, 'video-confirmation'), user('video-confirmation-answer', '我已确认'),
  run(8, { variant: 'execution', blocks: scenarioRuns[8].execution.completedBlocks }), getScenarioMessage('videos-summary'), getScenarioMessage('videos-presentation'),
].filter(Boolean);

export const confirmationScenarioMessages = completedScenarioMessages;

export const artifactGroups = {
  document: scenarioArtifacts.filter((artifact) => artifact.type === 'document'),
  video: [{ id: 'campaign-videos', title: '大促推广成片', timestamp: '2月5日 17:42', items: scenarioArtifacts.filter((artifact) => artifact.type === 'video').map((artifact) => ({ id: artifact.id, title: artifact.title, src: artifact.previewUrl })) }],
  image: [],
  actor: [{ id: 'young-characters', title: '年轻活力形象', timestamp: '2月5日 17:42', items: scenarioArtifacts.filter((artifact) => artifact.type === 'character').map((artifact) => artifact.previewUrl) }],
};
