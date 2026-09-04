const streamEndpoint = 'GET /api/agent/runs/:runId/events';

const bindings = {
  UserMessage: {
    controller: 'sendMessage() / startScenario()',
    transport: 'HTTP',
    endpoint: 'POST /api/agent/tasks/:taskId/messages',
    event: 'message.accepted',
    trigger: '用户发送消息或提交附件',
    fields: [
      ['text', 'request.content.text', '原样传递'],
      ['attachment', 'request.attachments[]', '映射为商品或素材引用'],
    ],
    sample: { type: 'message.accepted', message_id: 'msg_01', role: 'user' },
  },
  AssistantText: {
    controller: 'runAgentStage() → outputIds',
    transport: 'SSE',
    endpoint: streamEndpoint,
    event: 'message.created',
    trigger: 'Agent 完成一个可展示的文本输出',
    fields: [
      ['text', 'event.message.content[]', '文本块合并或按段落展示'],
      ['role', 'event.message.role', '映射为 assistant'],
    ],
    sample: { type: 'message.created', message: { role: 'assistant', content: ['...'] } },
  },
  FollowUpMessage: {
    controller: 'runAgentStage() → interaction.required',
    transport: 'SSE',
    endpoint: streamEndpoint,
    event: 'interaction.required',
    trigger: 'Agent 判断继续执行前缺少必要信息',
    fields: [
      ['text', 'event.prompt', '追问说明'],
      ['questions', 'event.questions[]', '追问列表'],
      ['interactionId', 'event.interaction_id', '提交答案时回传'],
    ],
    sample: { type: 'interaction.required', interaction_id: 'int_01', mode: 'questions', questions: ['...'] },
  },
  ProgressMessage: {
    controller: 'runAgentStage() → progress',
    transport: 'SSE',
    endpoint: streamEndpoint,
    event: 'run.thinking.delta',
    trigger: 'Agent 进入思考或工具执行阶段',
    fields: [
      ['title', 'event.label', '缺省为“正在思考...”'],
      ['thought', 'event.summary', '展示可公开的思考摘要'],
      ['detail', 'event.eta_ms', '格式化为预计时长'],
      ['state', 'event.status', 'thinking / tool_running'],
    ],
    sample: { type: 'run.thinking.delta', status: 'thinking', label: '正在思考...', summary: '正在梳理大促节点', eta_ms: 10000 },
  },
  RunCompleteMessage: {
    controller: 'applyConversationEvent() → run.completed',
    transport: 'SSE',
    endpoint: streamEndpoint,
    event: 'run.thinking.completed',
    trigger: '本轮思考结束，准备输出消息或产物',
    fields: [
      ['detail', 'event.elapsed_ms', 'formatDuration()'],
      ['state', 'event.status', 'completed'],
    ],
    sample: { type: 'run.thinking.completed', status: 'completed', label: '思考结束', elapsed_ms: 18000 },
  },
  ExecutionMessage: {
    controller: 'applyConversationEvent() → run.executing / run.step.updated',
    transport: 'SSE',
    endpoint: streamEndpoint,
    event: 'run.execution.started / run.step.updated / run.completed',
    trigger: 'Agent 开始调用 Skill、工具或生成内容，并持续汇报执行步骤',
    fields: [
      ['title', 'event.label', '执行中的主状态文案'],
      ['steps', 'event.steps[]', '按 step_id 原位更新 running / completed / failed'],
      ['phase', 'event.status', 'executing / completed / failed'],
      ['expanded', 'view state', '执行中展开，完成后默认收起'],
    ],
    sample: { type: 'run.step.updated', run_id: 'run_03', step: { id: 'product-image', label: '商品图已生成', status: 'completed' } },
  },
  MultiSelectMessage: {
    controller: 'runAgentStage() → scenarioInteractions',
    transport: 'SSE + HTTP',
    endpoint: `${streamEndpoint}\nPOST /api/agent/interactions/:interactionId/submit`,
    event: 'interaction.required',
    trigger: 'Agent 需要用户从多个候选项中确认',
    fields: [
      ['prompt', 'event.prompt', '问题标题'],
      ['options', 'event.options[]', '多选项'],
      ['selected', 'response.selected[]', '提交选择结果'],
    ],
    sample: { type: 'interaction.required', mode: 'multi_select', options: ['双11节点', '春节/年货节'] },
  },
  SingleSelectMessage: {
    controller: 'runAgentStage() → scenarioInteractions',
    transport: 'SSE + HTTP',
    endpoint: `${streamEndpoint}\nPOST /api/agent/interactions/:interactionId/submit`,
    event: 'interaction.required',
    trigger: 'Agent 需要用户从互斥候选项中选择一个结果',
    fields: [
      ['prompt', 'event.prompt', '问题标题'],
      ['options', 'event.options[]', '单选项'],
      ['selected', 'response.selected', '提交所选项'],
    ],
    sample: { type: 'interaction.required', mode: 'single_select', options: ['方向1', '方向2', '方向3'] },
  },
  ConfirmationMessage: {
    controller: 'QuestionMessage() → confirm-choice',
    transport: 'SSE + HTTP',
    endpoint: `${streamEndpoint}\nPOST /api/agent/interactions/:interactionId/submit`,
    event: 'interaction.required',
    trigger: '继续执行、消耗积分或应用修改前需要二元确认',
    fields: [
      ['prompt', 'event.prompt', '会话中的确认提示'],
      ['cancelLabel', 'event.actions.secondary.label', '取消或补充信息'],
      ['confirmLabel', 'event.actions.primary.label', '确认操作'],
    ],
    sample: { type: 'interaction.required', mode: 'confirmation', prompt: '是否开始生成最终成片？' },
  },
  FormMessage: {
    controller: 'runAgentStage() → scenarioInteractions',
    transport: 'SSE + HTTP',
    endpoint: `${streamEndpoint}\nPOST /api/agent/interactions/:interactionId/submit`,
    event: 'interaction.required',
    trigger: 'Agent 需要一组结构化字段才能继续',
    fields: [
      ['prompt', 'event.prompt', '表单标题'],
      ['fields', 'event.schema.fields[]', '映射输入框或下拉选择'],
      ['submitLabel', 'event.actions.primary.label', '主行动点文案'],
    ],
    sample: { type: 'interaction.required', mode: 'form', schema: { fields: [{ key: 'duration', type: 'select' }] } },
  },
  StatusMessage: {
    controller: 'applyConversationEvent() → receipt.created',
    transport: 'SSE',
    endpoint: streamEndpoint,
    event: 'receipt.created',
    trigger: '任务或工具返回一条独立状态回执',
    fields: [
      ['text', 'event.summary', '回执内容'],
      ['icon', 'event.status', '根据状态映射图标'],
    ],
    sample: { type: 'receipt.created', status: 'completed', summary: '商品信息读取完成' },
  },
  AnsweredQuestionMessage: {
    controller: 'applyConversationEvent() → interaction.submitted',
    transport: 'HTTP response + local state transition',
    endpoint: 'POST /api/agent/interactions/:interactionId/submit',
    event: 'interaction.submitted',
    trigger: '用户提交追问、表单或确认操作后，原 QuestionMessage 原位更新为 answered',
    fields: [
      ['text', 'event.summary', '已确认内容摘要'],
      ['history', 'event.submission', '展开后展示历史选择或填写'],
      ['icon', 'event.status', '由状态映射图标，不直接传资源地址'],
    ],
    sample: { type: 'interaction.submitted', interaction_id: 'int_01', summary: '已确认投放节点', submission: { selected: ['双11节点'] } },
  },
  ArtifactCard: {
    controller: 'runAgentStage() → artifact output',
    transport: 'SSE',
    endpoint: streamEndpoint,
    event: 'artifact.created',
    trigger: 'Agent 生成可在工作台中打开的结构化产物',
    fields: [
      ['title', 'event.artifact.title', '产物标题'],
      ['status', 'event.artifact.status', '生成中 / 已生成 / 失败'],
      ['artifactType', 'event.artifact.type', '决定图标和详情渲染器'],
      ['artifactId', 'event.artifact.id', '打开工作台详情'],
    ],
    sample: { type: 'artifact.created', artifact: { id: 'art_01', type: 'document', status: 'generated', title: '需求分析' } },
  },
  ArtifactPresentation: {
    controller: 'ArtifactPresentation registry',
    transport: 'SSE + Artifact Store',
    endpoint: `${streamEndpoint}\nGET /api/agent/artifacts/:artifactId`,
    event: 'artifact.created / artifact.updated',
    trigger: '会话需要展示或引用一个已经进入产物流的产物',
    fields: [
      ['artifactId', 'message.artifact_id', '只保存关系，不复制产物内容'],
      ['variant', 'artifact.type', '选择文稿、图片、形象或视频展示器'],
      ['preview', 'artifact.preview_url', '媒体类型直接展示预览'],
    ],
    sample: { type: 'artifact.created', artifact: { id: 'art_01', type: 'video', preview_url: '...' } },
  },
  ImageList: {
    controller: 'runAgentStage() → media output',
    transport: 'SSE',
    endpoint: streamEndpoint,
    event: 'artifact.batch.created',
    trigger: 'Agent 一次生成一组图片产物',
    fields: [['items', 'event.artifacts[]', '筛选 type=image 后映射缩略图与 ID']],
    sample: { type: 'artifact.batch.created', artifacts: [{ id: 'img_01', type: 'image', preview_url: '...' }] },
  },
  VideoList: {
    controller: 'runAgentStage() → media output',
    transport: 'SSE',
    endpoint: streamEndpoint,
    event: 'artifact.batch.created',
    trigger: 'Agent 一次生成一组视频产物',
    fields: [['items', 'event.artifacts[]', '筛选 type=video 后映射标题、封面和 ID']],
    sample: { type: 'artifact.batch.created', artifacts: [{ id: 'vid_01', type: 'video', title: '推广成片1' }] },
  },
};

