// The mock adapter chooses a business transition; message rendering remains event-driven.
export function nextConversationAction({ messages, scenarioStage, pendingRun }, text) {
  if (pendingRun) return { type: 'resume', runId: pendingRun };
  const question = messages.findLast((item) => item.kind === 'agent-question' && item.phase === 'pending');
  if (question) return { type: 'question', questionId: question.id };
  if (/怎么|为什么|是什么|帮助|如何/.test(text)) return { type: 'reply', text: '你可以告诉我需要调整的商品卖点、人物或画面，也可以先打开生成内容查看细节。确认当前方案后，我会继续下一步。' };
  if (scenarioStage === 2) return { type: 'run', runId: 3 };
  if (scenarioStage === 3) return { type: 'run', runId: /人物|演员|形象|主角|年轻|换/.test(text) ? 4 : 7 };
  if (scenarioStage === 4) return { type: 'run', runId: 5 };
  if (scenarioStage === 6) return { type: 'run', runId: 7 };
  if (scenarioStage >= 8) return { type: 'reply', text: '这次成片已经完成。打开右上角的生成内容，可以预览视频、编辑画面描述并保存新版本；引用某条产物后再发送修改意见，我会把意见记录到该产物中。' };
  return { type: 'reply', text: '我已收到你的补充。请先完成当前确认，再继续生成。' };
}

export function selectedCampaigns(messages) {
  const answer = messages.find((item) => item.id === 'campaign-selection')?.answer;
  const selected = answer?.selected || [];
  return selected.includes('以上全部') ? ['双11节点', '圣诞/元旦跨年', '春节/年货节'] : selected;
}

export function personalizeText(text, state) {
  const campaigns = selectedCampaigns(state.messages);
  const replace = (value) => String(value).replaceAll('即创螺蛳粉', state.product?.title || '即创螺蛳粉')
    .replace(/双11节点和春节\/年货节|双11节点和春节\/年货节期间/g, campaigns.length ? campaigns.join('、') : '本次大促');
  return Array.isArray(text) ? text.map(replace) : replace(text || '');
}

export function publishArtifacts(current, outputs, fixtures, state, runId) {
  const ids = new Set(outputs.flatMap((node) => [node.artifactId, ...(node.artifactIds || [])]).filter(Boolean));
  if (runId === 3) ['product-image-1', 'product-image-2', 'character-1', 'preview-1'].forEach((id) => ids.add(id));
  return [...current, ...fixtures.filter((item) => ids.has(item.id) && !current.some((existing) => existing.id === item.id))
    .map((item) => ({ ...structuredClone(item), title: personalizeText(item.title, state), createdAt: new Date().toLocaleString('zh-CN'), revision: 1 }))];
}
