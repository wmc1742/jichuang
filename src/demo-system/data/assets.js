export const assetRoot = './assets';

export const icons = {
  logoMark: `${assetRoot}/agent-2/icons/logo-mark.svg`,
  logoWord: `${assetRoot}/agent-2/icons/logo-word.svg`,
  collapse: `${assetRoot}/agent-2/icons/collapse.svg`,
  share: `${assetRoot}/agent-2/icons/share.svg`,
  artifactList: `${assetRoot}/agent-2/icons/artifact-list.svg`,
  workbench: `${assetRoot}/agent-2/icons/workbench.svg`,
  product: `${assetRoot}/agent-2/icons/upload-product.svg`,
  material: `${assetRoot}/agent-2/icons/upload-material.svg`,
  settings: `${assetRoot}/agent-2/icons/settings.svg`,
  credit: `${assetRoot}/agent-2/icons/credit.svg`,
  send: `${assetRoot}/agent-2/icons/send.svg`,
  document: `${assetRoot}/agent-2/icons/artifact-doc.svg`,
  video: `${assetRoot}/agent-2/icons/artifact-video.svg`,
  image: `${assetRoot}/agent-2/icons/artifact-image.svg`,
  actor: `${assetRoot}/agent-2/icons/artifact-actor.svg`,
  play: `${assetRoot}/agent-2/icons/play.svg`,
  selectionForm: `${assetRoot}/agent-2/icons/selection-form.svg`,
  questionConfirm: `${assetRoot}/agent-2/icons/question-confirm.svg`,
  checkboxSelected: `${assetRoot}/agent-2/icons/checkbox-selected.svg`,
  thinkingProgress: `${assetRoot}/agent-2/icons/thinking-progress.png`,
  thinkingComplete: `${assetRoot}/agent-2/icons/thinking-complete.svg`,
  executionRunning: `${assetRoot}/agent-2/icons/execution-running.svg`,
  executionComplete: `${assetRoot}/agent-2/icons/thinking-complete.svg`,
  statusConfirmed: `${assetRoot}/agent-2/icons/status-confirmed.svg`,
  chevronRight: `${assetRoot}/agent-2/icons/chevron-right.svg`,
  search: `${assetRoot}/figma-strict/icons/search.svg`,
};

export const media = {
  product: `${assetRoot}/figma-latest/media/videoSingle-img1011.png`,
  productSquare: `${assetRoot}/figma-latest/media/analysisReport-imgImage.png`,
  actor: `${assetRoot}/figma-latest/media/creativeDetail-imgRectangle279335595.png`,
  actors: [593, 594, 595, 596, 597, 598].map(
    (id) => `${assetRoot}/figma-latest/media/creativeDetail-imgRectangle279335${id}.png`,
  ),
  inspirations: Array.from(
    { length: 10 },
    (_, index) => `${assetRoot}/figma-latest/media/home-imgRectangle3462425${String(index + 1).padStart(2, '0')}.png`,
  ),
  productReferences: [
    `${assetRoot}/figma-latest/media/analysisReport-imgImage.png`,
    `${assetRoot}/figma-latest/media/videoSingle-img1011.png`,
    `${assetRoot}/figma-latest/media/home-img1011.png`,
  ],
  conversationProducts: [
    `${assetRoot}/agent-2/conversation-product-1.png`,
    `${assetRoot}/agent-2/conversation-product-4.png`,
    `${assetRoot}/agent-2/conversation-product-8.png`,
  ],
  conversationActors: [1, 3, 6, 7, 9].map(
    (id) => `${assetRoot}/agent-2/conversation-actor-${id}.png`,
  ),
  conversationVideos: [
    `${assetRoot}/agent-2/conversation-video-1.png`,
    `${assetRoot}/agent-2/conversation-video-2.png`,
  ],
};
