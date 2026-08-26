/// <reference types="vitest/globals" />

import { Readable } from 'node:stream';
import { buffer as readableToBuffer } from 'node:stream/consumers';
import { ApFile, ApStreamingFile } from '@activepieces/pieces-framework';
import { streamUtils } from '../src';

describe('streamUtils.toStreamingBody', () => {
  test('wraps a buffered ApFile into a readable body with its exact size, even from another bundle where instanceof would fail', async () => {
    const data = Buffer.from('cross-bundle-bytes');
    const file = new ApFile('report.xlsx', data, 'xlsx');
    Object.setPrototypeOf(file, Object.prototype);

    const { body, size } = streamUtils.toStreamingBody(file);

    expect(size).toBe(data.length);
    expect(await readableToBuffer(body)).toEqual(data);
  });

  test('passes an ApStreamingFile body and size through untouched', () => {
    const streamBody = Readable.from(Buffer.from('streamed'));
    const file: ApStreamingFile = {
      filename: 'export.csv',
      extension: 'csv',
      size: 8,
      body: streamBody,
    };

    const { body, size } = streamUtils.toStreamingBody(file);

    expect(body).toBe(streamBody);
    expect(size).toBe(8);
  });

  test('readChunks splits a single large buffer into exact chunkSize chunks', async () => {
    const data = Buffer.from(Array.from({ length: 25 }, (_, i) => i));
    const chunks: Buffer[] = [];
    for await (const chunk of streamUtils.readChunks({ readable: Readable.from(data), chunkSize: 10 })) {
      chunks.push(chunk);
    }

    expect(chunks.map((chunk) => chunk.length)).toEqual([10, 10, 5]);
    expect(Buffer.concat(chunks).equals(data)).toBe(true);
  });

  test('keeps a sizeless ApStreamingFile sizeless', () => {
    const streamBody = Readable.from(Buffer.from('no-content-length'));
    const file: ApStreamingFile = {
      filename: 'unknown.bin',
      body: streamBody,
    };

    const { body, size } = streamUtils.toStreamingBody(file);

    expect(body).toBe(streamBody);
    expect(size).toBeUndefined();
  });
});
