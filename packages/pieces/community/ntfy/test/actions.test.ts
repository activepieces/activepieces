import { HttpMethod } from '@activepieces/pieces-common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendNotification } from '../src/lib/actions/send-notification';
import { publishMessage } from '../src/lib/actions/publish-message';
import { deleteNotification } from '../src/lib/actions/delete-notification';
import { clearNotification } from '../src/lib/actions/clear-notification';
import { updateNotification } from '../src/lib/actions/update-notification';
import { fetchMessages } from '../src/lib/actions/fetch-messages';
import { listScheduledMessages } from '../src/lib/actions/list-scheduled-messages';
import { getAccount } from '../src/lib/actions/get-account';
import { getAttachmentInfo } from '../src/lib/actions/get-attachment-info';
import { sendFile } from '../src/lib/actions/send-file';
import { newMessage } from '../src/lib/triggers/new-message';
import { ntfy } from '../src/index';
import { ntfyClient } from '../src/lib/common/client';
import { ndjson, runAction, testAuth, triggerContext } from './helpers';

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

beforeEach(() => {
  sendRequest.mockReset();
});

describe('Send Notification', () => {
  it('publishes with an empty title (0.3.0 crashed here) and no X-Title header', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: { id: 'x' } });
    const result = await runAction({
      action: sendNotification,
      propsValue: { topic: 'alerts', message: 'hello', title: undefined },
    });
    const request = sendRequest.mock.calls[0][0];
    expect(request.method).toBe(HttpMethod.POST);
    expect(request.url).toBe('https://ntfy.example.com/alerts');
    expect(request.headers).not.toHaveProperty('X-Title');
    expect(request.authentication).toBeUndefined();
    expect(result).toEqual({ status: 200, headers: {}, body: { id: 'x' } });
  });
});

describe('Publish Message (JSON)', () => {
  it('posts JSON to the root URL with the bearer token', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: { id: 'm1', event: 'message' } });
    const result = await runAction({
      action: publishMessage,
      token: 'tk_abc',
      propsValue: { topic: 'alerts', message: 'hi', priority: 5, tags: ['warning'], markdown: false },
    });
    const request = sendRequest.mock.calls[0][0];
    expect(request.url).toBe('https://ntfy.example.com/');
    expect(request.headers).toMatchObject({ Authorization: 'Bearer tk_abc', 'Content-Type': 'application/json' });
    expect(request.body).toEqual({ topic: 'alerts', message: 'hi', priority: 5, tags: ['warning'] });
    expect(result).toEqual({ id: 'm1', event: 'message' });
  });
});

describe('Delete Notification', () => {
  it('sends DELETE /<topic>/<sequence_id> and no Authorization header without a token', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: { id: 'e', event: 'message_delete' } });
    await runAction({ action: deleteNotification, propsValue: { topic: 'alerts', sequence_id: 'job-1' } });
    const request = sendRequest.mock.calls[0][0];
    expect(request.method).toBe(HttpMethod.DELETE);
    expect(request.url).toBe('https://ntfy.example.com/alerts/job-1');
    expect(request.headers).not.toHaveProperty('Authorization');
  });
});

describe('Fetch Messages', () => {
  it('parses NDJSON, filters events, sorts newest first and reports limit cut-off', async () => {
    sendRequest.mockResolvedValueOnce({
      status: 200,
      headers: { 'x-messages-truncated': '1' },
      body: ndjson([
        { id: 'a', time: 1, event: 'message', topic: 't' },
        { id: 'b', time: 3, event: 'message', topic: 't' },
        { id: 'c', time: 2, event: 'message_clear', topic: 't' },
        { id: 'd', time: 2, event: 'message', topic: 't' },
      ]),
    });
    const result = await runAction({
      action: fetchMessages,
      propsValue: { topics: 't', since: undefined, priority: [4, 5], tags: ['x'], limit: 2 },
    });
    const request = sendRequest.mock.calls[0][0];
    expect(request.url).toBe('https://ntfy.example.com/t/json');
    expect(request.responseType).toBe('text');
    expect(request.queryParams).toEqual({ poll: '1', since: '12h', priority: '4,5', tags: 'x' });
    expect(result).toEqual({
      messages: [
        { id: 'b', time: 3, event: 'message', topic: 't' },
        { id: 'd', time: 2, event: 'message', topic: 't' },
      ],
      count: 2,
      total_matched: 3,
      has_more: true,
      server_truncated: true,
    });
  });
});

