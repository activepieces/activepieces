import { createHmac } from 'crypto';
import { Store } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { firefliesWebhook, SUMMARIZED_EVENT, TRANSCRIBED_EVENT } from '../src/lib/common/webhook';

afterEach(() => vi.unstubAllGlobals());

const MEETING = { id: 'm-1', title: 'Weekly sync' };

describe('parseEvent', () => {
  test('maps a Webhooks V2 body', () => {
    expect(firefliesWebhook.parseEvent({ event: 'meeting.transcribed', meeting_id: 'm-1', timestamp: 1, client_reference_id: 'ref' })).toEqual({
      version: 'v2',
      event: TRANSCRIBED_EVENT,
      meetingId: 'm-1',
      reprocessedAt: undefined,
      clientReferenceId: 'ref',
    });
  });

  test('maps both V1 eventType spellings to meeting.transcribed', () => {
    for (const eventType of ['Transcription completed', 'Transcription complete']) {
      expect(firefliesWebhook.parseEvent({ eventType, meetingId: 'm-1' })?.event).toBe(TRANSCRIBED_EVENT);
    }
  });

  test('parses a string body', () => {
    expect(firefliesWebhook.parseEvent(JSON.stringify({ event: 'meeting.summarized', meeting_id: 'm-2' }))?.meetingId).toBe('m-2');
  });

  test('returns undefined for unknown shapes', () => {
    expect(firefliesWebhook.parseEvent({ eventType: 'Something else', meetingId: 'm-1' })).toBeUndefined();
    expect(firefliesWebhook.parseEvent('not json')).toBeUndefined();
    expect(firefliesWebhook.parseEvent({ event: 'meeting.transcribed' })).toBeUndefined();
  });
});

