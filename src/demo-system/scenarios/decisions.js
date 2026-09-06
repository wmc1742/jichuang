export const phasesAfterRun = Object.freeze({ 1: 'campaign-question', 2: 'requirements-review', 3: 'storyboard-review', 4: 'actor-selection', 5: 'actor-confirmation', 6: 'storyboard-review', 7: 'video-confirmation', 8: 'completed' });

// Mock replaces intent recognition, not the product state machine. Unknown input never implies approval.
export function recognizeMockIntent(text) {
  const value = text.trim().replace(/[，。！!\s]/g, '');
  if (/换|更换|年轻|重新生成/.test(value) && /人物|演员|形象|主角|年轻/.test(value)) return { type: 'replace-actor' };
  const actor = value.match(/(?:选|用|第)([一二三123])(?:个|号)?/);
  if (actor) return { type: 'select-actor', index: '一二三'.includes(actor[1]) ? '一二三'.indexOf(actor[1]) : Number(actor[1]) - 1 };
  if (/^(?:不用|不需要)(?:改|修改|补充)?(?:挺好|很好|了)?$/.test(value) || /^(?:没问题|没有了|确认|可以|好的?|继续|挺好|很好|OK|ok|是的|没什么问题)(?:继续|开始生成|生成成片)?$/.test(value)) return { type: 'accept' };
  if (/取消|先不|暂停|停止/.test(value)) return { type: 'decline' };
  return { type: 'feedback' };
}

export const mockDecisionRules = Object.freeze({
  'requirements-review': { accept: 3, feedback: '收到你的补充。你希望调整需求分析中的哪一部分？也可以打开文稿直接编辑，保存后的内容会用于后续创作。' },
  'storyboard-review': { accept: 7, 'replace-actor': 4, feedback: '你希望调整哪个镜头、人物或台词？我会以当前分镜为基础继续处理，不会直接开始生成成片。' },
  'actor-selection': { 'select-actor': 5, feedback: '你更希望采用哪一个形象？请告诉我第一个、第二个或第三个。' },
  completed: { 'replace-actor': 4, feedback: '可以继续调整已有产物。请引用需要修改的文稿、形象或视频，并说明具体修改内容。' },
});
