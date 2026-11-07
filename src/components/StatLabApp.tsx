'use client';

import {
  useCallback, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import {
  Activity, ArrowUpRight, BarChart3, BookOpen, Braces, Check,
  ChevronLeft, ChevronRight, Code2, Copy, Database, Dices, Download,
  FlaskConical, GitBranch, Lightbulb, Menu, Moon, Play, RotateCcw,
  Search, Sigma, Sparkles, Sun, Table2, Terminal, TrendingUp, Type, X,
} from 'lucide-react';
import {
  Bar, BarChart as ReBarChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { WebR as WebRInstance } from 'webr';
import { executeR, initializeWebR, type ROutput } from '@/lib/webr-client';
import { parseCsv, rStringLiteral, stringifyCsv, type CsvRow } from '@/lib/csv';
import { readProgressState, writeProgressPatch } from '@/lib/progress';
import { fundamentalsLessons } from '@/lib/r-fundamentals';

// ─── Types & navigation ───────────────────────────────────────────────────────

type Module =
  | 'Dashboard' | 'R Playground' | 'R Fundamentals' | 'Vectors & Matrices'
  | 'Data Frames' | 'Statistics Lab' | 'Probability Lab' | 'Data Visualization'
  | 'Dataset Explorer' | 'Learning Challenges' | 'About';

const navigation: { name: Module; icon: typeof Activity }[] = [
  { name: 'Dashboard',           icon: Activity    },
  { name: 'R Playground',        icon: Code2       },
  { name: 'R Fundamentals',      icon: Type        },
  { name: 'Vectors & Matrices',  icon: Braces      },
  { name: 'Data Frames',         icon: Table2      },
  { name: 'Statistics Lab',      icon: Sigma       },
  { name: 'Probability Lab',     icon: Dices       },
  { name: 'Data Visualization',  icon: BarChart3   },
  { name: 'Dataset Explorer',    icon: Database    },
  { name: 'Learning Challenges', icon: Lightbulb   },
  { name: 'About',               icon: BookOpen    },
];

// ─── Playground examples ──────────────────────────────────────────────────────

const examples = [
  {
    title: 'Basic calculations', group: 'R basics',
    code: '# Basic calculations in R\n# The <- operator assigns a value to a variable\na <- 12\nb <- 8\n\na + b      # addition\na * b      # multiplication\na / b      # division\na ^ 2      # exponentiation',
  },
  {
    title: 'Descriptive statistics', group: 'Statistics',
    code: '# Descriptive statistics\n# Summarise a set of exam scores\nscores <- c(65, 78, 82, 91, 74)\n\nmean(scores)    # arithmetic mean\nmedian(scores)  # middle value\nsd(scores)      # sample standard deviation\nvar(scores)     # sample variance\nsummary(scores) # full 5-number summary',
  },
  {
    title: 'Data frames', group: 'Data frames',
    code: '# Data frames — R\'s tabular data structure\nstudents <- data.frame(\n  name  = c("Asha", "Rahul", "Maya"),\n  score = c(82, 75, 94),\n  grade = c("B", "C", "A")\n)\n\nstudents            # print the table\nmean(students$score) # column mean\nsubset(students, score >= 80) # filter rows',
  },
  {
    title: 'Probability simulation', group: 'Probability',
    code: '# Simulate 1 000 coin flips\n# set.seed makes results reproducible\nset.seed(42)\ncoin_flips <- sample(c("Heads", "Tails"), size = 1000, replace = TRUE)\ntable(coin_flips)   # frequency table\nprop.table(table(coin_flips)) # proportions',
  },
  {
    title: 'Functions and conditions', group: 'Control flow',
    code: '# Define and call a custom function\ncalculate_grade <- function(marks) {\n  if      (marks >= 90) "A"\n  else if (marks >= 75) "B"\n  else if (marks >= 60) "C"\n  else                  "F"\n}\n\ncalculate_grade(85)\ncalculate_grade(58)\nsapply(c(92, 74, 61, 88), calculate_grade)',
  },
  {
    title: 'Matrix operations', group: 'Vectors',
    code: '# Matrices — rectangular arrays of numbers\nm <- matrix(1:9, nrow = 3, ncol = 3)\nm\n\nrowSums(m)   # sum each row\ncolSums(m)   # sum each column\nt(m)         # transpose\nm %*% m      # matrix multiplication',
  },
];

// ─── Learning challenges ──────────────────────────────────────────────────────

const exercises = [
  {
    title: 'Add two variables', difficulty: 'Beginner', topic: 'Variables',
    goal: 'Create x = 7 and y = 5, then store their sum in total (12).', expected: 'total must equal 12.',
    hint: 'Use <- to assign each value, then add x + y.', starter: '# Create x and y, then save their sum in total',
    solution: 'x <- 7\ny <- 5\ntotal <- x + y',
    explanation: 'The assignment operator stores a value under a name. Once x and y exist, adding them produces 12, which is assigned to total.',
    check: 'base::stopifnot(base::exists("total"), base::isTRUE(base::all.equal(total, 12)))',
  },
  {
    title: 'Find a vector mean', difficulty: 'Beginner', topic: 'Vectors',
    goal: 'Create scores containing 4, 8, 12 and store its mean in average (8).', expected: 'average must equal 8.',
    hint: 'Use c() to create the vector and mean() to find the average.', starter: '# Create scores and calculate average',
    solution: 'scores <- c(4, 8, 12)\naverage <- mean(scores)',
    explanation: 'c() combines the values into one numeric vector. mean() adds them and divides by the number of values.',
    check: 'base::stopifnot(base::exists("average"), base::isTRUE(base::all.equal(average, 8)))',
  },
  {
    title: 'Sort values', difficulty: 'Beginner', topic: 'Vectors',
    goal: 'Create values containing 9, 2, 5, then save the ascending result as sorted_values.', expected: 'sorted_values must be 2, 5, 9 in that order.',
    hint: 'Use sort() — it returns the elements in ascending order by default.', starter: '# Create values and save the sorted result',
    solution: 'values <- c(9, 2, 5)\nsorted_values <- sort(values)',
    explanation: 'sort() returns a new vector ordered from smallest to largest; assigning it keeps the result available for later code.',
    check: 'base::stopifnot(base::exists("sorted_values"), base::identical(sorted_values, c(2, 5, 9)))',
  },
  {
    title: 'Measure sample spread', difficulty: 'Beginner', topic: 'Statistics',
    goal: 'Create measurements containing 2, 4, 6 and store the sample standard deviation as spread (2).', expected: 'spread must equal 2.',
    hint: 'R\'s sd() function computes the sample standard deviation.', starter: '# Create measurements and calculate spread',
    solution: 'measurements <- c(2, 4, 6)\nspread <- sd(measurements)',
    explanation: 'R’s sd() uses the sample formula with denominator n − 1. For 2, 4, 6, the result is 2.',
    check: 'base::stopifnot(base::exists("spread"), base::isTRUE(base::all.equal(spread, 2)))',
  },
  {
    title: 'Build a sequence', difficulty: 'Beginner', topic: 'Functions',
    goal: 'Use seq() to save the integers 1 through 5 in a vector named steps.', expected: 'steps must contain 1, 2, 3, 4, 5.',
    hint: 'seq(from, to) generates a sequence from one number to another.', starter: '# Use seq() to create steps',
    solution: 'steps <- seq(from = 1, to = 5)',
    explanation: 'seq() creates a regular sequence. With the default step of 1, the values include both the start and end points.',
    check: 'base::stopifnot(base::exists("steps"), base::identical(steps, 1:5))',
  },
  {
    title: 'Filter a data frame', difficulty: 'Intermediate', topic: 'Data frames',
    goal: 'Build students with scores 72, 85, 91, then keep rows with score >= 80 in high_scores.', expected: 'high_scores must contain scores 85 and 91.',
    hint: 'Use data.frame() and subset(students, score >= 80).', starter: '# Create students, then filter the higher scores',
    solution: 'students <- data.frame(score = c(72, 85, 91))\nhigh_scores <- subset(students, score >= 80)',
    explanation: 'A logical condition selects rows. subset() returns only observations whose score meets the threshold.',
    check: 'base::stopifnot(base::exists("high_scores"), base::identical(high_scores$score, c(85, 91)))',
  },
  {
    title: 'Handle missing data', difficulty: 'Intermediate', topic: 'Data cleaning',
    goal: 'Create readings = 4, NA, 8, 12 and calculate the mean ignoring missing values into observed_mean.', expected: 'observed_mean must equal 8.',
    hint: 'Pass na.rm = TRUE to mean().', starter: '# Create readings and calculate a mean that removes NA values',
    solution: 'readings <- c(4, NA, 8, 12)\nobserved_mean <- mean(readings, na.rm = TRUE)',
    explanation: 'NA means unknown. na.rm = TRUE removes missing entries for this calculation; it does not change the original vector.',
    check: 'base::stopifnot(base::exists("observed_mean"), base::isTRUE(base::all.equal(observed_mean, 8)))',
  },
  {
    title: 'Write a summary function', difficulty: 'Advanced', topic: 'Functions',
    goal: 'Write summarize_range(x) that returns a named list with the mean and range of x.', expected: 'For c(2, 4, 8), mean is 14/3 and range is 6.',
    hint: 'Return list(mean = mean(x), range = diff(range(x))).', starter: '# Define summarize_range(x) and return mean and range',
    solution: 'summarize_range <- function(x) {\n  list(mean = mean(x), range = diff(range(x)))\n}',
    explanation: 'A function packages reusable calculations. A named list gives each result a clear label and can hold separate values.',
    check: 'base::stopifnot(base::exists("summarize_range"), base::is.function(summarize_range), base::isTRUE(base::all.equal(summarize_range(c(2, 4, 8))$mean, 14/3)), base::isTRUE(base::all.equal(summarize_range(c(2, 4, 8))$range, 6)))',
  },
  {
    title: 'Multiply matrices', difficulty: 'Advanced', topic: 'Matrices',
    goal: 'Create a 2 x 2 matrix containing 1, 2, 3, 4 and store m multiplied by itself as squared.', expected: 'R fills matrices by column; squared[1, 1] must be 7.',
    hint: 'Use matrix(1:4, nrow = 2) and the %*% operator.', starter: '# Create m, then multiply it by itself with %*%',
    solution: 'm <- matrix(1:4, nrow = 2)\nsquared <- m %*% m',
    explanation: 'In R, matrix() fills columns first. %*% performs matrix multiplication; * would multiply matching cells instead.',
    check: 'base::stopifnot(base::exists("squared"), base::is.matrix(squared), base::identical(base::dim(squared), c(2L, 2L)), base::isTRUE(base::all.equal(squared[1, 1], 7)))',
  },
];

// ─── Sample teaching data ─────────────────────────────────────────────────────

const sampleRows = [
  { name: 'Asha',  marks: 85, attendance: 92 },
  { name: 'Ravi',  marks: 72, attendance: 84 },
  { name: 'Neha',  marks: 94, attendance: 98 },
  { name: 'Arjun', marks: 81, attendance: 88 },
  { name: 'Mira',  marks: 67, attendance: 76 },
];

type ChartDatum = { label: string; value: number };
type ScatterDatum = { x: number; y: number };

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function Chart({ data, line = false, color = '#8170e8' }: { data: ChartDatum[]; line?: boolean; color?: string }) {
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        {line ? (
          <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" />
            <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: 'var(--text)' }}
            />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={{ fill: color, r: 3 }} />
          </LineChart>
        ) : (
          <ReBarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" />
            <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: 'var(--text)' }}
            />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
          </ReBarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function Heading({ title, description, icon }: { title: string; description: string; icon: ReactNode }) {
  return (
    <div className="page-title">
      <div className="page-symbol">{icon}</div>
      <div><h1>{title}</h1><p>{description}</p></div>
    </div>
  );
}

function Output({ items }: { items: ROutput[] }) {
  return (
    <div className="output-block">
      <pre>
        {items.length
          ? items.map((item, i) => (
              <div
                key={i}
                className={`console-line${item.type === 'warning' ? ' warning' : ''}${item.type === 'error' || item.type === 'stderr' ? ' error' : ''}`}
              >
                <span className="console-prefix">
                  {item.type === 'stdout' ? '›' : item.type === 'warning' ? '!' : '×'}
                </span>
                <span>{item.type === 'stdout' ? item.text : `${item.type}: ${item.text}`}</span>
              </div>
            ))
          : <span className="muted-line">Run an R expression to see results here.</span>}
      </pre>
    </div>
  );
}

function hasSuccessfulOutput(items: ROutput[]) {
  return items.length > 0 && !items.some(item => item.type === 'error');
}

function InfoBox({ children }: { children: ReactNode }) {
  return <div className="info-box">{children}</div>;
}

function parseNumeric(text: string) {
  const nums = text.split(/[\s,;]+/).filter(Boolean).map(Number);
  if (!nums.length || nums.some(n => !Number.isFinite(n)))
    throw new Error('Enter valid numeric values separated by commas or spaces.');
  if (nums.length > 10000) throw new Error('Please use 10,000 values or fewer.');
  return nums;
}

function parseRNumberMarker(output: ROutput[], marker: string): number[] {
  const line = output.find(item => item.text.includes(marker));
  const payload = line?.text.split(marker).pop()?.trim();
  if (!payload) throw new Error('R did not return the requested chart values.');
  const values = payload.split(',').map(Number);
  if (!values.length || values.some(value => !Number.isFinite(value)))
    throw new Error('R returned invalid chart values.');
  return values;
}

function LessonCode({ code }: { code: string }) {
  return <pre className="lesson-code">{code}</pre>;
}

// ─── Main application ─────────────────────────────────────────────────────────

export default function StatLabApp() {

  // ── Global UI ──────────────────────────────────────────────────────────────
  const [active,     setActive]     = useState<Module>('Dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed,  setCollapsed]  = useState(false);
  const [dark,       setDark]       = useState(true);

  // ── WebR runtime ───────────────────────────────────────────────────────────
  const [runtime,        setRuntime]        = useState<WebRInstance | null>(null);
  const [runtimeStatus,  setRuntimeStatus]  = useState<'initializing' | 'ready' | 'error'>('initializing');
  const [runtimeMessage, setRuntimeMessage] = useState('Loading WebR and the R source library…');

  // ── R Playground (isolated) ────────────────────────────────────────────────
  const [code,     setCode]     = useState(examples[0].code);
  const [output,   setOutput]   = useState<ROutput[]>([]);
  const [images,   setImages]   = useState<ImageBitmap[]>([]);
  const [running,  setRunning]  = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [error,    setError]    = useState('');
  const [runs,     setRuns]     = useState(0);
  const [copied,   setCopied]   = useState(false);

  // ── Shared numeric input ───────────────────────────────────────────────────
  const [values, setValues] = useState('10, 20, 30, 40, 50');

  // ── Statistics Lab (isolated) ──────────────────────────────────────────────
  const [statsLabOut,   setStatsLabOut]   = useState<ROutput[]>([]);
  // correlation sub-panel
  const [corrX,         setCorrX]         = useState('10, 20, 30, 40, 50');
  const [corrY,         setCorrY]         = useState('12, 25, 28, 37, 53');
  const [corrOut,       setCorrOut]       = useState<ROutput[]>([]);

  // ── Data Frames (isolated) ─────────────────────────────────────────────────
  const [dataFrameOut, setDataFrameOut] = useState<ROutput[]>([]);

  // ── Dataset Explorer (isolated) ────────────────────────────────────────────
  const [dataset,    setDataset]    = useState('Student marks');
  const [tableRows,  setTableRows]  = useState<Record<string, unknown>[]>(sampleRows);
  const [search,     setSearch]     = useState('');
  const [csvError,   setCsvError]   = useState('');
  const [datasetOut, setDatasetOut] = useState<ROutput[]>([]);

  // ── Probability Lab (isolated) ─────────────────────────────────────────────
  const [probN,         setProbN]         = useState(1000);
  const [probSeed,      setProbSeed]      = useState(42);
  const [probOut,       setProbOut]       = useState<ROutput[]>([]);
  const [probChartData, setProbChartData] = useState<ChartDatum[]>([]);

  // ── Data Visualization (isolated) ──────────────────────────────────────────
  const [vizMode,      setVizMode]      = useState<'histogram' | 'boxplot'>('histogram');
  const [vizChartData, setVizChartData] = useState<ChartDatum[]>([]);
  const [vizOut,       setVizOut]       = useState<ROutput[]>([]);
  const [boxStats,     setBoxStats]     = useState<number[]>([]);

  // ── R Fundamentals (isolated) ──────────────────────────────────────────────
  const [lesson,          setLesson]          = useState(0);
  const [fundamentalsOut, setFundamentalsOut] = useState<ROutput[]>([]);

  // ── Vectors & Matrices (isolated) ──────────────────────────────────────────
  const [vectorsOut, setVectorsOut] = useState<ROutput[]>([]);

  // ── Hypothesis Testing (isolated) ──────────────────────────────────────────
  const [htSample,     setHtSample]     = useState('82, 76, 90, 88, 74, 93, 69, 85');
  const [htMu,         setHtMu]         = useState('80');
  const [htAlt,        setHtAlt]        = useState('two.sided');
  const [htOut,        setHtOut]        = useState<ROutput[]>([]);

  // ── Regression (inside Statistics Lab as a tab) ───────────────────────────
  const [regX,         setRegX]         = useState('1, 2, 3, 4, 5, 6, 7, 8');
  const [regY,         setRegY]         = useState('2.1, 4.0, 5.8, 8.3, 9.9, 12.1, 14.0, 16.2');
  const [regOut,       setRegOut]       = useState<ROutput[]>([]);
  const [regScatter,   setRegScatter]   = useState<ScatterDatum[]>([]);
  const [regFitLine,   setRegFitLine]   = useState<ScatterDatum[]>([]);

  // ── Learning Challenges ────────────────────────────────────────────────────
  const [challenge,         setChallenge]         = useState(0);
  const [challengeCode,     setChallengeCode]     = useState(exercises[0].starter);
  const [challengeFeedback, setChallengeFeedback] = useState('');
  const [solutionVisible,   setSolutionVisible]   = useState(false);
  const [progress,          setProgress]          = useState<number[]>([]);
  const [completedLessons,  setCompletedLessons]  = useState<number[]>([]);
  const [activity,          setActivity]          = useState<string[]>([]);
  const [recentModules,     setRecentModules]     = useState<Module[]>([]);

  // ── Dashboard experiment ───────────────────────────────────────────────────
  const [experimentMode,    setExperimentMode]    = useState<'normal' | 'dice'>('normal');
  const [experimentData,    setExperimentData]    = useState<ChartDatum[]>([]);
  const [experimentSummary, setExperimentSummary] = useState('');
  const [experimentLoading, setExperimentLoading] = useState(false);
  const [experimentError,   setExperimentError]   = useState('');
  const [experimentSeed,    setExperimentSeed]    = useState(42);

  // ── Statistics Lab tab ────────────────────────────────────────────────────
  const [statsTab, setStatsTab] = useState<'descriptive' | 'correlation' | 'hypothesis' | 'regression'>('descriptive');

  // ── Restore persisted preferences ─────────────────────────────────────────
  useEffect(() => {
    requestAnimationFrame(() => {
      const saved = readProgressState();
      setDark(saved.theme !== 'light');
      if (saved.playgroundCode) setCode(saved.playgroundCode);
      setRuns(saved.runs);
      setProgress(saved.completedChallenges.filter(index => index < exercises.length));
      setCompletedLessons(saved.completedLessons.filter(index => index < fundamentalsLessons.length));
      setActivity(saved.activity);
      setRecentModules(saved.recentModules.filter((name): name is Module => navigation.some(item => item.name === name)));
      writeProgressPatch(saved);
    });
  }, []);

  // Give each learning workspace a bookmarkable hash route while keeping the
  // shared R session and editor mounted during client-side navigation.
  useEffect(() => {
    const syncFromLocation = () => {
      const slug = window.location.hash.slice(1);
      const route = navigation.find(item => item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug);
      if (route) setActive(route.name);
    };
    syncFromLocation();
    window.addEventListener('popstate', syncFromLocation);
    window.addEventListener('hashchange', syncFromLocation);
    return () => {
      window.removeEventListener('popstate', syncFromLocation);
      window.removeEventListener('hashchange', syncFromLocation);
    };
  }, []);

  // ── Boot WebR ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    initializeWebR(s => { if (alive) setRuntimeStatus(s); })
      .then(r => {
        if (alive) {
          setRuntime(r);
          setRuntimeStatus('ready');
          setRuntimeMessage('R 4 via WebR · browser runtime');
        }
      })
      .catch(e => {
        if (alive) {
          setRuntimeStatus('error');
          setRuntimeMessage(e instanceof Error ? e.message : 'WebR could not initialize.');
        }
      });
    return () => { alive = false; };
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────────
  const visibleRows = useMemo(
    () => tableRows.filter(r => JSON.stringify(r).toLowerCase().includes(search.toLowerCase())),
    [tableRows, search],
  );

  // ── Navigation helper ──────────────────────────────────────────────────────
  const go = useCallback((m: Module) => {
    setActive(m); setMobileOpen(false);
    const slug = m.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (window.location.hash !== `#${slug}`) window.history.pushState(null, '', `#${slug}`);
    setRecentModules(old => {
      const next = [m, ...old.filter(item => item !== m)].slice(0, 8);
      writeProgressPatch({ recentModules: next });
      return next;
    });
  }, []);

  // ── Activity log ───────────────────────────────────────────────────────────
  const saveActivity = (label: string) => {
    setActivity(old => {
      const next = [`${new Date().toLocaleString()}: ${label}`, ...old].slice(0, 6);
      writeProgressPatch({ activity: next });
      return next;
    });
  };

  // ── R Playground execute ───────────────────────────────────────────────────
  const run = useCallback(async (source = code) => {
    if (runtimeStatus !== 'ready' || !runtime) {
      setError(runtimeStatus === 'error' ? runtimeMessage : 'Wait for WebR to finish initializing.');
      return;
    }
    if (source.length > 50000) { setError('Code is limited to 50,000 characters per run.'); return; }
    setRunning(true); setError(''); setOutput([]); setImages([]); setDuration(null);
    writeProgressPatch({ playgroundCode: source });
    try {
      const result = await executeR(source, runtime);
      setOutput(result.output); setImages(result.images); setDuration(result.durationMs);
      setRuns(n => { const next = n + 1; writeProgressPatch({ runs: next }); return next; });
      saveActivity('R program run');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'R execution failed. See the runtime status and try again.');
    } finally { setRunning(false); }
  }, [code, runtime, runtimeStatus, runtimeMessage]);

  // ── Dataset analysis ───────────────────────────────────────────────────────
  const runDataset = async (
    name: string = dataset,
    setOut: (out: ROutput[]) => void = setDatasetOut,
  ) => {
    if (!runtime) return;
    const call = name === 'Student marks' ? 'statlab_student_marks()' : 'statlab_monthly_expenses()';
    try {
      const result = await executeR(`${call}`, runtime);
      setOut(result.output);
      setTableRows(
        name === 'Student marks' ? sampleRows : [
          { month: 'Jan', food: 4200, travel: 1800 },
          { month: 'Feb', food: 3900, travel: 2100 },
          { month: 'Mar', food: 4600, travel: 1600 },
          { month: 'Apr', food: 4100, travel: 1900 },
        ],
      );
      setDataset(name);
      saveActivity(`${name} dataset explored`);
    } catch (e) { setError(String(e)); }
  };

  // ── Statistics Lab — descriptive ───────────────────────────────────────────
  const runStats = async () => {
    if (!runtime) return;
    try {
      const parsed = parseNumeric(values);
      const vector = `c(${parsed.join(', ')})`;
      const result = await executeR(
        `statlab_descriptive_summary(${vector})\nstatlab_mode(${vector})`,
        runtime,
      );
      setStatsLabOut(result.output);
      saveActivity('Descriptive statistics calculated');
    } catch (e) {
      setStatsLabOut([{ type: 'error', text: e instanceof Error ? e.message : 'Invalid input' }]);
    }
  };

  // ── Statistics Lab — correlation ───────────────────────────────────────────
  const runCorrelation = async () => {
    if (!runtime) return;
    try {
      const px = parseNumeric(corrX);
      const py = parseNumeric(corrY);
      if (px.length !== py.length) throw new Error('X and Y must have the same number of values.');
      const vx = `c(${px.join(', ')})`;
      const vy = `c(${py.join(', ')})`;
      const result = await executeR(
        `x <- ${vx}\ny <- ${vy}\ncat("Pearson correlation:", round(statlab_correlation(x, y), 4), "\\n")\ncat("Spearman correlation:", round(statlab_correlation(x, y, method = "spearman"), 4), "\\n")\ncat("n:", length(x), "pairs\\n")\ncor.test(x, y)`,
        runtime,
      );
      setCorrOut(result.output);
      saveActivity('Correlation calculated');
    } catch (e) {
      setCorrOut([{ type: 'error', text: e instanceof Error ? e.message : 'Correlation failed' }]);
    }
  };

  // ── Hypothesis testing ─────────────────────────────────────────────────────
  const runHypothesis = async () => {
    if (!runtime) return;
    try {
      const parsed = parseNumeric(htSample);
      const mu = parseFloat(htMu);
      if (!Number.isFinite(mu)) throw new Error('Enter a valid hypothesised mean (μ₀).');
      const vector = `c(${parsed.join(', ')})`;
      const result = await executeR(
        `x <- ${vector}\nstatlab_one_sample_test(x, mu = ${mu}, alternative = "${htAlt}")`,
        runtime,
      );
      setHtOut(result.output);
      saveActivity('Hypothesis test run');
    } catch (e) {
      setHtOut([{ type: 'error', text: e instanceof Error ? e.message : 'Hypothesis test failed' }]);
    }
  };

  // ── Regression ─────────────────────────────────────────────────────────────
  const runRegression = async () => {
    if (!runtime) return;
    try {
      const px = parseNumeric(regX);
      const py = parseNumeric(regY);
      if (px.length !== py.length) throw new Error('X and Y must have the same number of values.');
      if (px.length < 3) throw new Error('At least 3 data points are needed for regression.');
      const vx = `c(${px.join(', ')})`;
      const vy = `c(${py.join(', ')})`;
      const result = await executeR(
        `x_vals <- ${vx}\ny_vals <- ${vy}\ndf <- data.frame(x = x_vals, y = y_vals)\nmodel <- statlab_fit_linear(df, "y", "x")\ncat("=== Linear Regression Model ===\\n")\nprint(summary(model))\ncat("\\nIntercept (a):", round(coef(model)[1], 4), "\\n")\ncat("Slope (b):", round(coef(model)[2], 4), "\\n")\ncat("R-squared:", round(summary(model)$r.squared, 4), "\\n")\ncat("Prediction at x=6:", round(predict(model, newdata=data.frame(x=6)), 4))`,
        runtime,
      );
      setRegOut(result.output);
      // Build scatter + fit line data
      const minX = Math.min(...px); const maxX = Math.max(...px);
      const intercept = result.output.find(o => o.text.includes('Intercept (a):'))?.text.match(/-?\d+\.?\d*/)?.[0];
      const slope = result.output.find(o => o.text.includes('Slope (b):'))?.text.match(/-?\d+\.?\d*/)?.[0];
      setRegScatter(px.map((x, i) => ({ x, y: py[i] })));
      if (intercept && slope) {
        const a = parseFloat(intercept); const b = parseFloat(slope);
        setRegFitLine([
          { x: minX, y: a + b * minX },
          { x: maxX, y: a + b * maxX },
        ]);
      }
      saveActivity('Linear regression fitted');
    } catch (e) {
      setRegOut([{ type: 'error', text: e instanceof Error ? e.message : 'Regression failed' }]);
    }
  };

  // ── Probability Lab ────────────────────────────────────────────────────────
  const runProbability = async () => {
    if (!runtime) return;
    const n = Math.min(100000, Math.max(1, Math.floor(probN)));
    setProbN(n);
    try {
      const result = await executeR(
        `dice <- statlab_simulate_dice(${n}, seed = ${Math.floor(probSeed)})\ncat("Rolls:", length(dice), "\\n")\nprint(table(dice))\ncat("\\nEmpirical mean:", round(mean(dice), 4), "\\nTheoretical mean: 3.5\\n")\ncat("Empirical SD:   ", round(sd(dice), 4), "\\nTheoretical SD:  ", round(sqrt(35/12), 4), "\\n")\ncat("STATLAB_DICE_COUNTS:", paste(as.integer(table(factor(dice, levels = 1:6))), collapse = ","), "\\n")`,
        runtime,
      );
      setProbOut(result.output);
      const hist = parseRNumberMarker(result.output, 'STATLAB_DICE_COUNTS:');
      if (hist.length !== 6) throw new Error('R returned an incomplete six-face frequency table.');
      setProbChartData(hist.map((value, i) => ({ label: `Face ${i + 1}`, value })));
      saveActivity(`Seeded die simulation · ${n.toLocaleString()} trials`);
    } catch (e) {
      setProbChartData([]);
      setProbOut([{ type: 'error', text: e instanceof Error ? e.message : 'Simulation failed' }]);
    }
  };

  // ── Data Visualization — histogram ─────────────────────────────────────────
  const runHistogram = async () => {
    if (!runtime) return;
    try {
      const parsed = parseNumeric(values);
      const vector = `c(${parsed.join(', ')})`;
      const r = await executeR(
        `h <- statlab_histogram_data(${vector})\ncat("STATLAB_HIST_COUNTS:", paste(as.integer(h$count), collapse = ","), "\\n")\ncat("STATLAB_HIST_MIDPOINTS:", paste(sprintf("%.3f", h$midpoint), collapse = ","), "\\n")\nh`,
        runtime,
      );
      const bins = parseRNumberMarker(r.output, 'STATLAB_HIST_COUNTS:');
      const mids = parseRNumberMarker(r.output, 'STATLAB_HIST_MIDPOINTS:');
      if (bins.length !== mids.length) throw new Error('R returned inconsistent histogram bins.');
      setVizChartData(
        bins.map((value, i) => ({ label: mids[i].toFixed(1), value })),
      );
      setVizOut(r.output);
    } catch (e) {
      setVizChartData([]);
      setVizOut([{ type: 'error', text: e instanceof Error ? e.message : 'Unable to compute histogram in R' }]);
    }
  };

  // ── Data Visualization — boxplot ───────────────────────────────────────────
  const runBoxplot = async () => {
    if (!runtime) return;
    try {
      const parsed = parseNumeric(values);
      const vector = `c(${parsed.join(', ')})`;
      const r = await executeR(
        `x <- ${vector}\nstats <- statlab_boxplot_data(x)\ncat("STATLAB_BOXPLOT:", paste(sprintf("%.10g", stats), collapse = ","), "\\n")\ncat("Min:", min(x), "\\n")\ncat("Q1 (25th pct):", quantile(x, 0.25), "\\n")\ncat("Median:", median(x), "\\n")\ncat("Q3 (75th pct):", quantile(x, 0.75), "\\n")\ncat("Max:", max(x), "\\n")\ncat("IQR:", IQR(x))`,
        runtime,
      );
      const stats = parseRNumberMarker(r.output, 'STATLAB_BOXPLOT:');
      if (stats.length !== 5) throw new Error('R returned an incomplete five-number summary.');
      setBoxStats(stats);
      setVizOut(r.output);
    } catch (e) {
      setBoxStats([]);
      setVizOut([{ type: 'error', text: e instanceof Error ? e.message : 'Boxplot failed' }]);
    }
  };

  // ── CSV import / export ────────────────────────────────────────────────────
  const loadCsv = async (file?: File) => {
    if (!file) return;
    setCsvError('');
    try {
      if (file.size > 2_000_000) throw new Error('CSV size limit is 2 MB.');
      const parsed = parseCsv(await file.text());
      if (parsed.length > 5000) throw new Error('CSV is limited to 5 000 rows.');
      setTableRows(parsed);
      setDataset(file.name);
      saveActivity(`Imported ${file.name}`);
    } catch (e) { setCsvError(e instanceof Error ? e.message : 'Could not read this CSV'); }
  };

  const exportCsv = () => {
    const csv  = stringifyCsv(tableRows as CsvRow[]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'statlab-data.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── CSV → R bridge ─────────────────────────────────────────────────────────
  const runCsvAnalysis = async () => {
    if (!runtime || tableRows.length === 0) return;
    const cols = Object.keys(tableRows[0]);
    try {
      // Keep imported headers as data instead of turning them into executable names.
      // Each column is passed as a separately quoted R vector, preserving spaces,
      // punctuation, missing values, and duplicate names without source injection.
      const columns = cols.map(col => {
        const column = tableRows.map(row => row[col]);
        const numeric = column.every(value => value === null || value === undefined || typeof value === 'number');
        const values = column.map(value => value === null || value === undefined
          ? numeric ? 'NA_real_' : 'NA_character_'
          : numeric ? String(value) : rStringLiteral(String(value)));
        return `c(${values.join(', ')})`;
      });
      const rNames = cols.map(rStringLiteral).join(', ');
      const rCode = `df <- as.data.frame(setNames(list(${columns.join(', ')}), c(${rNames})), check.names = FALSE, stringsAsFactors = FALSE)\ncat("Rows:", nrow(df), "  Columns:", ncol(df), "\\n")\nstr(df)\nsummary(df)`;
      const result = await executeR(rCode, runtime);
      setDatasetOut(result.output);
      saveActivity(`Analyzed ${dataset} in R`);
    } catch (e) {
      setDatasetOut([{ type: 'error', text: e instanceof Error ? e.message : 'R analysis failed' }]);
    }
  };

  // ── Theme ──────────────────────────────────────────────────────────────────
  const toggleTheme = () => { setDark(v => { writeProgressPatch({ theme: v ? 'light' : 'dark' }); return !v; }); };

  // ── Copy playground code ───────────────────────────────────────────────────
  const copyCode = async () => {
    await navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const resetCode = () => { setCode(examples[0].code); setOutput([]); setError(''); setImages([]); };

  // ── Dashboard experiment ───────────────────────────────────────────────────
  const runExperiment = async () => {
    if (!runtime || runtimeStatus !== 'ready') {
      setExperimentError('Wait for the R runtime to be ready, then try again.');
      return;
    }
    setExperimentLoading(true); setExperimentError('');
    const seed = experimentSeed; setExperimentSeed(seed + 1);
    try {
      const rCode = experimentMode === 'normal'
        ? `set.seed(${seed})\nsample_values <- rnorm(800)\nh <- hist(sample_values, breaks=seq(-4, 4, by=0.5), plot=FALSE)\ncat("STATLAB_COUNTS:", paste(as.integer(h$counts), collapse=","), "\\n")\ncat(sprintf("STATLAB_SUMMARY: Mean = %.2f · SD = %.2f", mean(sample_values), sd(sample_values)))`
        : `set.seed(${seed})\ndice_values <- sample(1:6, size=720, replace=TRUE)\ncat("STATLAB_COUNTS:", paste(as.integer(table(factor(dice_values, levels=1:6))), collapse=","), "\\n")\ncat(sprintf("STATLAB_SUMMARY: 720 rolls · observed mean = %.2f · expected = 3.50", mean(dice_values)))`;
      const result      = await executeR(rCode, runtime);
      const countsLine  = result.output.find(item => item.text.includes('STATLAB_COUNTS:'));
      const summaryLine = result.output.find(item => item.text.includes('STATLAB_SUMMARY:'));
      if (!countsLine || !summaryLine)
        throw new Error(result.output.map(item => item.text).join(' ').trim() || 'R returned no experiment values.');
      const countsText = countsLine.text.split('STATLAB_COUNTS:').pop()?.trim();
      if (!countsText) throw new Error('R returned an empty chart series.');
      const vals = countsText.split(',').map(Number);
      if (vals.some(v => !Number.isFinite(v)) || !vals.length)
        throw new Error('R returned an invalid chart series.');
      const summary = summaryLine.text.split('STATLAB_SUMMARY:').pop()?.trim() ?? '';
      const labels  = experimentMode === 'normal'
        ? Array.from({ length: vals.length }, (_, i) => (-3.75 + i * 0.5).toFixed(2))
        : ['1', '2', '3', '4', '5', '6'];
      setExperimentData(vals.map((v, i) => ({ label: labels[i] ?? String(i + 1), value: v })));
      setExperimentSummary(summary);
      setRuns(n => { const next = n + 1; writeProgressPatch({ runs: next }); return next; });
      saveActivity(
        experimentMode === 'normal'
          ? `Normal distribution experiment · seed ${seed}`
          : `Fair die simulation · seed ${seed}`,
      );
    } catch (e) {
      setExperimentError(e instanceof Error ? e.message : 'The R experiment could not be completed.');
      setExperimentData([]); setExperimentSummary('');
    } finally { setExperimentLoading(false); }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={`shell ${dark ? 'dark' : 'light'}`}>

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="brand">
          <div className="brand-symbol"><FlaskConical size={17} /></div>
          {!collapsed && <><span className="brand-name">statlab</span><span className="brand-tag">R LAB</span></>}
        </div>
        {!collapsed && <div className="side-label">WORKSPACE</div>}
        <nav className="nav-list" aria-label="Main navigation">
          {navigation.map(({ name, icon: Icon }, index) => (
            <button
              key={name}
              title={collapsed ? name : undefined}
              aria-current={active === name ? 'page' : undefined}
              className={`nav-button${active === name ? ' selected' : ''}${index === 5 || index === 10 ? ' divider' : ''}`}
              onClick={() => go(name)}
            >
              <Icon size={16} />
              {!collapsed && <span>{name}</span>}
            </button>
          ))}
        </nav>
        <div className="side-bottom">
          <button className="nav-button" onClick={() => setCollapsed(v => !v)}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!collapsed && <span>Collapse sidebar</span>}
          </button>
          {!collapsed && (
            <div className="side-footer">
              Independent learning project<br />
              <span>Built to explore R &amp; statistics</span>
            </div>
          )}
        </div>
      </aside>

      {mobileOpen && (
        <button className="drawer-backdrop" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Main area ── */}
      <main className="main">
        <header className="topbar">
          <div className="breadcrumbs">
            <button className="icon-button menu-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
              <Menu size={18} />
            </button>
            <span className="crumb-muted">StatLab</span>
            <ChevronRight size={13} />
            <span className="crumb-current">{active}</span>
          </div>
          <div className="top-actions">
            <div className="runtime-state" title={runtimeMessage}>
              <span className={`runtime-dot ${runtimeStatus}`} />
              {runtimeStatus === 'ready' ? 'WebR ready' : runtimeStatus === 'error' ? 'WebR error' : 'Initializing WebR'}
            </div>
            <button className="icon-button" aria-label="Toggle theme" title="Toggle theme" onClick={toggleTheme}>
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        <div className="content">

          {/* ══════════════════════════════════════════════════════
              Dashboard
          ══════════════════════════════════════════════════════ */}
          {active === 'Dashboard' && (
            <div className="home-page">
              <nav className="home-nav" aria-label="Explore StatLab">
                <span className="home-nav-label">YOUR LAB</span>
                <button onClick={() => go('R Playground')}><Code2 size={14} />Explore</button>
                <button onClick={() => go('R Fundamentals')}><BookOpen size={14} />Learn</button>
                <button onClick={() => go('Learning Challenges')}><Sparkles size={14} />Practice</button>
                <span className="home-nav-spacer" />
                <span className="home-nav-runtime">
                  <i className={`runtime-dot ${runtimeStatus}`} />
                  {runtimeStatus === 'ready' ? 'R runtime ready' : runtimeStatus === 'error' ? 'Runtime needs attention' : 'Preparing R runtime'}
                </span>
              </nav>

              <section className="home-hero">
                <div className="hero-copy">
                  <div className="eyebrow hero-eyebrow"><span className="pulse" /> A PLAYGROUND FOR THINKING WITH DATA</div>
                  <h1>Make sense of data<br /><em>by getting your hands on it.</em></h1>
                  <p>Write real R. Run experiments. See how the numbers move. A hands-on space to learn statistics one question at a time — no installation needed.</p>
                  <div className="hero-actions">
                    <button className="hero-primary" onClick={() => go('R Playground')}>
                      <Code2 size={16} />Open the R workspace<ArrowUpRight size={15} />
                    </button>
                    <button className="hero-secondary" onClick={() => go('R Fundamentals')}>
                      Find a place to start<ChevronRight size={14} />
                    </button>
                  </div>
                  <div className="hero-proof">
                    <span><i className="proof-dot" /> Real R, in your browser</span>
                    <span className="proof-divider" />
                    <span>No account needed</span>
                    <span className="proof-divider" />
                    <span>11 learning modules</span>
                  </div>
                </div>

                <div className="hero-art" aria-label="Illustration of a sampling distribution">
                  <div className="hero-art-glow" />
                  <div className="art-topline">
                    <span><span className="art-live-dot" />STATISTICAL FIELDNOTE <b>01</b></span>
                    <span>R · WASM</span>
                  </div>
                  <svg className="distribution-art" viewBox="0 0 620 300" role="img" aria-label="Illustrative bell-shaped sampling distribution">
                    <defs>
                      <linearGradient id="statlabWash" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#9d83ff" stopOpacity=".34" />
                        <stop offset="78%" stopColor="#5ed6e8" stopOpacity=".04" />
                        <stop offset="100%" stopColor="#5ed6e8" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="statlabStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#8e7cff" />
                        <stop offset="55%" stopColor="#bd9dff" />
                        <stop offset="100%" stopColor="#69e3ee" />
                      </linearGradient>
                      <filter id="statlabGlow">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>
                    <g className="chart-grid">
                      <path d="M35 55H590M35 110H590M35 165H590M35 220H590" />
                      <path d="M100 32V240M220 32V240M340 32V240M460 32V240M580 32V240" />
                    </g>
                    <path d="M35 220 C86 216 108 204 142 181 C181 154 195 114 234 88 C263 69 284 51 317 50 C350 49 373 69 399 91 C431 118 453 157 489 182 C522 205 552 216 590 220 L590 240 L35 240Z" fill="url(#statlabWash)" />
                    <path className="curve-halo" d="M35 220 C86 216 108 204 142 181 C181 154 195 114 234 88 C263 69 284 51 317 50 C350 49 373 69 399 91 C431 118 453 157 489 182 C522 205 552 216 590 220" />
                    <path className="curve-line" d="M35 220 C86 216 108 204 142 181 C181 154 195 114 234 88 C263 69 284 51 317 50 C350 49 373 69 399 91 C431 118 453 157 489 182 C522 205 552 216 590 220" />
                    <path className="mean-line" d="M317 48V240" />
                    <circle className="curve-point" cx="317" cy="50" r="5" />
                    <g className="chart-axis">
                      <text x="35"  y="262">−3σ</text>
                      <text x="220" y="262">−1σ</text>
                      <text x="317" y="262" textAnchor="middle">μ</text>
                      <text x="460" y="262">+2σ</text>
                      <text x="590" y="262" textAnchor="end">+3σ</text>
                    </g>
                  </svg>
                  <div className="art-foot">
                    <span><b>01</b> SHAPE THE QUESTION</span>
                    <span>Illustrative distribution · run an experiment below</span>
                  </div>
                </div>
              </section>

              <section className="experiment-preview" aria-labelledby="experiment-title">
                <div className="experiment-intro">
                  <div className="eyebrow">
                    <span className="preview-kicker-icon"><Sparkles size={12} /></span> TRY A SMALL EXPERIMENT
                  </div>
                  <h2 id="experiment-title">What does randomness<br />look like?</h2>
                  <p>Generate a sample in R and watch its shape form. The chart and summary come from your browser — no server involved.</p>
                  <label className="experiment-select-label" htmlFor="experiment-kind">EXPERIMENT</label>
                  <select
                    id="experiment-kind"
                    className="experiment-select"
                    value={experimentMode}
                    onChange={e => {
                      setExperimentMode(e.target.value as 'normal' | 'dice');
                      setExperimentData([]); setExperimentSummary(''); setExperimentError('');
                    }}
                  >
                    <option value="normal">Sample from a normal distribution</option>
                    <option value="dice">Roll a fair die 720 times</option>
                  </select>
                  <div className="experiment-actions">
                    <button
                      className="experiment-run"
                      onClick={() => void runExperiment()}
                      disabled={runtimeStatus !== 'ready' || experimentLoading}
                    >
                      {experimentLoading ? <span className="mini-spinner" /> : <Play size={14} fill="currentColor" />}
                      {experimentLoading ? 'Running in R…' : experimentData.length ? 'Run another sample' : 'Run experiment'}
                      <span>↗</span>
                    </button>
                    <span className="experiment-source">
                      {runtimeStatus === 'ready' ? 'computed by WebR' : 'waiting for WebR'}
                    </span>
                  </div>
                  {experimentError && <p className="experiment-error" role="alert">{experimentError}</p>}
                </div>

                <div className="experiment-chart-panel">
                  <div className="experiment-chart-head">
                    <div>
                      <span className="chart-overline">LIVE R OUTPUT</span>
                      <h3>{experimentMode === 'normal' ? 'A sample, taking shape' : 'Chance across six faces'}</h3>
                    </div>
                    <span className="chart-run-count">
                      {experimentData.length ? `seed ${experimentSeed - 1}` : 'READY WHEN YOU ARE'}
                    </span>
                  </div>
                  <div className="experiment-chart-wrap">
                    {experimentData.length
                      ? <ExperimentChart data={experimentData} />
                      : <IllustrativeBars mode={experimentMode} />}
                  </div>
                  <div className="experiment-chart-foot" role="status" aria-live="polite">
                    <span>{experimentData.length ? experimentSummary : 'The first chart is a visual guide. Run R to replace it with computed values.'}</span>
                    <span>{experimentData.length ? 'R · WebR' : 'NO SAMPLE YET'}</span>
                  </div>
                </div>
              </section>

              <section className="learning-rail">
                <div className="rail-heading">
                  <div><span className="eyebrow">A GOOD PLACE TO BEGIN</span><h2>Follow a question.</h2></div>
                  <p>Explore a concept, try it in R, and see what changes.</p>
                </div>
                <div className="learning-paths">
                  <button className="learning-path path-violet" onClick={() => go('Statistics Lab')}>
                    <span className="path-index">01 <Sigma size={16} /></span>
                    <span className="path-title">Find the story in a sample</span>
                    <span className="path-description">Mean, median, spread, correlation — all computed by real R.</span>
                    <span className="path-link">Explore statistics <ArrowUpRight size={14} /></span>
                  </button>
                  <button className="learning-path path-cyan" onClick={() => go('R Playground')}>
                    <span className="path-index">02 <Code2 size={16} /></span>
                    <span className="path-title">Learn R by running it</span>
                    <span className="path-description">Start with a short program. Change a value and run it again.</span>
                    <span className="path-link">Open the playground <ArrowUpRight size={14} /></span>
                  </button>
                  <button className="learning-path path-teal" onClick={() => go('Data Visualization')}>
                    <span className="path-index">03 <BarChart3 size={16} /></span>
                    <span className="path-title">Let a chart reveal a pattern</span>
                    <span className="path-description">Histograms and boxplots built from R-computed bin counts.</span>
                    <span className="path-link">Make a visualization <ArrowUpRight size={14} /></span>
                  </button>
                </div>
              </section>

              <section className="home-bottom">
                <div className="first-run-callout">
                  <div className="onboarding-mark"><span>R</span><i /></div>
                  <div>
                    <span className="eyebrow">YOUR FIRST FEW MINUTES</span>
                    <h3>Start small. Stay curious.</h3>
                    <p>Open the playground, run one line, then change a value and run it again. That&apos;s how every statistical idea clicks.</p>
                  </div>
                  <button className="onboarding-action" onClick={() => go('R Playground')}>
                    Start with R <ArrowUpRight size={14} />
                  </button>
                </div>
                <section className="home-activity">
                  <div className="activity-head">
                    <div>
                      <span className="eyebrow">LOCAL TO THIS BROWSER</span>
                      <h3>Your learning trail</h3>
                    </div>
                    <Activity size={17} />
                  </div>
                  <div className="activity-numbers">
                    <div><strong>{runs}</strong><span>R runs</span></div>
                    <div><strong>{completedLessons.length}<small> / {fundamentalsLessons.length}</small></strong><span>lessons</span></div>
                    <div>
                      <strong>{progress.length}<small> / {exercises.length}</small></strong>
                      <span>challenges</span>
                    </div>
                    <div className="activity-streak">
                      <div className="progress-track">
                        <span style={{ width: `${(progress.length / exercises.length) * 100}%` }} />
                      </div>
                      <span>{progress.length ? `${progress.length} of ${exercises.length} checked` : 'Ready when you are'}</span>
                    </div>
                  </div>
                  {activity.length
                    ? <ol className="activity-list">{activity.slice(0, 3).map(x => <li key={x}>{x}</li>)}</ol>
                    : <div className="activity-empty"><span className="empty-orbit" />Your experiments will show up here as you go.</div>}
                  {recentModules.length > 0 && (
                    <div className="recent-modules"><span>Recently opened</span>{recentModules.slice(0, 3).map(name => <button key={name} onClick={() => go(name)}>{name}<ArrowUpRight size={12} /></button>)}</div>
                  )}
                </section>
              </section>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              R Playground
          ══════════════════════════════════════════════════════ */}
          {active === 'R Playground' && (
            <>
              <Heading icon={<Code2 size={18} />} title="R Playground" description="Write and run genuine R code — executed by WebAssembly in your browser." />

              <InfoBox>
                <strong>What is this?</strong> The R Playground runs actual R 4 code in your browser using WebAssembly — no server, no installation.
                Type any R expression, click <strong>Run R</strong> (or press <kbd>Ctrl+Enter</kbd>), and see the output immediately.
                Variables you create persist between runs in the same session.
              </InfoBox>

              <div className="toolbar">
                <select className="tool-select" aria-label="Load R example" defaultValue="" onChange={e => { if (e.target.value !== '') setCode(examples[Number(e.target.value)].code); }}>
                  <option value="">Load example…</option>
                  {examples.map((ex, i) => <option value={i} key={ex.title}>{ex.group} · {ex.title}</option>)}
                </select>
                <span className="toolbar-spacer" />
                <button className="tool" onClick={copyCode}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}</button>
                <button className="tool" onClick={() => downloadFile('statlab.R', code)}><Download size={14} />Download .R</button>
                <button className="tool" onClick={resetCode}><RotateCcw size={14} />Reset</button>
                <button className="primary" disabled={running || runtimeStatus !== 'ready'} onClick={() => run()}>
                  <Play size={13} fill="currentColor" />{running ? 'Running…' : 'Run R'} <kbd className="kbd">Ctrl ↵</kbd>
                </button>
              </div>
              <div className="editor-grid">
                <section className="panel editor-panel">
                  <div className="editor-top">
                    <span><i className="file-dot" /> main.R</span>
                    <span>{code.split('\n').length} lines</span>
                  </div>
                  <CodeEditor code={code} onChange={setCode} onRun={() => run()} />
                  <div className="editor-foot">
                    <span>R 4 · WebAssembly · browser-local</span>
                    <span>Saved automatically</span>
                  </div>
                </section>
                <section className="panel console-panel">
                  <div className="console-top">
                    <strong><Terminal size={13} />Console</strong>
                    <div>
                      <span className={`runtime-dot ${running ? 'initializing' : error ? 'error' : 'ready'}`} />
                      <button onClick={() => { setOutput([]); setError(''); setImages([]); }}>Clear output</button>
                    </div>
                  </div>
                  <div className="console-body">
                    <span className={`console-badge${error ? ' error' : running ? ' warn' : ''}`}>
                      {error ? 'Execution failed' : running ? 'Running R code' : runtimeStatus === 'ready' ? 'Ready' : runtimeStatus === 'error' ? 'Runtime unavailable' : 'Initializing'}
                    </span>
                    {error && (
                      <div className="console-line error">
                        <span className="console-prefix">×</span><span>{error}</span>
                      </div>
                    )}
                    <Output items={output} />
                    {duration !== null && (
                      <div className="chart-caption">Completed in {duration.toFixed(0)} ms · actual WebR execution</div>
                    )}
                  </div>
                  {images.length > 0 && <PlotImages images={images} />}
                  <div className="environment">
                    <div className="environment-head"><span>R ENVIRONMENT</span><span>persistent R session</span></div>
                    <div className="environment-empty">Variables remain available between runs in this session. Use rm() to clear them.</div>
                  </div>
                </section>
              </div>
              <div className="runtime-banner">
                <Lightbulb size={14} />
                <span>
                  <strong>Actual R execution.</strong> WebR runs R 4 compiled to WebAssembly in a browser worker. First startup may take a moment to download the runtime. Your code and files never leave your browser.
                </span>
                {runtimeStatus === 'error' && (
                  <button
                    className="link-button"
                    onClick={() => initializeWebR(s => setRuntimeStatus(s)).then(r => { setRuntime(r); setRuntimeStatus('ready'); }).catch(e => setRuntimeMessage(String(e)))}
                  >Retry</button>
                )}
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════
              R Fundamentals
          ══════════════════════════════════════════════════════ */}
          {active === 'R Fundamentals' && (
            <>
              <Heading icon={<Type size={18} />} title="R Fundamentals" description="A 20-lesson path from your first expression to basic statistical summaries." />
              <InfoBox>
                <strong>How to use this module:</strong> Choose a topic, read its goal and explanation, and run the example in WebR. Mark a lesson complete when you feel ready to move on. You can return to any topic at any time.
              </InfoBox>
              <div className="split-layout">
                <section className="panel challenge-list">
                  {fundamentalsLessons.map((item, i) => (
                    <button
                      key={item.title}
                      className={`challenge-item${lesson === i ? ' active' : ''}`}
                      onClick={() => { setLesson(i); setFundamentalsOut([]); }}
                    >
                      <span className={`challenge-number${completedLessons.includes(i) ? ' done' : ''}`}>{completedLessons.includes(i) ? '✓' : String(i + 1).padStart(2, '0')}</span>
                      <span><b>{item.title}</b><small>{item.summary}</small></span>
                    </button>
                  ))}
                </section>
                <section className="panel result-panel">
                  <div className="panel-head"><div><h3>{fundamentalsLessons[lesson].title}</h3><p>{fundamentalsLessons[lesson].summary}</p></div></div>
                  <p className="eyebrow">LEARNING OBJECTIVE</p>
                  <p className="lesson-text">{fundamentalsLessons[lesson].objective}</p>
                  <p className="lesson-text">{fundamentalsLessons[lesson].explanation}</p>
                  <LessonCode code={fundamentalsLessons[lesson].code} />
                  <p className="lesson-text"><strong>Expected result:</strong> {fundamentalsLessons[lesson].expected}</p>
                  <p className="lesson-text"><strong>Common mistake:</strong> {fundamentalsLessons[lesson].commonMistake}</p>
                  <p className="lesson-text"><strong>Try it:</strong> {fundamentalsLessons[lesson].exercise}</p>
                  <button
                    className="primary"
                    style={{ marginTop: 12 }}
                    disabled={runtimeStatus !== 'ready'}
                    onClick={async () => {
                      try {
                        const r = await executeR(fundamentalsLessons[lesson].code, runtime || undefined);
                        setFundamentalsOut(r.output);
                      } catch (e) { setFundamentalsOut([{ type: 'error', text: String(e) }]); }
                    }}
                  >
                    <Play size={13} fill="currentColor" />Run example in R
                  </button>
                  <button
                    className="secondary"
                    style={{ margin: '12px 0 0 8px' }}
                    aria-pressed={completedLessons.includes(lesson)}
                    onClick={() => setCompletedLessons(old => {
                      const next = old.includes(lesson) ? old : [...old, lesson].sort((a, b) => a - b);
                      writeProgressPatch({ completedLessons: next });
                      return next;
                    })}
                  >
                    {completedLessons.includes(lesson) ? 'Lesson completed' : 'Mark lesson complete'}
                  </button>
                  <Output items={fundamentalsOut} />
                  {hasSuccessfulOutput(fundamentalsOut) && (
                    <p className="lesson-text" style={{ marginTop: 10 }}>
                      <strong>Reading the result:</strong> These values were computed by R in your browser.
                      Experiment by pasting the example into the <button className="link-button" style={{ padding: '0 2px' }} onClick={() => go('R Playground')}>R Playground</button> to modify and explore it freely.
                    </p>
                  )}
                </section>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════
              Vectors & Matrices
          ══════════════════════════════════════════════════════ */}
          {active === 'Vectors & Matrices' && (
            <>
              <Heading icon={<Braces size={18} />} title={active} description="Create vectors and matrices, then calculate with base R and StatLab helpers." />
              <InfoBox>
                <strong>What is this?</strong> Vectors are R&apos;s primary data structure — ordered sequences of values.
                Matrices are two-dimensional arrays. This module lets you enter your own numbers and see R&apos;s built-in operations applied live.
                <br /><strong>How to use:</strong> Enter comma-separated numbers in the box, then click <strong>Run vector operations</strong>.
                The matrix example always uses a fixed 3×3 matrix — click <strong>Run matrix example</strong> to see it.
              </InfoBox>
              <div className="split-layout">
                <section className="panel controls">
                  <span className="eyebrow">VECTOR INPUT</span>
                  <label>Your numeric values (comma-separated)
                    <textarea value={values} onChange={e => setValues(e.target.value)} rows={4} />
                  </label>
                  <p className="lesson-text">Values are validated and passed to R as a numeric vector.</p>
                  <button
                    className="primary"
                    disabled={runtimeStatus !== 'ready'}
                    onClick={async () => {
                      try {
                        const v = parseNumeric(values);
                        const r = await executeR(
                          `v <- c(${v.join(', ')})\ncat("Your vector:\\n")\nprint(v)\ncat("\\n")\nstatlab_vector_summary(v)\ncat("\\nSorted ascending:\\n")\nprint(sort(v))\ncat("Unique values:\\n")\nprint(unique(v))`,
                          runtime || undefined,
                        );
                        setVectorsOut(r.output);
                      } catch (e) { setVectorsOut([{ type: 'error', text: String(e) }]); }
                    }}
                  >
                    <Play size={13} />Run vector operations
                  </button>
                  <div style={{ marginTop: 16 }}>
                    <h3 style={{ fontSize: 13, marginBottom: 8 }}>Matrix operations</h3>
                    <p className="lesson-text">A 3×3 matrix filled with 1–9. See row/column sums and transpose.</p>
                    <button
                      className="secondary"
                      onClick={async () => {
                        try {
                          const r = await executeR(
                            `m <- matrix(1:9, nrow = 3, ncol = 3)\ncat("Matrix m:\\n")\nprint(m)\ncat("\\nRow sums:\\n"); print(rowSums(m))\ncat("\\nColumn sums:\\n"); print(colSums(m))\ncat("\\nTranspose t(m):\\n"); print(t(m))\ncat("\\nStatLab summary:\\n")\nstatlab_matrix_summary(m)`,
                            runtime || undefined,
                          );
                          setVectorsOut(r.output);
                        } catch (e) { setVectorsOut([{ type: 'error', text: String(e) }]); }
                      }}
                    >
                      <Play size={13} />Run matrix example
                    </button>
                  </div>
                </section>
                <section className="panel result-panel">
                  <div className="panel-head"><div><h3>R result</h3><p>Output from your R calculations</p></div></div>
                  <Output items={vectorsOut} />
                  {hasSuccessfulOutput(vectorsOut) && (
                    <p className="lesson-text" style={{ marginTop: 10 }}>
                      <strong>Understanding the output:</strong> <code>statlab_vector_summary()</code> returns the count, sum, mean, min, and max. Try entering a different set of numbers and running again.
                    </p>
                  )}
                </section>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════
              Data Frames
          ══════════════════════════════════════════════════════ */}
          {active === 'Data Frames' && (
            <>
              <Heading icon={<Table2 size={18} />} title="Data Frames" description="R's primary way to store and work with tabular data." />
              <InfoBox>
                <strong>What is a data frame?</strong> A data frame is R&apos;s equivalent of a spreadsheet table — rows are observations, columns are variables.
                Click <strong>Run R example</strong> to see how R creates a data frame, filters rows, and computes column summaries using the StatLab helper functions.
              </InfoBox>
              <div className="panel result-panel">
                <div className="panel-head">
                  <div>
                    <h3>Student marks · sample teaching data</h3>
                    <p>Created by <code>statlab_student_marks()</code> from the StatLab R library.</p>
                  </div>
                  <button
                    className="primary"
                    onClick={() => runDataset('Student marks', setDataFrameOut)}
                    disabled={runtimeStatus !== 'ready'}
                  >
                    <Play size={13} />Run R example
                  </button>
                </div>
                <DataTable rows={sampleRows} />
                <Output items={dataFrameOut} />
                <LessonCode code={`students <- statlab_student_marks()\n\n# Filter rows where marks >= 80\nstatlab_filter_rows(students, "marks", 80)\n\n# Summarise all numeric columns\nstatlab_summarise_numeric(students)`} />
                {hasSuccessfulOutput(dataFrameOut) && (
                  <p className="lesson-text" style={{ marginTop: 8 }}>
                    <strong>Reading the output:</strong> The filtered table shows only students with marks ≥ 80.
                    The numeric summary gives mean, min, max, and standard deviation for each numeric column.
                    Head to the <button className="link-button" style={{ padding: '0 2px' }} onClick={() => go('Dataset Explorer')}>Dataset Explorer</button> to import your own CSV data.
                  </p>
                )}
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════
              Statistics Lab  (tabbed: descriptive | correlation | hypothesis | regression)
          ══════════════════════════════════════════════════════ */}
          {active === 'Statistics Lab' && (
            <>
              <Heading icon={<Sigma size={18} />} title={active} description="Descriptive stats, correlation, hypothesis testing, and regression — all computed by R." />

              {/* Tab bar */}
              <div className="stats-tabs">
                {(['descriptive', 'correlation', 'hypothesis', 'regression'] as const).map(tab => (
                  <button
                    key={tab}
                    className={`stats-tab${statsTab === tab ? ' active' : ''}`}
                    onClick={() => setStatsTab(tab)}
                  >
                    {tab === 'descriptive'  && <><Sigma size={13} />Descriptive</>}
                    {tab === 'correlation'  && <><GitBranch size={13} />Correlation</>}
                    {tab === 'hypothesis'   && <><Lightbulb size={13} />Hypothesis Test</>}
                    {tab === 'regression'   && <><TrendingUp size={13} />Regression</>}
                  </button>
                ))}
              </div>

              {/* ── Descriptive statistics ── */}
              {statsTab === 'descriptive' && (
                <div className="split-layout">
                  <section className="panel controls">
                    <InfoBox>
                      <strong>What is this?</strong> Descriptive statistics summarise a dataset in a few numbers.
                      Mean tells you the centre; standard deviation tells you the spread; quartiles tell you the shape.
                      <br /><strong>How to use:</strong> Enter comma-separated numbers, then click <strong>Calculate in R</strong>.
                    </InfoBox>
                    <span className="eyebrow" style={{ marginTop: 12 }}>YOUR DATA</span>
                    <label>Numeric sample values
                      <textarea className="data-entry" aria-label="Numeric sample values" value={values} onChange={e => setValues(e.target.value)} rows={5} />
                    </label>
                    <button className="secondary" onClick={() => setValues('10, 20, 30, 40, 50')}>Load reference sample</button>
                    <button className="primary" disabled={runtimeStatus !== 'ready'} onClick={runStats}>
                      <Play size={13} fill="currentColor" />Calculate in R
                    </button>
                  </section>
                  <section className="panel result-panel">
                    <div className="panel-head"><div><h3>R summary result</h3><p>Computed by <code>statlab_descriptive_summary()</code></p></div></div>
                    <Output items={statsLabOut} />
                    <LessonCode code={`x <- c(10, 20, 30, 40, 50)\nstatlab_descriptive_summary(x)\nstatlab_mode(x)`} />
                    {hasSuccessfulOutput(statsLabOut) && (
                      <p className="lesson-text" style={{ marginTop: 8 }}>
                        <strong>Reading the result:</strong> <em>variance_sample</em> and <em>sd_sample</em> use R&apos;s <code>var()</code> and <code>sd()</code> which divide by n−1 (Bessel&apos;s correction for sample data).
                        Q1 and Q3 are the 25th and 75th percentiles. The IQR (Q3−Q1) measures spread while ignoring outliers.
                      </p>
                    )}
                    <p className="chart-caption">Mode = all values with the highest frequency. If all values are unique, every value is the mode.</p>
                  </section>
                </div>
              )}

              {/* ── Correlation ── */}
              {statsTab === 'correlation' && (
                <div className="split-layout">
                  <section className="panel controls">
                    <InfoBox>
                      <strong>What is correlation?</strong> Correlation measures how strongly two variables move together.
                      A value near +1 means they increase together; near −1 means one increases as the other decreases; near 0 means little relationship.
                      <br /><strong>How to use:</strong> Enter two equal-length vectors, then click <strong>Calculate correlation</strong>.
                    </InfoBox>
                    <span className="eyebrow" style={{ marginTop: 12 }}>TWO VARIABLES</span>
                    <label>X values (comma-separated)
                      <textarea className="data-entry" value={corrX} onChange={e => setCorrX(e.target.value)} rows={3} />
                    </label>
                    <label>Y values (same length as X)
                      <textarea className="data-entry" value={corrY} onChange={e => setCorrY(e.target.value)} rows={3} />
                    </label>
                    <button className="primary" disabled={runtimeStatus !== 'ready'} onClick={runCorrelation}>
                      <Play size={13} fill="currentColor" />Calculate correlation
                    </button>
                  </section>
                  <section className="panel result-panel">
                    <div className="panel-head"><div><h3>Correlation result</h3><p>Pearson and Spearman coefficients + significance test</p></div></div>
                    <Output items={corrOut} />
                    <LessonCode code={`x <- c(10, 20, 30, 40, 50)\ny <- c(12, 25, 28, 37, 53)\nstatlab_correlation(x, y)          # Pearson\nstatlab_correlation(x, y, method = "spearman")\ncor.test(x, y)`} />
                    {hasSuccessfulOutput(corrOut) && (
                      <p className="lesson-text" style={{ marginTop: 8 }}>
                        <strong>Reading the result:</strong> The Pearson coefficient assumes a linear relationship. Spearman uses ranks and works for monotone (not necessarily linear) relationships.
                        The p-value from <code>cor.test()</code> tells you whether the correlation is statistically significant — typically a p-value below 0.05 is considered significant.
                      </p>
                    )}
                  </section>
                </div>
              )}

              {/* ── Hypothesis testing ── */}
              {statsTab === 'hypothesis' && (
                <div className="split-layout">
                  <section className="panel controls">
                    <InfoBox>
                      <strong>What is hypothesis testing?</strong> A one-sample t-test asks: &quot;Is the true mean of my sample equal to some value I expect (μ₀)?&quot; The test tells you how likely your data is <em>if</em> that expected value were true.
                      <br /><strong>How to use:</strong> Enter your sample, a hypothesised mean, and choose the type of test.
                    </InfoBox>
                    <span className="eyebrow" style={{ marginTop: 12 }}>ONE-SAMPLE T-TEST</span>
                    <label>Sample values (comma-separated)
                      <textarea className="data-entry" value={htSample} onChange={e => setHtSample(e.target.value)} rows={3} />
                    </label>
                    <label>Hypothesised mean (μ₀)
                      <input type="number" value={htMu} onChange={e => setHtMu(e.target.value)} />
                    </label>
                    <label>Alternative hypothesis
                      <select value={htAlt} onChange={e => setHtAlt(e.target.value)} className="lesson-select">
                        <option value="two.sided">Two-sided: μ ≠ μ₀</option>
                        <option value="greater">One-sided: μ &gt; μ₀</option>
                        <option value="less">One-sided: μ &lt; μ₀</option>
                      </select>
                    </label>
                    <button className="primary" disabled={runtimeStatus !== 'ready'} onClick={runHypothesis}>
                      <Play size={13} fill="currentColor" />Run t-test in R
                    </button>
                  </section>
                  <section className="panel result-panel">
                    <div className="panel-head"><div><h3>Hypothesis test result</h3><p>Computed by <code>t.test()</code> via <code>statlab_one_sample_test()</code></p></div></div>
                    <Output items={htOut} />
                    <LessonCode code={`x <- c(82, 76, 90, 88, 74, 93, 69, 85)\nstatlab_one_sample_test(x, mu = 80, alternative = "two.sided")`} />
                    {hasSuccessfulOutput(htOut) && (
                      <p className="lesson-text" style={{ marginTop: 8 }}>
                        <strong>Reading the result:</strong> The <em>t-statistic</em> measures how many standard errors the sample mean is from μ₀.
                        The <em>p-value</em> is the probability of seeing a t-statistic this large (or larger) purely by chance.
                        If p &lt; 0.05, we reject the null hypothesis (H₀: μ = μ₀) at the 5% significance level.
                        The 95% confidence interval gives a range of plausible values for the true mean.
                      </p>
                    )}
                  </section>
                </div>
              )}

              {/* ── Regression ── */}
              {statsTab === 'regression' && (
                <>
                  <div className="split-layout">
                    <section className="panel controls">
                      <InfoBox>
                        <strong>What is linear regression?</strong> Simple linear regression fits the line <em>ŷ = a + bx</em> that best explains the relationship between an input (X) and an output (Y).
                        The slope (b) tells you how much Y changes for each unit increase in X. R² tells you how much of the variation in Y is explained by X.
                        <br /><strong>How to use:</strong> Enter X and Y vectors of the same length, then click <strong>Fit regression in R</strong>.
                      </InfoBox>
                      <span className="eyebrow" style={{ marginTop: 12 }}>LINEAR REGRESSION</span>
                      <label>X values (predictor)
                        <textarea className="data-entry" value={regX} onChange={e => setRegX(e.target.value)} rows={3} />
                      </label>
                      <label>Y values (response)
                        <textarea className="data-entry" value={regY} onChange={e => setRegY(e.target.value)} rows={3} />
                      </label>
                      <button className="primary" disabled={runtimeStatus !== 'ready'} onClick={runRegression}>
                        <TrendingUp size={13} />Fit regression in R
                      </button>
                    </section>
                    <section className="panel result-panel">
                      <div className="panel-head"><div><h3>Regression result</h3><p>Computed by <code>lm()</code> via <code>statlab_fit_linear()</code></p></div></div>
                      <Output items={regOut} />
                      {regScatter.length > 0 && (
                        <p className="lesson-text" style={{ marginTop: 8 }}>
                          <strong>Reading the result:</strong> Look for <em>Intercept (a)</em> and <em>Slope (b)</em> — these define the fitted line ŷ = a + b·x.
                          <em>R-squared</em> (0–1) tells you the proportion of variation in Y explained by X. Values near 1 indicate a strong fit.
                          The scatter plot below shows your data points; the trend line is the model&apos;s prediction.
                        </p>
                      )}
                    </section>
                  </div>
                  {regScatter.length > 0 && (
                    <div className="panel" style={{ padding: 14, marginTop: 10 }}>
                      <div className="panel-head"><div><h3>Scatter plot with regression line</h3><p>Each point is a data pair (x, y); the line is ŷ = a + bx from R</p></div></div>
                      <div className="chart" style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" />
                            <XAxis dataKey="x" name="X" tick={{ fill: 'var(--muted)', fontSize: 11 }} label={{ value: 'X (predictor)', position: 'bottom', fill: 'var(--muted)', fontSize: 11 }} />
                            <YAxis dataKey="y" name="Y" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                            <Scatter data={regScatter} fill="#a78bfa" opacity={0.85} name="Data" />
                            <Scatter data={regFitLine} fill="none" line={{ stroke: '#64d9eb', strokeWidth: 2 }} shape={() => null} name="Fit" />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ══════════════════════════════════════════════════════
              Probability Lab
          ══════════════════════════════════════════════════════ */}
          {active === 'Probability Lab' && (
            <>
              <Heading icon={<Dices size={18} />} title={active} description="Simulate random experiments and explore the law of large numbers." />
              <InfoBox>
                <strong>What is this?</strong> This module simulates rolling a fair 6-sided die many times using R&apos;s random number generator.
                As you increase the number of rolls, each face should appear about 1/6 of the time — this is the <em>Law of Large Numbers</em> in action.
                <br /><strong>Try it:</strong> Start with 100 rolls, observe the uneven distribution. Then try 10 000 — the bars become much more uniform.
                Use the same seed to get reproducible results.
              </InfoBox>
              <div className="split-layout">
                <section className="panel controls">
                  <span className="eyebrow">DICE SIMULATOR</span>
                  <h3 style={{ fontSize: 14, margin: '10px 0 14px' }}>Experiment settings</h3>
                  <label>Number of rolls (1 – 100,000)
                    <input type="number" min="1" max="100000" value={probN} onChange={e => setProbN(Number(e.target.value) || 1)} />
                  </label>
                  <label>Random seed (any integer for reproducibility)
                    <input type="number" value={probSeed} onChange={e => setProbSeed(Number(e.target.value) || 1)} />
                  </label>
                  <p className="lesson-text">The seed makes results identical each time you run with the same value. Change it to get a different random sample.</p>
                  <button className="primary" disabled={runtimeStatus !== 'ready'} onClick={runProbability}>
                    <Play size={13} fill="currentColor" />Simulate using R
                  </button>
                  <div style={{ marginTop: 14 }}>
                    <p className="lesson-text"><strong>Quick experiments:</strong></p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {[100, 1000, 10000, 100000].map(n => (
                        <button key={n} className="secondary" onClick={() => setProbN(n)}>
                          Try {n.toLocaleString()} rolls
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
                <section className="panel result-panel">
                  <div className="panel-head">
                    <div><h3>Dice simulation result</h3><p>Bar heights = observed frequency for each face; computed by R&apos;s <code>table()</code></p></div>
                  </div>
                  {probChartData.length
                    ? <Chart data={probChartData} color="#a78bfa" />
                    : <div className="empty-plot">Run the simulation to see the frequency distribution.</div>}
                  <Output items={probOut} />
                  {hasSuccessfulOutput(probOut) && (
                    <p className="lesson-text" style={{ marginTop: 8 }}>
                      <strong>Understanding the output:</strong> Theoretical mean = 3.5. If your empirical mean is close to 3.5, the Law of Large Numbers is working. The more rolls you use, the closer the observed frequencies will be to 1/6 ≈ 16.7%.
                    </p>
                  )}
                </section>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════
              Data Visualization
          ══════════════════════════════════════════════════════ */}
          {active === 'Data Visualization' && (
            <>
              <Heading icon={<BarChart3 size={18} />} title={active} description="R computes the statistics; Recharts renders the chart in your browser." />
              <InfoBox>
                <strong>What is this?</strong> Enter numbers, choose a chart type, and click to compute.
                R calculates the bin counts or summary statistics; the interactive chart is drawn from those values.
                <br /><strong>Histogram</strong> shows how data is distributed across ranges. <strong>Boxplot summary</strong> shows the five-number summary (min, Q1, median, Q3, max).
              </InfoBox>

              <div className="stats-tabs" style={{ marginBottom: 12 }}>
                <button className={`stats-tab${vizMode === 'histogram' ? ' active' : ''}`} onClick={() => { setVizMode('histogram'); setVizOut([]); setVizChartData([]); setBoxStats([]); }}>
                  <BarChart3 size={13} />Histogram
                </button>
                <button className={`stats-tab${vizMode === 'boxplot' ? ' active' : ''}`} onClick={() => { setVizMode('boxplot'); setVizOut([]); setVizChartData([]); setBoxStats([]); }}>
                  <Activity size={13} />Boxplot Summary
                </button>
              </div>

              <div className="split-layout">
                <section className="panel controls">
                  <span className="eyebrow">DATA INPUT</span>
                  <label>Numeric values (comma-separated)
                    <textarea value={values} onChange={e => setValues(e.target.value)} rows={5} />
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button className="secondary" onClick={() => setValues('2, 5, 5, 6, 7, 7, 7, 8, 8, 9, 10, 11, 12, 15')}>
                      Load sample dataset
                    </button>
                    {vizMode === 'histogram' && (
                      <button className="primary" disabled={runtimeStatus !== 'ready'} onClick={runHistogram}>
                        <BarChart3 size={14} />Compute histogram with R
                      </button>
                    )}
                    {vizMode === 'boxplot' && (
                      <button className="primary" disabled={runtimeStatus !== 'ready'} onClick={runBoxplot}>
                        <Activity size={14} />Compute boxplot with R
                      </button>
                    )}
                  </div>
                  <p className="lesson-text" style={{ marginTop: 12 }}>
                    {vizMode === 'histogram'
                      ? 'R uses Sturges\' formula to automatically choose the number of bins. More data → more bins.'
                      : 'The five-number summary (min, Q1, median, Q3, max) is computed by R\'s boxplot.stats(). Outliers are values beyond 1.5×IQR.'}
                  </p>
                </section>
                <section className="panel chart-panel">
                  <div className="panel-head">
                    <div>
                      <h3>{vizMode === 'histogram' ? 'R histogram bins' : 'Five-number summary'}</h3>
                      <p>{vizMode === 'histogram' ? 'Each bar = count of values in that range, from R' : 'Statistics from boxplot.stats() in R'}</p>
                    </div>
                  </div>
                  {vizMode === 'histogram' && (
                    vizChartData.length
                      ? <Chart data={vizChartData} color="#8170e8" />
                      : <div className="empty-plot">Compute the histogram to populate this chart.</div>
                  )}
                  {vizMode === 'boxplot' && (
                    boxStats.length === 5
                      ? (
                        <div className="boxplot-display">
                          <div className="boxplot-visual">
                            {(() => {
                              const [mn, q1, med, q3, mx] = boxStats;
                              const range = mx - mn || 1;
                              const pct = (v: number) => (v - mn) / range * 100;
                              return (
                                <>
                                  <div className="boxplot-line" style={{ left: 0, right: 0 }} />
                                  <div className="boxplot-box" style={{ left: `${pct(q1).toFixed(1)}%`, width: `${Math.max(pct(q3) - pct(q1), 5).toFixed(1)}%` }} />
                                  <div className="boxplot-median" style={{ left: `${pct(med).toFixed(1)}%` }} />
                                  <div className="boxplot-whisker" style={{ left: `0%`, width: `${pct(q1).toFixed(1)}%` }} />
                                  <div className="boxplot-whisker" style={{ left: `${pct(q3).toFixed(1)}%`, width: `${(100 - pct(q3)).toFixed(1)}%` }} />
                                  <div className="boxplot-labels">
                                    <span title="Min">{mn.toFixed(2)}<br /><small>Min</small></span>
                                    <span title="Q1">{q1.toFixed(2)}<br /><small>Q1</small></span>
                                    <span title="Median">{med.toFixed(2)}<br /><small>Median</small></span>
                                    <span title="Q3">{q3.toFixed(2)}<br /><small>Q3</small></span>
                                    <span title="Max">{mx.toFixed(2)}<br /><small>Max</small></span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                          <div className="boxstat-grid">
                            {['Min', 'Q1 (25th)', 'Median', 'Q3 (75th)', 'Max'].map((label, i) => (
                              <div key={label} className="metric panel">
                                <span>{label}</span>
                                <b>{boxStats[i]?.toFixed(2) ?? '—'}</b>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                      : <div className="empty-plot">Compute the boxplot summary to see results.</div>
                  )}
                  <Output items={vizOut} />
                  {hasSuccessfulOutput(vizOut) && vizMode === 'histogram' && (
                    <p className="lesson-text" style={{ marginTop: 8 }}>
                      <strong>Reading the chart:</strong> The x-axis shows value ranges (bins) and the y-axis counts observations in each bin. A roughly symmetric, bell-shaped histogram is compatible with a normal distribution, but the chart alone cannot prove a model fits well—especially for a small sample.
                    </p>
                  )}
                  {boxStats.length === 5 && vizMode === 'boxplot' && (
                    <p className="lesson-text" style={{ marginTop: 8 }}>
                      <strong>Reading the result:</strong> The box spans Q1 to Q3 (the middle 50% of data). The line inside the box is the median. Whiskers extend to the min and max (or to 1.5×IQR). Values beyond the whiskers are outliers.
                    </p>
                  )}
                </section>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════
              Dataset Explorer
          ══════════════════════════════════════════════════════ */}
          {active === 'Dataset Explorer' && (
            <>
              <Heading icon={<Database size={18} />} title={active} description="Browse, search, import, and analyze tabular data — all in the browser." />
              <InfoBox>
                <strong>What is this?</strong> Explore built-in teaching datasets or import your own CSV file.
                The <strong>Analyze with R</strong> button sends the current table to WebR as a real R data frame and runs <code>str()</code> and <code>summary()</code> on it — even for imported CSVs.
                <br /><strong>Import limit:</strong> 2 MB and 5 000 rows. All data stays in your browser.
              </InfoBox>
              <div className="toolbar">
                <select
                  className="tool-select"
                  value={dataset === 'Monthly expenses' ? 'Monthly expenses' : 'Student marks'}
                  onChange={e => runDataset(e.target.value, setDatasetOut)}
                >
                  <option>Student marks</option>
                  <option>Monthly expenses</option>
                </select>
                <label className="tool">
                  <Search size={13} />
                  <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rows…" />
                </label>
                <label className="tool upload-label">Import CSV
                  <input type="file" accept=".csv,text/csv" onChange={e => loadCsv(e.target.files?.[0])} />
                </label>
                <button className="tool" onClick={exportCsv}><Download size={13} />Export CSV</button>
                {/* CSV-to-R bridge: sends current tableRows to WebR as a data.frame */}
                <button className="primary" onClick={runCsvAnalysis} disabled={runtimeStatus !== 'ready' || tableRows.length === 0}>
                  <Play size={13} />Analyze with R
                </button>
              </div>
              {csvError && <div className="runtime-banner"><X size={14} />{csvError}</div>}
              <div className="panel result-panel">
                <div className="panel-head">
                  <div>
                    <h3>{dataset}</h3>
                    <p>{visibleRows.length} row{visibleRows.length !== 1 ? 's' : ''} shown · {Object.keys(tableRows[0] || {}).length} column{Object.keys(tableRows[0] || {}).length !== 1 ? 's' : ''} · local browser data</p>
                  </div>
                </div>
                <DataTable rows={visibleRows} />
                <Output items={datasetOut} />
                {hasSuccessfulOutput(datasetOut) && (
                  <p className="lesson-text" style={{ marginTop: 8 }}>
                    <strong>Reading the output:</strong> <code>str()</code> shows the column types and a preview of values. <code>summary()</code> provides min, max, mean, and quartiles for numeric columns, and counts for character columns.
                  </p>
                )}
              </div>
              <div className="runtime-banner">
                <Database size={14} />
                <span>CSV parsing runs in your browser. Your data is never uploaded to a server. Quoted commas, escaped quotes, and null values are handled correctly.</span>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════
              Learning Challenges
          ══════════════════════════════════════════════════════ */}
          {active === 'Learning Challenges' && (
            <>
              <Heading icon={<Lightbulb size={18} />} title={active} description="Write R code to solve each challenge — your answer is checked by running real R." />
              <InfoBox>
                <strong>How it works:</strong> Each challenge has a goal and a starter template. Edit the code, then click <strong>Run &amp; check</strong>.
                Your code runs in WebR and the result is verified using R&apos;s <code>stopifnot()</code>. If the check passes, the challenge is marked complete.
                Use the <strong>Hint</strong> button if you get stuck.
              </InfoBox>
              <div className="challenge-layout">
                <section className="panel challenge-list">
                  <div className="challenge-progress">
                    <span>YOUR PROGRESS</span>
                    <b>{progress.length} / {exercises.length}</b>
                    <div className="progress-track">
                      <span style={{ width: `${(progress.length / exercises.length) * 100}%` }} />
                    </div>
                    <button className="link-button" onClick={() => {
                      if (window.confirm('Reset all completed challenges? This cannot be undone.')) {
                        setProgress([]); writeProgressPatch({ completedChallenges: [] }); setSolutionVisible(false);
                      }
                    }}>
                      Reset progress
                    </button>
                  </div>
                  {exercises.map((ex, i) => (
                    <button
                      key={ex.title}
                      className={`challenge-item${challenge === i ? ' active' : ''}`}
                      onClick={() => { setChallenge(i); setChallengeCode(ex.starter); setChallengeFeedback(''); setSolutionVisible(false); }}
                    >
                      <span className={`challenge-number${progress.includes(i) ? ' done' : ''}`}>
                        {progress.includes(i) ? '✓' : `0${i + 1}`}
                      </span>
                      <span><b>{ex.title}</b><small>{ex.difficulty} · {ex.topic}</small></span>
                      <ChevronRight size={14} />
                    </button>
                  ))}
                </section>
                <section className="panel challenge-detail">
                  <span className="eyebrow">CHALLENGE {String(challenge + 1).padStart(2, '0')} · {exercises[challenge].difficulty.toUpperCase()} · {exercises[challenge].topic.toUpperCase()}</span>
                  <h2>{exercises[challenge].title}</h2>
                  <p>{exercises[challenge].goal}</p>
                  <p className="lesson-text"><strong>Expected result:</strong> {exercises[challenge].expected}</p>
                  <textarea
                    className="challenge-editor"
                    aria-label="Challenge answer code"
                    spellCheck={false}
                    value={challengeCode}
                    onChange={e => setChallengeCode(e.target.value)}
                  />
                  <div className="actions">
                    <button className="primary" onClick={async () => {
                      if (!runtime) return;
                      setChallengeFeedback('Running your code and checking the result in R…');
                      try {
                        const candidate = `${challengeCode}\n${exercises[challenge].check}\nbase::cat("\\nChallenge check passed.\\n")`;
                        const result = await executeR(
                          `base::eval(base::parse(text = ${rStringLiteral(candidate)}), envir = new.env(parent = .GlobalEnv))`,
                          runtime,
                        );
                        const success = result.output.some(x => x.text.includes('Challenge check passed'));
                        if (success) {
                          setChallengeFeedback('✓ Correct — your code passes the R computation check!');
                          setProgress(old => {
                            const next = old.includes(challenge) ? old : [...old, challenge];
                            writeProgressPatch({ completedChallenges: next });
                            return next;
                          });
                          saveActivity(`Challenge completed: ${exercises[challenge].title}`);
                        } else {
                          const msg = result.output.filter(x => x.type !== 'stdout' || x.text.trim()).map(x => x.text).join(' ').trim();
                          setChallengeFeedback(`Not quite. ${msg || 'Check that your variable names and values match the goal exactly.'}`);
                        }
                      } catch (e) {
                        setChallengeFeedback(e instanceof Error ? e.message : 'The R check could not be completed.');
                      }
                    }} disabled={runtimeStatus !== 'ready'}>
                      <Play size={13} />Run &amp; check
                    </button>
                    <button
                      className="secondary"
                      onClick={() => setChallengeFeedback(`Hint: ${exercises[challenge].hint}`)}
                    >
                      <Lightbulb size={13} />Hint
                    </button>
                    <button className="secondary" onClick={() => setSolutionVisible(value => !value)}>
                      {solutionVisible ? 'Hide solution' : 'Show solution'}
                    </button>
                  </div>
                  {solutionVisible && (
                    <div className="challenge-feedback">
                      <strong>One solution</strong>
                      <LessonCode code={exercises[challenge].solution} />
                      <p>{exercises[challenge].explanation}</p>
                    </div>
                  )}
                  {challengeFeedback && (
                    <div className={`challenge-feedback${challengeFeedback.startsWith('✓') ? ' ok' : ''}`}>
                      {challengeFeedback}
                    </div>
                  )}
                  {/* FIX: stale-closure bug resolved — compute newIdx before calling setters */}
                  <div className="challenge-nav">
                    <button
                      className="tool"
                      disabled={challenge === 0}
                      onClick={() => {
                        const newIdx = challenge - 1;
                        setChallenge(newIdx);
                        setChallengeCode(exercises[newIdx].starter);
                        setChallengeFeedback('');
                      }}
                    >
                      <ChevronLeft size={13} />Previous
                    </button>
                    <button
                      className="tool"
                      disabled={challenge === exercises.length - 1}
                      onClick={() => {
                        const newIdx = challenge + 1;
                        setChallenge(newIdx);
                        setChallengeCode(exercises[newIdx].starter);
                        setChallengeFeedback('');
                      }}
                    >
                      Next<ChevronRight size={13} />
                    </button>
                  </div>
                </section>
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════
              About
          ══════════════════════════════════════════════════════ */}
          {active === 'About' && (
            <>
              <Heading icon={<BookOpen size={18} />} title="About StatLab" description="An independent student learning and engineering project." />
              <div className="about-grid">
                <section className="panel about-card">
                  <div className="brand-symbol"><FlaskConical size={18} /></div>
                  <h2>Explore data.<br /><span>Simulate ideas.</span><br />Think statistically.</h2>
                  <p>StatLab is an interactive R programming and statistical simulation lab designed to learn by experimenting with real code and data. Calculations in the interactive lessons use genuine R running in your browser through WebAssembly. The charts are drawn in the browser from R-computed values; the labeled homepage artwork is illustrative.</p>
                  <blockquote>StatLab is an independent educational project created for learning and experimentation. It is not affiliated with, endorsed by, or an official product of NPTEL or SWAYAM.</blockquote>
                  <p>The project grew from studying R through NPTEL SWAYAM as part of a college open elective. No course content is reproduced here. You can inspect the project source on GitHub.</p>
                </section>
                <section className="panel about-card">
                  <h3>Runtime architecture</h3>
                  <p>The playground loads WebR 0.6.0, an R runtime compiled to WebAssembly. It runs entirely in a browser worker. The R source helpers in <code>r/</code> are loaded during initialization and used by the lessons, statistics, sampling, regression, and visualization modules. Recharts draws charts from values calculated by R.</p>
                  <div className="about-row"><b>Frontend</b> Next.js 16 App Router, TypeScript, Tailwind CSS 4, Recharts 3, Lucide React</div>
                  <div className="about-row"><b>R runtime</b> WebR 0.6.0 · browser-side WebAssembly · R 4</div>
                  <div className="about-row"><b>Privacy</b> User code and CSV files never leave your browser</div>
                  <div className="about-row"><b>Source</b> 10 R helper modules in <code>r/</code> — statistics, regression, probability, visualization</div>
                  <div className="about-row"><b>Repository</b> <a href="https://github.com/mukti786/StatLab" target="_blank" rel="noreferrer">GitHub source code <ArrowUpRight size={12} aria-hidden="true" /></a></div>
                  <div className="about-row"><b>Known limits</b> WebAssembly memory limits apply; package installation is not supported; first load requires downloading the WebR runtime</div>
                  <h3 style={{ marginTop: 20 }}>Modules available</h3>
                  <p>Dashboard · R Playground · R Fundamentals · Vectors &amp; Matrices · Data Frames · Statistics Lab (with descriptive statistics, correlation, hypothesis testing, and regression) · Probability Lab · Data Visualization (histogram + boxplot) · Dataset Explorer (with CSV-to-R bridge) · Learning Challenges · About</p>
                </section>
              </div>
            </>
          )}

          <footer className="footer">
            <span className="footer-mark"><FlaskConical size={13} />StatLab · Explore data. Simulate ideas. Think statistically.</span>
            <span>Independent educational project · Code runs locally in your browser</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

// ─── Code editor with syntax highlighting ─────────────────────────────────────

function CodeEditor({
  code, onChange, onRun,
}: {
  code: string; onChange: (value: string) => void; onRun: () => void;
}) {
  const highlight = useRef<HTMLPreElement>(null);
  const tokens    = useMemo(() => highlightR(code), [code]);
  return (
    <div className="editor-body">
      <div className="gutter">
        {code.split('\n').map((_, i) => <span key={i}>{i + 1}</span>)}
      </div>
      <div className="code-area">
        <pre className="syntax-layer" aria-hidden="true" ref={highlight}><code>{tokens}</code></pre>
        <textarea
          aria-label="R code editor"
          className="editor"
          spellCheck={false}
          value={code}
          onChange={e => onChange(e.target.value)}
          onScroll={e => {
            if (highlight.current) {
              highlight.current.scrollTop  = e.currentTarget.scrollTop;
              highlight.current.scrollLeft = e.currentTarget.scrollLeft;
            }
          }}
          onKeyDown={e => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); onRun(); }
            if (e.key === 'Tab') {
              e.preventDefault();
              e.currentTarget.setRangeText('  ', e.currentTarget.selectionStart, e.currentTarget.selectionEnd, 'end');
              onChange(e.currentTarget.value);
            }
          }}
        />
      </div>
    </div>
  );
}

function highlightR(source: string): ReactNode[] {
  const token = /#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:TRUE|FALSE|NA|NULL|Inf|NaN)\b|\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?L?\b|\b[A-Za-z.][A-Za-z0-9._]*\b|<-|==|!=|<=|>=|[+*/^=<>:$~!&|%-]/g;
  const nodes: ReactNode[] = [];
  let position = 0, index = 0, match: RegExpExecArray | null;
  while ((match = token.exec(source))) {
    if (match.index > position) nodes.push(source.slice(position, match.index));
    const value = match[0];
    let kind = 'code-ident';
    if (value.startsWith('#')) kind = 'code-comment';
    else if (value.startsWith('"') || value.startsWith("'")) kind = 'code-string';
    else if (/^\d/.test(value)) kind = 'code-number';
    else if (/^(TRUE|FALSE|NA|NULL|Inf|NaN)$/.test(value)) kind = 'code-constant';
    else if (/^(<-|==|!=|<=|>=|[+*/^=<>:$~!&|%-])$/.test(value)) kind = 'code-operator';
    else if (/^\s*\(/.test(source.slice(token.lastIndex))) kind = 'code-function';
    nodes.push(<span className={kind} key={index++}>{value}</span>);
    position = token.lastIndex;
  }
  if (position < source.length) nodes.push(source.slice(position));
  return nodes;
}

// ─── Data table ───────────────────────────────────────────────────────────────

function DataTable({ rows }: { rows: Record<string, unknown>[] }) {
  const cols = Object.keys(rows[0] || {});
  if (!rows.length) return <div className="empty-plot">No rows to display.</div>;
  return (
    <div className="table-scroll">
      <table>
        <thead><tr>{cols.map(c => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>{cols.map(c => <td key={c}>{String(row[c] ?? 'NA')}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── R graphics canvas ────────────────────────────────────────────────────────

function PlotImages({ images }: { images: ImageBitmap[] }) {
  return (
    <div className="r-plots">
      {images.map((image, i) => (
        <canvas
          key={i}
          ref={canvas => {
            if (canvas) {
              canvas.width  = image.width;
              canvas.height = image.height;
              canvas.getContext('2d')?.drawImage(image, 0, 0);
            }
          }}
        />
      ))}
    </div>
  );
}

// ─── Dashboard experiment components ─────────────────────────────────────────

const NORMAL_LABELS = ['−4', '−3', '−2', '−1', '0', '1', '2', '3'];

function IllustrativeBars({ mode }: { mode: 'normal' | 'dice' }) {
  const barValues = mode === 'normal'
    ? [2, 4, 8, 15, 26, 40, 52, 62, 70, 62, 52, 40, 26, 15, 8, 4]
    : [4, 4, 4, 4, 4, 4];
  return (
    <div
      className={`illustrative-bars${mode === 'dice' ? ' dice-preview' : ''}`}
      aria-label="Illustrative chart — no R sample run yet"
    >
      {barValues.map((value, i) => (
        <div className="preview-bar-column" key={i}>
          <span className="preview-bar" style={{ height: `${value}%`, animationDelay: `${i * 24}ms` }} />
          <span className="preview-bar-label">
            {mode === 'normal'
              ? (i % 2 === 0 ? (NORMAL_LABELS[i / 2] ?? '') : '')
              : String(i + 1)}
          </span>
        </div>
      ))}
    </div>
  );
}

function ExperimentChart({ data }: { data: ChartDatum[] }) {
  const max = Math.max(...data.map(item => item.value), 1);
  return (
    <div
      className="experiment-bars"
      role="img"
      aria-label={`R-generated histogram: ${data.map(item => `${item.label} has ${item.value}`).join(', ')}`}
    >
      {data.map((item, i) => (
        <div className="experiment-bar-column" key={i}>
          <div className="experiment-bar-value" style={{ height: `${Math.max(2, (item.value / max) * 100)}%` }}>
            <span>{item.value}</span>
          </div>
          <span className="experiment-bin-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function downloadFile(name: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
