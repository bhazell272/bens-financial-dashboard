import { useIndex, usePrediction, useProgress } from '../lib/data';
import { usePredictionState } from '../lib/state';
import { getToken } from '../lib/sync';
import { askClaudeUrl, Row } from '../ui';

export default function More() {
  const { data: index } = useIndex();
  const week = index?.currentPrediction ?? null;
  const { data: prediction } = usePrediction(week);
  const [mine] = usePredictionState(week);
  const { data: progress } = useProgress();
  const synced = !!getToken();

  const predictionStatus = !prediction
    ? null
    : prediction.result
      ? 'Scored · see how you did'
      : mine.lockedAt
        ? 'Locked in · scored Friday'
        : 'Make your call';
  const record = progress ? `You ${progress.predictions.you} · Claude ${progress.predictions.claude} correct so far` : '';

  return (
    <div className="page">
      <h1 className="large-title">More</h1>

      {prediction ? (
        <a href="#/more/prediction" className="panel" style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 6, border: '1.5px solid var(--accent)' }}>
          <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 600 }}>This week's prediction</span>
            <span className="pill-tag" style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}>
              {predictionStatus}
            </span>
          </span>
          <span className="feedback" style={{ fontSize: 15 }}>
            {prediction.question}
          </span>
          {record ? <span className="caption">{record}</span> : null}
        </a>
      ) : null}

      <div className="list" style={{ marginTop: 24 }}>
        <Row href="#/more/progress" title="Progress" sub="Streak, quiz accuracy, you vs Claude" />
        <Row href="#/more/week" title="This week" sub="Friday digest of the week" />
        <Row href="#/more/careers" title="Careers" sub="Grad programs and deadlines" />
        <Row href="#/more/archive" title="Archive" sub="Every past morning" />
      </div>

      <div className="list" style={{ marginTop: 24 }}>
        <Row href="#/more/device" title="This device" right={<span className="muted">{synced ? 'Synced' : 'Not connected'}</span>} />
        <a className="row" href={askClaudeUrl('I have a question about finance or my studies.')} target="_blank" rel="noopener noreferrer">
          <span className="title">Ask Claude</span>
          <span className="muted">Opens Claude</span>
        </a>
      </div>
      <p className="footnote">Appearance follows your device's light or dark setting.</p>
    </div>
  );
}
