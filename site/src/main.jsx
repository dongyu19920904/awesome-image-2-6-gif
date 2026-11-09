import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, Copy, Link, Search, WandSparkles, X } from 'lucide-react';
import '@fontsource-variable/noto-sans-sc';
import { FilterPill, Hero, LanguageSwitch, PromptCard, copyToClipboard } from './upstream-gallery.jsx';
import { cases, DetailMedia, docsUrl, galleryRoot, labels, localizeCase, Media, repoUrl, sourceData, wechatUrl } from './gallery-data.jsx';
import SourceIndex from './SourceIndex.jsx';
import './styles.css';
import './gif-gallery.css';

const categoryIds = [...new Set(cases.map((item) => item.category))];
const routeIds = [...new Set(cases.map((item) => item.route))];
const playable = cases.filter((item) => item.preview_url);
const featured = playable.filter((item) => item.featured);

function readLocation() {
  const params = new URLSearchParams(location.search);
  const storedLanguage = params.has('lang') ? null : localStorage.getItem('gif-gallery-language');
  const id = params.get('case');
  const category = params.get('category');
  const route = params.get('route');
  return {
    language: (params.get('lang') || storedLanguage) === 'en' ? 'en' : 'zh',
    activeId: cases.some((item) => item.id === id) ? id : null,
    query: params.get('q') || '',
    category: categoryIds.includes(category) ? category : '',
    route: routeIds.includes(route) ? route : '',
    onlyPlayable: params.get('playable') === '1'
  };
}

function caseLinks(item, t) {
  const links = new Map();
  for (const [role, url, label] of [
    ['output', item.preview_url || item.preview, item.preview_url ? t.openGif : t.resultAtSource],
    ['prompt', item.prompt_source || item.source_url, item.promptLabel],
    ['author', item.source_url, `${t.original} · @${item.author}`],
  ]) {
    if (!url) continue;
    const link = links.get(url);
    if (link) link.label += ' · ' + label;
    else links.set(url, { role, url, label });
  }
  return [...links.values()];
}

function MediaFacts({ item, language }) {
  const t = labels[language];
  const count = new Intl.NumberFormat(language, { maximumFractionDigits: 3 });
  const facts = [
    [t.size, item.width && item.height ? `${item.width} × ${item.height} px` : null],
    [t.frames, item.frame_count ?? null],
    [t.duration, item.duration_ms == null ? null : `${count.format(item.duration_ms / 1000)} s`],
    [t.fileSize, item.bytes == null ? null : `${count.format(item.bytes)} B`],
    [t.model, item.model || item.host || null],
  ];
  const measured = item.metrics_source?.measured || item.metrics_source?.file;
  const reported = item.metrics_source?.reported;
  const bytes = item.metrics_source?.bytes;
  return (
    <div className="previewSection">
      <h3>{t.mediaInfo}</h3>
      <dl className="gifFacts">
        {facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? t.dataNotRecorded}</dd></div>)}
      </dl>
      <div className="gifFactSources" role="group" aria-label={t.measurement}>
        {measured?.url && <a href={measured.url} target="_blank" rel="noreferrer">{t.parameterRead}</a>}
        {reported?.url && <a href={reported.url} target="_blank" rel="noreferrer">{t.parameterReported}</a>}
        {bytes?.url && <a href={bytes.url} target="_blank" rel="noreferrer">{t.fileSize}</a>}
      </div>
    </div>
  );
}

