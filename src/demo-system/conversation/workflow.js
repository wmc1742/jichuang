import { mockDecisionRules, recognizeMockIntent } from '../scenarios/decisions.js?v=20260906b';
import { artifactContent } from '../artifacts/content.js?v=20260906b';
import { referencedDocumentArtifacts } from '../artifacts/document.js?v=20260906b';

export function nextConversationAction({ messages, workflow, pendingRun }, text) {
  if (pendingRun) return { type: 'resume', runId: pendingRun };
  const question = messages.findLast((item) => item.kind === 'agent-question' && item.phase === 'pending');
  if (question) return { type: 'question', questionId: question.id };
  const decision = recognizeMockIntent(text);
  const rule = mockDecisionRules[workflow?.phase];
  if (decision.type === 'decline') return { type: 'reply', text: '好的，先不继续生成。已有内容会保留，你可以继续补充或修改。' };
  if (Number.isInteger(rule?.[decision.type])) return { type: 'run', runId: rule[decision.type], ...(decision.index == null ? {} : { actorIndex: decision.index }) };
  return { type: 'reply', text: rule?.feedback || '我已收到。请告诉我这次想完成的创作目标，或补充商品和参考素材。' };
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
  const published = [...current];
  function publish(id) {
    if (published.some((item) => item.id === id)) return;
    const fixture = fixtures.find((item) => item.id === id);
    if (!fixture) return;
    const item = artifactContent({ ...structuredClone(fixture), title: personalizeText(fixture.title, state), createdAt: new Date().toLocaleString('zh-CN'), revision: 1 }, state);
    published.push(item);
    referencedDocumentArtifacts(item.content).forEach(publish);
    (fixture.dependencies || []).forEach(publish);
  }
  ids.forEach(publish);
  return published;
}
