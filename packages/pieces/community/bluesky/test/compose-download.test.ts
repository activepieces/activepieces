import { afterEach, describe, expect, it, vi } from 'vitest';
import { blueskyCompose } from '../src/lib/common/compose';

const URL_UNDER_TEST = 'https://media.example.com/a.png';

function streamOf({ chunks, delayMs = 0 }: { chunks: Uint8Array[]; delayMs?: number }): ReadableStream<Uint8Array> {
  let index = 0;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (index >= chunks.length) {
        controller.close();
        return;
      }
      controller.enqueue(chunks[index]);
      index += 1;
    },
  });
}

function stubFetch({ response }: { response: () => Response }) {
  const fetchMock = vi.fn(async (_url: string, _init?: unknown) => response());
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function acceptOf({ init }: { init: unknown }): string | undefined {
  if (typeof init !== 'object' || init === null || !('headers' in init)) {
    return undefined;
  }
  const headers: unknown = init.headers;
  if (typeof headers !== 'object' || headers === null) {
    return undefined;
  }
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === 'accept');
  return typeof entry?.[1] === 'string' ? entry[1] : undefined;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchBinary', () => {
  it('downloads the body through httpClient and returns bytes and content type', async () => {
    const fetchMock = stubFetch({
      response: () =>
        new Response(streamOf({ chunks: [new Uint8Array([1, 2]), new Uint8Array([3])] }), {
          status: 200,
          headers: { 'content-type': 'image/png; charset=binary' },
        }),
    });
    const result = await blueskyCompose.fetchBinary({ url: URL_UNDER_TEST, maxBytes: 10, label: 'Image 1' });
    expect(Array.from(result.data)).toEqual([1, 2, 3]);
    expect(result.contentType).toBe('image/png');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('asks for any content type by default and lets link pages ask for HTML', async () => {
    const fetchMock = stubFetch({ response: () => new Response(streamOf({ chunks: [new Uint8Array([1])] }), { status: 200 }) });
    await blueskyCompose.fetchBinary({ url: URL_UNDER_TEST, maxBytes: 10, label: 'Image 1' });
    await blueskyCompose.fetchBinary({ url: URL_UNDER_TEST, maxBytes: 10, accept: 'text/html', label: 'Link page' });
    const acceptHeaders = fetchMock.mock.calls.map((call) => acceptOf({ init: call[1] }));
    expect(acceptHeaders).toEqual(['*/*', 'text/html']);
  });

  it('rejects a declared content-length above the limit before reading the body', async () => {
    stubFetch({
      response: () =>
        new Response(streamOf({ chunks: [new Uint8Array(5)] }), { status: 200, headers: { 'content-length': '2000000' } }),
    });
    await expect(blueskyCompose.fetchBinary({ url: URL_UNDER_TEST, maxBytes: 1_000_000, label: 'Image 1' })).rejects.toThrow(
      'Image 1 at https://media.example.com/a.png is 2.0 MB; the limit is 1.0 MB.',
    );
  });

  it('stops reading once the streamed body passes the limit', async () => {
    stubFetch({
      response: () => new Response(streamOf({ chunks: [new Uint8Array(600), new Uint8Array(600)] }), { status: 200 }),
    });
    await expect(blueskyCompose.fetchBinary({ url: URL_UNDER_TEST, maxBytes: 1000, label: 'Image 1' })).rejects.toThrow(
      'Image 1 at https://media.example.com/a.png is larger than the 1 KB limit.',
    );
  });

  it('times out while the body is still downloading', async () => {
    stubFetch({
      response: () => new Response(streamOf({ chunks: [new Uint8Array(1), new Uint8Array(1)], delayMs: 200 }), { status: 200 }),
    });
    await expect(
      blueskyCompose.fetchBinary({ url: URL_UNDER_TEST, maxBytes: 1000, timeoutMs: 50, label: 'Video' }),
    ).rejects.toThrow('Could not download Video from https://media.example.com/a.png: timed out after 0 s');
  });

  it('reports the HTTP status when the server refuses the download', async () => {
    stubFetch({ response: () => new Response('not found', { status: 404 }) });
    await expect(blueskyCompose.fetchBinary({ url: URL_UNDER_TEST, maxBytes: 1000, label: 'Link page' })).rejects.toThrow(
      'Could not download Link page from https://media.example.com/a.png: HTTP 404.',
    );
  });

  it('refuses non-http URLs without sending a request', async () => {
    const fetchMock = stubFetch({ response: () => new Response('') });
    await expect(blueskyCompose.fetchBinary({ url: 'file:///etc/passwd', maxBytes: 1000, label: 'Image 1' })).rejects.toThrow(
      'Image 1 "file:///etc/passwd" must start with http:// or https://.',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
