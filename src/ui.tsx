import type { ReactNode } from 'react';

// Stroke icons, one weight (1.75), drawn on a 24px grid.
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const Icon = {
  brief: () => (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...P}>
      <path d="M4 5h13v14H6a2 2 0 0 1-2-2z" /><path d="M17 9h3v8a2 2 0 0 1-2 2" /><path d="M8 9h5M8 13h5" />
    </svg>
  ),
  quiz: () => (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...P}>
      <circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.5v.4" /><path d="M12 17h.01" />
    </svg>
  ),
  markets: () => (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...P}>
      <path d="M3 17l5-5 4 3 8-8" /><path d="M15 7h5v5" />
    </svg>
  ),
  chinese: () => (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...P}>
      <path d="M4 5h9v7H8l-4 3z" /><path d="M13 9h7v7l-3-2h-4a2 2 0 0 1-2-2" />
    </svg>
  ),
  more: () => (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...P}>
      <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
    </svg>
  ),
  sparkle: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...P}>
      <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
    </svg>
  ),
  close: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...P} strokeWidth={2}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  check: () => (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" {...P} strokeWidth={2.25}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  ),
  arrow: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...P} strokeWidth={2}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  chevron: () => (
    <svg className="chev" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" {...P} strokeWidth={2}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),
  back: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...P} strokeWidth={2}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  ),
  dot: ({ done }: { done: boolean }) => (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" fill={done ? 'var(--accent)' : 'none'} stroke={done ? 'var(--accent)' : 'var(--hair-strong)'} strokeWidth="1.25" />
    </svg>
  ),
};

/** Opens claude.ai (or the Claude app on a phone) with the page's context filled in. Uses the user's own subscription. */
export function askClaudeUrl(context: string): string {
  const prompt = `I'm reading my morning finance briefing. ${context}\n\nMy question: `;
  return `https://claude.ai/new?q=${encodeURIComponent(prompt.slice(0, 6000))}`;
}

export function AskClaude({ context }: { context: string }) {
  return (
    <a className="icon-btn" href={askClaudeUrl(context)} target="_blank" rel="noopener noreferrer" aria-label="Ask Claude about this page">
      <Icon.sparkle />
    </a>
  );
}

export function Back({ to, label }: { to: string; label: string }) {
  return (
    <a className="back" href={to}>
      <Icon.back />
      {label}
    </a>
  );
}

export function Row({ href, title, sub, right }: { href?: string; title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  const inner = (
    <>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span className="title">{title}</span>
        {sub ? <span className="sub">{sub}</span> : null}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
        {right}
        {href ? <Icon.chevron /> : null}
      </span>
    </>
  );
  return href ? (
    <a className="row" href={href}>
      {inner}
    </a>
  ) : (
    <div className="row">{inner}</div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="panel" style={{ marginTop: 24 }}>
      <h2 className="h3">{title}</h2>
      {children ? <p className="feedback" style={{ marginTop: 8 }}>{children}</p> : null}
    </div>
  );
}

export function Sources({ sources }: { sources: { title: string; url: string; paywalled?: boolean }[] }) {
  if (!sources?.length) return null;
  return (
    <span className="src">
      {sources.map((s, i) => (
        <span key={s.url + i}>
          {i > 0 ? ' · ' : ''}
          <a href={s.url} target="_blank" rel="noopener noreferrer">
            {s.title}
          </a>
          {s.paywalled ? ' (paywalled)' : ''}
        </span>
      ))}
    </span>
  );
}
