import { useRef, useState } from 'react';
import { Back } from '../ui';
import { useApproved, usePending } from '../lib/state';
import { getToken, uploadPdf } from '../lib/sync';
import type { Card } from '../lib/types';

export default function ReviewCards() {
  const [pending, setPending] = usePending();
  const [, setApproved] = useApproved();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const approve = (cards: Card[]) => {
    const ids = new Set(cards.map((c) => c.id));
    setApproved((s) => ({ ...s, cards: [...s.cards.filter((c) => !ids.has(c.id)), ...cards] }), `Approve ${cards.length} cards`);
    setPending((s) => ({ ...s, cards: s.cards.filter((c) => !ids.has(c.id)) }), `Clear ${cards.length} approved cards`);
  };
  const remove = (id: string) => setPending((s) => ({ ...s, cards: s.cards.filter((c) => c.id !== id) }), `Delete card ${id}`);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      await uploadPdf(file);
      setMsg({ ok: true, text: `Uploaded ${file.name}. Its cards will be here for you to approve after tomorrow morning's run.` });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Upload failed.' });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className="page">
      <Back to="#/chinese" label="Chinese" />
      <h1 className="large-title" style={{ marginTop: 8 }}>
        New cards
      </h1>
      <p className="lede">Upload a vocab list or lesson PDF. The next morning run pulls out the words; you approve them here before they join your deck.</p>

      <input ref={input} type="file" accept="application/pdf" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      <button type="button" className="btn outline block" style={{ marginTop: 18 }} disabled={busy} onClick={() => input.current?.click()}>
        {busy ? 'Uploading…' : 'Choose a PDF'}
      </button>
      {!getToken() ? <p className="footnote">Connect this device first (More → This device) so uploads can be saved.</p> : null}
      {msg ? (
        <p className="footnote" role="status" style={{ color: msg.ok ? 'var(--up)' : 'var(--down)' }}>
          {msg.text}
        </p>
      ) : null}
      <p className="footnote">The repository is public, so upload textbook material only, nothing personal.</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 className="group-title">To approve · {pending.cards.length}</h2>
        {pending.cards.length > 1 ? (
          <button type="button" className="link" style={{ minHeight: 44 }} onClick={() => approve(pending.cards)}>
            Add all
          </button>
        ) : null}
      </div>
      {pending.cards.length ? (
        <div className="list">
          {pending.cards.map((c) => (
            <div className="row" key={c.id}>
              <span style={{ display: 'flex', gap: 14, alignItems: 'center', minWidth: 0 }}>
                <span className="han" lang="zh-Hans" style={{ fontSize: 20, minWidth: 56 }}>
                  {c.hz}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ color: 'var(--accent)', fontSize: 14 }}>{c.py}</span>
                  <span className="sub" style={{ color: 'var(--ink-2)', fontSize: 14 }}>
                    {c.en}
                  </span>
                </span>
              </span>
              <span style={{ display: 'flex', gap: 6, flex: 'none' }}>
                <button type="button" className="btn outline pill" onClick={() => remove(c.id)} aria-label={`Delete ${c.hz}`}>
                  Delete
                </button>
                <button type="button" className="btn primary pill" onClick={() => approve([c])} aria-label={`Add ${c.hz}`}>
                  Add
                </button>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="footnote">Nothing waiting. Upload a PDF above.</p>
      )}
    </div>
  );
}