function CaseDialog({ item, language, onClose, onCopy, onShare, notice, onOpen }) {
  const dialog = useRef(null);
  const t = labels[language];
  useEffect(() => {
    const modal = dialog.current;
    modal.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      modal.close();
      document.body.style.overflow = overflow;
    };
  }, []);

  const related = item.series ? cases.filter((other) => other.series === item.series && other.id !== item.id) : [];
  const links = caseLinks(item, t);
  const relatedSources = (item.related_sources || []).filter((url) => url !== item.license_url && !links.some((link) => link.url === url));
  return (
    <dialog className="gifDialog" ref={dialog} aria-labelledby="preview-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="previewDialog">
        <button className="previewClose" type="button" onClick={onClose} aria-label={t.closePreview}><X size={20} /></button>
        <div className={item.reference_url ? 'previewMedia hasComparison' : 'previewMedia'}>
          {item.reference_url ? (
            <div className="comparisonGrid">
              <figure className="comparisonFigure">
                <div className="comparisonLabel">{t.reference}</div>
                <img src={item.reference_url} alt={t.reference} />
              </figure>
              <figure className="comparisonFigure">
                <div className="comparisonLabel">{t.output}</div>
                <DetailMedia key={item.id} item={item} language={language} />
              </figure>
            </div>
          ) : <DetailMedia key={item.id} item={item} language={language} />}
        </div>
        <div className="previewContent">
          <div className="previewMeta"><span>{item.routeLabel}</span></div>
          <h2 id="preview-title">{item.title}</h2>
          <p lang={item.descriptionLanguage}>{item.description}</p>
          {item.input && <div className="previewSection">
            <h3>{t.inputLabel}</h3>
            <p lang={item.inputLanguage}>{item.input}</p>
          </div>}
          {item.preview_url && <MediaFacts item={item} language={language} />}
          <div className="previewActions">
            {item.prompt && <button type="button" onClick={onCopy}><Copy size={17} />{t.copyPrompt}</button>}
            {links.map(({ role, url, label }) => (
              <a key={url} data-case-link={role} href={url} target="_blank" rel="noreferrer">{label}<ArrowUpRight size={17} /></a>
            ))}
            <a data-case-link="wechat" href={docsUrl + item.next_step} target="_blank" rel="noreferrer">
              {t.nextStep}<ArrowUpRight size={17} />
            </a>
            <button type="button" onClick={onShare}><Link size={17} />{t.share}</button>
          </div>
          <span className="gifNotice" role="status">{notice}</span>
          {item.promptLocation && <div className="previewSection">
            <h3>{t.promptLocation}</h3>
            <p lang={item.promptLocationLanguage}>{item.promptLocation}</p>
          </div>}
          {item.prompt && <div className="previewSection">
            <h3>{t.authorPrompt} · {item.prompt_language?.toUpperCase()}</h3>
            <pre className="promptBlock" lang={item.prompt_language}>{item.prompt}</pre>
          </div>}
          <div className="previewSection" data-case-evidence="">
            <h3>{t.evidence}</h3>
            <p>{item.wechatEvidence}</p>
          </div>
          {related.length > 0 && <div className="previewActions">
            {related.map((other) => <button type="button" key={other.id} onClick={() => onOpen(other)}>
              {other['title_' + language]}
            </button>)}
          </div>}
          <div className="previewActions">
            {item.license_url && <a href={item.license_url} target="_blank" rel="noreferrer">{t.license} · {item.license}</a>}
            {item.page && <a data-case-link="guide" href={docsUrl + item.page} target="_blank" rel="noreferrer">{t.guide}</a>}
          </div>
          {!item.license_url && item.rights === 'creator_source_link_only' && <p className="gifNotice">{t.rightsLinkOnly}</p>}
          {relatedSources.length > 0 && (
            <details className="gifRelatedSources">
              <summary>{t.sourceDetails}</summary>
              <ul>{relatedSources.map((url) => <li key={url}><a href={url} target="_blank" rel="noreferrer">{url}</a></li>)}</ul>
            </details>
          )}
        </div>
      </section>
    </dialog>
  );
}

