import { afterEach, describe, expect, test, vi } from 'vitest';
import { sendItRequests } from '../src/lib/common/requests';
import { API_KEY, replies, stubFetch } from './helpers';

afterEach(() => vi.unstubAllGlobals());

const future = new Date(Date.now() + 86_400_000).toISOString();

describe('post building', () => {
  test('sends only set content fields, normalises platforms and media URLs', () => {
    const body = sendItRequests.buildPost({ input: { platforms: ['X', 'x', 'threads'], text: ' hi ', mediaUrls: [{ url: 'https://a.io/1.png' }, 'https://a.io/2.png'], mediaType: 'image', firstComment: 'c', platformSettings: '{"threads":{"a":1}}' } });
    expect(body).toEqual({ platforms: ['x', 'threads'], content: { text: 'hi', mediaUrls: ['https://a.io/1.png', 'https://a.io/2.png'], mediaType: 'image', firstComment: 'c', platformSettings: { threads: { a: 1 } } } });
  });

  test('drops mediaType without media', () => {
    expect(sendItRequests.buildPost({ input: { platforms: ['x'], text: 'hi', mediaType: 'auto' } }).content).toEqual({ text: 'hi' });
  });

  test('requires media for instagram, pinterest, tiktok, youtube', () => {
    expect(() => sendItRequests.buildPost({ input: { platforms: ['instagram'], text: 'hi' } })).toThrow('a Media URL (image or video) is required');
    expect(sendItRequests.buildPost({ input: { platforms: ['instagram'], text: 'hi' }, requireMedia: false }).platforms).toEqual(['instagram']);
  });

  test('rejects non-https media, empty platforms and empty text', () => {
    expect(() => sendItRequests.buildPost({ input: { platforms: ['x'], text: 'hi', mediaUrl: 'http://a.io/x.png' } })).toThrow('https');
    expect(() => sendItRequests.buildPost({ input: { platforms: [], text: 'hi' } })).toThrow('at least one platform');
    expect(() => sendItRequests.buildPost({ input: { platforms: ['x'], text: '  ' } })).toThrow('Post Text is required');
  });

  test('rejects non-object platform settings', () => {
    expect(() => sendItRequests.buildPost({ input: { platforms: ['x'], text: 'hi', platformSettings: '[1]' } })).toThrow('JSON object');
  });

  test('scheduled time must be ISO and in the future', () => {
    expect(() => sendItRequests.futureIso({ value: 'tomorrow' })).toThrow('ISO-8601');
    expect(() => sendItRequests.futureIso({ value: '2020-01-01T00:00:00Z' })).toThrow('in the past');
    expect(sendItRequests.futureIso({ value: future })).toBe(future);
  });

  test('idempotency key defaults to run + step and honours an override', () => {
    const a = sendItRequests.idempotencyKey({ override: undefined, runId: 'run1', stepName: 'step_2', operation: 'publish', input: { text: 'a', platforms: ['x'] } });
    const aAgain = sendItRequests.idempotencyKey({ override: undefined, runId: 'run1', stepName: 'step_2', operation: 'publish', input: { platforms: ['x'], text: 'a' } });
    const b = sendItRequests.idempotencyKey({ override: undefined, runId: 'run1', stepName: 'step_2', operation: 'publish', input: { text: 'b', platforms: ['x'] } });
    expect(a).toMatch(/^activepieces:publish:[0-9a-f]{40}$/);
    expect(aAgain).toBe(a);
    expect(b).not.toBe(a);
    expect(sendItRequests.idempotencyKey({ override: ' mine ', runId: 'run1', stepName: 'step_2', operation: 'publish', input: {} })).toBe('mine');
  });
});

