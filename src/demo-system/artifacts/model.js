export const ArtifactType = Object.freeze({
  DOCUMENT: 'document',
  VIDEO: 'video',
  IMAGE: 'image',
  PREVIEW: 'preview',
  ACTOR: 'actor',
});

export const ArtifactView = Object.freeze({
  CATEGORY: 'category',
  LIST: 'list',
  DETAIL: 'detail',
  EDIT: 'edit',
  DRILL: 'drill',
});

export const artifactTypeDefinitions = Object.freeze([
  { id: ArtifactType.DOCUMENT, label: '文稿', icon: 'document', presentation: 'card', canEdit: true, canReference: true },
  { id: ArtifactType.VIDEO, label: '视频', icon: 'video', presentation: 'media', canEdit: true, canReference: true },
  { id: ArtifactType.IMAGE, label: '图片', icon: 'image', presentation: 'media', canEdit: false, canReference: true },
  { id: ArtifactType.PREVIEW, label: '预览', icon: 'video', presentation: 'collection', canEdit: true, canReference: false },
  { id: ArtifactType.ACTOR, label: '演员', icon: 'actor', presentation: 'media', canEdit: true, canReference: true },
]);

const typeMap = new Map(artifactTypeDefinitions.map((type) => [type.id, type]));

export function getArtifactType(type) {
  return typeMap.get(type === 'character' ? ArtifactType.ACTOR : type) || typeMap.get(ArtifactType.DOCUMENT);
}

export function createArtifactWorkspace(overrides = {}) {
  return {
    open: false,
    maximized: false,
    rootMode: ArtifactView.CATEGORY,
    selectedCategory: ArtifactType.DOCUMENT,
    openTabs: [],
    activeTabId: null,
    activeView: ArtifactView.CATEGORY,
    drillTarget: null,
    loadingArtifactId: null,
    playing: false,
    ...overrides,
  };
}

export function artifactById(artifacts, id) {
  return artifacts.find((artifact) => artifact.id === id) || null;
}

export function generatedArtifactTypes(artifacts) {
  const available = new Set(artifacts.map((artifact) => getArtifactType(artifact.type).id));
  return artifactTypeDefinitions.filter((type) => available.has(type.id));
}

export function artifactsByType(artifacts, type) {
  return artifacts
    .filter((artifact) => getArtifactType(artifact.type).id === type)
    .sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0));
}

export function openArtifactTab(workspace, artifactId) {
  const openTabs = workspace.openTabs.includes(artifactId)
    ? workspace.openTabs
    : [...workspace.openTabs, artifactId];
  return {
    ...workspace,
    open: true,
    openTabs,
    activeTabId: artifactId,
    activeView: ArtifactView.DETAIL,
    drillTarget: null,
    playing: false,
  };
}

export function closeArtifactTab(workspace, artifactId) {
  const index = workspace.openTabs.indexOf(artifactId);
  const openTabs = workspace.openTabs.filter((id) => id !== artifactId);
  if (workspace.activeTabId !== artifactId) return { ...workspace, openTabs };
  const activeTabId = openTabs[Math.min(index, openTabs.length - 1)] || null;
  return {
    ...workspace,
    openTabs,
    activeTabId,
    activeView: activeTabId ? ArtifactView.DETAIL : workspace.rootMode,
    drillTarget: null,
    playing: false,
  };
}

export function normalizeArtifactWorkspace(workspace, artifacts) {
  const ids = new Set(artifacts.map((artifact) => artifact.id));
  const openTabs = workspace.openTabs.filter((id) => ids.has(id));
  const activeTabId = ids.has(workspace.activeTabId) ? workspace.activeTabId : openTabs.at(-1) || null;
  return { ...workspace, openTabs, activeTabId };
}
