import React, { useState } from 'react';
import { ExternalLink, Play } from 'lucide-react';
import sourceData from '../../data/x-materials.json';
import catalog from '../../data/cases.json';
import media from '../data/gallery-media.json';

export { sourceData };
export const repoUrl = 'https://github.com/dongyu19920904/awesome-image-2-6-gif';
export const docsUrl = repoUrl + '/blob/main/';
export const wechatUrl = docsUrl + 'guides/wechat.md';
export const galleryRoot = new URL(import.meta.env.BASE_URL, window.location.href);

export const labels = {
  zh: {
    brand: 'Image 2.6 GIF', eyebrow: '真实作品 · 作者原词',
    title: ['把一张图，', '做成动态表情'],
    subtitle: '先看真实动图，再找作者提示词。用 GPT Image 2.6 做反应动图，沿着案例找到微信聊天和投稿方法。',
    explore: '逛动图画廊', githubProject: 'GitHub 仓库', wechat: '微信指南',
    cases: '可播放动图', categories: '案例分类', sources: '已核 X 原帖', featured: '精选动图',
    navCases: '案例', navSources: '来源', skills: '现成 Skills', monetization: '变现资料',
    sectionEyebrow: '作品与原词', sectionTitle: '动图案例画廊', search: '按效果、作者或提示词搜索',
    category: '用途', route: '生成路线', all: '全部', onlyPlayable: '只看可播放', clear: '清除筛选',
    matching: '个匹配案例', empty: '没有符合当前筛选的案例。', viewDetails: '查看案例',
    playable: '可播放 GIF', sourceOnly: '效果见作者来源', copyPrompt: '复制原词', copied: '已复制',
    copyError: '复制失败，可在详情选中原词。', authorPrompt: '作者原词', closePreview: '关闭案例',
    nextStep: '微信下一步', share: '分享案例', openGif: '打开 GIF', mediaError: '动图加载失败',
    original: '作者来源', license: '素材许可', reference: '参考图', output: 'GIF 结果',
    authorMethod: '作者方法', authorWorkflow: '作者流程', pause: '显示静态预览', resume: '播放动图',
    retryGif: '重试动图', resultAtSource: '查看作者发布的效果', inputLabel: '输入', guide: 'GitHub 案例导读',
    mediaInfo: '动图参数', size: '尺寸', frames: '帧数', duration: '时长', fileSize: '文件大小',
    evidence: '微信证据', noPlatformResult: '暂无独立的平台结果', reportedListed: '作者自述已上架，未公开收益',
    reportedPending: '作者自述已提交，待审核', rightsLinkOnly: '仅链接作者公开来源',
    sourceDetails: '其他来源', model: '模型或宿主', measurement: '参数来源', promptLocation: '原词位置',
    dataNotRecorded: '未记录', parameterRead: '读取公开 GIF 文件', parameterReported: '作者报告',
    pinnedPrompt: '固定版本中对应作品的提示词段落',
    shareError: '复制失败，可以从地址栏复制当前案例链接。'
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
    authorWorkflow: 'Creator workflow', pause: 'Show still', resume: 'Play GIF',
    retryGif: 'Retry GIF', resultAtSource: 'See the result at source', inputLabel: 'Input', guide: 'GitHub case guide',
    mediaInfo: 'GIF specifications', size: 'Dimensions', frames: 'Frames', duration: 'Duration', fileSize: 'File size',
    evidence: 'WeChat evidence', noPlatformResult: 'No independent platform result documented',
    reportedListed: 'Creator reports listing. Earnings undisclosed.',
    reportedPending: 'Creator reports submission pending review', rightsLinkOnly: 'Links to the creator’s public source',
    sourceDetails: 'Related sources', model: 'Model or host', measurement: 'Specification source',
    promptLocation: 'Prompt location', dataNotRecorded: 'Unrecorded', parameterRead: 'Read from the public GIF file',
    parameterReported: 'Creator-reported', pinnedPrompt: 'The prompt section for this work in the pinned source',
    shareError: 'Copy failed. Use the case link in the address bar.'
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

const catalogById = new Map(catalog.records.map((record) => [record.id, record]));
const mediaIds = new Set(media.map((item) => item.id));
export const cases = [
  ...media.map((item) => {
    const record = catalogById.get(item.id);
    return {
      ...record,
      ...item,
      next_step: record?.next_step ?? item.next_step,
      poster_url: item.featured ? new URL(`poster/${item.id}.webp`, galleryRoot).href : item.poster_url,
    };
  }),
  ...catalog.records.filter((record) => !mediaIds.has(record.id)).map((record) => ({
    ...record,
    source_url: record.primary_source,
    description_zh: record.output_evidence,
    description_en: record.output_evidence_en,
    input_zh: record.inputs,
    input_en: record.inputs_en,
  })),
];

export function localizeCase(item, language) {
  const index = Number(language === 'en');
  const t = labels[language];
  return {
    ...item,
    title: item['title_' + language],
    description: item['description_' + language] || item.description_zh,
    descriptionLanguage: item['description_' + language] ? language : 'zh',
    input: item['input_' + language] || item.input_zh,
    inputLanguage: item['input_' + language] ? language : 'zh',
    promptLocation: (index && item.prompt_location_en) || item.prompt_location || (item.prompt && t.pinnedPrompt),
    promptLocationLanguage: index && item.prompt_location && !item.prompt_location_en ? 'zh' : language,
    wechatEvidence: {
      no_independent_platform_result: t.noPlatformResult,
      'creator_reports_listed; earnings_not_disclosed': t.reportedListed,
      creator_reports_submitted_pending: t.reportedPending,
    }[item.wechat_evidence] || t.dataNotRecorded,
    categoryLabel: categories[item.category]?.[index] || item.category,
    routeLabel: routes[item.route]?.[index] || routes.unknown[index],
    promptLabel: {
      method_only: labels[language].authorMethod,
      workflow_at_source: labels[language].authorWorkflow
    }[item.prompt_status] || labels[language].authorPrompt
  };
}

export function Media({ item, language, eager = false }) {
  const [failed, setFailed] = useState(false);
  const t = labels[language];
  if (!item.poster_url || failed) {
    return <span className="gifFallback">
      {item.preview_url ? <Play size={24} /> : <ExternalLink size={24} />}
      {item.preview_url ? t.resume : t.sourceOnly}
    </span>;
  }
  return <img src={item.poster_url} alt={item.title} data-poster="" loading={eager ? 'eager' : 'lazy'} decoding="async"
    onError={() => setFailed(true)} />;
}

export function DetailMedia({ item, language }) {
  const [playing, setPlaying] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [failed, setFailed] = useState(false);
  const t = labels[language];

  return <div className="gifDetailMedia">
    <div className="gifPlaybackStage">
      {playing && item.preview_url ? (
        <img src={item.preview_url} alt={item.title} data-gif="" onError={() => { setPlaying(false); setFailed(true); }} />
      ) : <Media item={item} language={language} eager />}
      {item.preview_url && <button className="filterPill gifPlayback" type="button"
        onClick={() => { setFailed(false); setPlaying(!playing); }}>
        {playing ? t.pause : failed ? t.retryGif : t.resume}
      </button>}
    </div>
    {failed && <p className="gifNotice" role="status">{t.mediaError}</p>}
  </div>;
}
