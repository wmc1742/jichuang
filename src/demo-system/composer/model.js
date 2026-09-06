export function createInput(text = '') {
  return { version: 1, skill: null, parts: [{ id: 'text', type: 'text', text }] };
}

export function inputText(input) {
  return (input?.parts || []).map((part) => part.type === 'text' ? part.text : part.type === 'reference' ? part.reference.title : '').join('');
}

export function inputReferences(input) {
  return (input?.parts || []).filter((part) => part.type === 'reference').map((part) => part.reference);
}

export function inputInstruction(input) {
  return (input?.parts || []).filter((part) => part.type === 'text').map((part) => part.text).join('').trim();
}

export function selectInputSkill(input, skill) {
  return { version: 1, skill: { id: skill.id, name: skill.name }, parts: [
    ...skill.query.map((part, index) => ({ ...structuredClone(part), id: `${skill.id}-${index}`, owner: skill.id })),
    { id: 'additional-text', type: 'text', text: '' },
  ] };
}

export function removeInputSkill(input) {
  const skillId = input.skill?.id;
  // Removing a preset must not delete uploaded context or independent user text.
  const parts = input.parts.filter((part) => part.owner !== skillId || part.type === 'reference')
    .map(({ owner, slot, ...part }) => part);
  return { version: 1, skill: null, parts: parts.length ? parts : createInput().parts };
}

export function attachInputReference(input, reference, slotId = null) {
  const result = structuredClone(input);
  const index = result.parts.findIndex((part) => part.type === 'slot' && (slotId ? part.id === slotId : part.accepts === 'product' ? reference.type === 'product' : reference.type !== 'product'));
  const part = { id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type: 'reference', reference: structuredClone(reference) };
  if (index >= 0) result.parts[index] = { ...part, id: result.parts[index].id, owner: result.parts[index].owner, slot: result.parts[index] };
  else result.parts.splice(Math.max(0, result.parts.length - 1), 0, part);
  return result;
}

export function removeInputReference(input, id) {
  return { ...input, parts: input.parts.flatMap((part) => part.id !== id ? [part] : part.slot ? [part.slot] : []) };
}

export function validateInput(input) {
  const missing = (input?.parts || []).filter((part) => part.type === 'slot' && part.required);
  return { valid: !missing.length && Boolean(inputText(input).trim() || inputReferences(input).length), missing };
}

export function migrateInput(state) {
  if (state.input?.version === 1) return state.input;
  const input = createInput(state.draft || '');
  if (state.attachment) {
    const reference = { ...state.attachment, type: state.attachment.type || 'product' };
    const position = input.parts[0].text.indexOf(reference.title);
    if (position >= 0) input.parts = [
      { id: 'prefix', type: 'text', text: input.parts[0].text.slice(0, position) },
      { id: 'legacy-ref', type: 'reference', reference },
      { id: 'text', type: 'text', text: input.parts[0].text.slice(position + reference.title.length) },
    ];
    else input.parts.unshift({ id: 'legacy-ref', type: 'reference', reference });
  }
  return input;
}

export function inputRequest(input) {
  return { content: structuredClone(input.parts.filter((part) => part.type !== 'slot')), text: inputText(input).trim(), skill: input.skill, attachments: inputReferences(input) };
}
