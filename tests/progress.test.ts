import { afterEach, describe, expect, it, vi } from 'vitest';
import { PROGRESS_STORAGE_KEY, readProgressState, writeProgressPatch } from '../src/lib/progress';

function mockStorage(entries: Record<string, string> = {}) {
  const values = new Map(Object.entries(entries));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
    clear: () => values.clear(),
  };
}

describe('versioned local progress', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('migrates the previous unversioned keys and writes a validated v1 record', () => {
    vi.stubGlobal('localStorage', mockStorage({
      'statlab-progress': '[0,2,2,-1,"bad"]',
      'statlab-activity': '["R program run"]',
      'statlab-runs': '4',
      'statlab-theme': 'light',
      'statlab-code': 'mean(1:3)',
    }));

    const state = readProgressState();
    expect(state).toMatchObject({
      version: 1,
      completedChallenges: [0, 2],
      activity: ['R program run'],
      runs: 4,
      theme: 'light',
      playgroundCode: 'mean(1:3)',
    });
    writeProgressPatch(state);
    expect(JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) ?? '{}')).toMatchObject({ version: 1, runs: 4 });
  });

  it('falls back safely when a stored v1 value is malformed', () => {
    vi.stubGlobal('localStorage', mockStorage({ [PROGRESS_STORAGE_KEY]: '{broken' }));
    expect(readProgressState()).toMatchObject({ version: 1, completedChallenges: [], completedLessons: [], runs: 0 });
  });

  it('keeps the learning state usable when storage is unavailable', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } });
    expect(readProgressState().version).toBe(1);
    expect(() => writeProgressPatch({ runs: 1 })).not.toThrow();
  });

  it('persists lesson and challenge completion independently and can clear both', () => {
    vi.stubGlobal('localStorage', mockStorage());
    writeProgressPatch({ completedLessons: [0, 2], completedChallenges: [1] });
    expect(readProgressState()).toMatchObject({ completedLessons: [0, 2], completedChallenges: [1] });
    writeProgressPatch({ completedLessons: [], completedChallenges: [] });
    expect(readProgressState()).toMatchObject({ completedLessons: [], completedChallenges: [] });
  });
});
