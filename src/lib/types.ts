// Shapes of the files the site reads. The morning Claude task writes the
// content files under public/data/; the GitHub Action writes markets.json.
// docs/DATA.md describes the same contract in prose for the scheduled tasks.

export interface Source {
  title: string;
  url: string;
  paywalled?: boolean;
}

export interface Story {
  h: string; // headline
  d: string; // 2–3 plain sentences: what happened
  why: string; // one sentence: why it matters
  sources: Source[];
  when?: string; // e.g. "6h ago" or an ISO date
  mention?: string; // optional networking opener
  more?: DeepDive[]; // the in-depth read, shown on "Read more"
}

// One part of a story's in-depth read, e.g. {h: "Background", p: "…"}.
// Paragraphs are separated by blank lines ("\n\n") inside p.
export interface DeepDive {
  h: string;
  p: string;
}

export interface Section {
  id: string; // westpac | banks | regulation | wealth | business | china | hk | citi | global
  name: string;
  minutes: number; // full read time for the section, deep dives included
  items: Story[];
  background?: { h: string; d: string }; // used on quiet days instead of items
}

export interface QuizMC {
  id: string;
  type: 'mc';
  q: string;
  options: string[];
  answer: number; // index into options
  explain: string;
  from?: string; // e.g. "Wednesday · Big four banks"
  topic?: string;
}

export interface QuizWritten {
  id: string;
  type: 'written';
  q: string;
  topic?: string;
}

export type QuizQuestion = QuizMC | QuizWritten;

export interface ChineseSegment {
  t: string; // text
  py?: string; // pinyin, only on new words
}

export interface ChineseWord {
  hz: string;
  py: string;
  en: string;
}

export interface Chinese {
  segments: ChineseSegment[];
  english: string;
  original: Source;
  words: ChineseWord[];
}

export interface WrittenMark {
  date: string; // the day the answer was written
  q: string;
  score: number; // out of 10
  feedback: string;
  model: string; // model answer
}

export interface Day {
  date: string; // YYYY-MM-DD (Shanghai date)
  generatedAt: string;
  readMinutes: number; // time to skim the summaries
  fullMinutes?: number; // time to read everything, deep dives included
  top: { h: string; d: string }[];
  sections: Section[];
  primer: { term: string; text: string }[];
  quiz: QuizQuestion[];
  chinese?: Chinese;
  marked?: WrittenMark; // yesterday's written answer, marked
  markets?: {
    summary: string;
    forWestpac: string;
    extras?: { name: string; sub: string; value: string; change?: string }[];
  };
}

export interface Index {
  latest: string | null;
  days: string[];
  weeks: string[];
  currentPrediction: string | null;
}

export interface Week {
  id: string; // Monday date
  range: string;
  readMinutes: number;
  paragraph: string;
  changes: { topic: string; text: string }[];
  dots: string;
  next: { day: string; text: string }[];
  sources: Source[];
}

export interface Careers {
  checked: string;
  soon: { name: string; sub: string; closes: string; confirmed: boolean; url?: string }[];
  watch: { name: string; sub: string; status: string }[];
  events: { date: string; text: string; url?: string }[];
}

export interface RubricScore {
  evidence: number;
  mechanism: number;
  risk: number;
}

export interface Prediction {
  week: string;
  question: string;
  options: [string, string];
  now?: string;
  closesAt: string; // ISO
  claude: string; // base64 JSON {call, justification}, so it isn't spoiled at a glance
  result?: {
    answer: number;
    actual: string;
    you?: RubricScore;
    claude: RubricScore;
    claudeSaw: string;
    youSaw?: string;
  };
}

export interface Progress {
  updated: string;
  summary: string;
  streak: number;
  opened30: number;
  quizAccuracy: number | null;
  quizTrend?: number;
  writtenAvg: number | null;
  predictions: { you: number; claude: number };
  wordsKnown: number;
  reasoning: { week: string; you: number | null; claude: number }[];
  weakest: { topic: string; accuracy: number }[];
}

export interface Quote {
  id: string;
  name: string;
  sub: string;
  group: 'banks' | 'rates' | 'asia' | 'global' | 'commodities';
  price: number | null;
  change: number | null; // percent
  decimals: number;
  closes?: number[]; // last month, oldest first
}

export interface Markets {
  fetchedAt: string;
  quotes: Quote[];
  asx?: { price: number; change: number; series: Record<'1W' | '1M' | '6M' | '1Y', number[]> };
}

export interface Card {
  id: string;
  hz: string;
  py: string;
  en: string;
  pos?: string;
  ex?: [string, string][];
  deck: string; // e.g. "Level 2 · Lesson 8" or "Finance words"
}
