# Agent 2.0 会话模型

## 会话 1.0 基线

`conversation-v1.0` 是 2026-09-04 确认的会话基线。后续评审与修改默认以该版本为参照，使用“保留、修改、新增、删除”描述相对变化，不再回退到更早的会话实现。

该基线包含：会话消息类型与状态机、用户确认时序、思考与执行的连续 Run、真实时间模拟、AI 正文流式输出、16px AI 正文字号、追问历史展开、会话内产物展示，以及组件可视化编辑与 API 契约查看。

该基线不代表任务管理和产物工作台已经定版。会话中的 `ArtifactPresentation` 仅定义了产物在消息流中的展示与引用关系；进入产物列表、详情、编辑、引用回会话等跨页面行为，需要与后续产物页基线共同确定。

验收地址：`https://wmc1742.github.io/jichuang/?view=conversation&v=20260904j`

## 产品边界

一个 Task 同时拥有 Conversation 与 Artifact Store。二者是同一任务下的平级内容域：

```text
Task
  |- Conversation Timeline
  `- Artifact Store
```

会话中的产物展示不是产物本体，而是 `ArtifactPresentation`。消息只保存 `artifactId` 或 `artifactIds`，再从 Artifact Store 读取标题、状态、预览图和详情。文稿使用引用卡；形象使用图片列表；视频使用视频预览列表。

当前只实现会话纵切。任务与产物页已登记 Figma Section 和数据边界，但不在本轮扩写页面能力。

## 稳定节点

时间线节点统一包含：

```text
id + kind + variant + phase + placement + payload
```

- `kind` 决定业务组件。
- `variant` 决定同类组件的交互形式。
- `phase` 决定实例当前状态。
- `placement` 决定展示位置；当前会话节点均在 feed。
- 同一个 Run、追问或执行步骤始终保留同一个 ID。状态变化使用更新，不能追加一个相似的新节点。

## 组件调用

| 业务语义 | 业务组件 | 状态与渲染 |
| --- | --- | --- |
| 用户输入或操作回答 | `UserMessage` | 纯文本、带商品附件、“我已确认” |
| AI 正文回复 | `AssistantMessage` | 单段或多段正文 |
| Agent 思考与执行 | `RunMessage` | `thinking/running`、`execution/executing`、`completed` |
| AI 追问 | `QuestionMessage` | `single-select`、`multi-select`、`form`、`confirmation`、`answered` |
| 独立系统回执 | `ReceiptMessage` | 不属于 Run 或追问生命周期的状态 |
| 会话中的产物投影 | `ArtifactPresentation` | `document`、`image`、`character`、`video` |

`AnsweredQuestionMessage`、`StatusMessage` 和 `RunCompleteMessage` 是渲染状态，不是新的业务消息类型。其中已回答的 `QuestionMessage` 必须继续由 `AnsweredQuestionMessage` 渲染，不能降级成独立回执 `StatusMessage`。

AI 正文统一使用 16px，并通过稳定的 `AssistantMessage` 实例流式更新：`message.created` 创建空消息，`message.delta` 持续追加可见文本，`message.completed` 结束光标并进入完成态。追问、表单、产物和媒体不是文本流，必须等前一条正文输出完成后再按事件顺序出现。

演示运行中，`RunMessage` 同时保留两组时间：`simulation.durationSeconds` 控制真实等待与逐秒计时，`elapsed` 保留任务完成后的业务耗时文案。计时事件只更新时间，不能改变 Run 状态。有执行阶段的 Run 由 Mock 事件表在 `simulation.toolStartSecond` 发出 `tool.started`，同一个 Run 才从思考切换到执行；没有 Skill/Tool 调用的 Run 不会出现执行态。

## 状态规则

### Run

```text
run.started
  -> 同一 RunMessage: thinking / running
tool.started / skill.started（可选，仅真实调用 Skill/Tool 时）
  -> 同一 RunMessage: execution / executing
run.completed
  -> 同一 RunMessage: completed / collapsed
