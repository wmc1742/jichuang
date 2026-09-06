import { media } from '../data/assets.js?v=20260906c';

const productQuery = (text) => [{ type: 'text', text: '根据 ' }, { type: 'slot', accepts: 'product', label: '添加商品', required: true }, { type: 'text', text }];
const materialQuery = (text) => [{ type: 'text', text: '根据 ' }, { type: 'slot', accepts: 'material', label: '添加素材', required: true }, { type: 'text', text }];

// Presets describe inputs only. The renderer does not infer layouts from skill names.
export const skills = [
  { id: 'campaign-video', name: '大促营销视频', aliases: ['大促推广视频'], description: '结合商品特点和推广节点，生成大促视频。', image: media.product, query: productQuery(' 为我生成用于大促推广的视频'), sourceNode: '1047:44266' },
  { id: 'scene', name: '场景优化', description: '为商品补充适合的使用场景。', image: media.product, query: productQuery(' 优化商品的使用场景') },
  { id: 'cleaning', name: '家清剧情视频', description: '以生活化剧情表达商品卖点。', image: media.conversationProductsAll[2], query: productQuery(' 为我生成家清剧情视频') },
  { id: 'outfit', name: '服饰多场景试穿', description: '呈现服饰在不同场景中的穿着效果。', image: media.conversationActors[0], query: productQuery(' 为我生成服饰多场景试穿视频') },
  { id: 'variations', name: '爆款裂变', description: '基于现有创意生成多种表达方案。', image: media.conversationProductsAll[3], query: materialQuery(' 为我生成不同的创意版本') },
  { id: 'selling-points', name: '商品卖点拆解', description: '整理商品信息和可表达的核心卖点。', image: media.product, query: productQuery(' 为我分析商品卖点') },
];

export const skillById = (id) => skills.find((skill) => skill.id === id || skill.name === id || skill.aliases?.includes(id));
