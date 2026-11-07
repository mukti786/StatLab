import { describe, expect, it } from 'vitest';
import { parseCsv, rStringLiteral, stringifyCsv } from '../src/lib/csv';

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
    expect(() => parseCsv('a\nleft"right')).toThrow('start of a field');
    expect(() => parseCsv('a\n"quoted"tail')).toThrow('after a closing quote');
  });
  it('rejects empty headers and enforces configurable byte and row limits', () => {
    expect(() => parseCsv('name,\nA,1')).toThrow('headers cannot be empty');
    expect(() => parseCsv('a\n1\n2', 100, 1)).toThrow('1 records');
    expect(() => parseCsv('a\nlong', 4, 10)).toThrow('2 MB');
  });
  it('encodes imported text as an R string literal without allowing source injection', () => {
    expect(rStringLiteral('comma, "quote" \\path\nnext')).toBe('"comma, \\"quote\\" \\\\path\\nnext"');
    expect(() => rStringLiteral('bad\0value')).toThrow('null bytes');
  });
  it('round trips CSV values safely', () => {
    const rows = [{ name: 'A, B', score: 5, note: 'line\nbreak' }];
    expect(parseCsv(stringifyCsv(rows))).toEqual(rows);
  });
});
