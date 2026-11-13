import { createHmac } from 'node:crypto';
import { HttpError } from '@activepieces/pieces-common';
import { AppConnectionType, PropertyType } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { letmepostAuth } from '../src/lib/common/auth';
import { LetmepostApiError, letmepostClient } from '../src/lib/common/client';
import { publishPost } from '../src/lib/actions/publish-post';
import { publishPostAi } from '../src/lib/actions/publish-post-ai';
import { letmepost } from '../src/index';
import { replyToPost } from '../src/lib/actions/reply-to-post';
import { listMedia } from '../src/lib/actions/list-media';
import { listPosts } from '../src/lib/actions/list-posts';
import { getPost } from '../src/lib/actions/get-post';
import { uploadMedia } from '../src/lib/actions/upload-media';
import { postEvent } from '../src/lib/triggers/post-event';
import { newPublishedPost } from '../src/lib/triggers/new-published-post';
import { reschedulePost } from '../src/lib/actions/reschedule-post';
import { cancelPost } from '../src/lib/actions/cancel-post';
import { getAccount } from '../src/lib/actions/get-account';
import { listPinterestBoards } from '../src/lib/actions/list-pinterest-boards';
import { listAccounts } from '../src/lib/actions/list-accounts';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    httpClient: {
      sendRequest: (...args: unknown[]) => sendRequest(...args),
    },
  };
});

const AUTH = {
  type: AppConnectionType.CUSTOM_AUTH,
  props: { base_url: ' https://api.letmepost.dev/ ', api_key: ' lmp_test_key ' },
};
const SECRET = 'whsec_test_secret';
const POST_ID = '01a1a9d5-2ba5-7711-a8fb-aa4255e1569a';
const PROFILE_ID = '01a1a9ae-5ffe-7a21-b253-0bfa111b40c7';

function httpError({ status, body }: { status: number; body: unknown }) {
  return new HttpError({}, { status, responseBody: body });
}

function memoryStore() {
  const data = new Map<string, unknown>();
  return {
    data,
    store: {
      get: async (key: string): Promise<unknown> => data.get(key) ?? null,
      put: async (key: string, value: unknown): Promise<unknown> => {
        data.set(key, value);
        return value;
      },
      delete: async (key: string): Promise<void> => {
        data.delete(key);
      },
    },
  };
}

function call<T>({ fn, ctx }: { fn: (ctx: never) => Promise<T>; ctx: unknown }): Promise<T> {
  return Reflect.apply(fn, undefined, [ctx]);
}

function actionContext({ propsValue }: { propsValue: Record<string, unknown> }) {
  return { auth: AUTH, propsValue, store: memoryStore().store };
}

function request(index: number) {
  return sendRequest.mock.calls[index][0];
}

function validate({ base_url, api_key }: { base_url: string; api_key: string }) {
  return letmepostAuth.validate?.({
    auth: { base_url, api_key },
    server: { apiUrl: 'http://localhost:3000', publicUrl: 'http://localhost:4200', mintOidcToken: async () => 'x' },
  });
}

beforeEach(() => {
  sendRequest.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('base URL', () => {
  it('trims, strips trailing slashes and defaults to the hosted API', () => {
    expect(letmepostClient.checkBaseUrl(' https://self.example.com/api// ')).toEqual({ ok: true, baseUrl: 'https://self.example.com/api' });
    expect(letmepostClient.checkBaseUrl(undefined)).toEqual({ ok: true, baseUrl: 'https://api.letmepost.dev' });
    expect(letmepostClient.checkBaseUrl('')).toEqual({ ok: true, baseUrl: 'https://api.letmepost.dev' });
  });

  it('refuses other schemes, credentials in the URL and query strings', () => {
    expect(letmepostClient.checkBaseUrl('ftp://x.example.com').ok).toBe(false);
    expect(letmepostClient.checkBaseUrl('https://user:pw@x.example.com').ok).toBe(false);
    expect(letmepostClient.checkBaseUrl('https://x.example.com?a=1').ok).toBe(false);
    expect(letmepostClient.checkBaseUrl('api.letmepost.dev').ok).toBe(false);
  });
});

describe('client', () => {
  it('sends a bearer key, Accept JSON, a verified-TLS dispatcher and encodes path ids', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, body: { id: 'a/1', platform: 'bluesky' } });
    await call({ fn: getAccount.run, ctx: actionContext({ propsValue: { accountId: 'a/1?x' } }) });
    const [req, options] = sendRequest.mock.calls[0];
    expect(req.url).toBe('https://api.letmepost.dev/v1/accounts/a%2F1%3Fx');
    expect(req.headers).toMatchObject({ Authorization: 'Bearer lmp_test_key', Accept: 'application/json' });
    expect(req.followRedirects).toBe(false);
    expect(options.dispatcher).toBeDefined();
    expect(options.dispatcher.constructor.name).toBe('Agent');
  });

  it('maps the vendor error envelope into LetmepostApiError with responseBody, never body', async () => {
    const envelope = {
      error: {
        code: 'validation_failed',
        message: 'Post is not queued.',
        rule: 'post.status',
        remediation: 'Only queued posts can be changed.',
        requestId: 'req_1',
        docUrl: 'https://docs.letmepost.dev/errors/validation_failed',
      },
    };
    sendRequest.mockRejectedValueOnce(httpError({ status: 409, body: envelope }));
    const error = await call({ fn: getPost.run, ctx: actionContext({ propsValue: { postId: POST_ID } }) }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(LetmepostApiError);
    expect(error).toMatchObject({ status: 409, responseBody: envelope });
    expect(error).not.toHaveProperty('body');
    const message = error instanceof Error ? error.message : '';
    expect(message).toContain('HTTP 409');
    expect(message).toContain('validation_failed: Post is not queued.');
    expect(message).toContain('Rule: post.status.');
    expect(message).toContain('Only queued posts can be changed.');
    expect(message).toContain('req_1');
  });

  it('reports an unreachable host by name', async () => {
    sendRequest.mockRejectedValueOnce(new TypeError('fetch failed'));
    await expect(call({ fn: getPost.run, ctx: actionContext({ propsValue: { postId: POST_ID } }) })).rejects.toThrow(
      'could not reach https://api.letmepost.dev (fetch failed)'
    );
  });

  it('treats a redirect as a failure instead of following it', async () => {
    sendRequest.mockResolvedValueOnce({ status: 302, body: undefined });
    await expect(call({ fn: getPost.run, ctx: actionContext({ propsValue: { postId: POST_ID } }) })).rejects.toThrow('redirect');
  });
});

