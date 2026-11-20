import { useEffect, useState } from 'react';
import { Back } from '../ui';
import { getToken, onSyncStatus, setToken, testToken, type SyncStatus } from '../lib/sync';

const STEPS = [
  'On GitHub, open Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.',
  'Repository access: Only select repositories → bens-financial-dashboard.',
  'Permissions → Repository permissions → Contents: Read and write. Nothing else.',
  'Set an expiry you are comfortable with (a year is fine), generate, and copy the token.',
  'Paste it below on each device: phone and laptop.',
];

export default function Device() {
  const [has, setHas] = useState(!!getToken());
  const [value, setValue] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ s: SyncStatus; d?: string }>({ s: 'local' });
  useEffect(() => onSyncStatus((s, d) => setStatus({ s, d })) as () => void, []);

  const save = async () => {
    setBusy(true);
    const r = await testToken(value);
    setBusy(false);
    setMsg({ ok: r.ok, text: r.message });
    if (r.ok) {
      setToken(value);
      setHas(true);
      setValue('');
    }
  };

  return (
    <div className="page">
      <Back to="#/more" label="More" />
      <h1 className="large-title" style={{ marginTop: 8 }}>
        This device
      </h1>
      <p className="lede">
        {has
          ? 'Connected. Quiz answers, flashcard progress and predictions sync with your other devices.'
          : 'Connect once on each device so your answers and flashcard progress follow you between phone and laptop. Without it, everything still works but stays on this device.'}
      </p>
      {has && status.s === 'error' ? (
        <div className="banner" role="alert">
          The last save didn't reach GitHub ({status.d}). It's kept on this device and will be retried on your next change.
        </div>
      ) : null}

      {!has ? (
        <>
          <h2 className="group-title">Make a token</h2>
          <ol className="list" style={{ padding: '6px 16px 6px 36px', margin: 0 }}>
            {STEPS.map((s) => (
              <li key={s} style={{ padding: '8px 0', lineHeight: 1.45 }}>
                {s}
              </li>
            ))}
          </ol>
          <label htmlFor="token" className="group-title" style={{ display: 'block' }}>
            Paste it here
          </label>
          <input
            id="token"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="github_pat_…"
            style={{ width: '100%', font: 'inherit', fontSize: 16, padding: 14, borderRadius: 14, border: '1px solid var(--hair-strong)', background: 'var(--surface)', color: 'var(--ink)' }}
          />
          <button type="button" className="btn primary block" style={{ marginTop: 12 }} disabled={busy || value.trim().length < 20} onClick={save}>
            {busy ? 'Checking…' : 'Connect this device'}
          </button>
        </>
      ) : (
        <button
          type="button"
          className="btn outline block"
          style={{ marginTop: 22 }}
          onClick={() => {
            setToken(null);
            setHas(false);
            setMsg(null);
          }}
        >
          Disconnect this device
        </button>
      )}
      {msg ? (
        <p className="footnote" role="status" style={{ color: msg.ok ? 'var(--up)' : 'var(--down)' }}>
          {msg.text}
        </p>
      ) : null}
      <p className="footnote">The token is stored only in this browser. It can only touch this one repository. Anyone with this unlocked device could edit your scores, nothing more.</p>
    </div>
  );
}
