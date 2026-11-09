import React, { useState } from 'react';
import './source-index.css';

const PAGE_SIZE = 12;

const ROUTES = {
  native: ['原生 GIF 请求', 'Native GIF request'],
  assembled: ['帧合成', 'Frame assembly'],
  mixed: ['混合路线', 'Mixed workflow'],
  unknown: ['路线未说明', 'Route unspecified'],
  see_original: ['详见原帖', 'See original'],
};

const USES = {
  wechat: { labels: ['微信聊天与投稿', 'WeChat use and submission'], match: /微信|投稿|提审|赞赏|打赏|变现|wechat|weixin|submission|chat-sticker/i },
  reference: { labels: ['参考图与角色一致', 'Reference images and character consistency'], match: /参考|图生|角色一致|reference|character-consistency|image-to-gif/i },
  prompt: { labels: ['提示词与原词', 'Prompts'], match: /提示词|原词|prompt/i },
  loop: { labels: ['循环与帧时长', 'Loops and frame timing'], match: /循环|帧时|帧数|帧率|loop|frame[-_ ]?(count|timing|rate)|fps/i },
  troubleshooting: { labels: ['对照与排查', 'Comparisons and troubleshooting'], match: /对照|比较|失败|修复|排查|comparison|failure|troubleshoot/i },
};

const INITIAL_FILTERS = { query: '', route: '', use: '', limit: PAGE_SIZE };
const REVIEWED_BODY_SCOPE = 'original body read; media, platform approval and earnings not independently verified';

export default function SourceIndex({ language = 'zh', records = [] }) {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const english = language === 'en';
  const label = ([zh, en]) => english ? en : zh;
  const terms = filters.query.toLowerCase().trim().split(/\s+/)
    .map((term) => term.replace(/^@/, '')).filter(Boolean);

  const matches = records.filter((record) => {
    const topicText = [record.title, record.title_en, ...(record.topics ?? []), record.note, record.note_en].join(' ');
    const relatedUses = Object.values(USES).filter(({ match }) => match.test(topicText));
    const searchText = [
      topicText,
      record.author,
      record.id,
      record.url,
      record.route,
      ...(ROUTES[record.route] ?? []),
      ...relatedUses.flatMap(({ labels }) => labels),
    ].join(' ').toLowerCase();

    return (!filters.route || record.route === filters.route)
      && (!filters.use || USES[filters.use].match.test(topicText))
      && terms.every((term) => searchText.includes(term));
  });

  const updateFilter = (field, value) => setFilters((previous) => ({
    ...previous,
    [field]: value,
    limit: PAGE_SIZE,
  }));
  const shown = Math.min(filters.limit, matches.length);

  return (
    <section className="gallerySection gifSourceIndex" id="sources" aria-labelledby="gif-source-heading">
      <header className="gifSourceIndex__header">
        <span className="eyebrow">{label(['来源档案', 'Source archive'])}</span>
        <h2 id="gif-source-heading">{label(['查 X 原帖', 'Browse original X posts'])}</h2>
        <p>
          {label([
            '标题与摘要为编辑导读。生成路线按作者描述记录，核验范围见各条。',
            'Titles and summaries are editorial notes. Workflow labels reflect what authors reported. See each entry for its evidence scope.',
          ])}
        </p>
      </header>

      <div className="filterPanel gifSourceIndex__filters">
        <label>
          {label(['搜索标题、作者或关键词', 'Search titles, authors or keywords'])}
          <input type="search" value={filters.query} onChange={(event) => updateFilter('query', event.target.value)} />
        </label>
        <label>
          {label(['生成路线', 'Workflow'])}
          <select value={filters.route} onChange={(event) => updateFilter('route', event.target.value)}>
            <option value="">{label(['全部路线', 'All workflows'])}</option>
            {Object.entries(ROUTES).map(([key, labels]) => <option key={key} value={key}>{label(labels)}</option>)}
          </select>
        </label>
        <label>
          {label(['用途', 'Use'])}
          <select value={filters.use} onChange={(event) => updateFilter('use', event.target.value)}>
            <option value="">{label(['全部用途', 'All uses'])}</option>
            {Object.entries(USES).map(([key, { labels }]) => <option key={key} value={key}>{label(labels)}</option>)}
          </select>
        </label>
        <button className="filterPill" type="button" onClick={() => setFilters(INITIAL_FILTERS)}>
          {label(['清除筛选', 'Clear filters'])}
        </button>
      </div>

      <p className="resultBar" role="status">
        {label([
          `显示 ${shown} 条，找到 ${matches.length} 条，共 ${records.length} 条`,
          `Showing ${shown} of ${matches.length} matches across ${records.length} posts`,
        ])}
      </p>

      {matches.length === 0 ? (
        <p>{label(['没有匹配的原帖。试试作者名或换一个用途。', 'No matching posts. Try an author name or another use.'])}</p>
      ) : (
        <ul className="gifSourceIndex__list">
          {matches.slice(0, shown).map((record) => (
            <li key={record.id}>
              <a href={record.url} lang={english && record.title_en ? 'en' : 'zh-Hans'}>
                {(english && record.title_en) || record.title}
              </a>
              <span className="gifSourceIndex__meta">
                <span>@{record.author}</span>
                <span>{label(ROUTES[record.route] ?? ROUTES.see_original)}</span>
              </span>
              {record.note && <p className="gifSourceIndex__note" lang={english && record.note_en ? 'en' : 'zh-Hans'}>
                {(english && record.note_en) || record.note}
              </p>}
              {record.source_scope && <small className="gifSourceIndex__scope"
                lang={english || record.source_scope !== REVIEWED_BODY_SCOPE ? 'en' : 'zh-Hans'}>
                {record.source_scope === REVIEWED_BODY_SCOPE
                  ? label(['已读原帖正文，媒体、平台审核和收益未经独立核验。',
                    'Original post read. Media, platform approval, and earnings remain unverified.'])
                  : record.source_scope}
              </small>}
            </li>
          ))}
        </ul>
      )}

      {shown < matches.length && (
        <button
          className="filterPill gifSourceIndex__more"
          type="button"
          onClick={() => setFilters((previous) => ({ ...previous, limit: previous.limit + PAGE_SIZE }))}
        >
          {label(['显示更多原帖', 'Show more posts'])}
        </button>
      )}
    </section>
  );
}