describe('auth validate', () => {
  it('accepts a good key', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, body: { data: [] } });
    expect(await validate({ base_url: 'https://api.letmepost.dev', api_key: 'k' })).toEqual({ valid: true });
    expect(request(0).url).toBe('https://api.letmepost.dev/v1/accounts');
  });

  it('gives a key-specific message on 401 only', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 401, body: { error: { code: 'unauthenticated', message: 'Invalid API key.' } } }));
    const result = await validate({ base_url: 'https://api.letmepost.dev', api_key: 'bad' });
    expect(result).toMatchObject({ valid: false });
    expect(JSON.stringify(result)).toContain('rejected the API key');
  });

  it('reports other statuses with the vendor message, not as a bad key', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 503, body: { error: { code: 'platform_unavailable', message: 'Down for maintenance.' } } }));
    const result = await validate({ base_url: 'https://api.letmepost.dev', api_key: 'k' });
    expect(JSON.stringify(result)).toContain('HTTP 503');
    expect(JSON.stringify(result)).toContain('Down for maintenance.');
    expect(JSON.stringify(result)).not.toContain('rejected the API key');
  });

  it('reports an unreachable host', async () => {
    sendRequest.mockRejectedValueOnce(new TypeError('getaddrinfo ENOTFOUND nope.example'));
    const result = await validate({ base_url: 'https://nope.example', api_key: 'k' });
    expect(JSON.stringify(result)).toContain('could not reach https://nope.example');
  });

  it('rejects a malformed base URL without calling the API', async () => {
    const result = await validate({ base_url: 'not a url', api_key: 'k' });
    expect(result).toMatchObject({ valid: false });
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('publish_post', () => {
  const base = { accounts: ['acc_1'], text: 'hello', publishNow: true };

  it('B2: fails before any request when Publish now and Schedule at are both set', async () => {
    await expect(
      call({ fn: publishPost.run, ctx: actionContext({ propsValue: { ...base, scheduledAt: '2030-01-01T00:00:00.000Z' } }) })
    ).rejects.toThrow('Publish now is on and Schedule at is set');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('requires Schedule at when Publish now is off', async () => {
    await expect(call({ fn: publishPost.run, ctx: actionContext({ propsValue: { ...base, publishNow: false } }) })).rejects.toThrow(
      'Schedule at time is required'
    );
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('schedules with scheduledAt only when Publish now is off', async () => {
    sendRequest.mockResolvedValueOnce({ status: 202, body: { id: 'batch', status: 'queued', results: [{ postId: 'p1', status: 'queued' }] } });
    await call({ fn: publishPost.run, ctx: actionContext({ propsValue: { ...base, publishNow: false, scheduledAt: '2030-01-01T00:00:00.000Z' } }) });
    expect(request(0).body).toEqual({ targets: [{ accountId: 'acc_1' }], scheduledAt: '2030-01-01T00:00:00.000Z', text: 'hello' });
  });

  it('B1: throws with each target error when the batch status is failed', async () => {
    const failed = {
      id: 'batch',
      status: 'failed',
      results: [
        {
          accountId: 'acc_1',
          platform: 'bluesky',
          status: 'failed',
          error: { code: 'preflight_failed', message: 'Too long.', rule: 'bluesky.text.max_graphemes', remediation: 'Trim 12 graphemes.' },
        },
      ],
    };
    sendRequest.mockResolvedValueOnce({ status: 200, body: failed });
    const error = await call({ fn: publishPost.run, ctx: actionContext({ propsValue: base }) }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(LetmepostApiError);
    expect(error).toMatchObject({ responseBody: failed });
    const message = error instanceof Error ? error.message : '';
    expect(message).toContain('every target failed');
    expect(message).toContain('bluesky acc_1: preflight_failed: Too long. Rule: bluesky.text.max_graphemes. Trim 12 graphemes.');
  });

  it('returns a partial failure with postIds added and the idempotency header sent', async () => {
    sendRequest.mockResolvedValueOnce({
      status: 200,
      body: { id: 'batch', status: 'partial_failed', results: [{ postId: 'p1', status: 'published' }, { status: 'failed' }] },
    });
    const output = await call({ fn: publishPost.run, ctx: actionContext({ propsValue: { ...base, idempotencyKey: 'key-1' } }) });
    expect(output).toMatchObject({ id: 'batch', status: 'partial_failed', postIds: ['p1'] });
    expect(request(0).headers['Idempotency-Key']).toBe('key-1');
    expect(request(0).body).toEqual({ targets: [{ accountId: 'acc_1' }], publishNow: true, text: 'hello' });
  });

  it('applies Pinterest options only to Pinterest targets', async () => {
    sendRequest.mockResolvedValueOnce({
      status: 200,
      body: { data: [{ id: 'acc_pin', platform: 'pinterest' }, { id: 'acc_bsky', platform: 'bluesky' }] },
    });
    sendRequest.mockResolvedValueOnce({ status: 200, body: { id: 'b', status: 'published', results: [] } });
    await call({
      fn: publishPost.run,
      ctx: actionContext({
        propsValue: { ...base, accounts: ['acc_pin', 'acc_bsky'], pinterestBoardId: 'board_1', pinterestTitle: 'Pin title', pinterestDestinationUrl: ' ' },
      }),
    });
    expect(request(0).url).toBe('https://api.letmepost.dev/v1/accounts');
    expect(request(1).body.targets).toEqual([
      { accountId: 'acc_pin', options: { platform: 'pinterest', boardId: 'board_1', title: 'Pin title' } },
      { accountId: 'acc_bsky' },
    ]);
  });

  it('does not look up accounts when no Pinterest option is set', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, body: { id: 'b', status: 'published', results: [] } });
    await call({ fn: publishPost.run, ctx: actionContext({ propsValue: base }) });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(request(0).method).toBe('POST');
  });

  it('refuses a media item with both a URL and a media id', async () => {
    await expect(
      call({ fn: publishPost.run, ctx: actionContext({ propsValue: { ...base, media: [{ kind: 'image', url: 'https://x/y.png', mediaId: 'med_1' }] } }) })
    ).rejects.toThrow('both a URL and a Media ID');
  });
});

describe('reply_to_post', () => {
  function accountIs(platform: string) {
    sendRequest.mockResolvedValueOnce({ status: 200, body: { id: 'acc_1', platform } });
  }

  it('sends Bluesky reply options and publishes immediately', async () => {
    accountIs('bluesky');
    sendRequest.mockResolvedValueOnce({ status: 200, body: { id: 'b', status: 'published', results: [{ postId: 'p2' }] } });
    const output = await call({
      fn: replyToPost.run,
      ctx: actionContext({ propsValue: { account: 'acc_1', text: 'hi', replyToUri: 'at://x', replyToCid: 'bafy' } }),
    });
    expect(request(1).body).toEqual({
      targets: [{ accountId: 'acc_1', options: { platform: 'bluesky', replyToUri: 'at://x', replyToCid: 'bafy' } }],
      publishNow: true,
      text: 'hi',
    });
    expect(output).toMatchObject({ postIds: ['p2'] });
  });

  it('requires both Bluesky parent fields', async () => {
    accountIs('bluesky');
    await expect(
      call({ fn: replyToPost.run, ctx: actionContext({ propsValue: { account: 'acc_1', text: 'hi', replyToUri: 'at://x' } }) })
    ).rejects.toThrow('Bluesky parent URI and Bluesky parent CID');
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('requires the Bluesky root pair together', async () => {
    accountIs('bluesky');
    await expect(
      call({
        fn: replyToPost.run,
        ctx: actionContext({ propsValue: { account: 'acc_1', text: 'hi', replyToUri: 'at://x', replyToCid: 'c', replyRootUri: 'at://r' } }),
      })
    ).rejects.toThrow('root URI and Bluesky root CID');
  });

  it('maps the X and Threads reply fields', async () => {
    accountIs('twitter');
    sendRequest.mockResolvedValueOnce({ status: 200, body: { id: 'b', status: 'published', results: [] } });
    await call({ fn: replyToPost.run, ctx: actionContext({ propsValue: { account: 'acc_1', text: 'hi', replyToTweetId: '123' } }) });
    expect(request(1).body.targets[0].options).toEqual({ platform: 'twitter', replyToTweetId: '123' });

    sendRequest.mockReset();
    accountIs('threads');
    sendRequest.mockResolvedValueOnce({ status: 200, body: { id: 'b', status: 'published', results: [] } });
    await call({ fn: replyToPost.run, ctx: actionContext({ propsValue: { account: 'acc_1', text: 'hi', replyToThreadsId: '456' } }) });
    expect(request(1).body.targets[0].options).toEqual({ platform: 'threads', replyToId: '456' });
  });

  it('refuses platforms without reply support and missing X tweet id', async () => {
    accountIs('linkedin');
    await expect(call({ fn: replyToPost.run, ctx: actionContext({ propsValue: { account: 'acc_1', text: 'hi' } }) })).rejects.toThrow(
      'X, Threads and Bluesky accounts only'
    );
    accountIs('twitter');
    await expect(call({ fn: replyToPost.run, ctx: actionContext({ propsValue: { account: 'acc_1', text: 'hi' } }) })).rejects.toThrow(
      'X tweet ID'
    );
  });

  it('throws when the reply failed', async () => {
    accountIs('twitter');
    sendRequest.mockResolvedValueOnce({ status: 200, body: { id: 'b', status: 'failed', results: [{ platform: 'twitter', error: { code: 'platform_rejected', message: 'Gone.' } }] } });
    await expect(
      call({ fn: replyToPost.run, ctx: actionContext({ propsValue: { account: 'acc_1', text: 'hi', replyToTweetId: '1' } }) })
    ).rejects.toThrow('platform_rejected: Gone.');
  });
});

describe('list_media', () => {
  it('follows nextCursor, sends it, and stops at the limit', async () => {
    const page = ({ ids, nextCursor }: { ids: string[]; nextCursor: string | null }) => ({ status: 200, body: { data: ids.map((id) => ({ id })), nextCursor } });
    sendRequest.mockResolvedValueOnce(page({ ids: Array.from({ length: 100 }, (_, i) => `m${i}`), nextCursor: 'c1' }));
    sendRequest.mockResolvedValueOnce(page({ ids: Array.from({ length: 20 }, (_, i) => `n${i}`), nextCursor: 'c2' }));
    const output = await call({ fn: listMedia.run, ctx: actionContext({ propsValue: { limit: 120 } }) });
    expect(Array.isArray(output) ? output.length : -1).toBe(120);
    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(request(0).queryParams).toEqual({ limit: '100' });
    expect(request(1).queryParams).toEqual({ limit: '20', cursor: 'c1' });
  });

  it('stops when there is no next cursor', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, body: { data: [{ id: 'm1' }], nextCursor: null } });
    const output = await call({ fn: listMedia.run, ctx: actionContext({ propsValue: { limit: 50 } }) });
    expect(output).toEqual([{ id: 'm1' }]);
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('clamps a limit above 500 to 500 instead of failing', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, body: { data: [{ id: 'm1' }], nextCursor: null } });
    await call({ fn: listMedia.run, ctx: actionContext({ propsValue: { limit: 5000 } }) });
    expect(request(0).queryParams).toEqual({ limit: '100' });
  });

  it('rejects a limit below 1', async () => {
    await expect(call({ fn: listMedia.run, ctx: actionContext({ propsValue: { limit: 0 } }) })).rejects.toThrow('1 to 500');
  });
});

describe('list_posts', () => {
  it('sends the cursor and comma-joined filters', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, body: { data: [{ id: 'p1' }], nextCursor: 'next' } });
    const output = await call({
      fn: listPosts.run,
      ctx: actionContext({ propsValue: { status: ['published', 'canceled'], platform: ['bluesky'], limit: 1, cursor: 'abc', errorCode: 'a, b' } }),
    });
    expect(request(0).queryParams).toEqual({ status: 'published,canceled', platform: 'bluesky', errorCode: 'a,b', limit: '1', cursor: 'abc' });
    expect(output).toEqual({ data: [{ id: 'p1' }], nextCursor: 'next' });
  });

  it('rejects a limit above 200', async () => {
    await expect(call({ fn: listPosts.run, ctx: actionContext({ propsValue: { limit: 201 } }) })).rejects.toThrow('1 to 200');
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('upload_media', () => {
  it('posts a multipart form with the file part and no JSON content type', async () => {
    sendRequest.mockResolvedValueOnce({ status: 201, body: { id: 'med_x' } });
    await call({
      fn: uploadMedia.run,
      ctx: actionContext({ propsValue: { file: { filename: 'a.png', extension: 'png', data: Buffer.from([1, 2, 3]) } } }),
    });
    const req = request(0);
    expect(req.body).toBeInstanceOf(FormData);
    const part = req.body.get('file');
    expect(part).toBeInstanceOf(Blob);
    expect(part.name).toBe('a.png');
    expect(req.headers['Content-Type']).toBeUndefined();
    expect(req.redactBodyInErrors).toBe(true);
    expect(req.timeout).toBe(300_000);
  });

  it('keeps the 60 s timeout on ordinary calls and reports an abort as a timeout', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, body: {} });
    await call({ fn: getPost.run, ctx: actionContext({ propsValue: { postId: POST_ID } }) });
    expect(request(0).timeout).toBe(60_000);

    sendRequest.mockRejectedValueOnce(new DOMException('This operation was aborted', 'AbortError'));
    await expect(
      call({
        fn: uploadMedia.run,
        ctx: actionContext({ propsValue: { file: { filename: 'a.mp4', data: Buffer.from([1]) } } }),
      })
    ).rejects.toThrow('timed out after 300 s');
  });

  it('refuses a value that is not a file', async () => {
    await expect(call({ fn: uploadMedia.run, ctx: actionContext({ propsValue: { file: 'nope' } }) })).rejects.toThrow('File is required');
  });
});

