import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, Copy, Link, Search, WandSparkles, X } from 'lucide-react';
import { FilterPill, Hero, LanguageSwitch, PromptCard, copyToClipboard } from './upstream-gallery.jsx';
import { cases, DetailMedia, docsUrl, labels, localizeCase, Media, repoUrl, sourceData, wechatUrl } from './gallery-data.jsx';
import SourceIndex from './SourceIndex.jsx';
import './styles.css';
import './gif-gallery.css';

const categoryIds = [...new Set(cases.map((item) => item.category))];
const routeIds = [...new Set(cases.map((item) => item.route))];
const playable = cases.filter((item) => item.preview_url);
const featured = playable.filter((item) => item.featured);

function readCase() {
  return new URLSearchParams(location.search).get('case');
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
          <div className="previewMeta"><span>{item.routeLabel}</span><span>{item.input}</span></div>
          <h2 id="preview-title">{item.title}</h2>
          <p>{item.description}</p>
          <div className="previewActions">
            {item.prompt && <button type="button" onClick={onCopy}><Copy size={17} />{t.copyPrompt}</button>}
            <a href={item.prompt_source || item.source_url} target="_blank" rel="noreferrer">
              {item.promptLabel}<ArrowUpRight size={17} />
            </a>
            <a href={item.source_url} target="_blank" rel="noreferrer">
              {t.original} · @{item.author}<ArrowUpRight size={17} />
            </a>
            <a href={docsUrl + item.next_step} target="_blank" rel="noreferrer">
              {t.nextStep}<ArrowUpRight size={17} />
            </a>
            <button type="button" onClick={onShare}><Link size={17} />{t.share}</button>
          </div>
          <span className="gifNotice" role="status">{notice}</span>
          {item.prompt && <div className="previewSection">
            <h3>{t.authorPrompt} · {item.prompt_language?.toUpperCase()}</h3>
            <pre className="promptBlock">{item.prompt}</pre>
          </div>}
          {related.length > 0 && <div className="previewActions">
            {related.map((other) => <button type="button" key={other.id} onClick={() => onOpen(other)}>
              {other['title_' + language]}
            </button>)}
          </div>}
          <div className="previewActions">
            {item.preview_url && <a href={item.preview_url} target="_blank" rel="noreferrer">{t.openGif}<ArrowUpRight size={17} /></a>}
            {item.license_url && <a href={item.license_url} target="_blank" rel="noreferrer">{t.license} · {item.license}</a>}
            {item.page && <a href={docsUrl + item.page} target="_blank" rel="noreferrer">{t.githubProject}</a>}
          </div>
        </div>
      </section>
    </dialog>
  );
}

function App() {
  const [language, setLanguage] = useState(() => localStorage.getItem('gif-gallery-language') === 'en' ? 'en' : 'zh');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [route, setRoute] = useState('');
  const [onlyPlayable, setOnlyPlayable] = useState(false);
  const [activeId, setActiveId] = useState(readCase);
  const [copiedId, setCopiedId] = useState('');
  const [notice, setNotice] = useState('');
  const t = labels[language];
  const localized = cases.map((item) => localizeCase(item, language));
  const active = localized.find((item) => item.id === activeId);
  const needle = query.trim().toLowerCase();
  const matching = localized.filter((item) =>
    (!category || item.category === category) && (!route || item.route === route) &&
    (!onlyPlayable || item.preview_url) &&
    [item.title_zh, item.title_en, item.author, item.categoryLabel, item.routeLabel, item.prompt].join(' ').toLowerCase().includes(needle)
  );

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    localStorage.setItem('gif-gallery-language', language);
  }, [language]);
  useEffect(() => {
    function onHistory() {
      setActiveId(readCase());
      setNotice('');
    }
    window.addEventListener('popstate', onHistory);
    return () => window.removeEventListener('popstate', onHistory);
  }, []);

  function openCase(item) {
    const url = new URL(location.href);
    url.searchParams.set('case', item.id);
    if (active) history.replaceState(history.state, '', url);
    else history.pushState({ galleryCase: true }, '', url);
    setActiveId(item.id);
    setNotice('');
  }

  function closeCase() {
    if (history.state?.galleryCase) history.back();
    else {
      const url = new URL(location.href);
      url.searchParams.delete('case');
      history.replaceState(null, '', url);
      setActiveId(null);
    }
    setNotice('');
  }

  async function copyValue(value, id) {
    setCopiedId('');
    try {
      await copyToClipboard(value);
      setCopiedId(id);
      setNotice(t.copied);
    } catch {
      setNotice(t.copyError);
    }
  }

  function clearFilters() {
    setQuery('');
    setCategory('');
    setRoute('');
    setOnlyPlayable(false);
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
          <LanguageSwitch language={language} setLanguage={setLanguage} />
        </div>
      </header>
      <Hero latestCases={featured.slice(0, 5).map((item) => localizeCase(item, language))} language={language}
        repoUrl={repoUrl} totalCases={playable.length} categoryCount={categoryIds.length} onOpenCase={openCase} />
      <section className="hotStrip" aria-label={t.featured}>
        {featured.map((item) => {
          const localizedItem = localizeCase(item, language);
          return <button type="button" key={item.id} aria-label={localizedItem.title} onClick={() => openCase(item)}>
            <Media item={localizedItem} language={language} /><span>{localizedItem.title}</span>
          </button>;
        })}
      </section>
      <section className="gallerySection" id="gallery">
        <div className="sectionHead">
          <div><span className="eyebrow">{t.sectionEyebrow}</span><h2>{t.sectionTitle}</h2></div>
          <div className="searchBox"><Search size={18} />
            <input id="case-search" value={query} onChange={(event) => setQuery(event.target.value)}
              placeholder={t.search} aria-label={t.search} type="search" />
          </div>
        </div>
        <div className="filterPanel">
          <div><strong>{t.category}</strong><div className="filterRow">
            <FilterPill active={!category} onClick={() => setCategory('')}>{t.all}</FilterPill>
            {categoryIds.map((id) => <FilterPill key={id} active={category === id} onClick={() => setCategory(id)}>
              {localized.find((item) => item.category === id).categoryLabel}
            </FilterPill>)}
          </div></div>
          <div><strong>{t.route}</strong><div className="filterRow">
            <FilterPill active={!route} onClick={() => setRoute('')}>{t.all}</FilterPill>
            {routeIds.map((id) => <FilterPill key={id} active={route === id} onClick={() => setRoute(id)}>
              {localized.find((item) => item.route === id).routeLabel}
            </FilterPill>)}
          </div></div>
        </div>
        <div className="resultBar">
          <span role="status">{matching.length} {t.matching}</span>
          <div className="filterRow">
            <FilterPill active={onlyPlayable} onClick={() => setOnlyPlayable(!onlyPlayable)}>{t.onlyPlayable}</FilterPill>
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
        onShare={() => copyValue(location.href, '')} />}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
