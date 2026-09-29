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
const MB = 1024 * 1024;

function respond({ body, headers = {}, status = 200 }: RespondParams) {
  return vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => ({
    status,
    headers: { 'content-type': 'image/png', ...headers },
    body: typeof body === 'function' ? body(request) : body,
  }));
}

function chunks({ count, size }: { count: number; size: number }): Readable {
  const block = Buffer.alloc(size, 1);
  return Readable.from((function* () {
    for (let i = 0; i < count; i++) yield block;
  })());
}

async function download() {
  const written: { fileName: string; data: Buffer }[] = [];
  const out = await linearUploadDownloadAtomic.run({
    ...createMockActionContext({ propsValue: { url: URL_IN } }),
    auth: { type: 'SECRET_TEXT', secret_text: 'lin_api_test' },
    files: {
      write: async ({ fileName, data }: { fileName: string; data: Buffer }) => {
        written.push({ fileName, data });
        return 'file://x';
      },
    },
  });
  return { out, written };
}

describe('linear_upload_download size cap', () => {
  afterEach(() => vi.restoreAllMocks());

  test('streams a normal file, sends the key only to uploads.linear.app, names it by mime type', async () => {
    const spy = respond({ body: () => chunks({ count: 3, size: 1024 }) });
    const { out, written } = await download();
    expect(out).toMatchObject({ file_name: 'abc.png', mime_type: 'image/png', size_bytes: 3072 });
    expect(written[0].data.length).toBe(3072);
    expect(spy.mock.calls[0][0]).toMatchObject({ responseType: 'stream', headers: { Authorization: 'lin_api_test' } });
  });

  test('refuses before reading when Content-Length is over 100 MB', async () => {
    const body = chunks({ count: 1, size: 10 });
    const destroy = vi.spyOn(body, 'destroy');
    respond({ body, headers: { 'content-length': String(101 * MB) } });
    await expect(download()).rejects.toThrow('larger than 100 MB');
    expect(destroy).toHaveBeenCalled();
  });

  test('stops reading as soon as an unlabelled stream passes 100 MB', async () => {
    let produced = 0;
    const block = Buffer.alloc(MB, 1);
    const body = Readable.from((function* () {
      for (let i = 0; i < 500; i++) {
        produced++;
        yield block;
      }
    })());
    respond({ body });
    await expect(download()).rejects.toThrow('larger than 100 MB');
    expect(produced).toBeLessThan(110);
  });
});

type RespondParams = {
  body: Readable | ((request: HttpRequest) => Readable);
  headers?: Record<string, string>;
  status?: number;
};