describe('post_event trigger', () => {
  const event = { id: 'evt_1', type: 'post.published', createdAt: '2026-06-19T10:29:47.790Z', organizationId: 'org', data: { id: 'p1' } };

  function sign(body: string) {
    return `sha256=${createHmac('sha256', SECRET).update(body, 'utf8').digest('hex')}`;
  }

  async function enabled() {
    const holder = memoryStore();
    await holder.store.put('letmepost_webhook_signing_secret', SECRET);
    await holder.store.put('letmepost_webhook_endpoint_id', 'we_1');
    return holder;
  }

  function run({ store, payload, events }: { store: ReturnType<typeof memoryStore>['store']; payload: unknown; events?: string[] }) {
    return call({ fn: postEvent.run, ctx: { auth: AUTH, propsValue: { events }, store, payload } });
  }

  function delivery({ body = JSON.stringify(event), eventId = 'evt_1', signature }: { body?: string; eventId?: string; signature?: string }) {
    return {
      body,
      rawBody: body,
      headers: { 'x-letmepost-signature': signature ?? sign(body), 'x-letmepost-event-id': eventId },
    };
  }

  it('accepts a valid signature and parses a string body', async () => {
    const { store } = await enabled();
    expect(await run({ store, payload: delivery({}) })).toEqual([{ ...event, _dedupe_key: 'evt_1' }]);
  });

  it('rejects a wrong signature, a wrong-length signature and a non-hex signature', async () => {
    const { store } = await enabled();
    const wrong = `sha256=${createHmac('sha256', 'other').update(JSON.stringify(event)).digest('hex')}`;
    expect(await run({ store, payload: delivery({ signature: wrong }) })).toEqual([]);
    expect(await run({ store, payload: delivery({ signature: 'sha256=abcd' }) })).toEqual([]);
    expect(await run({ store, payload: delivery({ signature: `sha256=${'z'.repeat(64)}` }) })).toEqual([]);
    expect(await run({ store, payload: { ...delivery({}), rawBody: JSON.stringify({ ...event, type: 'post.failed' }) } })).toEqual([]);
  });

  it('emits a retried delivery with the same event id only once', async () => {
    const { store } = await enabled();
    expect(await run({ store, payload: delivery({}) })).toHaveLength(1);
    expect(await run({ store, payload: delivery({}) })).toEqual([]);
    expect(await run({ store, payload: delivery({ eventId: 'evt_2' }) })).toHaveLength(1);
  });

  it('does not mark filtered-out events as seen', async () => {
    const { store, data } = await enabled();
    expect(await run({ store, payload: delivery({}), events: ['post.failed'] })).toEqual([]);
    expect([...data.keys()].some((key) => key.startsWith('letmepost_webhook_seen_event_'))).toBe(false);
  });

  it('keeps the seen-id markers bounded', async () => {
    const { store, data } = await enabled();
    for (let i = 0; i < 2000; i++) {
      await run({ store, payload: delivery({ eventId: `e${i}` }) });
    }
    const markers = [...data.keys()].filter((key) => key.startsWith('letmepost_webhook_seen_event_'));
    expect(markers.length).toBeLessThanOrEqual(500);
    expect(markers.length).toBeGreaterThan(400);
  });

  it('does not lose either marker when two different events are processed concurrently', async () => {
    const { store } = await enabled();
    const pending: (() => void)[] = [];
    const gatedStore = {
      ...store,
      get: async (key: string): Promise<unknown> => {
        const value = await store.get(key);
        if (key.startsWith('letmepost_webhook_seen_event_')) {
          await new Promise<void>((resolve) => pending.push(resolve));
        }
        return value;
      },
    };
    const both = Promise.all([
      run({ store: gatedStore, payload: delivery({ eventId: 'evt_a' }) }),
      run({ store: gatedStore, payload: delivery({ eventId: 'evt_b' }) }),
    ]);
    while (pending.length < 2) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    pending.splice(0).forEach((release) => release());
    expect((await both).map((items) => items.length)).toEqual([1, 1]);
    expect(await run({ store, payload: delivery({ eventId: 'evt_a' }) })).toEqual([]);
    expect(await run({ store, payload: delivery({ eventId: 'evt_b' }) })).toEqual([]);
  });

  it('tags each emitted event with its id so the platform drops overlapping deliveries atomically', async () => {
    const { store } = await enabled();
    const [first] = await run({ store, payload: delivery({ eventId: 'evt_9' }) });
    expect(first).toMatchObject({ _dedupe_key: 'evt_9' });
  });

  it('onDisable tolerates an endpoint already deleted (404) but not other failures', async () => {
    const first = await enabled();
    sendRequest.mockRejectedValueOnce(httpError({ status: 404, body: { error: { code: 'not_found', message: 'Not found.' } } }));
    await call({ fn: postEvent.onDisable, ctx: { auth: AUTH, propsValue: {}, store: first.store } });
    expect(request(0).url).toBe('https://api.letmepost.dev/v1/webhook-endpoints/we_1');
    expect(first.data.has('letmepost_webhook_endpoint_id')).toBe(false);

    const second = await enabled();
    sendRequest.mockRejectedValueOnce(httpError({ status: 500, body: { error: { code: 'internal_error', message: 'Boom.' } } }));
    await expect(call({ fn: postEvent.onDisable, ctx: { auth: AUTH, propsValue: {}, store: second.store } })).rejects.toThrow('HTTP 500');
    expect(second.data.has('letmepost_webhook_endpoint_id')).toBe(true);
  });

  it('onEnable deletes the endpoint it created when storing the secret fails', async () => {
    sendRequest.mockResolvedValueOnce({ status: 201, body: { id: 'we_9', signingSecret: SECRET } });
    sendRequest.mockResolvedValueOnce({ status: 200, body: { id: 'we_9', deleted: true } });
    const failingStore = {
      ...memoryStore().store,
      put: async () => {
        throw new Error('store down');
      },
    };
    await expect(
      call({ fn: postEvent.onEnable, ctx: { auth: AUTH, propsValue: { events: [] }, store: failingStore, webhookUrl: 'https://ap.example/hook' } })
    ).rejects.toThrow('store down');
    expect(request(1).method).toBe('DELETE');
    expect(request(1).url).toBe('https://api.letmepost.dev/v1/webhook-endpoints/we_9');
  });

  it('onEnable rethrows the original store error when the cleanup delete also fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    sendRequest.mockResolvedValueOnce({ status: 201, body: { id: 'we_9', signingSecret: SECRET } });
    sendRequest.mockRejectedValueOnce(httpError({ status: 500, body: { error: { code: 'internal_error', message: 'Boom.' } } }));
    const failingStore = {
      ...memoryStore().store,
      put: async () => {
        throw new Error('store down');
      },
    };
    const error = await call({
      fn: postEvent.onEnable,
      ctx: { auth: AUTH, propsValue: { events: [] }, store: failingStore, webhookUrl: 'https://ap.example/hook' },
    }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(LetmepostApiError);
    const message = error instanceof Error ? error.message : '';
    expect(message).toContain('store down');
    expect(message).toContain('we_9 could not be removed automatically');
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe('new_published_post trigger', () => {
  it('filters published server-side, pages with the cursor and emits each post once across polls', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T00:00:00.000Z'));
    const { store } = memoryStore();
    const ctx = { auth: AUTH, propsValue: {}, store, files: {} };
    await call({ fn: newPublishedPost.onEnable, ctx });

    const post = { id: 'p1', accountId: 'a1', platform: 'bluesky', status: 'published', text: 't', publishedAt: '2026-06-02T00:00:00.000Z', createdAt: '2026-06-01T23:00:00.000Z', platformUri: 'at://x' };
    const old = { ...post, id: 'p0', publishedAt: '2026-05-01T00:00:00.000Z' };
    sendRequest.mockResolvedValueOnce({ status: 200, body: { data: [post], nextCursor: 'c1' } });
    sendRequest.mockResolvedValueOnce({ status: 200, body: { data: [old], nextCursor: null } });
    const first = await call({ fn: newPublishedPost.run, ctx });
    expect(first).toEqual([expect.objectContaining({ id: 'p1', platform_url: 'at://x', published_at: '2026-06-02T00:00:00.000Z' })]);
    expect(request(0).queryParams).toEqual({ status: 'published', limit: '200' });
    expect(request(1).queryParams).toEqual({ status: 'published', limit: '200', cursor: 'c1' });

    sendRequest.mockResolvedValueOnce({ status: 200, body: { data: [post, old], nextCursor: null } });
    expect(await call({ fn: newPublishedPost.run, ctx })).toEqual([]);
  });

  it('lets an API failure fail the poll instead of returning nothing', async () => {
    const { store } = memoryStore();
    await store.put('lastPoll', 0);
    sendRequest.mockRejectedValueOnce(httpError({ status: 500, body: { error: { code: 'internal_error', message: 'Boom.' } } }));
    await expect(call({ fn: newPublishedPost.run, ctx: { auth: AUTH, propsValue: {}, store, files: {} } })).rejects.toThrow('HTTP 500');
  });
});

describe('qa: remaining actions', () => {
  it('reschedule rejects a past time before any request and sends ISO scheduledAt via PATCH', async () => {
    await expect(
      call({ fn: reschedulePost.run, ctx: actionContext({ propsValue: { postId: 'p1', scheduledAt: '2000-01-01T00:00:00.000Z' } }) })
    ).rejects.toThrow('in the future');
    await expect(
      call({ fn: reschedulePost.run, ctx: actionContext({ propsValue: { postId: 'p1', scheduledAt: 'not a date' } }) })
    ).rejects.toThrow('valid date');
    expect(sendRequest).not.toHaveBeenCalled();
    sendRequest.mockResolvedValueOnce({ status: 200, body: { id: 'p1', scheduledAt: '2099-01-01T10:00:00.000Z' } });
    await call({ fn: reschedulePost.run, ctx: actionContext({ propsValue: { postId: 'p 1', scheduledAt: '2099-01-01T12:00:00+02:00' } }) });
    expect(request(0).method).toBe('PATCH');
    expect(request(0).url).toBe('https://api.letmepost.dev/v1/posts/p%201');
    expect(request(0).body).toEqual({ scheduledAt: '2099-01-01T10:00:00.000Z' });
  });

  it('cancel sends DELETE without a body and surfaces a 409 with the vendor rule', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, body: { id: 'p1', status: 'canceled' } });
    expect(await call({ fn: cancelPost.run, ctx: actionContext({ propsValue: { postId: 'p1' } }) })).toEqual({ id: 'p1', status: 'canceled' });
    expect(request(0).method).toBe('DELETE');
    expect(request(0).body).toBeUndefined();
    sendRequest.mockRejectedValueOnce(httpError({ status: 409, body: { error: { code: 'conflict', message: 'Post is canceled.', rule: 'post.status' } } }));
    await expect(call({ fn: cancelPost.run, ctx: actionContext({ propsValue: { postId: 'p1' } }) })).rejects.toThrow('HTTP 409');
  });

  it('cancel refuses an empty or dot-segment post id before any request', async () => {
    await expect(call({ fn: cancelPost.run, ctx: actionContext({ propsValue: { postId: ' ' } }) })).rejects.toThrow('Post ID is required');
    await expect(call({ fn: cancelPost.run, ctx: actionContext({ propsValue: { postId: '..' } }) })).rejects.toThrow('Post ID is required');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('get_account fetches the encoded id and fails on a body without id/platform', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, body: { id: 'a/1', platform: 'bluesky', displayName: 'x' } });
    expect(await call({ fn: getAccount.run, ctx: actionContext({ propsValue: { accountId: 'a/1' } }) })).toMatchObject({ id: 'a/1' });
    expect(request(0).url).toBe('https://api.letmepost.dev/v1/accounts/a%2F1');
    sendRequest.mockResolvedValueOnce({ status: 200, body: {} });
    await expect(call({ fn: getAccount.run, ctx: actionContext({ propsValue: { accountId: 'a1' } }) })).rejects.toThrow('without an id');
  });

  it('list_pinterest_boards calls the boards path and returns the body unchanged', async () => {
    const body = { data: [{ id: 'b1', name: 'Board', privacy: 'PUBLIC' }], defaultBoardId: 'b1' };
    sendRequest.mockResolvedValueOnce({ status: 200, body });
    expect(await call({ fn: listPinterestBoards.run, ctx: actionContext({ propsValue: { accountId: 'acc_pin' } }) })).toEqual(body);
    expect(request(0).url).toBe('https://api.letmepost.dev/v1/accounts/acc_pin/pinterest/boards');
  });

  it('list_accounts sends profileId only when set and returns a bare array', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, body: { data: [{ id: 'a1', platform: 'bluesky' }] } });
    expect(await call({ fn: listAccounts.run, ctx: actionContext({ propsValue: { profileId: ` ${PROFILE_ID} ` } }) })).toEqual([{ id: 'a1', platform: 'bluesky' }]);
    expect(request(0).queryParams).toEqual({ profileId: PROFILE_ID });
    sendRequest.mockResolvedValueOnce({ status: 200, body: {} });
    expect(await call({ fn: listAccounts.run, ctx: actionContext({ propsValue: {} }) })).toEqual([]);
    expect(request(1).queryParams).toEqual({});
  });

  it('the account dropdown returns a disabled state with the vendor message instead of throwing', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 403, body: { error: { code: 'forbidden', message: 'Key lacks accounts:read.' } } }));
    const options = getAccount.props.accountId.options;
    const result = await Reflect.apply(options, undefined, [{ auth: AUTH }, {}]);
    expect(result).toMatchObject({ disabled: true, options: [] });
    expect(result.placeholder).toContain('Key lacks accounts:read.');
  });
});

