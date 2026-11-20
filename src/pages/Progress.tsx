import { Back, Empty, Row } from '../ui';
import { useProgress } from '../lib/data';

function path(values: (number | null)[], max = 9, w = 320, h = 120, pad = 8) {
  const pts = values.map((v, i) => (v === null ? null : [(i / Math.max(values.length - 1, 1)) * w, pad + (1 - v / max) * (h - pad * 2)]));
  let d = '';
  let pen = false;
  for (const p of pts) {
    if (!p) {
      pen = false;
      continue;
    }
    d += `${pen ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)} `;
    pen = true;
  }
  return d;
}

export default function ProgressPage() {
  const { data: p, loading } = useProgress();
  if (loading) return <div className="page" aria-busy="true" />;
  return (
    <div className="page">
      <Back to="#/more" label="More" />
      <h1 className="large-title" style={{ marginTop: 8 }}>
        Progress
      </h1>
      {!p ? (
        <Empty title="Nothing to show yet">Progress fills in after your first few mornings.</Empty>
      ) : (
        <>
          <p className="lede">{p.summary}</p>

          {p.reasoning.length ? (
            <section className="panel" style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h2 className="h3" style={{ fontSize: 18 }}>
                  Prediction reasoning
                </h2>
                <span className="caption">out of 9, by week</span>
              </div>
              <svg viewBox="0 0 320 120" style={{ width: '100%', height: 120 }} role="img" aria-label="Your weekly reasoning score compared with Claude's">
                {[8, 60, 112].map((y) => (
                  <line key={y} x1="0" x2="320" y1={y} y2={y} stroke="var(--hair)" />
                ))}
                <path d={path(p.reasoning.map((r) => r.claude))} fill="none" stroke="var(--muted)" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" />
                <path d={path(p.reasoning.map((r) => r.you))} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{ display: 'flex', gap: 18 }} className="caption">
                <span style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--ink-2)' }}>
                  <span style={{ width: 16, height: 3, borderRadius: 2, background: 'var(--accent)' }} />
                  You
                </span>
                <span style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--ink-2)' }}>
                  <span style={{ width: 16, borderTop: '2px dashed var(--muted)' }} />
                  Claude
                </span>
              </div>
            </section>
          ) : null}

          <h2 className="group-title">Last 30 days</h2>
          <div className="list">
            <Row title="Mornings opened" right={<span className="num">{p.opened30} of 30</span>} />
            <Row title="Streak" right={<span className="num">{p.streak} in a row</span>} />
            <Row title="Quiz accuracy" right={<span className="num">{p.quizAccuracy === null ? '—' : `${p.quizAccuracy}%`}</span>} />
            <Row title="Written answers" right={<span className="num">{p.writtenAvg === null ? '—' : `${p.writtenAvg} / 10`}</span>} />
            <Row title="Predictions right" right={<span className="num">You {p.predictions.you} · Claude {p.predictions.claude}</span>} />
            <Row title="Chinese words known" right={<span className="num">{p.wordsKnown}</span>} />
          </div>

          {p.weakest.length ? (
            <>
              <h2 className="group-title">Practise more</h2>
              <div className="list">
                {p.weakest.map((w) => (
                  <div className="row" key={w.topic} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                    <span style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{w.topic}</span>
                      <span className="num muted">{w.accuracy}%</span>
                    </span>
                    <span className="progress" style={{ height: 6 }}>
                      <span style={{ width: `${w.accuracy}%`, background: 'var(--ink)' }} />
                    </span>
                  </div>
                ))}
              </div>
              <p className="footnote">Your lowest-scoring topics. Tomorrow's quiz leans on these.</p>
            </>
          ) : null}
          <p className="footnote">Updated {new Date(p.updated).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}.</p>
        </>
      )}
    </div>
  );
}