export function getConversationApiBinding(message, component, selectedSource) {
  const semanticAliases = {
    AssistantMessage: 'AssistantText',
    ReceiptMessage: 'StatusMessage',
    ArtifactMessage: 'ArtifactCard',
  };
  let bindingKey = semanticAliases[component] || component;
  if (component === 'RunMessage') {
    bindingKey = message.phase === 'completed'
      ? 'RunCompleteMessage'
      : message.phase === 'executing' ? 'ExecutionMessage' : 'ProgressMessage';
  }
  if (component === 'QuestionMessage') {
    if (message.phase === 'answered') bindingKey = 'AnsweredQuestionMessage';
    else if (message.variant === 'single-select') bindingKey = 'SingleSelectMessage';
    else if (message.variant === 'multi-select') bindingKey = 'MultiSelectMessage';
    else if (message.variant === 'form') bindingKey = 'FormMessage';
    else if (message.variant === 'confirmation') bindingKey = 'ConfirmationMessage';
    else bindingKey = 'FollowUpMessage';
  }
  if (component === 'ArtifactPresentation') bindingKey = 'ArtifactPresentation';
  const binding = bindings[bindingKey] || bindings.AssistantText;
  return {
    ...binding,
    mock: {
      mode: 'Mock',
      source: selectedSource || message.editorSource || `scenarioMessages.${message.id}`,
      module: 'src/demo-system/scenarios/luosifen.js',
      connected: false,
    },
  };
}
