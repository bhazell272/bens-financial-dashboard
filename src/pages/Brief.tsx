import { useEffect, useState } from 'react';
import { AskClaude, Back, Empty, Icon, Sources } from '../ui';
import { greeting, longDate, todayShanghai, useDay, useIndex } from '../lib/data';
import { useDayState } from '../lib/state';

const NAME = 'Ben';
const PREF = 'dfnw.headlinesOnly';

export default function Brief({ date }: { date?: string }) {
  const { data: index, loading: indexLoading } = useIndex();
  const day = date ?? index?.latest ?? null;
  const { data, loading } = useDay(day);
  const [state, update] = useDayState(day);
  const [headlinesOnly, setHeadlinesOnly] = useState(() => {
    try {
      return localStorage.getItem(PREF) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(PREF, headlinesOnly ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [headlinesOnly]);

  // Record that this morning's brief was opened (feeds the streak).
  useEffect(() => {
    if (!date && day && data && !state.opened) update((s) => ({ ...s, opened: new Date().toISOString() }), `Opened ${day}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, data]);

  if (indexLoading || loading) return <div className="page" aria-busy="true" />;

  if (!data) {
    return (
      <div className="page">
        <h1 className="large-title">{greeting()}, {NAME}</h1>
        <Empty title="No briefing yet">
          The first one arrives around 7am Shanghai time on a weekday. <a className="link" href="?demo#/brief">Preview with sample content</a>
        </Empty>
      </div>
    );
  }

  const sections = data.sections;
  const read = new Set(state.read);
  const readCount = sections.filter((s) => read.has(s.id)).length;
  const minsLeft = sections.filter((s) => !read.has(s.id)).reduce((n, s) => n + s.minutes, 0);
  const stale = !date && data.date !== todayShanghai();

  const markRead = (id: string) => {
    update((s) => ({ ...s, read: Array.from(new Set([...s.read, id])) }), `Read ${id} on ${day}`);
    const i = sections.findIndex((s) => s.id === id);
    const next = sections.slice(i + 1).find((s) => !read.has(s.id));
    if (next) document.getElementById(`s-${next.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else document.getElementById('up-next')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const jump = (id: string) => document.getElementById(`s-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const context = `Today's top stories: ${data.top.map((t) => t.h).join('; ')}.`;

  return (
    <div className="page wide">
      <div className="brief-layout">
        <aside className="brief-rail" aria-label="Sections">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="caption">
              {readCount} of {sections.length} read · {minsLeft} min left
            </span>
            <div className="progress">
              <span style={{ width: `${(readCount / Math.max(sections.length, 1)) * 100}%` }} />
            </div>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column' }}>
            {sections.map((s) => (
              <a key={s.id} href={`#s-${s.id}`} onClick={(e) => (e.preventDefault(), jump(s.id))} className={`rail-link${read.has(s.id) ? ' done' : ''}`}>
                <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Icon.dot done={read.has(s.id)} />
                  {s.name}
                </span>
                <span className="caption num">{s.minutes} min</span>
              </a>
            ))}
          </nav>
        </aside>

        <main className={`brief-main${headlinesOnly ? ' headlines-only' : ''}`}>
          {date ? <Back to="#/more/archive" label="Archive" /> : null}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <h1 className="large-title">{date ? longDate(data.date) : `${greeting()}, ${NAME}`}</h1>
              <p className="subtitle">
                {date ? 'From the archive' : longDate(data.date)} · about {data.readMinutes} min
              </p>
            </div>
            <AskClaude context={context} />
          </div>

          {stale ? <div className="banner">Showing {longDate(data.date)}. Today's update hasn't arrived yet.</div> : null}

          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }} className="phone-only-progress">
            <div style={{ display: 'flex', justifyContent: 'space-between' }} className="caption">
              <span>
                {readCount} of {sections.length} read
              </span>
              <span>{minsLeft} min left</span>
            </div>
            <div className="progress">
              <span style={{ width: `${(readCount / Math.max(sections.length, 1)) * 100}%` }} />
            </div>
          </div>

          <div className="segmented" role="group" aria-label="Reading mode" style={{ marginTop: 16 }}>
            <button type="button" aria-pressed={!headlinesOnly} onClick={() => setHeadlinesOnly(false)}>
              Full
            </button>
            <button type="button" aria-pressed={headlinesOnly} onClick={() => setHeadlinesOnly(true)}>
              Headlines only
            </button>
          </div>

          <nav className="chips" aria-label="Jump to section">
            {sections.map((s) => (
              <button key={s.id} type="button" className={`chip${read.has(s.id) ? ' done' : ''}`} onClick={() => jump(s.id)}>
                {s.name}
              </button>
            ))}
          </nav>

          <section className="panel top3" style={{ marginTop: 22 }}>
            <h2 className="h3">What matters today</h2>
            {data.top.map((t, i) => (
              <div className="top3-item" key={i}>
                <span className="top3-n">{i + 1}</span>
                <div>
                  <div className="top3-h">{t.h}</div>
                  <div className="top3-d">{t.d}</div>
                </div>
              </div>
            ))}
          </section>

          {sections.map((s) => (
            <section className="section" id={`s-${s.id}`} key={s.id} aria-labelledby={`h-${s.id}`}>
              <div className="section-head">
                <h2 className="h2" id={`h-${s.id}`}>
                  {s.name}
                </h2>
                <span className="caption">{s.minutes} min</span>
              </div>
              {s.items.length === 0 && s.background ? (
                <article className="story">
                  <h3>{s.background.h}</h3>
                  <p>{s.background.d}</p>
                  <span className="src">Nothing new today · background</span>
                </article>
              ) : null}
              {s.items.map((it, i) => (
                <article className="story" key={i}>
                  <h3>{it.h}</h3>
                  <p>{it.d}</p>
                  <p className="why">
                    <b>Why it matters · </b>
                    {it.why}
                  </p>
                  {it.mention ? <span className="mention">Worth mentioning: {it.mention}</span> : null}
                  <Sources sources={it.sources} />
                </article>
              ))}
              {!date ? (
                <button type="button" className="btn outline pill" style={{ marginTop: 14 }} onClick={() => markRead(s.id)} disabled={read.has(s.id)}>
                  {read.has(s.id) ? (
                    <>
                      <Icon.check /> Read
                    </>
                  ) : (
                    'Mark read · next section'
                  )}
                </button>
              ) : null}
            </section>
          ))}

          {data.primer.length ? (
            <section className="section" aria-labelledby="h-primer">
              <div className="section-head">
                <h2 className="h2" id="h-primer">
                  Grad primer
                </h2>
              </div>
              {data.primer.map((p, i) => (
                <article className="story" key={i}>
                  <h3>{p.term}</h3>
                  <p>{p.text}</p>
                </article>
              ))}
            </section>
          ) : null}

          {!date ? (
            <a className="next-card" id="up-next" href="#/quiz">
              <span>
                <small>When you're done</small>
                <strong>Take today's quiz · {data.quiz.length} questions</strong>
              </span>
              <Icon.arrow />
            </a>
          ) : null}
        </main>
      </div>
    </div>
  );
}
