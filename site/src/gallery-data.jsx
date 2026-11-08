import React, { useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import sourceData from '../../data/x-materials.json';
import catalog from '../../data/cases.json';
import media from '../data/gallery-media.json';

export { sourceData };
export const repoUrl = 'https://github.com/dongyu19920904/awesome-image-2-6-gif';
export const docsUrl = repoUrl + '/blob/main/';
export const wechatUrl = docsUrl + 'guides/wechat.md';

export const labels = {
  zh: {
    brand: 'Image 2.6 GIF', eyebrow: '真实作品 · 作者原词',
    title: ['把一张图，', '变成会动的表情'],
    subtitle: '先看真实动图，再找作者提示词。用 GPT Image 2.6 做反应动图，沿着案例找到微信聊天和投稿方法。',
    explore: '逛动图画廊', githubProject: 'GitHub 仓库', wechat: '微信指南',
    cases: '可播放动图', categories: '案例分类', sources: '已核 X 原帖', featured: '精选动图',
    navCases: '案例', navSources: '来源', skills: '现成 Skills', monetization: '变现资料',
    sectionEyebrow: '作品与原词', sectionTitle: '动图案例画廊', search: '按效果、作者或提示词搜索',
    category: '用途', route: '生成路线', all: '全部', onlyPlayable: '只看可播放', clear: '清除筛选',
    matching: '个匹配案例', empty: '没有符合当前筛选的案例。', viewDetails: '查看案例',
    playable: '可播放 GIF', sourceOnly: '去原帖看效果', copyPrompt: '复制原词', copied: '已复制',
    copyError: '复制失败，可在详情选中原词。', authorPrompt: '作者原词', closePreview: '关闭案例',
    nextStep: '微信下一步', share: '分享案例', openGif: '打开 GIF', mediaError: '动图加载失败',
    original: '作者来源', license: '素材许可', reference: '参考图', output: 'GIF 结果',
    authorMethod: '作者方法', authorWorkflow: '作者流程', pause: '暂停动图', resume: '播放动图'
  },
  en: {
    brand: 'Image 2.6 GIF', eyebrow: 'REAL GIFS · CREATOR PROMPTS',
    title: 'Turn an image into a reaction GIF',
    subtitle: 'Browse real motion, find the creator’s prompt, and follow the steps for using or submitting stickers on WeChat.',
    explore: 'Browse the GIF gallery', githubProject: 'GitHub repository', wechat: 'WeChat guide',
    cases: 'playable GIFs', categories: 'case categories', sources: 'reviewed X posts', featured: 'Featured GIFs',
    navCases: 'Cases', navSources: 'Sources', skills: 'Skills', monetization: 'Monetization',
    sectionEyebrow: 'GIFS AND PROMPTS', sectionTitle: 'GIF case gallery', search: 'Search effects, creators, or prompts',
    category: 'Use', route: 'Generation route', all: 'All', onlyPlayable: 'Playable GIFs only', clear: 'Clear filters',
    matching: 'matching cases', empty: 'No cases match these filters.', viewDetails: 'View case',
    playable: 'Playable GIF', sourceOnly: 'See result at source', copyPrompt: 'Copy prompt', copied: 'Copied',
    copyError: 'Copy failed. Select the prompt in the case details.', authorPrompt: 'Creator prompt',
    closePreview: 'Close case', nextStep: 'WeChat next step', share: 'Share case', openGif: 'Open GIF',
    mediaError: 'GIF could not load', original: 'Creator source', license: 'Media license',
    reference: 'Reference image', output: 'GIF result', authorMethod: 'Creator method',
    authorWorkflow: 'Creator workflow', pause: 'Pause GIF', resume: 'Play GIF'
  }
};

const categories = {
  reaction: ['日常反应', 'Reactions'],
  loop_technique: ['循环和画风', 'Loop techniques'],
  image_to_gif: ['参考图与角色', 'Reference and character'],
  wechat_pack: ['微信工作流', 'WeChat workflows'],
  gif_postprocessing: ['动图后处理', 'GIF post-processing']
};

const routes = {
  native_request: ['原生 GIF 请求', 'Native GIF request'],
  native_with_postprocessing: ['原生 GIF 后处理', 'Native GIF with editing'],
  frame_assembly: ['帧合成', 'Frame assembly'],
  mixed: ['混合路线', 'Mixed routes'],
  submission_workflow: ['投稿工作流', 'Submission workflow'],
  unknown: ['路线未说明', 'Route unspecified']
};

export const cases = [
  ...media,
  ...catalog.records.filter((record) => !media.some((item) => item.id === record.id)).map((record) => ({
    ...record,
    source_url: record.primary_source,
    description_zh: record.output_evidence,
    description_en: 'See the creator source, generation route, and WeChat next step.',
    input_zh: record.inputs, input_en: 'See case for input',
    preview_url: null
  }))
];

export function localizeCase(item, language) {
  const index = Number(language === 'en');
  return {
    ...item,
    title: item['title_' + language],
    description: item['description_' + language],
    input: item['input_' + language],
    categoryLabel: categories[item.category]?.[index] || item.category,
    routeLabel: routes[item.route]?.[index] || routes.unknown[index],
    promptLabel: {
      method_only: labels[language].authorMethod,
      workflow_at_source: labels[language].authorWorkflow
    }[item.prompt_status] || labels[language].authorPrompt
  };
}

export function Media({ item, language, eager = false }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const t = labels[language];
  if (!item.preview_url || failedUrl === item.preview_url) {
    return <span className="gifFallback"><ExternalLink size={24} />{item.preview_url ? t.mediaError : t.sourceOnly}</span>;
  }
  return <img src={item.preview_url} alt={item.title} loading={eager ? 'eager' : 'lazy'} decoding="async"
    onError={() => setFailedUrl(item.preview_url)} />;
}

export function DetailMedia({ item, language }) {
  const image = useRef(null);
  const still = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const t = labels[language];

  if (!item.preview_url || failed) {
    return <Media item={{ ...item, preview_url: failed ? null : item.preview_url }} language={language} />;
  }

  function togglePlayback() {
    if (!paused) {
      const canvas = still.current;
      canvas.width = image.current.naturalWidth;
      canvas.height = image.current.naturalHeight;
      canvas.getContext('2d').drawImage(image.current, 0, 0);
    }
    setPaused(!paused);
  }

  return <div className="gifDetailMedia">
    <img ref={image} src={item.preview_url} alt={item.title} hidden={paused}
      onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
    <canvas ref={still} hidden={!paused} aria-label={item.title} role="img" />
    <button className="filterPill gifPlayback" type="button" onClick={togglePlayback} disabled={!loaded}>
      {paused ? t.resume : t.pause}
    </button>
  </div>;
}