describe('requests', () => {
  test('publish sends Idempotency-Key and returns results', async () => {
    const seen = stubFetch(replies([{ body: { success: true, results: [{ platform: 'bluesky', postUrl: 'https://bsky.app/profile/did:plc:a/post/1', postType: 'text', platformPostId: 'at://did:plc:a/app.bsky.feed.post/1' }], errors: [], errorDetails: [] } }]));
    const out = await sendItRequests.publish({ apiKey: API_KEY, input: { platforms: ['x'], text: 'hi' }, key: 'k1' });
    expect(seen[0].method).toBe('POST');
    expect(seen[0].path).toBe('/api/v1/publish');
    expect(seen[0].headers.get('idempotency-key')).toBe('k1');
    expect(seen[0].body).toEqual({ platforms: ['x'], content: { text: 'hi' } });
    expect(out['results']).toHaveLength(1);
    expect(out['idempotencyKey']).toBe('k1');
  });

  test('schedule returns a scheduleId from either shape', async () => {
    stubFetch(replies([{ body: { success: true, scheduleId: 'sched_1' } }, { body: { success: true, schedule: { id: 'sched_2' } } }]));
    expect((await sendItRequests.schedule({ apiKey: API_KEY, input: { platforms: ['x'], text: 'hi' }, scheduledTime: future, key: 'k' }))['scheduleId']).toBe('sched_1');
    expect((await sendItRequests.schedule({ apiKey: API_KEY, input: { platforms: ['x'], text: 'hi' }, scheduledTime: future, key: 'k' }))['scheduleId']).toBe('sched_2');
  });

  test('cancel encodes the ID and DELETEs', async () => {
    const seen = stubFetch(replies([{ body: { success: true } }]));
    const out = await sendItRequests.cancel({ apiKey: API_KEY, scheduleId: 'a/b' });
    expect(seen[0].method).toBe('DELETE');
    expect(seen[0].url).toBe('https://sendit.infiniteappsai.com/api/v1/scheduled/a%2Fb');
    expect(out).toMatchObject({ scheduleId: 'a/b', cancelled: true });
  });

  test('trigger now POSTs to /trigger', async () => {
    const seen = stubFetch(replies([{ body: { success: true, results: [] } }]));
    await sendItRequests.triggerNow({ apiKey: API_KEY, scheduleId: 'sched_1' });
    expect(seen[0].method).toBe('POST');
    expect(seen[0].path).toBe('/api/v1/scheduled/sched_1/trigger');
  });

  test('get scheduled filters the list and fails clearly when missing', async () => {
    stubFetch(replies([{ body: { success: true, posts: [{ id: 'sched_1', platforms: ['x'] }] } }]));
    expect(await sendItRequests.getScheduled({ apiKey: API_KEY, scheduleId: 'sched_1' })).toMatchObject({ id: 'sched_1' });
    await expect(sendItRequests.getScheduled({ apiKey: API_KEY, scheduleId: 'nope' })).rejects.toThrow('No pending scheduled post');
  });

  test('list accounts passes limit and counts', async () => {
    const seen = stubFetch(replies([{ body: { success: true, accounts: [{ id: 'acc_1' }] } }]));
    expect(await sendItRequests.listAccounts({ apiKey: API_KEY, limit: 5 })).toEqual({ success: true, accounts: [{ id: 'acc_1' }], count: 1 });
    expect(seen[0].query.get('limit')).toBe('5');
  });

  test('list scheduled keeps the SendIt response fields and adds count', async () => {
    const seen = stubFetch(replies([{ body: { success: true, total: 1, posts: [{ id: 'sched_1' }] } }]));
    expect(await sendItRequests.listScheduled({ apiKey: API_KEY, platform: 'x' })).toEqual({ success: true, total: 1, posts: [{ id: 'sched_1' }], count: 1 });
    expect(seen[0].query.get('platform')).toBe('x');
  });

  test('analytics requires a platform and lowercases it', async () => {
    const seen = stubFetch(replies([{ body: { success: true, platform: 'instagram', posts: [] } }]));
    const out = await sendItRequests.analytics({ apiKey: API_KEY, platform: 'Instagram' });
    expect(seen[0].query.get('platform')).toBe('instagram');
    expect(out).toMatchObject({ platform: 'instagram', posts: [], count: 0 });
  });

  test('requirements and dead letter', async () => {
    const seen = stubFetch(replies([{ body: { success: true, platform: 'x', textLimit: 280 } }, { body: { success: true, posts: [] } }]));
    expect(await sendItRequests.requirements({ apiKey: API_KEY, platform: 'X' })).toMatchObject({ textLimit: 280 });
    expect(await sendItRequests.listDeadLetter({ apiKey: API_KEY, limit: 10 })).toEqual({ success: true, posts: [], count: 0 });
    expect(seen[0].query.get('platform')).toBe('x');
    expect(seen[1].query.get('limit')).toBe('10');
  });
});
