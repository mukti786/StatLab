export const PROGRESS_STORAGE_KEY = 'statlab:state:v1';

export type ProgressState = {
  version: 1;
  completedChallenges: number[];
  completedLessons: number[];
  recentModules: string[];
  activity: string[];
  runs: number;
  theme: 'dark' | 'light';
  playgroundCode: string;
};

export const emptyProgressState: ProgressState = {
  version: 1,
  completedChallenges: [],
  completedLessons: [],
  recentModules: [],
  activity: [],
  runs: 0,
  theme: 'dark',
  playgroundCode: '',
};

function parseList(value: unknown, maxLength: number): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').slice(0, maxLength)
    : [];
}

function parseIndexes(value: unknown): number[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is number => Number.isInteger(item) && item >= 0 && item < 100))]
    : [];
}

export function readProgressState(): ProgressState {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && 'version' in parsed && parsed.version === 1) {
        const state = parsed as Partial<ProgressState>;
        return {
          version: 1,
          completedChallenges: parseIndexes(state.completedChallenges),
          completedLessons: parseIndexes(state.completedLessons),
          recentModules: parseList(state.recentModules, 8),
          activity: parseList(state.activity, 6),
          runs: Number.isSafeInteger(state.runs) && Number(state.runs) >= 0 ? Number(state.runs) : 0,
          theme: state.theme === 'light' ? 'light' : 'dark',
          playgroundCode: typeof state.playgroundCode === 'string' && state.playgroundCode.length <= 50_000 ? state.playgroundCode : '',
        };
      }
    }

    // Migrate the unversioned keys used by earlier StatLab builds.
    return {
      ...emptyProgressState,
      completedChallenges: parseIndexes(JSON.parse(localStorage.getItem('statlab-progress') ?? '[]')),
      completedLessons: [],
      activity: parseList(JSON.parse(localStorage.getItem('statlab-activity') ?? '[]'), 6),
      runs: Math.max(0, Number.parseInt(localStorage.getItem('statlab-runs') ?? '0', 10) || 0),
      theme: localStorage.getItem('statlab-theme') === 'light' ? 'light' : 'dark',
      playgroundCode: localStorage.getItem('statlab-code')?.slice(0, 50_000) ?? '',
    };
  } catch {
    return emptyProgressState;
  }
}

export function writeProgressPatch(patch: Partial<ProgressState>): void {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ ...readProgressState(), ...patch, version: 1 }));
  } catch {
    // Storage may be unavailable or full; StatLab remains usable for this session.
  }
}
