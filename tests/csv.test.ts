import { describe, expect, it } from 'vitest';
import { parseCsv, stringifyCsv } from '../src/lib/csv';

describe('local CSV handling', () => {
  it('parses numeric, missing, and quoted fields with commas', () => {
    expect(parseCsv('name,score,note\nAsha,85,"great, work"\nRavi,,"said ""hi"""')).toEqual([
      { name: 'Asha', score: 85, note: 'great, work' },
      { name: 'Ravi', score: null, note: 'said "hi"' },
    ]);
  });
  it('rejects malformed rows, duplicate headers, and unterminated quotes', () => {
    expect(() => parseCsv('a,b\n1')).toThrow('same number');
    expect(() => parseCsv('a,a\n1,2')).toThrow('unique');
    expect(() => parseCsv('a\n"not closed')).toThrow('unclosed');
  });
  it('round trips CSV values safely', () => {
    const rows = [{ name: 'A, B', score: 5, note: 'line\nbreak' }];
    expect(parseCsv(stringifyCsv(rows))).toEqual(rows);
  });
});
