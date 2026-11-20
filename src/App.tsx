import { useEffect, useState } from 'react';
import { Icon } from './ui';
import { DEMO } from './lib/data';
import Brief from './pages/Brief';
import Quiz from './pages/Quiz';
import Markets from './pages/Markets';
import Chinese from './pages/Chinese';
import Study from './pages/Study';
import ReviewCards from './pages/ReviewCards';
import More from './pages/More';
import ProgressPage from './pages/Progress';
import WeekPage from './pages/Week';
import CareersPage from './pages/Careers';
import Archive from './pages/Archive';
import PredictionPage from './pages/Prediction';
import Device from './pages/Device';

// Hash routes keep the site working from any folder (GitHub Pages, localhost)
// and when opened from the home screen.
function useRoute(): string[] {
  const read = () => (location.hash.replace(/^#\/?/, '') || 'brief').split('/').filter(Boolean);
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

const TABS = [
  { id: 'brief', label: 'Brief', icon: Icon.brief },
  { id: 'quiz', label: 'Quiz', icon: Icon.quiz },
  { id: 'markets', label: 'Markets', icon: Icon.markets },
  { id: 'chinese', label: '中文', icon: Icon.chinese },
  { id: 'more', label: 'More', icon: Icon.more },
] as const;

export default function App() {
  const route = useRoute();
  const [top, sub, arg] = route;
  const demoLink = (id: string) => `${DEMO ? '?demo' : ''}#/${id}`;

  // Quiz and flashcard study are focus screens: no navigation chrome.
  const focus = top === 'quiz' || (top === 'chinese' && sub === 'study');

  let page;
  switch (top) {
    case 'quiz':
      page = <Quiz />;
      break;
    case 'markets':
      page = <Markets />;
      break;
    case 'chinese':
      page = sub === 'study' ? <Study /> : sub === 'review' ? <ReviewCards /> : <Chinese />;
      break;
    case 'more':
      if (sub === 'progress') page = <ProgressPage />;
      else if (sub === 'week') page = <WeekPage id={arg ?? null} />;
      else if (sub === 'careers') page = <CareersPage />;
      else if (sub === 'archive') page = arg ? <Brief date={arg} /> : <Archive />;
      else if (sub === 'prediction') page = <PredictionPage />;
      else if (sub === 'device') page = <Device />;
      else page = <More />;
      break;
    default:
      page = <Brief />;
  }

  return (
    <div className="app">
      {!focus && (
        <header className="topbar">
          <a className="wordmark" href={demoLink('brief')}>
            Daily Financial News Watch
          </a>
          <nav className="pillnav" aria-label="Pages">
            {TABS.map((t) => (
              <a key={t.id} href={demoLink(t.id)} aria-current={top === t.id || (t.id === 'brief' && !top) ? 'page' : undefined}>
                {t.label}
              </a>
            ))}
          </nav>
          <span style={{ width: 44 }} />
        </header>
      )}
      {page}
      {!focus && (
        <nav className="tabbar" aria-label="Pages">
          {TABS.map((t) => (
            <a key={t.id} href={demoLink(t.id)} aria-current={top === t.id || (t.id === 'brief' && !top) ? 'page' : undefined}>
              <t.icon />
              {t.label}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
