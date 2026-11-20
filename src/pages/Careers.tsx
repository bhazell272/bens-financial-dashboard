import { Back, Empty } from '../ui';
import { todayShanghai, useCareers } from '../lib/data';

function daysLeft(closes: string): number {
  const a = Date.parse(todayShanghai() + 'T00:00:00Z');
  const b = Date.parse(closes + 'T00:00:00Z');
  return Math.round((b - a) / 86400000);
}

export default function CareersPage() {
  const { data: c, loading } = useCareers();
  if (loading) return <div className="page" aria-busy="true" />;
  const soon = (c?.soon ?? []).filter((s) => daysLeft(s.closes) >= 0).sort((a, b) => (a.closes < b.closes ? -1 : 1));

  return (
    <div className="page">
      <Back to="#/more" label="More" />
      <h1 className="large-title" style={{ marginTop: 8 }}>
        Careers
      </h1>
      {!c ? (
        <Empty title="Nothing tracked yet">The careers check runs every Tuesday morning.</Empty>
      ) : (
        <>
          <p className="subtitle">Checked {new Date(c.checked).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })}</p>

          <h2 className="group-title">Closing soon</h2>
          {soon.length ? (
            <div className="list">
              {soon.map((s) => {
                const n = daysLeft(s.closes);
                const Tag = s.url ? 'a' : 'div';
                return (
                  <Tag className="row" key={s.name} {...(s.url ? { href: s.url, target: '_blank', rel: 'noopener noreferrer' } : {})}>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <span className="title" style={{ fontWeight: 600 }}>{s.name}</span>
                      <span className="sub">
                        {s.sub} · closes {new Date(s.closes + 'T00:00:00Z').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', timeZone: 'UTC' })}
                        {s.confirmed ? '' : ' (date unconfirmed)'}
                      </span>
                    </span>
                    <span className="pill-tag num" style={{ background: 'var(--accent-soft)', color: 'var(--accent-soft-ink)' }}>
                      {n === 0 ? 'Today' : n === 1 ? '1 day' : `${n} days`}
                    </span>
                  </Tag>
                );
              })}
            </div>
          ) : (
            <p className="footnote">Nothing closing in the next few weeks.</p>
          )}

          <h2 className="group-title">Programs you're watching</h2>
          <div className="list">
            {c.watch.map((w) => (
              <div className="row" key={w.name}>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span className="title">{w.name}</span>
                  <span className="sub">{w.sub}</span>
                </span>
                <span className="muted" style={{ fontSize: 14 }}>
                  {w.status}
                </span>
              </div>
            ))}
          </div>

          {c.events.length ? (
            <>
              <h2 className="group-title">Events</h2>
              <div className="list">
                {c.events.map((e, i) => (
                  <div className="row" key={i} style={{ justifyContent: 'flex-start', gap: 16, alignItems: 'baseline' }}>
                    <span style={{ width: 56, flex: 'none', fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>{e.date}</span>
                    <span style={{ lineHeight: 1.4 }}>
                      {e.url ? (
                        <a href={e.url} target="_blank" rel="noopener noreferrer">
                          {e.text}
                        </a>
                      ) : (
                        e.text
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
          <p className="footnote">Only dates confirmed on official pages, unless marked unconfirmed.</p>
        </>
      )}
    </div>
  );
}
