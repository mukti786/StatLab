import { z } from 'zod';

export type CsvRow = Record<string, string | number | null>;
const headerSchema = z.string().trim().min(1, 'CSV headers cannot be empty.');

export function parseCsv(text: string, maxBytes = 2_000_000, maxRows = 5000): CsvRow[] {
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new Error('CSV size limit is 2 MB.');
  const matrix: string[][] = [];
  let row: string[] = [], cell = '', quoted = false, afterQuote = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (char === '"') { quoted = false; afterQuote = true; }
      else cell += char;
    } else if (afterQuote) {
      if (char === ',') { row.push(cell); cell = ''; afterQuote = false; }
      else if (char === '\n') { row.push(cell.replace(/\r$/, '')); matrix.push(row); row = []; cell = ''; afterQuote = false; }
      else if (char !== '\r' || text[i + 1] !== '\n') throw new Error('CSV has characters after a closing quote.');
    } else if (char === '"') {
      if (cell.length) throw new Error('CSV quotes must begin at the start of a field.');
      quoted = true;
    }
    else if (char === ',') { row.push(cell); cell = ''; }
    else if (char === '\n') { row.push(cell.replace(/\r$/, '')); matrix.push(row); row = []; cell = ''; }
    else cell += char;
  }
  if (quoted) throw new Error('CSV contains an unclosed quoted field.');
  if (cell.length || row.length || afterQuote) { row.push(cell.replace(/\r$/, '')); matrix.push(row); }
  if (matrix.length < 2) throw new Error('CSV must include a header and at least one data row.');
  if (matrix.length - 1 > maxRows) throw new Error(`CSV limit is ${maxRows.toLocaleString()} records.`);
  const headers = matrix[0].map(h => headerSchema.parse(h));
  if (new Set(headers).size !== headers.length) throw new Error('CSV column names must be unique.');
  return matrix.slice(1).map(cells => {
    if (cells.length !== headers.length) throw new Error('CSV rows must have the same number of fields as the header.');
    return Object.fromEntries(headers.map((header, index) => {
      const value = cells[index].trim();
      return [header, value === '' ? null : Number.isFinite(Number(value)) ? Number(value) : value];
    }));
  });
}

/** Escape a value as a valid R string literal before embedding local CSV data in R code. */
export function rStringLiteral(value: string): string {
  if (value.includes('\0')) throw new Error('CSV text cannot contain null bytes.');
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\r', '\\r').replaceAll('\n', '\\n').replaceAll('\t', '\\t')}"`;
}

export function stringifyCsv(rows: CsvRow[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const text = String(value ?? '');
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return [headers.map(escape).join(','), ...rows.map(row => headers.map(header => escape(row[header])).join(','))].join('\r\n');
}
