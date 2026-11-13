/// <reference types="vitest/globals" />

import { Readable } from 'stream';
import { vi } from 'vitest';
import { httpClient, HttpRequest } from '@activepieces/pieces-common';
import { createMockActionContext } from '@activepieces/pieces-framework';

vi.mock('@linear/sdk', () => ({
  LinearClient: class {
    client = { rawRequest: vi.fn() };
  },
  LinearDocument: {},
}));

import '../../../index';
import { linearUploadDownloadAtomic } from './upload-download';

const URL_IN = 'https://uploads.linear.app/org/file/abc';
const KEY = 'lin_api_test';

function chunks({ count, size }: { count: number; size: number }): Readable {
  const block = Buffer.alloc(size, 1);
  return Readable.from((function* () {
    for (let i = 0; i < count; i++) yield block;
  })());
}

function reply({ status = 200, headers = {}, body = chunks({ count: 1, size: 4 }) }: ReplyParams) {
  return { status, headers: { 'content-type': 'image/png', ...headers }, body };
}

function queue(replies: Array<ReturnType<typeof reply>>) {
  const spy = vi.spyOn(httpClient, 'sendRequest');
  for (const next of replies) {
    spy.mockImplementationOnce(async (_request: HttpRequest) => next);
  }
  return spy;
}