describe('qa: post_event extra paths', () => {
  it('onEnable deletes the endpoint when no signing secret comes back', async () => {
    sendRequest.mockResolvedValueOnce({ status: 201, body: { id: 'we_7' } });
    sendRequest.mockResolvedValueOnce({ status: 200, body: { id: 'we_7', deleted: true } });
    const holder = memoryStore();
    await expect(
      call({ fn: postEvent.onEnable, ctx: { auth: AUTH, propsValue: {}, store: holder.store, webhookUrl: 'https://ap.example/hook' } })
    ).rejects.toThrow('no webhook signing secret');
    expect(request(1).method).toBe('DELETE');
    expect(request(1).url).toBe('https://api.letmepost.dev/v1/webhook-endpoints/we_7');
    expect(holder.data.size).toBe(0);
  });

  it('dedupes on the envelope id when the event-id header is missing', async () => {
    const holder = memoryStore();
    await holder.store.put('letmepost_webhook_signing_secret', SECRET);
    const body = JSON.stringify({ id: 'evt_env', type: 'post.failed', data: {} });
    const sig = `sha256=${createHmac('sha256', SECRET).update(body, 'utf8').digest('hex')}`;
    const payload = { body: JSON.parse(body), rawBody: body, headers: { 'X-Letmepost-Signature': sig } };
    const ctx = { auth: AUTH, propsValue: {}, store: holder.store, payload };
    expect(await call({ fn: postEvent.run, ctx })).toHaveLength(1);
    expect(await call({ fn: postEvent.run, ctx })).toEqual([]);
  });

  it('returns nothing when no secret is stored', async () => {
    const holder = memoryStore();
    const body = JSON.stringify({ id: 'e', type: 'post.published' });
    const sig = `sha256=${createHmac('sha256', SECRET).update(body, 'utf8').digest('hex')}`;
    expect(await call({ fn: postEvent.run, ctx: { auth: AUTH, propsValue: {}, store: holder.store, payload: { body, rawBody: body, headers: { 'x-letmepost-signature': sig } } } })).toEqual([]);
  });
});

