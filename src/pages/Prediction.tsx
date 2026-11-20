import { useState } from 'react';
import { Back, Empty } from '../ui';
import { decodeClaude, useIndex, usePrediction } from '../lib/data';
import { usePredictionState } from '../lib/state';
import type { RubricScore } from '../lib/types';

const RUBRIC: { key: keyof RubricScore; label: string }[] = [
  { key: 'evidence', label: 'Evidence used' },
  { key: 'mechanism', label: 'Cause and effect holds' },
  { key: 'risk', label: 'Main risk named' },
];
const total = (r?: RubricScore) => (r ? r.evidence + r.mechanism + r.risk : null);

export default function PredictionPage() {
  const { data: index } = useIndex();
  const week = index?.currentPrediction ?? null;
  const { data: p, loading } = usePrediction(week);
  const [mine, update] = usePredictionState(week);
  const [call, setCall] = useState<number | null>(null);
  const [why, setWhy] = useState('');

  if (loading) return <div className="page" aria-busy="true" />;
  if (!p) {
    return (
      <div className="page">
        <Back to="#/more" label="More" />
        <h1 className="large-title" style={{ marginTop: 8 }}>
          Prediction
        </h1>
        <Empty title="No prediction this week yet">A new question arrives on Monday morning.</Empty>
      </div>
    );
  }

  const locked = !!mine.lockedAt;
  const closed = Date.now() > Date.parse(p.closesAt);
  const claude = locked || closed ? decodeClaude(p.claude) : null;
  const r = p.result;

  return (
    <div className="page">
      <Back to="#/more" label="More" />
      <h1 className="large-title" style={{ marginTop: 8 }}>
        This week's prediction
      </h1>
      <p className="subtitle">
        {locked ? 'Locked in' : closed ? 'Closed' : `Locks ${new Date(p.closesAt).toLocaleString('en-AU', { timeZone: 'Asia/Shanghai', weekday: 'long', hour: 'numeric', minute: '2-digit' })}`} · scored Friday
      </p>

      <section className="panel" style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h2 className="h3" style={{ lineHeight: 1.3 }}>
          {p.question}
        </h2>
        {p.now ? <span className="caption">{p.now}</span> : null}

        {!locked && !closed ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
              {p.options.map((o, i) => (
                <button key={o} type="button" className={`option${call === i ? ' right' : ''}`} style={{ justifyContent: 'center', fontWeight: 600 }} aria-pressed={call === i} onClick={() => setCall(i)}>
                  {o}
                </button>
              ))}
            </div>
            <label htmlFor="why" style={{ fontWeight: 600 }}>
              Your justification
            </label>
            <span className="caption">What's your evidence? Through what cause and effect? What would prove you wrong?</span>
            <textarea id="why" className="answer" value={why} onChange={(e) => setWhy(e.target.value)} />
            <button
              type="button"
              className="btn primary block"
              disabled={call === null || why.trim().length < 40}
              onClick={() => update(() => ({ call: call!, justification: why.trim(), lockedAt: new Date().toISOString() }), `Prediction ${week}`)}
            >
              Lock in my call
            </button>
            <span className="caption">Claude's call stays hidden until you lock yours in.</span>
          </>
        ) : (
          <>
            <div>
              <div className="caption">Your call</div>
              <div style={{ fontWeight: 600, fontSize: 17 }}>{mine.call !== undefined ? p.options[mine.call] : 'No call made'}</div>
              {mine.justification ? <p className="feedback" style={{ marginTop: 4 }}>{mine.justification}</p> : null}
            </div>
            {claude ? (
              <div style={{ borderTop: '1px solid var(--hair)', paddingTop: 14 }}>
                <div className="caption">Claude's call</div>
                <div style={{ fontWeight: 600, fontSize: 17 }}>{p.options[claude.call]}</div>
                <p className="feedback" style={{ marginTop: 4 }}>{claude.justification}</p>
              </div>
            ) : null}
          </>
        )}
      </section>

      {r ? (
        <>
          <h2 className="group-title">Friday review</h2>
          <section className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p className="feedback" style={{ color: 'var(--ink)' }}>
              Result: <b>{p.options[r.answer]}</b> · {r.actual}
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
              <thead>
                <tr className="caption">
                  <th style={{ textAlign: 'left', fontWeight: 500, padding: '6px 0' }}>Reasoning</th>
                  <th style={{ fontWeight: 600, color: 'var(--ink)' }}>You</th>
                  <th style={{ fontWeight: 600, color: 'var(--ink)' }}>Claude</th>
                </tr>
              </thead>
              <tbody className="num">
                {RUBRIC.map((k) => (
                  <tr key={k.key} style={{ borderTop: '1px solid var(--hair)' }}>
                    <td style={{ padding: '10px 0' }}>{k.label}</td>
                    <td style={{ textAlign: 'center' }}>{r.you ? `${r.you[k.key]}/3` : '—'}</td>
                    <td style={{ textAlign: 'center' }}>{r.claude[k.key]}/3</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '1.5px solid var(--ink)', fontWeight: 700 }}>
                  <td style={{ padding: '10px 0' }}>Total</td>
                  <td style={{ textAlign: 'center' }}>{total(r.you) ?? '—'}/9</td>
                  <td style={{ textAlign: 'center' }}>{total(r.claude)}/9</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0' }}>Right call?</td>
                  <td style={{ textAlign: 'center' }}>{mine.call === undefined ? '—' : mine.call === r.answer ? 'Yes' : 'No'}</td>
                  <td style={{ textAlign: 'center' }}>{claude ? (claude.call === r.answer ? 'Yes' : 'No') : '—'}</td>
                </tr>
              </tbody>
            </table>
            <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <b style={{ fontSize: 14 }}>What Claude saw that you didn't</b>
              <span className="feedback" style={{ fontSize: 15 }}>{r.claudeSaw}</span>
              {r.youSaw ? (
                <>
                  <b style={{ fontSize: 14, marginTop: 6 }}>What you saw that Claude didn't</b>
                  <span className="feedback" style={{ fontSize: 15 }}>{r.youSaw}</span>
                </>
              ) : null}
            </div>
            <span className="caption">Reasoning is scored apart from being right: a good argument can lose to a noisy week.</span>
          </section>
        </>
      ) : null}
    </div>
  );
}