describe('List Scheduled Messages', () => {
  it('keeps only messages due after the server time', async () => {
    const now = 1790662800;
    sendRequest.mockResolvedValueOnce({
      status: 200,
      headers: { date: new Date(now * 1000).toUTCString() },
      body: ndjson([
        { id: 'past', time: now - 10, event: 'message', topic: 't' },
        { id: 'later', time: now + 7200, event: 'message', topic: 't' },
        { id: 'soon', time: now + 60, event: 'message', topic: 't' },
      ]),
    });
    const result = await runAction({ action: listScheduledMessages, propsValue: { topics: 't' } });
    expect(sendRequest.mock.calls[0][0].queryParams).toMatchObject({ poll: '1', sched: '1', since: 'all' });
    expect(result).toMatchObject({ count: 2, server_truncated: false });
    expect(JSON.stringify(result)).toMatch(/"soon".*"later"/);
  });

  it('reports when the server capped the replay', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: { 'x-messages-truncated': '1' }, body: '' });
    const result = await runAction({ action: listScheduledMessages, propsValue: { topics: 't' } });
    expect(result).toMatchObject({ count: 0, server_truncated: true });
  });
});

describe('Update Notification', () => {
  it('posts JSON to the root URL with the sequence id and only the fields that are set', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: { id: 'u1', sequence_id: 'job-1' } });
    const result = await runAction({
      action: updateNotification,
      propsValue: { topic: 'alerts', sequence_id: ' job-1 ', message: '50% done', title: '', priority: 3 },
    });
    const request = sendRequest.mock.calls[0][0];
    expect(request.method).toBe(HttpMethod.POST);
    expect(request.url).toBe('https://ntfy.example.com/');
    expect(request.body).toEqual({ topic: 'alerts', message: '50% done', priority: 3, sequence_id: 'job-1' });
    expect(result).toEqual({ id: 'u1', sequence_id: 'job-1' });
  });

  it('refuses an invalid sequence id before any request', async () => {
    await expect(
      runAction({ action: updateNotification, propsValue: { topic: 'alerts', sequence_id: 'a/b', message: 'x' } })
    ).rejects.toThrow(/Sequence ID/);
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('Clear Notification', () => {
  it('sends PUT /<topic>/<sequence_id>/clear', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: { id: 'c', event: 'message_clear' } });
    await runAction({ action: clearNotification, propsValue: { topic: 'alerts', sequence_id: 'job-1' } });
    const request = sendRequest.mock.calls[0][0];
    expect(request.method).toBe(HttpMethod.PUT);
    expect(request.url).toBe('https://ntfy.example.com/alerts/job-1/clear');
  });
});

describe('Get Account', () => {
  it('never returns tokens, emails, phone numbers or the sync topic', async () => {
    sendRequest.mockResolvedValueOnce({
      status: 200,
      headers: {},
      body: {
        username: 'jane',
        role: 'user',
        sync_topic: 'secret-sync',
        tokens: [{ token: 'tk_secret', label: 'x' }],
        emails: [{ address: 'jane@example.com', primary: true }],
        phone_numbers: ['+12223334444'],
        tier: { code: 'free', name: 'Free' },
        limits: { basis: 'tier', messages: 250 },
        stats: { messages: 8, messages_remaining: 242 },
        reservations: [{ topic: 'mine', everyone: 'deny-all' }],
      },
    });
    const result = await runAction({ action: getAccount, propsValue: {}, token: 'tk_secret' });
    const text = JSON.stringify(result);
    expect(text).not.toMatch(/tk_secret|jane@example.com|2223334444|secret-sync/);
    expect(result).toMatchObject({
      username: 'jane',
      tier_name: 'Free',
      limits_messages: 250,
      stats_messages_remaining: 242,
      reserved_topics: 'mine',
    });
  });
});