describe('live round fixes', () => {
  it('get_post refuses a non-UUID id before any request', async () => {
    await expect(call({ fn: getPost.run, ctx: actionContext({ propsValue: { postId: 'not-a-uuid' } }) })).rejects.toThrow(
      'Post ID must be a letmepost id in UUID form'
    );
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('get_post adds the batch-id hint on 404 and keeps status and responseBody', async () => {
    const body = { error: { code: 'not_found', message: 'Post not found.', requestId: 'req_9' } };
    sendRequest.mockRejectedValueOnce(httpError({ status: 404, body }));
    const error = await call({ fn: getPost.run, ctx: actionContext({ propsValue: { postId: POST_ID } }) }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(LetmepostApiError);
    expect(error).toMatchObject({ status: 404, responseBody: body });
    const message = error instanceof Error ? error.message : '';
    expect(message).toContain('not_found: Post not found.');
    expect(message).toContain('If this is the batch id from a publish, use results[].postId or postIds instead.');
  });

  it('get_post does not add the batch-id hint to other statuses', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 500, body: { error: { code: 'internal_error', message: 'Boom.' } } }));
    const error = await call({ fn: getPost.run, ctx: actionContext({ propsValue: { postId: POST_ID } }) }).catch((e: unknown) => e);
    expect(error instanceof Error ? error.message : '').not.toContain('batch id');
  });

  it('list_accounts and list_media refuse a non-UUID profile id before any request', async () => {
    await expect(call({ fn: listAccounts.run, ctx: actionContext({ propsValue: { profileId: 'prof_1' } }) })).rejects.toThrow(
      'Profile ID must be a letmepost id in UUID form'
    );
    await expect(call({ fn: listMedia.run, ctx: actionContext({ propsValue: { profileId: 'prof_1' } }) })).rejects.toThrow(
      'Profile ID must be a letmepost id in UUID form'
    );
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('list_media sends a valid profile id', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, body: { data: [], nextCursor: null } });
    await call({ fn: listMedia.run, ctx: actionContext({ propsValue: { profileId: PROFILE_ID } }) });
    expect(request(0).queryParams).toEqual({ limit: '50', profileId: PROFILE_ID });
  });

  it('puts a full stop between an unpunctuated vendor message and the rule', async () => {
    sendRequest.mockRejectedValueOnce(
      httpError({
        status: 400,
        body: { error: { code: 'validation_failed', message: 'Invalid', rule: 'media.0.mediaId', remediation: 'Check the request body matches the documented schema.', requestId: 'req_1' } },
      })
    );
    const error = await call({ fn: getPost.run, ctx: actionContext({ propsValue: { postId: POST_ID } }) }).catch((e: unknown) => e);
    const message = error instanceof Error ? error.message : '';
    expect(message).toContain('validation_failed: Invalid. Rule: media.0.mediaId. Check the request body');
    expect(message).not.toContain('Invalid Rule');
  });

  it('does not double the full stop when the vendor message already ends with one', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 409, body: { error: { code: 'validation_failed', message: 'Post is not queued.', rule: 'post.status' } } }));
    const error = await call({ fn: getPost.run, ctx: actionContext({ propsValue: { postId: POST_ID } }) }).catch((e: unknown) => e);
    expect(error instanceof Error ? error.message : '').toContain('Post is not queued. Rule: post.status.');
  });

  it('post_event sampleData is the live post.published shape and every data key is modelled', () => {
    const sample = postEvent.sampleData;
    expect(sample).toMatchObject({ type: 'post.published' });
    const data = letmepostClient.isRecord(sample) && letmepostClient.isRecord(sample['data']) ? sample['data'] : {};
    expect(Object.keys(data).sort()).toEqual(['accountId', 'cid', 'id', 'platform', 'profileId', 'publishedAt', 'uri', 'warnings'].sort());
    expect(String(data['uri'])).toMatch(/^at:\/\//);
    expect(String(data['cid'])).toMatch(/^bafy/);
    expect(data['warnings']).toEqual([]);
    expect(data).not.toHaveProperty('postId');
    const dataField = postEvent.outputSchema?.fields.find((field) => field.key === 'data');
    const modelled = (dataField?.children ?? []).map((field) => field.key);
    expect(modelled).toEqual(expect.arrayContaining(['id', 'platform', 'accountId', 'profileId', 'publishedAt', 'scheduledAt', 'uri', 'cid', 'warnings', 'sandbox']));
    const warnings = dataField?.children?.find((field) => field.key === 'warnings');
    expect((warnings?.listItems ?? []).map((field) => field.key)).toEqual(['code', 'message']);
    expect(modelled).not.toContain('postId');
  });
});

