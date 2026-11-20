import { AskClaude, Back, Empty, Row, Sources } from '../ui';
import { useIndex, useWeek } from '../lib/data';

export default function WeekPage({ id }: { id: string | null }) {
  const { data: index } = useIndex();
  const weekId = id ?? index?.weeks[0] ?? null;
  const { data: w, loading } = useWeek(weekId);
  const others = (index?.weeks ?? []).filter((x) => x !== weekId);

  if (loading) return <div className="page" aria-busy="true" />;
  return (
    <div className="page">
      <Back to={id ? '#/more/week' : '#/more'} label={id ? 'This week' : 'More'} />
      {!w ? (
        <>
          <h1 className="large-title" style={{ marginTop: 8 }}>
            This week
          </h1>
          <Empty title="No digest yet">The weekly digest arrives on Friday evening.</Empty>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8 }}>
            <div>
              <h1 className="large-title">{id ? 'Week of ' + w.range : 'This week'}</h1>
              <p className="subtitle">
                {w.range} · {w.readMinutes} min read
              </p>
            </div>
            <AskClaude context={`This week's summary: ${w.paragraph}`} />
          </div>
          <p className="lede" style={{ fontSize: 18, lineHeight: 1.5 }}>
            {w.paragraph}
          </p>

          <h2 className="group-title">What changed</h2>
          <div className="list">
            {w.changes.map((c, i) => (
              <div className="row" key={i} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
                <span className="sub">{c.topic}</span>
                <span style={{ lineHeight: 1.4 }}>{c.text}</span>
              </div>
            ))}
          </div>

          <h2 className="group-title">Connecting the dots</h2>
          <p className="feedback" style={{ margin: '0 4px', lineHeight: 1.55 }}>
            {w.dots}
          </p>

          <h2 className="group-title">Next week</h2>
          <div className="list">
            {w.next.map((n, i) => (
              <div className="row" key={i} style={{ justifyContent: 'flex-start', gap: 16, alignItems: 'baseline' }}>
                <span style={{ width: 44, flex: 'none', fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>{n.day}</span>
                <span style={{ lineHeight: 1.4 }}>{n.text}</span>
              </div>
            ))}
          </div>
          <div className="story" style={{ borderBottom: 0 }}>
            <Sources sources={w.sources} />
          </div>
        </>
      )}
      {!id && others.length ? (
        <>
          <h2 className="group-title">Previous weeks</h2>
          <div className="list">
            {others.slice(0, 12).map((x) => (
              <Row key={x} href={`#/more/week/${x}`} title={`Week of ${x}`} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
