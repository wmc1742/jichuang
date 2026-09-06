export const documentBlockTypes = Object.freeze(['section', 'paragraph', 'list', 'subjects', 'shots', 'image', 'video']);

export function validateDocument(document) {
  const errors = [];
  const ids = new Set();
  function visit(blocks) {
    for (const block of blocks || []) {
      if (!block.id || ids.has(block.id)) errors.push(`Duplicate or missing block id: ${block.id}`);
      ids.add(block.id);
      if (!documentBlockTypes.includes(block.type)) errors.push(`Unsupported block type: ${block.type}`);
      if (block.type === 'section') visit(block.children);
    }
  }
  if (document?.version !== 1 || !Array.isArray(document.blocks)) errors.push('Invalid document schema');
  visit(document?.blocks);
  return errors;
}

export function referencedDocumentArtifacts(document) {
  const ids = new Set();
  function visit(blocks) {
    for (const block of blocks || []) {
      if (block.artifactId) ids.add(block.artifactId);
      (block.items || []).forEach((item) => { if (item.artifactId) ids.add(item.artifactId); });
      (block.rows || []).forEach((item) => { if (item.actorId) ids.add(item.actorId); });
      if (block.children) visit(block.children);
    }
  }
  visit(document?.blocks);
  return [...ids];
}

export function replaceDocumentReference(document, fromId, toId) {
  const result = structuredClone(document);
  function visit(blocks) {
    for (const block of blocks || []) {
      if (block.artifactId === fromId) block.artifactId = toId;
      (block.items || []).forEach((item) => { if (item.artifactId === fromId) item.artifactId = toId; });
      (block.rows || []).forEach((item) => { if (item.actorId === fromId) item.actorId = toId; });
      if (block.children) visit(block.children);
    }
  }
  visit(result.blocks);
  return result;
}

export function migrateDocument(content) {
  if (content?.version === 1 && Array.isArray(content.blocks)) return content;
  // Preserve text already edited in an earlier demo; never replace it with new fixtures.
  return { version: 1, blocks: Object.entries(content || {}).filter(([, value]) => typeof value === 'string')
    .map(([id, text]) => ({ id: `legacy-${id}`, type: 'paragraph', text })) };
}
