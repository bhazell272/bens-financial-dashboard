import { useState } from 'react';
import { AskClaude, Empty } from '../ui';
import { useDay, useIndex, useMarkets } from '../lib/data';
import type { Quote } from '../lib/types';

const GROUPS: { id: Quote['group']; name: string }[] = [
  { id: 'banks', name: 'Banks' },
  { id: 'rates', name: 'Rates & currency' },
  { id: 'asia', name: 'Asia' },
  { id: 'global', name: 'Global' },
  { id: 'commodities', name: 'Commodities' },
];
const RANGES = ['1W', '1M', '6M', '1Y'] as const;

function fmt(n: number | null, d: number) {
  return n === null ? '—' : n.toLocaleString('en-AU', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function Change({ value }: { value: number | null | string }) {
  if (typeof value === 'string') return <span className="change flat num">{value}</span>;
  if (value === null) return <span className="change flat">Unavailable</span>;
  const dir = Math.abs(value) < 0.005 ? 'flat' : value > 0 ? 'up' : 'down';
  const label = dir === 'flat' ? '0.00%' : `${value > 0 ? '▲' : '▼'} ${Math.abs(value).toFixed(2)}%`;
  return (
    <span className={`change ${dir} num`} aria-label={dir === 'flat' ? 'unchanged' : `${dir} ${Math.abs(value).toFixed(2)} percent`}>
      {label}
    </span>
  );
}

function linePath(values: number[], w = 320, h = 110, pad = 6) {
  if (values.length < 2) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${((i / (values.length - 1)) * w).toFixed(1)} ${(pad + (1 - (v - min) / span) * (h - pad * 2)).toFixed(1)}`)
    .join(' ');
}

export default function Markets() {
  const { data: markets, loading } = useMarkets();
  const { data: index } = useIndex();
  const { data: day } = useDay(index?.latest ?? null);
  const [range, setRange] = useState<(typeof RANGES)[number]>('1M');
  const [all, setAll] = useState(false);

  if (loading) return <div className="page" aria-busy="true" />;

  const fetched = markets ? new Date(markets.fetchedAt) : null;
  const when = fetched
    ? fetched.toLocaleString('en-AU', { timeZone: 'Asia/Shanghai', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    : null;
  const extras = day?.markets?.extras ?? [];
  const shown = all ? GROUPS : GROUPS.slice(0, 3);
  const series = markets?.asx?.series[range] ?? [];

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="large-title">Markets</h1>
          <p className="subtitle">{when ? `At ${when} Shanghai · prices delayed` : 'Waiting for the first update'}</p>
        </div>
        <AskClaude context={`Today's market summary: ${day?.markets?.summary ?? 'not available'}.`} />
      </div>

      {day?.markets?.summary ? <p className="lede">{day.markets.summary}</p> : null}

      {!markets ? (
        <Empty title="No market data yet">Prices are fetched each weekday morning before the brief.</Empty>
      ) : (
        <>
          {markets.asx ? (
            <section className="panel" style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="caption" style={{ fontSize: 15 }}>
                    ASX 200
                  </div>
                  <div className="num" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em' }}>
                    {fmt(markets.asx.price, 1)}
                  </div>
                </div>
                <Change value={markets.asx.change} />
              </div>
              <svg className="chart" viewBox="0 0 320 110" preserveAspectRatio="none" role="img" aria-label={`ASX 200 over ${range}`}>
                <path d={linePath(series)} vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="segmented" role="group" aria-label="Chart range" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                {RANGES.map((r) => (
                  <button key={r} type="button" aria-pressed={range === r} onClick={() => setRange(r)}>
                    {r}
                  </button>
                ))}
              </div>
              {day?.markets?.forWestpac ? (
                <p className="feedback" style={{ fontSize: 15 }}>
                  <b style={{ fontWeight: 600, color: 'var(--ink)' }}>For Westpac · </b>
                  {day.markets.forWestpac}
                </p>
              ) : null}
            </section>
          ) : null}

          {shown.map((g) => {
            const rows = markets.quotes.filter((q) => q.group === g.id);
            const extra = g.id === 'rates' ? extras : [];
            if (!rows.length && !extra.length) return null;
            return (
              <section key={g.id}>
                <h2 className="group-title">{g.name}</h2>
                <div className="list">
                  {extra.map((x) => (
                    <div className="row" key={x.name}>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                        <span className="title" style={{ fontWeight: 600 }}>{x.name}</span>
                        <span className="sub">{x.sub}</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="num">{x.value}</span>
                        {x.change ? <Change value={x.change} /> : null}
                      </span>
                    </div>
                  ))}
                  {rows.map((q) => (
                    <div className="row" key={q.id}>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                        <span className="title" style={{ fontWeight: 600 }}>{q.name}</span>
                        <span className="sub">{q.sub}</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="num">{fmt(q.price, q.decimals)}</span>
                        <Change value={q.change} />
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
          <button type="button" className="link" style={{ margin: '16px 4px 0', fontSize: 15, minHeight: 44 }} onClick={() => setAll(!all)}>
            {all ? 'Show less' : 'Show global and commodities'}
          </button>
          <p className="footnote">Free price feeds can be delayed or missing. Missing prices show “Unavailable”, never a guess.</p>
        </>
      )}
    </div>
  );
}
