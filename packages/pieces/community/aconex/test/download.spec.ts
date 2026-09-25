import { Readable } from 'node:stream';
import { HttpError, httpClient, type HttpRequest } from '@activepieces/pieces-common';
import { downloadDocumentFileAction } from '../src/lib/actions/download-document-file';
import { MAX_FILE_BYTES, setAconexThrottleForTests, setMaxFileBytesForTests } from '../src/lib/client';
import { connection, prepareAconexTest, productionAuth } from './helpers';

function runDownload(props: Record<string, unknown>, write: ReturnType<typeof vi.fn> = vi.fn(async () => 'file://saved')) {
  return downloadDocumentFileAction.run({
    auth: connection(productionAuth),
    propsValue: {
      projectId: '1879048400',
      documentId: '1879093137',
      markedup: false,
      sizeForceFetch: false,
      ...props,
    },
    files: { write },
  } as never);
}

describe('download_document_file', () => {
  beforeEach(() => {
    prepareAconexTest();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('aborts above 500 MB without Content-Length or Accept-Encoding and does not write', async () => {
    expect(MAX_FILE_BYTES).toBe(500 * 1024 * 1024);
    setMaxFileBytesForTests(8);
    const write = vi.fn();
    let download: HttpRequest | undefined;
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
      if (String(request.url).includes('/auth/token')) {
        return { status: 200, headers: {}, body: { access_token: 'tok', expires_in: 3600 } };
      }
      download = request;
      return { status: 200, headers: {}, body: Readable.from([Buffer.from('0123456789')]) };
    });
    await expect(runDownload({}, write)).rejects.toMatchObject({ code: 'FILE_TOO_LARGE' });
    expect(write).not.toHaveBeenCalled();
    expect(download?.responseType).toBe('stream');
    expect(download?.followRedirects).toBe(true);
    expect(download?.retries).toBe(0);
    expect(Object.keys(download?.headers ?? {}).map((key) => key.toLowerCase())).not.toContain('accept-encoding');
    expect(download?.headers).not.toHaveProperty('Content-Length');
  });

  test('sanitizes filename* and prefers it over filename', async () => {
    const write = vi.fn(async () => 'file://saved');
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
      if (String(request.url).includes('/auth/token')) {
        return { status: 200, headers: {}, body: { access_token: 'tok', expires_in: 3600 } };
      }
      return {
        status: 200,
        headers: { 'content-disposition': `attachment; filename="ignored.pdf"; filename*=UTF-8''..%2Fsecret%3Bfile.pdf` },
        body: Readable.from([Buffer.from('abc')]),
      };
    });
    await runDownload({}, write);
    expect(write).toHaveBeenCalledWith({ fileName: 'secretfile.pdf', data: Buffer.from('abc') });
  });

  test('retries a throttle response four times', async () => {
    const sleeps: number[] = [];
    setAconexThrottleForTests({ minGapMs: 0, sleep: async (ms) => { sleeps.push(ms); } });
    const write = vi.fn();
    const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
      if (String(request.url).includes('/auth/token')) {
        return { status: 200, headers: {}, body: { access_token: 'tok', expires_in: 3600 } };
      }
      throw new HttpError({}, {
        status: 503,
        responseBody: '<Error><ErrorCode>CONCURRENCY_THROTTLE_LIMIT_REACHED</ErrorCode><RequestID>throttle1</RequestID></Error>',
      });
    });
    await expect(runDownload({}, write)).rejects.toMatchObject({ code: 'CONCURRENCY_THROTTLE_LIMIT_REACHED' });
    expect(spy.mock.calls.filter((call) => String(call[0].url).includes('/register/'))).toHaveLength(4);
    expect(sleeps).toEqual([200, 400, 800]);
    expect(write).not.toHaveBeenCalled();
  });
});
