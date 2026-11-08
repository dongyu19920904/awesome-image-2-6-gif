/* Adapted from freestylefly/awesome-gpt-image-2 at 53d3927. See ../LICENSE. */
import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, ChevronDown, Copy, Eye, Github, MessageCircle, Sparkles } from 'lucide-react';
import { labels, Media, sourceData, wechatUrl } from './gallery-data.jsx';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Some embedded browsers block the async clipboard API. Fall back to the
      // older selection path so the copy button still works in local previews.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  if (!copied) throw new Error('Clipboard unavailable');
}

export function Hero({ latestCases, language, repoUrl, totalCases, categoryCount, onOpenCase }) {
  const t = labels[language];

  return (
    <section className="hero">
      <div className="heroGlow heroGlowA" />
      <div className="heroGlow heroGlowB" />
      <div className="scanGrid" />
      <div className="heroCopy">
        <div className="eyebrow">
          <Sparkles size={16} />
          {t.eyebrow}
        </div>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
        <div className="heroActions">
          <a className="primaryAction" href="#gallery">
            {t.explore}
            <ArrowUpRight size={18} />
          </a>
          <a className="secondaryAction" href={repoUrl} target="_blank" rel="noreferrer">
            <Github size={18} />
            {t.githubProject}
          </a>
          <a
            className="secondaryAction sponsorAction"
            href={wechatUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={t.wechat}
          >
            <MessageCircle size={18} />
            {t.wechat}
          </a>
        </div>
        <div className="metrics">
          <span><strong>{totalCases}</strong> {t.cases}</span>
          <span><strong>{categoryCount}</strong> {t.categories}</span>
          <span><strong>{sourceData.count}</strong> {t.sources}</span>
        </div>
      </div>
      <div className="heroDeck" aria-label={t.featured}>
        {latestCases.slice(0, 5).map((caseItem, index) => (
          <button
            className={`heroCard heroCard${index + 1}`}
            type="button"
            aria-label={`${language === 'zh' ? '打开案例' : 'Open case'} ${caseItem.id}: ${caseItem.title}`}
            onClick={() => onOpenCase(caseItem)}
            key={caseItem.id}
          >
            <Media item={caseItem} language={language} eager />
            <span>{caseItem.title}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function FilterPill({ active, children, onClick }) {
  return (
    <button className={cx('filterPill', active && 'active')} aria-pressed={active} type="button" onClick={onClick}>
      {children}
    </button>
  );
}

function useDropdownDismiss(open, setOpen) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, setOpen]);

  return ref;
}

export function LanguageSwitch({ language, setLanguage }) {
  const [open, setOpen] = useState(false);
  const ref = useDropdownDismiss(open, setOpen);
  const languageOptions = [
    { value: 'en', label: 'English', short: 'EN' },
    { value: 'zh', label: '中文', short: '中文' }
  ];
  const activeLanguage = languageOptions.find((option) => option.value === language) || languageOptions[0];

  return (
    <div className="dropdownControl languageSwitch" ref={ref}>
      <button
        className={cx('dropdownTrigger', open && 'open')}
        type="button"
        aria-label="Language"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{activeLanguage.short}</span>
        <ChevronDown size={15} />
      </button>
      {open ? (
        <div className="dropdownMenu languageMenu" role="menu">
          {languageOptions.map((option) => (
            <button
              className={cx(option.value === language && 'active')}
              type="button"
              role="menuitemradio"
              aria-checked={option.value === language}
              onClick={() => {
                setLanguage(option.value);
                setOpen(false);
              }}
              key={option.value}
            >
              <span>{option.label}</span>
              <strong>{option.short}</strong>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PromptCard({ caseItem, copied, language, onCopy, onOpen }) {
  const t = labels[language];
  return (
    <article className="caseCard">
      <button className="caseImage imageButton" type="button" onClick={() => onOpen(caseItem)} aria-label={caseItem.title}>
        <Media item={caseItem} language={language} />
        <span className="caseBadge">{caseItem.routeLabel}</span>
        <span className="imageHint"><Eye size={15} />{t.viewDetails}</span>
      </button>
      <div className="caseBody">
        <div className="caseMeta">
          <span>{caseItem.categoryLabel}</span>
          <a href={caseItem.source_url} target="_blank" rel="noreferrer">@{caseItem.author}</a>
        </div>
        <h3>{caseItem.title}</h3>
        <p>{caseItem.description}</p>
        <div className="tagRow">
          <span>{caseItem.input}</span>
          <span>{caseItem.preview_url ? t.playable : t.sourceOnly}</span>
        </div>
        <div className="cardActions caseActions">
          {caseItem.prompt ? (
            <button type="button" onClick={() => onCopy(caseItem)}>
              {copied ? <Check size={17} /> : <Copy size={17} />}
              {copied ? t.copied : t.copyPrompt}
            </button>
          ) : (
            <a href={caseItem.prompt_source || caseItem.source_url} target="_blank" rel="noreferrer">
              {caseItem.promptLabel}<ArrowUpRight size={16} />
            </a>
          )}
          <button type="button" onClick={() => onOpen(caseItem)}><Eye size={17} />{t.viewDetails}</button>
        </div>
      </div>
    </article>
  );
}