async function drain(stream: Readable): Promise<Buffer> {
  const parts: Buffer[] = [];
  for await (const chunk of stream) {
    parts.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(parts);
}

async function download(write: WriteFn = async ({ data }) => {
  if (!(data instanceof Readable)) throw new Error('expected a stream');
  await drain(data);
  return 'file://x';
}) {
  const received: Array<Buffer | Readable> = [];
  const out = await linearUploadDownloadAtomic.run({
    ...createMockActionContext({ propsValue: { url: URL_IN } }),
    auth: { type: 'SECRET_TEXT', secret_text: KEY },
    files: {
      write: async (params: { fileName: string; data: Buffer | Readable }) => {
        received.push(params.data);
        return write(params);
      },
    },
  });
  return { out, received };
}

describe('linear_upload_download', () => {
  afterEach(() => vi.restoreAllMocks());

  test('passes a stream to files.write, counts the bytes and sends the key to uploads.linear.app', async () => {
    const spy = queue([reply({ body: chunks({ count: 3, size: 1024 }) })]);
    const { out, received } = await download();
    expect(received[0]).toBeInstanceOf(Readable);
    expect(out).toMatchObject({ file_name: 'abc.png', mime_type: 'image/png', size_bytes: 3072 });
    expect(spy.mock.calls[0][0]).toMatchObject({
      url: URL_IN,
      responseType: 'stream',
      followRedirects: false,
      headers: { Authorization: KEY },
    });
  });

  test('has no own size cap: a file larger than 100 MB is handed to files.write', async () => {
    queue([reply({ headers: { 'content-length': String(150 * 1024 * 1024) }, body: chunks({ count: 150, size: 1024 * 1024 }) })]);
    const { out } = await download();
    expect(out.size_bytes).toBe(150 * 1024 * 1024);
  });

  test('follows a redirect to storage.googleapis.com without the API key', async () => {
    const first = chunks({ count: 1, size: 1 });
    const destroyFirst = vi.spyOn(first, 'destroy');
    const spy = queue([
      reply({ status: 302, headers: { location: 'https://storage.googleapis.com/bucket/abc?sig=1' }, body: first }),
      reply({ body: chunks({ count: 2, size: 10 }) }),
    ]);
    const { out } = await download();
    expect(out.size_bytes).toBe(20);
    expect(destroyFirst).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[1][0].url).toBe('https://storage.googleapis.com/bucket/abc?sig=1');
    expect(spy.mock.calls[1][0].headers).toEqual({});
  });

  test.each([
    'https://evil.example.com/file',
    'https://internal.service.local/secret',
    'http://storage.googleapis.com/bucket/abc',
    'https://storage.googleapis.com:8443/bucket/abc',
    'https://user:pass@storage.googleapis.com/bucket/abc',
    'https://uploads.linear.app.evil.com/abc',
  ])('refuses a redirect to %s before requesting it', async (location) => {
    const first = chunks({ count: 1, size: 1 });
    const destroyFirst = vi.spyOn(first, 'destroy');
    const spy = queue([reply({ status: 302, headers: { location }, body: first })]);
    await expect(download()).rejects.toThrow('not a Linear file host');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(destroyFirst).toHaveBeenCalled();
  });

  test('destroys the stream when a redirect has no location', async () => {
    const body = chunks({ count: 1, size: 1 });
    const destroy = vi.spyOn(body, 'destroy');
    queue([reply({ status: 302, body })]);
    await expect(download()).rejects.toThrow('no location');
    expect(destroy).toHaveBeenCalled();
  });

  test('destroys every stream when there are too many redirects', async () => {
    const bodies = Array.from({ length: 4 }, () => chunks({ count: 1, size: 1 }));
    const destroys = bodies.map((body) => vi.spyOn(body, 'destroy'));
    queue(bodies.map((body) => reply({ status: 302, headers: { location: URL_IN }, body })));
    await expect(download()).rejects.toThrow('Too many redirects');
    for (const destroy of destroys) {
      expect(destroy).toHaveBeenCalled();
    }
  });

  test('destroys the source stream when files.write rejects the file part way', async () => {
    const body = chunks({ count: 50, size: 1024 });
    const destroy = vi.spyOn(body, 'destroy');
    queue([reply({ body })]);
    await expect(
      download(async ({ data }) => {
        if (!(data instanceof Readable)) throw new Error('expected a stream');
        let total = 0;
        for await (const chunk of data) {
          total += Buffer.from(chunk).length;
          if (total > 4096) throw new Error('File size is larger than maximum supported size');
        }
        return 'file://x';
      }),
    ).rejects.toThrow('maximum supported size');
    await new Promise((resolve) => setImmediate(resolve));
    expect(destroy).toHaveBeenCalled();
  });

  test('destroys the source stream when files.write fails before reading', async () => {
    const body = chunks({ count: 1, size: 10 });
    const destroy = vi.spyOn(body, 'destroy');
    queue([reply({ body })]);
    await expect(
      download(async () => {
        throw new Error('upload failed');
      }),
    ).rejects.toThrow('upload failed');
    await new Promise((resolve) => setImmediate(resolve));
    expect(destroy).toHaveBeenCalled();
  });

  test('fails when no chunk arrives for 60 seconds, and destroys the source', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const body = new Readable({ read() {} });
      const destroy = vi.spyOn(body, 'destroy');
      body.push(Buffer.alloc(8, 1));
      queue([reply({ body })]);
      const pending = download();
      const settled = pending.then(
        () => 'resolved',
        (error: unknown) => (error instanceof Error ? error.message : String(error)),
      );
      await vi.advanceTimersByTimeAsync(59_000);
      body.push(Buffer.alloc(8, 1));
      await vi.advanceTimersByTimeAsync(59_000);
      expect(destroy).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1_000);
      expect(await settled).toBe('The download stalled for 60 seconds.');
      expect(destroy).toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  test('clears the idle timer when the download ends', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      queue([reply({ body: chunks({ count: 3, size: 16 }) })]);
      const { out } = await download();
      expect(out.size_bytes).toBe(48);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  test('clears the idle timer when the source fails', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const body = new Readable({ read() {} });
      queue([reply({ body })]);
      const pending = download();
      body.destroy(new Error('socket hang up'));
      await expect(pending).rejects.toThrow('socket hang up');
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  test('refuses a link that is not on uploads.linear.app before any request', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await expect(
      linearUploadDownloadAtomic.run({
        ...createMockActionContext({ propsValue: { url: 'https://storage.googleapis.com/bucket/abc' } }),
        auth: { type: 'SECRET_TEXT', secret_text: KEY },
      }),
    ).rejects.toThrow('Only https://uploads.linear.app');
    expect(spy).not.toHaveBeenCalled();
  });
});

type ReplyParams = {
  status?: number;
  headers?: Record<string, string>;
  body?: Readable;
};

type WriteFn = (params: { fileName: string; data: Buffer | Readable }) => Promise<string>;