describe('handleDelivery', () => {
  test('a V2 delivery fetches the meeting and emits it', async () => {
    const seen = stubFetch({ body: { data: { transcript: MEETING } } });
    const output = await deliver({ body: { event: 'meeting.transcribed', meeting_id: 'm-1', timestamp: 1 } });
    expect(output).toEqual([MEETING]);
    expect(seen).toEqual([{ transcriptId: 'm-1' }]);
  });

  test('a V1-shaped body also fires the transcribed trigger', async () => {
    stubFetch({ body: { data: { transcript: MEETING } } });
    expect(await deliver({ body: { eventType: 'Transcription completed', meetingId: 'm-1' } })).toEqual([MEETING]);
  });

  test('an event for the other trigger is ignored without a request', async () => {
    const seen = stubFetch({ body: { data: { transcript: MEETING } } });
    expect(await deliver({ body: { event: 'meeting.summarized', meeting_id: 'm-1' } })).toEqual([]);
    expect(await deliver({ body: { event: 'meeting.bot_joined', meeting_id: 'm-1' } })).toEqual([]);
    expect(seen).toHaveLength(0);
  });

  test('the summarized trigger fires on meeting.summarized only', async () => {
    stubFetch({ body: { data: { transcript: MEETING } } });
    expect(await deliver({ body: { event: 'meeting.transcribed', meeting_id: 'm-1' }, targetEvent: SUMMARIZED_EVENT })).toEqual([]);
    expect(await deliver({ body: { event: 'meeting.summarized', meeting_id: 'm-1' }, targetEvent: SUMMARIZED_EVENT })).toEqual([MEETING]);
  });

  test('accepts a valid signature with or without the sha256= prefix', async () => {
    stubFetch({ body: { data: { transcript: MEETING } } });
    const rawBody = JSON.stringify({ event: 'meeting.transcribed', meeting_id: 'm-1' });
    const hex = createHmac('sha256', 'shh').update(rawBody).digest('hex');
    expect(await deliver({ body: JSON.parse(rawBody), rawBody, secret: 'shh', headers: { 'X-Hub-Signature': `sha256=${hex}` } })).toEqual([MEETING]);
    expect(await deliver({ body: JSON.parse(rawBody), rawBody, secret: 'shh', headers: { 'x-hub-signature': hex } })).toEqual([MEETING]);
  });

  test('rejects a wrong, short, missing or unverifiable signature without a request', async () => {
    const seen = stubFetch({ body: { data: { transcript: MEETING } } });
    const rawBody = JSON.stringify({ event: 'meeting.transcribed', meeting_id: 'm-1' });
    const wrong = createHmac('sha256', 'other-secret').update(rawBody).digest('hex');
    const body = JSON.parse(rawBody);
    expect(await deliver({ body, rawBody, secret: 'shh', headers: { 'x-hub-signature': `sha256=${wrong}` } })).toEqual([]);
    expect(await deliver({ body, rawBody, secret: 'shh', headers: { 'x-hub-signature': 'sha256=abcd' } })).toEqual([]);
    expect(await deliver({ body, rawBody, secret: 'shh', headers: { 'x-hub-signature': 'sha256=zz' } })).toEqual([]);
    expect(await deliver({ body, rawBody, secret: 'shh', headers: {} })).toEqual([]);
    expect(await deliver({ body, rawBody: undefined, secret: 'shh', headers: { 'x-hub-signature': wrong } })).toEqual([]);
    expect(seen).toHaveLength(0);
  });

  test('dedupes an identical resend but fires again for a reprocessed delivery', async () => {
    const seen = stubFetch({ body: { data: { transcript: MEETING } } });
    const store = memoryStore();
    const body = { event: 'meeting.transcribed', meeting_id: 'm-1', timestamp: 1 };
    expect(await deliver({ body, store })).toEqual([MEETING]);
    expect(await deliver({ body: { ...body, timestamp: 2 }, store })).toEqual([]);
    expect(await deliver({ body: { ...body, reprocessed_at: '2026-03-15T15:00:00Z' }, store })).toEqual([MEETING]);
    expect(seen).toHaveLength(2);
    expect(firefliesWebhook.dedupeKey({ version: 'v2', event: 'meeting.transcribed', meetingId: 'm-1', reprocessedAt: 'r', clientReferenceId: undefined })).toBe('meeting.transcribed:m-1:r');
  });

  test('forgets deliveries older than 24 hours', async () => {
    stubFetch({ body: { data: { transcript: MEETING } } });
    const store = memoryStore();
    const body = { event: 'meeting.transcribed', meeting_id: 'm-1' };
    expect(await deliver({ body, store, now: 1_000 })).toEqual([MEETING]);
    expect(await deliver({ body, store, now: 1_000 + 25 * 60 * 60 * 1000 })).toEqual([MEETING]);
  });

  test('writes the dedupe marker only after the meeting fetch succeeds, and rethrows the vendor error', async () => {
    stubFetch({ body: { data: null, errors: [{ message: 'Not found', code: 'object_not_found' }] } });
    const store = memoryStore();
    await expect(deliver({ body: { event: 'meeting.transcribed', meeting_id: 'm-1' }, store })).rejects.toThrow('object_not_found');
    expect(store.data.size).toBe(0);
    stubFetch({ body: { data: { transcript: null } } });
    await expect(deliver({ body: { event: 'meeting.transcribed', meeting_id: 'm-1' }, store })).rejects.toThrow('returned no meeting');
    expect(store.data.size).toBe(0);
  });
});

function deliver({ body, rawBody, secret, headers, store, targetEvent, now }: DeliverParams): Promise<unknown[]> {
  return firefliesWebhook.handleDelivery({
    apiKey: 'key',
    payload: { body, rawBody, headers: headers ?? {} },
    store: store ?? memoryStore(),
    signingSecret: secret,
    targetEvent: targetEvent ?? TRANSCRIBED_EVENT,
    now,
  });
}

function stubFetch({ body }: { body: unknown }): unknown[] {
  const variables: unknown[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      const parsed: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : null;
      variables.push(parsed !== null && typeof parsed === 'object' ? Reflect.get(parsed, 'variables') : undefined);
      return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
    }),
  );
  return variables;
}

function memoryStore(): Store & { data: Map<string, unknown> } {
  const data = new Map<string, unknown>();
  return {
    data,
    async put<T>(key: string, value: T): Promise<T> {
      data.set(key, JSON.parse(JSON.stringify(value)));
      return value;
    },
    async get<T>(key: string): Promise<T | null> {
      return data.has(key) ? JSON.parse(JSON.stringify(data.get(key))) : null;
    },
    async delete(key: string): Promise<void> {
      data.delete(key);
    },
  };
}

type DeliverParams = {
  body: unknown;
  rawBody?: unknown;
  secret?: string;
  headers?: Record<string, string>;
  store?: Store;
  targetEvent?: string;
  now?: number;
};