describe('Get Attachment Info', () => {
  it('returns exists:false on 404 and strips a file extension', async () => {
    sendRequest.mockRejectedValueOnce({ response: { status: 404, body: { code: 40401, error: 'page not found' } } });
    const result = await runAction({ action: getAttachmentInfo, propsValue: { message_id: 'NOPEnope1234.txt' } });
    expect(sendRequest.mock.calls[0][0]).toMatchObject({
      method: HttpMethod.HEAD,
      url: 'https://ntfy.example.com/file/NOPEnope1234',
    });
    expect(result).toEqual({
      message_id: 'NOPEnope1234',
      exists: false,
      size_bytes: null,
      content_type: null,
      url: 'https://ntfy.example.com/file/NOPEnope1234',
    });
  });

  it('rethrows other errors', async () => {
    sendRequest.mockRejectedValueOnce({ response: { status: 401, body: { error: 'unauthorized' } } });
    await expect(runAction({ action: getAttachmentInfo, propsValue: { message_id: 'abc' } })).rejects.toThrow(
      /HTTP 401/
    );
  });
});

describe('Send File', () => {
  it('uploads the file bytes with a duck-typed file object', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: { id: 'f1' } });
    await runAction({
      action: sendFile,
      propsValue: {
        topic: 'alerts',
        file: { filename: 'note.txt', data: Buffer.from('hello'), extension: 'txt', base64: 'aGVsbG8=' },
        message: undefined,
        priority: 4,
      },
    });
    const request = sendRequest.mock.calls[0][0];
    expect(request.method).toBe(HttpMethod.PUT);
    expect(request.body.toString()).toBe('hello');
    expect(request.headers).toMatchObject({ 'X-Priority': '4' });
    expect(request.headers).not.toHaveProperty('X-Message');
  });

  it('encodes a non-ASCII tag so the request can be sent', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: { id: 'f2' } });
    await runAction({
      action: sendFile,
      propsValue: { topic: 'alerts', file: { filename: 'a.txt', data: Buffer.from('a') }, tags: ['✅', 'ok'] },
    });
    const tags = sendRequest.mock.calls[0][0].headers['X-Tags'];
    expect(tags).toBe(ntfyClient.encodeToRFC2047('✅,ok'));
    expect(() => new Headers({ 'X-Tags': tags })).not.toThrow();
  });
});

