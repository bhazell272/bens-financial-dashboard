import { useEffect, useState } from 'react';
import { Empty, Icon } from '../ui';
import { useDay, useIndex } from '../lib/data';
import { useDayState } from '../lib/state';
import type { QuizMC } from '../lib/types';

export default function Quiz() {
  const { data: index } = useIndex();
  const day = index?.latest ?? null;
  const { data, loading } = useDay(day);
  const [state, update] = useDayState(day);
  const [step, setStep] = useState<number | null>(null);
  const [draft, setDraft] = useState('');

  const quiz = data?.quiz ?? [];
  const answers = state.quiz;

  // Resume at the first unanswered question.
  useEffect(() => {
    if (step === null && data) {
      const first = quiz.findIndex((q) => answers[q.id] === undefined);
      setStep(first === -1 ? quiz.length : first);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (loading || (data && step === null)) return <div className="page focus" aria-busy="true" />;
  if (!data || !quiz.length) {
    return (
      <div className="page focus">
        <Head step={0} total={0} />
        <Empty title="No quiz yet">It arrives with the morning brief.</Empty>
      </div>
    );
  }

  const i = step ?? 0;

  if (i >= quiz.length) {
    const mcs = quiz.filter((q): q is QuizMC => q.type === 'mc');
    const right = mcs.filter((q) => answers[q.id] === q.answer).length;
    return (
      <div className="page focus">
        <Head step={quiz.length} total={quiz.length} />
        <main style={{ flex: 1, paddingTop: 36, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h1 className="question">
            {right} of {mcs.length} right
          </h1>
          <p className="feedback">Your written answer is marked tomorrow morning. Questions you missed come back in a few days.</p>
          {data.marked ? (
            <section className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="caption">Yesterday's written answer</span>
              <span className="h3 num">{data.marked.score} / 10</span>
              <p className="feedback" style={{ fontWeight: 600, color: 'var(--ink)' }}>
                {data.marked.q}
              </p>
              <p className="feedback">{data.marked.feedback}</p>
              <details>
                <summary className="link" style={{ cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center' }}>
                  Model answer
                </summary>
                <p className="feedback">{data.marked.model}</p>
              </details>
            </section>
          ) : null}
        </main>
        <div style={{ display: 'grid', gap: 10, paddingTop: 16 }}>
          <a className="btn primary block" href="#/markets">
            Next: Markets
          </a>
          <button type="button" className="btn outline block" onClick={() => setStep(0)}>
            Review answers
          </button>
        </div>
      </div>
    );
  }

  const q = quiz[i];
  const answered = answers[q.id];
  const next = () => {
    setDraft('');
    setStep(i + 1);
  };

  return (
    <div className="page focus">
      <Head step={i + 1} total={quiz.length} />
      <main style={{ flex: 1, paddingTop: 32, display: 'flex', flexDirection: 'column', gap: 26 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span className="caption" style={{ fontSize: 14 }}>
            {q.type === 'written' ? 'Explain why · marked tomorrow' : q.from ?? 'From recent news'}
          </span>
          <h1 className="question">{q.q}</h1>
        </div>

        {q.type === 'mc' ? (
          <>
            <div className="options">
              {q.options.map((o, k) => {
                const cls = answered === undefined ? '' : k === q.answer ? ' right' : k === answered ? ' wrong' : '';
                return (
                  <button
                    type="button"
                    key={k}
                    className={`option${cls}`}
                    disabled={answered !== undefined}
                    onClick={() => update((s) => ({ ...s, quiz: { ...s.quiz, [q.id]: k } }), `Quiz ${q.id}`)}
                  >
                    <span>{o}</span>
                    {answered !== undefined && k === q.answer ? (
                      <span style={{ color: 'var(--up)' }} aria-label="Correct answer">
                        <Icon.check />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {answered !== undefined ? (
              <p className="feedback" aria-live="polite">
                {answered === q.answer ? <b className="ok">Correct. </b> : <b className="no">Not quite. </b>}
                {q.explain} <a className="link" href="#/brief">Re-read the brief</a>
              </p>
            ) : null}
          </>
        ) : (
          <>
            <label className="sr-only" htmlFor="written">
              Your answer
            </label>
            <textarea
              id="written"
              className="answer"
              placeholder="A few sentences: what happens, and why."
              value={typeof answered === 'string' ? answered : draft}
              readOnly={typeof answered === 'string'}
              onChange={(e) => setDraft(e.target.value)}
            />
          </>
        )}
      </main>

      <div style={{ paddingTop: 16 }}>
        {q.type === 'written' && answered === undefined ? (
          <button
            type="button"
            className="btn primary block"
            disabled={draft.trim().length < 20}
            onClick={() => {
              update((s) => ({ ...s, quiz: { ...s.quiz, [q.id]: draft.trim() } }), `Written answer ${q.id}`);
              next();
            }}
          >
            Submit answer
          </button>
        ) : (
          <button type="button" className="btn primary block" disabled={answered === undefined} onClick={next}>
            {i === quiz.length - 1 ? 'See results' : 'Next question'}
          </button>
        )}
      </div>
    </div>
  );
}

function Head({ step, total }: { step: number; total: number }) {
  return (
    <header className="focus-head">
      <a className="icon-btn" href="#/brief" aria-label="Close quiz">
        <Icon.close />
      </a>
      <div className="steps" role="img" aria-label={`Question ${step} of ${total}`}>
        {Array.from({ length: total }, (_, k) => (
          <span key={k} className={k < step ? 'on' : ''} />
        ))}
      </div>
      <span className="caption num" style={{ fontSize: 14 }}>
        {Math.min(step, total)} / {total}
      </span>
    </header>
  );
}