```

- 完成态默认折叠为用时。
- 思考中和执行中都显示同一条连续计时，状态切换时不清零。
- 简单回复或追问走 `thinking -> completed -> AssistantMessage/QuestionMessage`，不经过执行态。
- 只有生成、分析等 Skill/Tool 已经开始时，才走 `thinking -> executing -> completed -> ArtifactPresentation/AssistantMessage`。
- 点击可展开该 Run 的思考摘要和已完成步骤。
- “思考中”和“思考完成”不能作为两条相邻消息同时存在。
- 执行步骤按 `step.id` 原位从 running 更新为 completed 或 failed。

### 追问

```text
QuestionMessage(id=Q, phase=pending)
  -> interaction.submitted
QuestionMessage(id=Q, phase=answered, expanded=false)
  -> append UserMessage("我已确认")
  -> run.started
```

- 未回答时展示完整控件。
- 回答后原追问原位收起，不新增一条“已确认状态”。
- 点击摘要可展开只读历史选择。
- 提交多选、表单或点击确认后都新增用户气泡“我已确认”。
- 新一轮 Run 必须在该用户消息之后。
- 是否允许自定义选项由追问实例的 `allowCustom` 明确声明，组件不能擅自补充。

### 产物

```text
run.completed
  -> AssistantMessage（说明完成内容）
  -> ArtifactPresentation（引用 Artifact Store）
```

- 文稿点击后打开独立产物工作台；关闭后回到原会话和原状态。
- 形象和图片在会话中直接展示缩略图。
- 视频在会话中直接展示视频预览。
- `ArtifactPresentation` 不复制产物标题、媒体 URL 或详情内容。

## 最新螺蛳粉场景

最新 `2·会话` 由 32 个稳定节点组成：

1. 用户带商品附件提出大促视频需求。
2. AI 欢迎回复；Run 1 完成；AI 询问投放节点。
3. 多选追问：双11、圣诞/元旦、春节/年货节、以上全部。
4. 用户提交后，追问原位收起，追加“我已确认”。
5. Run 2 完成需求分析；AI 总结；展示需求分析文稿引用。
6. 用户回复“不用，挺好”。
7. Run 3 完成创意分镜；AI 总结；展示创意分镜文稿引用。
8. 用户要求更换为年轻有活力的主角。
9. Run 4 完成；AI 展示三个形象产物。
10. 用户选择第一个；Run 5 完成；AI 发起替换确认。
11. 用户确认后，追问原位收起，追加“我已确认”。
12. Run 6 完成替换；AI 询问是否继续修改。
13. 用户回复“没有了继续”；Run 7 完成；AI 建议生成成片并发起积分确认。
14. 用户确认后，追问原位收起，追加“我已确认”。
15. Run 8 完成素材、合成、预览和包装步骤；AI 总结；展示五个视频预览。

## 数据与 API

```text
API / SSE Event
  -> Conversation Adapter
  -> Conversation Runtime
  -> Component Registry
  -> Message Renderer
```

- `scenarioMessages`：可追加的普通消息和 ArtifactPresentation。
- `scenarioRuns`：8 个 Run 的状态、思考、执行步骤、耗时和输出 ID。
- `scenarioInteractions`：3 个追问的提交摘要、历史答案和下一 Run。
- `scenarioArtifacts`：与消息分离的 10 个 Artifact 实体。
- `conversation/runtime.js`：保证稳定实例原位更新。
- `conversation/component-registry.js`：按 `kind + variant + phase` 选择渲染组件。

右侧可视化编辑器展示业务组件、当前状态、渲染组件、实例 ID、Mock 来源、控制器、接口、事件和字段映射。设计属性只有在能真实影响当前渲染组件时才允许编辑。

## Figma 基准

- `1·整体信息架构`：`1176:118745`
- `2·会话`：`1176:118746`
- `3·产物内容`：`1176:118747`

完整映射见 `figma-map.json`。Figma 是当前视觉与已知状态基准，不是产品能力边界。