describe('New Message trigger', () => {
  it('seeds the cursor on enable, then emits each new message once', async () => {
    const store = new Map<string, string>();
    const ctx = triggerContext({ propsValue: { topics: 't', priority: undefined, tags: undefined }, store });
    const now = 1790662800;
    const dateHeader = { date: new Date(now * 1000).toUTCString() };

    sendRequest.mockResolvedValueOnce({
      status: 200,
      headers: dateHeader,
      body: ndjson([{ id: 'before', time: now - 5, event: 'message', topic: 't' }]),
    });
    await newMessage.onEnable(ctx);
    expect(sendRequest.mock.calls[0][0].queryParams).toMatchObject({ since: '60s' });

    sendRequest.mockResolvedValueOnce({
      status: 200,
      headers: dateHeader,
      body: ndjson([
        { id: 'before', time: now - 5, event: 'message', topic: 't' },
        { id: 'n1', time: now + 10, event: 'message', topic: 't' },
        { id: 'n2', time: now + 11, event: 'message', topic: 't' },
      ]),
    });
    const first = await newMessage.run(ctx);
    expect(sendRequest.mock.calls[1][0].queryParams).toMatchObject({ since: String(now - 60) });
    expect(first).toEqual([expect.objectContaining({ id: 'n1' }), expect.objectContaining({ id: 'n2' })]);

    sendRequest.mockResolvedValueOnce({
      status: 200,
      headers: dateHeader,
      body: ndjson([
        { id: 'n1', time: now + 10, event: 'message', topic: 't' },
        { id: 'n2', time: now + 11, event: 'message', topic: 't' },
      ]),
    });
    expect(await newMessage.run(ctx)).toEqual([]);
  });

  it('marks the runs of a capped replay that may have skipped messages and still advances the cursor', async () => {
    const store = new Map<string, string>([['ntfy_new_message_cursor', JSON.stringify({ lastTime: 1000, seen: [] })]]);
    const ctx = triggerContext({ propsValue: { topics: 't', priority: undefined, tags: undefined }, store });
    sendRequest.mockResolvedValueOnce({
      status: 200,
      headers: { 'x-messages-truncated': '1' },
      body: ndjson([
        { id: 'k1', time: 1500, event: 'message', topic: 't' },
        { id: 'k2', time: 1501, event: 'message', topic: 't' },
      ]),
    });
    const truncated = await newMessage.run(ctx);
    expect(truncated).toEqual([
      expect.objectContaining({ id: 'k1', replay_truncated: true }),
      expect.objectContaining({ id: 'k2', replay_truncated: true }),
    ]);
    expect(JSON.parse(store.get('ntfy_new_message_cursor') ?? 'null')).toMatchObject({ lastTime: 1501 });

    sendRequest.mockResolvedValueOnce({
      status: 200,
      headers: {},
      body: ndjson([
        { id: 'k2', time: 1501, event: 'message', topic: 't' },
        { id: 'k3', time: 1502, event: 'message', topic: 't' },
      ]),
    });
    expect(await newMessage.run(ctx)).toEqual([expect.objectContaining({ id: 'k3', replay_truncated: false })]);
  });

  it('does not flag a capped replay that only dropped already-seen messages', async () => {
    const store = new Map<string, string>([
      ['ntfy_new_message_cursor', JSON.stringify({ lastTime: 1000, seen: [{ id: 'old', time: 990 }] })],
    ]);
    const ctx = triggerContext({ propsValue: { topics: 't', priority: undefined, tags: undefined }, store });
    sendRequest.mockResolvedValueOnce({
      status: 200,
      headers: { 'x-messages-truncated': '1' },
      body: ndjson([
        { id: 'old', time: 990, event: 'message', topic: 't' },
        { id: 'n1', time: 1001, event: 'message', topic: 't' },
      ]),
    });
    expect(await newMessage.run(ctx)).toEqual([expect.objectContaining({ id: 'n1', replay_truncated: false })]);
  });

  it('keeps the cursor on republish', async () => {
    const store = new Map<string, string>([['ntfy_new_message_cursor', JSON.stringify({ lastTime: 5, seen: [] })]]);
    const ctx = { ...triggerContext({ propsValue: { topics: 't' }, store }), isRepublish: true };
    await newMessage.onEnable(ctx);
    expect(sendRequest).not.toHaveBeenCalled();
    expect(JSON.parse(store.get('ntfy_new_message_cursor') ?? 'null')).toEqual({ lastTime: 5, seen: [] });
  });
});

describe('Custom API Call base URL', () => {
  const propsValue = { url: { url: '/v1/health' }, method: HttpMethod.GET, headers: {}, queryParams: {}, body: {} };

  it('uses the validated Server URL, so a relative path cannot land in a query string', async () => {
    const customApiCall = ntfy.getAction('custom_api_call');
    if (!customApiCall) {
      throw new Error('custom_api_call is missing');
    }
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response('{"healthy":true}', { status: 200, headers: { 'content-type': 'application/json' } }));
    try {
      await runAction({ action: customApiCall, propsValue });
      expect(String(fetchSpy.mock.calls[0][0])).toBe('https://ntfy.example.com/v1/health');
      fetchSpy.mockClear();
      await expect(
        runAction({ action: customApiCall, propsValue, baseUrl: 'https://ntfy.example.com/?t=1' })
      ).rejects.toThrow(/"\?" or "#"/);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });
});

describe('Custom API Call auth mapping', () => {
  it('sends no Authorization header without a token (0.3.0 sent "Bearer undefined") and Bearer with one', () => {
    expect(ntfy.getAction('custom_api_call')).toBeDefined();
    expect(ntfyClient.authHeaders(testAuth())).toEqual({});
    expect(ntfyClient.authHeaders(testAuth({ token: '  ' }))).toEqual({});
    expect(ntfyClient.authHeaders(testAuth({ token: 'tk_abc' }))).toEqual({ Authorization: 'Bearer tk_abc' });
  });
});
