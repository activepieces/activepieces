import { describe, expect, it } from 'vitest';

import {
  UploadPart,
  UploadPartResponse,
  simplyprintChunkedUpload,
} from '../chunked-upload';

const { driveChunkedUpload, driveStreamedUpload, extractFilesApiId } = simplyprintChunkedUpload;

// Records every call (with a copy of the chunk bytes a real server would
// see) and replies from a caller-supplied script of responses. The recorded
// `chunk` is a COPY because the driver passes a zero-copy subarray view that
// could alias other chunks if inspected later.
function scriptedSender(responses: UploadPartResponse[]): {
  sendPart: (part: UploadPart) => Promise<UploadPartResponse>;
  calls: Array<UploadPart & { chunkCopy: Buffer }>;
} {
  const calls: Array<UploadPart & { chunkCopy: Buffer }> = [];
  let i = 0;
  const sendPart = async (part: UploadPart): Promise<UploadPartResponse> => {
    calls.push({ ...part, chunkCopy: Buffer.from(part.chunk) });
    if (i >= responses.length) {
      throw new Error(
        `sendPart called ${i + 1} times but only ${responses.length} responses scripted`,
      );
    }
    return responses[i++];
  };
  return { sendPart, calls };
}

function finalResponse(
  overrides: Partial<{ id: string; name: string; size: number }> = {},
): UploadPartResponse {
  return {
    kind: 'final',
    file: {
      id: overrides.id ?? 'abc123',
      name: overrides.name ?? 'x.gcode',
      size: overrides.size,
    },
    raw: { status: true, file: { id: overrides.id ?? 'abc123' } },
  };
}

describe('driveChunkedUpload — single-shot path', () => {
  it('sends one "only" part when data is at or under chunkSize', async () => {
    const data = Buffer.alloc(1000, 0x41);
    const { sendPart, calls } = scriptedSender([finalResponse({ id: 'single' })]);

    const result = await driveChunkedUpload({
      filename: 'small.gcode',
      data,
      sendPart,
      chunkSize: 1000,
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].kind).toBe('only');
    expect(calls[0].filename).toBe('small.gcode');
    expect(calls[0].chunkCopy.length).toBe(1000);
    expect(result.fileId).toBe('single');
  });

  it('throws if single-shot response is not final', async () => {
    const data = Buffer.alloc(10);
    const { sendPart } = scriptedSender([{ kind: 'continue', continueToken: 'tok' }]);

    await expect(
      driveChunkedUpload({ filename: 'x.gcode', data, sendPart, chunkSize: 1000 }),
    ).rejects.toThrow(/Single-shot upload .* did not return a final file id/);
  });

  it('refuses to upload an empty buffer', async () => {
    const { sendPart, calls } = scriptedSender([]);
    await expect(
      driveChunkedUpload({ filename: 'empty.gcode', data: Buffer.alloc(0), sendPart }),
    ).rejects.toThrow(/Refusing to upload empty file/);
    expect(calls).toHaveLength(0);
  });
});

