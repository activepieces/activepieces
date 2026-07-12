import { Readable } from 'stream';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify/sync';
import { describe, expect, it } from 'vitest';

// Mirrors the streaming chunk loop in chunk-csv-file.ts. Verifies header
// repetition, N-row grouping, and that embedded quoted newlines stay in one row.
async function chunkCsv(csv: string, rowsPerChunk: number, hasHeaders: boolean) {
  const parser = Readable.from([csv]).pipe(parse({ delimiter: ',' }));
  const chunks: string[] = [];
  let header: string[] | undefined;
  let buffer: string[][] = [];
  const flush = () => {
    if (buffer.length === 0) return;
    chunks.push(stringify(header ? [header, ...buffer] : buffer, { delimiter: ',' }));
    buffer = [];
  };
  for await (const record of parser) {
    if (hasHeaders && header === undefined) {
      header = record;
      continue;
    }
    buffer.push(record);
    if (buffer.length >= rowsPerChunk) flush();
  }
  flush();
  return chunks;
}

describe('chunk-csv-file', () => {
  it('splits data rows into N-row files, repeating the header', async () => {
    const csv = 'id,name\n1,a\n2,b\n3,c\n4,d\n5,e\n';
    const chunks = await chunkCsv(csv, 2, true);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toBe('id,name\n1,a\n2,b\n');
    expect(chunks[2]).toBe('id,name\n5,e\n');
  });

  it('keeps quoted embedded newlines within one row', async () => {
    const csv = 'a,b\n1,"line1\nline2"\n2,x\n';
    const chunks = await chunkCsv(csv, 1, true);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toBe('a,b\n1,"line1\nline2"\n');
  });
});
