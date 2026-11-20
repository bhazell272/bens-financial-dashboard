import { Back, Empty, Row } from '../ui';
import { longDate, useIndex } from '../lib/data';

export default function Archive() {
  const { data: index, loading } = useIndex();
  if (loading) return <div className="page" aria-busy="true" />;
  const days = index?.days ?? [];
  const byMonth = new Map<string, string[]>();
  for (const d of days) {
    const key = new Date(d + 'T00:00:00Z').toLocaleDateString('en-AU', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    byMonth.set(key, [...(byMonth.get(key) ?? []), d]);
  }
  return (
    <div className="page">
      <Back to="#/more" label="More" />
      <h1 className="large-title" style={{ marginTop: 8 }}>
        Archive
      </h1>
      {!days.length ? <Empty title="Nothing archived yet">Every morning's brief is kept here.</Empty> : null}
      {[...byMonth].map(([month, list]) => (
        <section key={month}>
          <h2 className="group-title">{month}</h2>
          <div className="list">
            {list.map((d) => (
              <Row key={d} href={`#/more/archive/${d}`} title={longDate(d)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