describe('driveChunkedUpload — chunked path', () => {
  it('sends first + continue + final, threading the continueToken', async () => {
    const data = Buffer.alloc(300);
    for (let i = 0; i < 300; i++) data[i] = i % 256;

    const { sendPart, calls } = scriptedSender([
      { kind: 'continue', continueToken: 'tok-1' },
      { kind: 'continue', continueToken: 'tok-2' },
      finalResponse({ id: 'done', name: 'big.gcode', size: 300 }),
    ]);

    const result = await driveChunkedUpload({
      filename: 'big.gcode',
      data,
      sendPart,
      chunkSize: 100,
    });

    expect(calls).toHaveLength(3);

    const first = calls[0];
    expect(first.kind).toBe('first');
    expect(first.filename).toBe('big.gcode');
    expect(first.chunkCopy.length).toBe(100);
    expect(first.chunkCopy[0]).toBe(0);
    expect(first.chunkCopy[99]).toBe(99);
    if (first.kind === 'first') expect(first.totalSize).toBe(300);

    const second = calls[1];
    expect(second.kind).toBe('continue');
    expect(second.chunkCopy.length).toBe(100);
    expect(second.chunkCopy[0]).toBe(100);
    expect(second.chunkCopy[99]).toBe(199);
    if (second.kind === 'continue') {
      expect(second.continueToken).toBe('tok-1');
      expect(second.filename).toBe('big.gcode.part1');
    }

    const third = calls[2];
    expect(third.kind).toBe('continue');
    expect(third.chunkCopy.length).toBe(100);
    expect(third.chunkCopy[0]).toBe(200);
    expect(third.chunkCopy[99]).toBe(43);
    if (third.kind === 'continue') {
      expect(third.continueToken).toBe('tok-2');
      expect(third.filename).toBe('big.gcode.part2');
    }

    expect(result).toEqual({
      fileId: 'done',
      name: 'big.gcode',
      size: 300,
      expiresAt: undefined,
      raw: { status: true, file: { id: 'done' } },
    });
  });

  it('sends a short tail chunk when data is not a clean multiple of chunkSize', async () => {
    const data = Buffer.alloc(250);
    const { sendPart, calls } = scriptedSender([
      { kind: 'continue', continueToken: 'tok-1' },
      { kind: 'continue', continueToken: 'tok-2' },
      finalResponse(),
    ]);

    await driveChunkedUpload({ filename: 'x.stl', data, sendPart, chunkSize: 100 });

    expect(calls.map((c) => c.chunkCopy.length)).toEqual([100, 100, 50]);
  });

  // Verifies the driver hands out views (memory-safety on multi-hundred-MB
  // files); scriptedSender captures a copy so we can still assert the
  // bytes-at-send-time were correct.
  it('uses zero-copy views: mutating the source post-send does not retroactively affect calls already made', async () => {
    const data = Buffer.alloc(200);
    data.fill(0xaa);

    let step = 0;
    const sendPart = async (part: UploadPart): Promise<UploadPartResponse> => {
      for (let i = 0; i < part.chunk.length; i++) {
        expect(part.chunk[i]).toBe(0xaa);
      }
      step++;
      return step === 1
        ? { kind: 'continue', continueToken: 'tok' }
        : finalResponse();
    };

    await driveChunkedUpload({ filename: 'x.gcode', data, sendPart, chunkSize: 100 });
  });

  it('throws if server sends a final response before the last chunk', async () => {
    const data = Buffer.alloc(300);
    const { sendPart } = scriptedSender([finalResponse()]);

    await expect(
      driveChunkedUpload({ filename: 'big.gcode', data, sendPart, chunkSize: 100 }),
    ).rejects.toThrow(/returned a final file id after only 100\/300 bytes/);
  });

  it('throws if server sends continueToken on the last chunk', async () => {
    const data = Buffer.alloc(200);
    const { sendPart } = scriptedSender([
      { kind: 'continue', continueToken: 'tok-1' },
      { kind: 'continue', continueToken: 'tok-2' },
    ]);

    await expect(
      driveChunkedUpload({ filename: 'big.gcode', data, sendPart, chunkSize: 100 }),
    ).rejects.toThrow(/did not return a final file id on the last chunk \(200\/200/);
  });

  it('rejects a non-positive chunkSize', async () => {
    const { sendPart } = scriptedSender([]);
    await expect(
      driveChunkedUpload({ filename: 'x', data: Buffer.alloc(10), sendPart, chunkSize: 0 }),
    ).rejects.toThrow(/Invalid chunkSize/);
  });
});

describe('driveChunkedUpload — memory behavior', () => {
  it('handles a ~120 MiB buffer chunked at 95 MiB without copying into the driver', async () => {
    const total = 120 * 1024 * 1024;
    const chunk = 95 * 1024 * 1024;
    const data = Buffer.alloc(total);
    data[0] = 0x11;
    data[total - 1] = 0x22;

    const { sendPart, calls } = scriptedSender([
      { kind: 'continue', continueToken: 'tok-1' },
      finalResponse({ id: 'big' }),
    ]);

    const result = await driveChunkedUpload({
      filename: 'huge.gcode',
      data,
      sendPart,
      chunkSize: chunk,
    });

    expect(calls).toHaveLength(2);
    expect(calls[0].chunkCopy.length).toBe(chunk);
    expect(calls[0].chunkCopy[0]).toBe(0x11);
    expect(calls[1].chunkCopy.length).toBe(total - chunk);
    expect(calls[1].chunkCopy[calls[1].chunkCopy.length - 1]).toBe(0x22);
    expect(result.fileId).toBe('big');
  });
});

async function* sourceFrom(pieces: Uint8Array[]): AsyncGenerator<Uint8Array> {
  for (const p of pieces) {
    // Defensive copy so test assertions after yield aren't mistaken for
    // mutations on the driver's side.
    yield Uint8Array.from(p);
  }
}

describe('driveStreamedUpload', () => {
  it('single-shot when totalSize fits in one chunk', async () => {
    const input = [Uint8Array.from({ length: 50 }, (_, i) => i)];
    const { sendPart, calls } = scriptedSender([finalResponse({ id: 'one' })]);

    const result = await driveStreamedUpload({
      filename: 'small.gcode',
      totalSize: 50,
      source: sourceFrom(input),
      sendPart,
      chunkSize: 100,
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].kind).toBe('only');
    expect(calls[0].chunkCopy.length).toBe(50);
    expect(result.fileId).toBe('one');
  });

  it('chunks across 3 parts, threads continueToken, verifies byte-for-byte content', async () => {
    const input: Uint8Array[] = [];
    for (let i = 0; i < 50; i++) {
      input.push(
        Uint8Array.from(
          [i * 5, i * 5 + 1, i * 5 + 2, i * 5 + 3, i * 5 + 4].map((v) => v % 256),
        ),
      );
    }
    const { sendPart, calls } = scriptedSender([
      { kind: 'continue', continueToken: 'tok-1' },
      { kind: 'continue', continueToken: 'tok-2' },
      finalResponse({ id: 'done' }),
    ]);

    await driveStreamedUpload({
      filename: 'big.stl',
      totalSize: 250,
      source: sourceFrom(input),
      sendPart,
      chunkSize: 100,
    });

    expect(calls).toHaveLength(3);
    expect(calls[0].kind).toBe('first');
    if (calls[0].kind === 'first') expect(calls[0].totalSize).toBe(250);
    expect(calls[0].chunkCopy.length).toBe(100);
    expect(calls[0].chunkCopy[0]).toBe(0);
    expect(calls[0].chunkCopy[99]).toBe(99);

    expect(calls[1].kind).toBe('continue');
    if (calls[1].kind === 'continue') {
      expect(calls[1].continueToken).toBe('tok-1');
      expect(calls[1].filename).toBe('big.stl.part1');
    }
    expect(calls[1].chunkCopy.length).toBe(100);
    expect(calls[1].chunkCopy[0]).toBe(100);
    expect(calls[1].chunkCopy[99]).toBe(199);

    expect(calls[2].kind).toBe('continue');
    if (calls[2].kind === 'continue') expect(calls[2].continueToken).toBe('tok-2');
    expect(calls[2].chunkCopy.length).toBe(50);
    expect(calls[2].chunkCopy[0]).toBe(200);
    expect(calls[2].chunkCopy[49]).toBe(249);
  });

  it('throws with byte progress if server closes early with final response', async () => {
    const input = [Uint8Array.from({ length: 250 }, (_, i) => i)];
    const { sendPart } = scriptedSender([finalResponse()]);

    await expect(
      driveStreamedUpload({
        filename: 'x',
        totalSize: 250,
        source: sourceFrom(input),
        sendPart,
        chunkSize: 100,
      }),
    ).rejects.toThrow(/returned a final file id after only 100\/250 bytes/);
  });

  // Declare 200, source has 250. Driver sends chunks of 100 + 100 (last) →
  // declared total matches bytesSent, but source still has 50 buffered.
  it('throws if Content-Length undercounted (stream has more bytes buffered than declared after final)', async () => {
    const input = [Uint8Array.from({ length: 250 }, (_, i) => i)];
    const { sendPart } = scriptedSender([
      { kind: 'continue', continueToken: 'tok-1' },
      finalResponse(),
    ]);

    await expect(
      driveStreamedUpload({
        filename: 'x',
        totalSize: 200,
        source: sourceFrom(input),
        sendPart,
        chunkSize: 100,
      }),
    ).rejects.toThrow(/Content-Length mismatch.*source still held 50 buffered bytes/);
  });

  // Source yields more pieces AFTER the driver collected enough bytes to
  // satisfy totalSize, so the leftover arrives via the post-final drain loop
  // rather than pending.
  it('throws if Content-Length undercounted (stream keeps yielding after final)', async () => {
    const input = [
      Uint8Array.from({ length: 200 }, (_, i) => i),
      Uint8Array.from({ length: 50 }, () => 0xff),
    ];
    const { sendPart } = scriptedSender([
      { kind: 'continue', continueToken: 'tok-1' },
      finalResponse(),
    ]);

    await expect(
      driveStreamedUpload({
        filename: 'x',
        totalSize: 200,
        source: sourceFrom(input),
        sendPart,
        chunkSize: 100,
      }),
    ).rejects.toThrow(
      /Content-Length mismatch.*source still held 50 buffered bytes|kept delivering more/,
    );
  });

  it('throws if Content-Length overcounted (stream runs dry before totalSize)', async () => {
    const input = [Uint8Array.from({ length: 50 }, (_, i) => i)];
    const { sendPart } = scriptedSender([]);

    await expect(
      driveStreamedUpload({
        filename: 'x',
        totalSize: 500,
        source: sourceFrom(input),
        sendPart,
        chunkSize: 100,
      }),
    ).rejects.toThrow(/source delivered fewer bytes than declared totalSize/);
  });

  it('refuses zero totalSize', async () => {
    const { sendPart } = scriptedSender([]);
    await expect(
      driveStreamedUpload({
        filename: 'x',
        totalSize: 0,
        source: sourceFrom([]),
        sendPart,
      }),
    ).rejects.toThrow(/Refusing to upload empty stream/);
  });

  it('coalesces many small pieces into chunkSize parts', async () => {
    const input: Uint8Array[] = [];
    for (let i = 0; i < 100; i++) {
      input.push(Uint8Array.from([i, i, i]));
    }
    const { sendPart, calls } = scriptedSender([
      { kind: 'continue', continueToken: 'tok-1' },
      { kind: 'continue', continueToken: 'tok-2' },
      finalResponse(),
    ]);

    await driveStreamedUpload({
      filename: 'x.gcode',
      totalSize: 300,
      source: sourceFrom(input),
      sendPart,
      chunkSize: 100,
    });

    expect(calls.map((c) => c.chunkCopy.length)).toEqual([100, 100, 100]);
  });

  it('handles pieces spanning chunk boundaries without dropping bytes', async () => {
    const input = [
      Uint8Array.from({ length: 170 }, (_, i) => i),
      Uint8Array.from({ length: 30 }, (_, i) => 170 + i),
    ];
    const { sendPart, calls } = scriptedSender([
      { kind: 'continue', continueToken: 'tok-1' },
      finalResponse(),
    ]);

    await driveStreamedUpload({
      filename: 'x',
      totalSize: 200,
      source: sourceFrom(input),
      sendPart,
      chunkSize: 100,
    });

    expect(calls).toHaveLength(2);
    expect(calls[0].chunkCopy[0]).toBe(0);
    expect(calls[0].chunkCopy[99]).toBe(99);
    expect(calls[1].chunkCopy[0]).toBe(100);
    expect(calls[1].chunkCopy[99]).toBe(199);
  });
});

describe('extractFilesApiId', () => {
  it('parses the canonical {file: {id, name, size, expires_at}} shape', () => {
    const parsed = extractFilesApiId({
      status: true,
      file: { id: 'abc', name: 'x.gcode', size: 42, expires_at: '2026-01-01T00:00:00Z' },
    });
    expect(parsed).toEqual({
      id: 'abc',
      name: 'x.gcode',
      size: 42,
      expiresAt: '2026-01-01T00:00:00Z',
    });
  });

  it('falls back to a top-level file_id / fileId / id string', () => {
    expect(extractFilesApiId({ file_id: 'aaa' })).toEqual({ id: 'aaa' });
    expect(extractFilesApiId({ fileId: 'bbb' })).toEqual({ id: 'bbb' });
    expect(extractFilesApiId({ id: 'ccc' })).toEqual({ id: 'ccc' });
  });

  it('returns null for bodies without a recognizable id', () => {
    expect(extractFilesApiId(null)).toBeNull();
    expect(extractFilesApiId(undefined)).toBeNull();
    expect(extractFilesApiId({})).toBeNull();
    expect(extractFilesApiId({ status: true })).toBeNull();
    expect(extractFilesApiId({ file: {} })).toBeNull();
    expect(extractFilesApiId({ file: { id: '' } })).toBeNull();
  });
});