function App() {
  const [locationState, setLocationState] = useState(readLocation);
  const { language, query, category, route, onlyPlayable, activeId } = locationState;
  const [copiedId, setCopiedId] = useState('');
  const [notice, setNotice] = useState('');
  const t = labels[language];
  const localized = cases.map((item) => localizeCase(item, language));
  const active = localized.find((item) => item.id === activeId);
  const needle = query.trim().toLowerCase();
  const matching = localized.filter((item) =>
    (!category || item.category === category) && (!route || item.route === route) &&
    (!onlyPlayable || item.preview_url) &&
    [item.title_zh, item.title_en, item.author, item.categoryLabel, item.routeLabel, item.prompt,
      item.input_zh, item.input_en, item.description_zh, item.description_en].join(' ').toLowerCase().includes(needle)
  );

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    localStorage.setItem('gif-gallery-language', language);
  }, [language]);
  useEffect(() => {
    function onHistory() {
      setLocationState(readLocation());
      setNotice('');
    }
    if (!new URLSearchParams(location.search).has('case')) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView();
    }
    window.addEventListener('popstate', onHistory);
    return () => window.removeEventListener('popstate', onHistory);
  }, []);

  function changeView(changes) {
    const url = new URL(location.href);
    for (const [key, value] of Object.entries(changes)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    history.replaceState(history.state, '', url);
    setLocationState(readLocation());
  }

  function openCase(item) {
    if (active) changeView({ case: item.id });
    else {
      const url = new URL(location.href);
      url.searchParams.set('case', item.id);
      history.pushState({ galleryCase: true }, '', url);
      setLocationState(readLocation());
    }
    setNotice('');
  }

  function closeCase() {
    if (history.state?.galleryCase) history.back();
    else changeView({ case: null });
    setNotice('');
  }

  async function copyValue(value, id) {
    setCopiedId('');
    try {
      await copyToClipboard(value);
      setCopiedId(id);
      setNotice(t.copied);
    } catch {
      setNotice(id ? t.copyError : t.shareError);
    }
  }

  function clearFilters() {
    changeView({ q: '', category: '', route: '', playable: '' });
  }

  function shareCase(item) {
    const current = new URL(location.href);
    const url = item.featured ? new URL(`case/${item.id}/`, galleryRoot) : new URL(galleryRoot);
    url.search = current.search;
    url.searchParams.set('lang', language);
    if (item.featured) url.searchParams.delete('case');
    else url.searchParams.set('case', item.id);
    return copyValue(url.href, '');
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#"><WandSparkles size={21} />{t.brand}</a>
        <div className="topbarControls">
          <nav>
            <a href="#gallery">{t.navCases}</a>
            <a href="#sources">{t.navSources}</a>
            <a href={wechatUrl}>{t.wechat}</a>
            <a href={docsUrl + 'skills/README.md'}>{t.skills}</a>
            <a href={repoUrl}>GitHub</a>
          </nav>
          <LanguageSwitch language={language} setLanguage={(lang) => changeView({ lang })} />
        </div>
      </header>
      <Hero latestCases={featured.slice(0, 5).map((item) => localizeCase(item, language))} language={language}
        repoUrl={repoUrl} totalCases={playable.length} categoryCount={categoryIds.length} onOpenCase={openCase} />
      <section className="hotStrip" aria-label={t.featured}>
        {featured.map((item) => {
          const localizedItem = localizeCase(item, language);
          return <button type="button" key={item.id} aria-label={localizedItem.title} onClick={() => openCase(item)}>
            <Media item={localizedItem} language={language} eager /><span>{localizedItem.title}</span>
          </button>;
        })}
      </section>
      <section className="gallerySection" id="gallery">
        <div className="sectionHead">
          <div><span className="eyebrow">{t.sectionEyebrow}</span><h2>{t.sectionTitle}</h2></div>
          <div className="searchBox"><Search size={18} />
            <input id="case-search" value={query} onChange={(event) => changeView({ q: event.target.value })}
              placeholder={t.search} aria-label={t.search} type="search" />
          </div>
        </div>
        <div className="filterPanel">
          <div><strong>{t.category}</strong><div className="filterRow">
            <FilterPill active={!category} onClick={() => changeView({ category: '' })}>{t.all}</FilterPill>
            {categoryIds.map((id) => <FilterPill key={id} active={category === id} onClick={() => changeView({ category: id })}>
              {localized.find((item) => item.category === id).categoryLabel}
            </FilterPill>)}
          </div></div>
          <div><strong>{t.route}</strong><div className="filterRow">
            <FilterPill active={!route} onClick={() => changeView({ route: '' })}>{t.all}</FilterPill>
            {routeIds.map((id) => <FilterPill key={id} active={route === id} onClick={() => changeView({ route: id })}>
              {localized.find((item) => item.route === id).routeLabel}
            </FilterPill>)}
          </div></div>
        </div>
        <div className="resultBar">
          <span role="status">{matching.length} {t.matching}</span>
          <div className="filterRow">
            <FilterPill active={onlyPlayable} onClick={() => changeView({ playable: onlyPlayable ? '' : '1' })}>{t.onlyPlayable}</FilterPill>
            <button className="filterPill" type="button" onClick={clearFilters}>{t.clear}</button>
          </div>
        </div>
        {!active && notice && <p className="gifNotice" role="status">{notice}</p>}
        <div className="caseGrid">
          {matching.map((item) => <PromptCard key={item.id} caseItem={item} language={language}
            copied={copiedId === item.id} onOpen={openCase} onCopy={() => copyValue(item.prompt, item.id)} />)}
        </div>
        {matching.length === 0 && <p>{t.empty}</p>}
      </section>
      <SourceIndex language={language} records={sourceData.records} />
      <footer className="resultBar gifFooter">
        <a href={docsUrl + 'guides/monetization.md'}>{t.monetization}<ArrowUpRight size={16} /></a>
        <a href={docsUrl + 'LICENSES.md'}>{t.license}<ArrowUpRight size={16} /></a>
        <a href={repoUrl}>{t.githubProject}<ArrowUpRight size={16} /></a>
      </footer>
      {active && <CaseDialog item={active} language={language} notice={notice}
        onClose={closeCase} onOpen={openCase} onCopy={() => copyValue(active.prompt, active.id)}
        onShare={() => shareCase(active)} />}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