describe('round 3: publish split', () => {
  const ACC_A = '01a1a9b1-b550-7713-afba-7a1ade80a71e';
  const ACC_PIN = '01a1a9b1-b550-7713-afba-7a1ade80a71f';
  const published = { status: 200, body: { id: 'batch', status: 'published', results: [{ postId: POST_ID, status: 'published' }] } };

  it('publish_post is human-only and publish_post_ai is ai-only; the piece requires 0.86.4', () => {
    expect(publishPost.audience).toBe('human');
    expect(publishPostAi.audience).toBe('ai');
    expect(publishPostAi.name).toBe('publish_post_ai');
    expect(publishPostAi.outputSchema).toBe(publishPost.outputSchema);
    expect(letmepost.minimumSupportedRelease).toBe('0.86.4');
    expect(Object.values(publishPostAi.props).some((prop) => prop.type === PropertyType.CHECKBOX)).toBe(false);
    expect(publishPostAi.props.scheduledAt.type).toBe(PropertyType.SHORT_TEXT);
    expect(publishPost.props.scheduledAt.type).toBe(PropertyType.DATE_TIME);
    expect(Object.values(publishPost.props).some((prop) => prop.type === PropertyType.CHECKBOX)).toBe(true);
  });

  it('publish_post_ai publishes now when Schedule at is empty, even with agent-style empty values', async () => {
    sendRequest.mockResolvedValueOnce(published);
    const output = await call({
      fn: publishPostAi.run,
      ctx: actionContext({ propsValue: { accountIds: [ACC_A], text: 'hi', scheduledAt: '', media: [], firstComment: '', profileId: '' } }),
    });
    expect(request(0).body).toEqual({ targets: [{ accountId: ACC_A }], publishNow: true, text: 'hi' });
    expect(request(0).body).not.toHaveProperty('scheduledAt');
    expect(output).toMatchObject({ postIds: [POST_ID] });
  });

  it('publish_post_ai schedules when Schedule at is set and never sends publishNow', async () => {
    sendRequest.mockResolvedValueOnce({ status: 202, body: { id: 'batch', status: 'queued', results: [{ postId: POST_ID }] } });
    await call({
      fn: publishPostAi.run,
      ctx: actionContext({ propsValue: { accountIds: [ACC_A], text: 'hi', scheduledAt: '2099-01-01T09:00:00+02:00', idempotencyKey: 'k1' } }),
    });
    expect(request(0).body).toEqual({ targets: [{ accountId: ACC_A }], scheduledAt: '2099-01-01T07:00:00.000Z', text: 'hi' });
    expect(request(0).headers['Idempotency-Key']).toBe('k1');
  });

  it('publish_post_ai refuses a past or invalid Schedule at before any request', async () => {
    await expect(call({ fn: publishPostAi.run, ctx: actionContext({ propsValue: { accountIds: [ACC_A], text: 'hi', scheduledAt: '2001-01-01T00:00:00Z' } }) })).rejects.toThrow('is not in the future');
    for (const bad of ['tomorrow', 'tomorrow 9am', '2026-13-45T00:00:00Z', '2099-02-30T09:00:00Z', '2099-11-07T09:00:00', '2099-11-07', 'Nov 7 2099 09:00 GMT']) {
      await expect(
        call({ fn: publishPostAi.run, ctx: actionContext({ propsValue: { accountIds: [ACC_A], text: 'hi', scheduledAt: bad } }) })
      ).rejects.toThrow('is not a valid ISO 8601 date and time with a timezone');
    }
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('publish_post_ai publishes now when Schedule at is omitted entirely', async () => {
    sendRequest.mockResolvedValueOnce(published);
    await call({ fn: publishPostAi.run, ctx: actionContext({ propsValue: { accountIds: [ACC_A], text: 'hi' } }) });
    expect(request(0).body).toEqual({ targets: [{ accountId: ACC_A }], publishNow: true, text: 'hi' });
  });

  it('publish_post_ai accepts ISO times with Z, an offset and milliseconds', async () => {
    for (const [input, sent] of [
      ['2099-11-07T09:00:00Z', '2099-11-07T09:00:00.000Z'],
      ['2099-11-07T11:00+02:00', '2099-11-07T09:00:00.000Z'],
      ['2099-11-07T09:00:00.250Z', '2099-11-07T09:00:00.250Z'],
    ]) {
      sendRequest.mockResolvedValueOnce({ status: 202, body: { id: 'batch', status: 'queued', results: [] } });
      await call({ fn: publishPostAi.run, ctx: actionContext({ propsValue: { accountIds: [ACC_A], text: 'hi', scheduledAt: input } }) });
      expect(sendRequest.mock.calls.at(-1)?.[0].body.scheduledAt).toBe(sent);
    }
  });

  it('publish_post_ai rejects non-UUID account ids and an empty list before any request', async () => {
    await expect(call({ fn: publishPostAi.run, ctx: actionContext({ propsValue: { accountIds: [ACC_A, 'bluesky'], text: 'hi' } }) })).rejects.toThrow(
      'Account ID 2 must be a letmepost id in UUID form'
    );
    await expect(call({ fn: publishPostAi.run, ctx: actionContext({ propsValue: { accountIds: [], text: 'hi' } }) })).rejects.toThrow('at least one account');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('publish_post_ai throws when every target failed (B1)', async () => {
    sendRequest.mockResolvedValueOnce({
      status: 200,
      body: { id: 'batch', status: 'failed', results: [{ platform: 'bluesky', accountId: ACC_A, status: 'failed', error: { code: 'platform_rejected', message: 'Nope.' } }] },
    });
    await expect(call({ fn: publishPostAi.run, ctx: actionContext({ propsValue: { accountIds: [ACC_A], text: 'hi' } }) })).rejects.toThrow(
      'every target failed. bluesky'
    );
  });

  it('publish_post_ai applies Pinterest fields only to Pinterest accounts', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, body: { data: [{ id: ACC_PIN, platform: 'pinterest' }, { id: ACC_A, platform: 'bluesky' }] } });
    sendRequest.mockResolvedValueOnce(published);
    await call({
      fn: publishPostAi.run,
      ctx: actionContext({ propsValue: { accountIds: [ACC_PIN, ACC_A, ACC_PIN], text: 'hi', pinterestBoardId: 'board_1', pinterestDestinationUrl: 'https://example.com' } }),
    });
    expect(request(1).body.targets).toEqual([
      { accountId: ACC_PIN, options: { platform: 'pinterest', boardId: 'board_1', destinationUrl: 'https://example.com' } },
      { accountId: ACC_A },
    ]);
  });

  it('publish_post (human) still sends the same request as before', async () => {
    sendRequest.mockResolvedValueOnce(published);
    await call({ fn: publishPost.run, ctx: actionContext({ propsValue: { accounts: ['acc_1'], text: 'hello', publishNow: true } }) });
    expect(request(0).body).toEqual({ targets: [{ accountId: 'acc_1' }], publishNow: true, text: 'hello' });
  });

  it('list_accounts filters by platform client-side and keeps the bare array', async () => {
    const data = [
      { id: 'a1', platform: 'bluesky' },
      { id: 'a2', platform: 'twitter' },
      { id: 'a3', platform: 'pinterest' },
    ];
    sendRequest.mockResolvedValueOnce({ status: 200, body: { data } });
    expect(await call({ fn: listAccounts.run, ctx: actionContext({ propsValue: { platform: ['twitter', 'pinterest'] } }) })).toEqual([data[1], data[2]]);
    expect(request(0).queryParams).toEqual({});
    sendRequest.mockResolvedValueOnce({ status: 200, body: { data } });
    expect(await call({ fn: listAccounts.run, ctx: actionContext({ propsValue: { platform: [] } }) })).toEqual(data);
  });
});
