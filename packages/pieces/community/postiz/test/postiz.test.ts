import { afterEach, describe, expect, test, vi } from 'vitest';
import { AppConnectionType, Store } from '@activepieces/pieces-framework';
import { httpClient, HttpError, HttpRequest } from '@activepieces/pieces-common';
import { createMockActionContext, createMockPollingTriggerContext } from '../../../framework/src/lib/test';
import { postiz } from '../src/index';
import { postizAuth, normalizeBaseUrl } from '../src/lib/common/auth';
import { aiCreateDraftPost } from '../src/lib/actions/ai-create-draft-post';
import { aiSchedulePost } from '../src/lib/actions/ai-schedule-post';
import { aiPublishPostNow } from '../src/lib/actions/ai-publish-post-now';
import { createPost } from '../src/lib/actions/create-post';
import { deletePost } from '../src/lib/actions/delete-post';
import { changePostStatus } from '../src/lib/actions/change-post-status';
import { getChannelSettings } from '../src/lib/actions/get-channel-settings';
import { listMedia } from '../src/lib/actions/list-media';
import { getPostAnalytics } from '../src/lib/actions/get-post-analytics';
import { newPost } from '../src/lib/triggers/new-post';
import { findAvailableSlot } from '../src/lib/actions/find-available-slot';
import { getPlatformAnalytics } from '../src/lib/actions/get-platform-analytics';
import { uploadFileFromUrl } from '../src/lib/actions/upload-file-from-url';
import { listPosts } from '../src/lib/actions/list-posts';
import { parseDate } from '../src/lib/common/post-body';

afterEach(() => vi.restoreAllMocks());

const API_KEY = 'pz_test_key';
const AUTH = {
  type: AppConnectionType.CUSTOM_AUTH,
  props: { base_url: 'https://api.postiz.com/public/v1/', api_key: API_KEY },
};
const CHANNEL = { id: 'chan-1', name: 'My Bluesky', identifier: 'bluesky', disabled: false };
const MEDIA = { id: 'media-1', name: 'a.png', originalName: 'cover.png', path: 'https://uploads.postiz.com/a.png' };

function stubPostiz({ routes }: { routes: Route[] }): HttpRequest[] {
  const seen: HttpRequest[] = [];
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
    seen.push(request);
    const route = routes.find((candidate) => candidate.method === request.method && request.url.endsWith(candidate.path));
    if (!route) {
      throw new Error(`unexpected ${request.method} ${request.url}`);
    }
    if (route.networkError) {
      throw new TypeError('fetch failed');
    }
    const status = route.status ?? 200;
    if (status >= 400) {
      throw new HttpError(request.body, { status, responseBody: route.body });
    }
    return { status, headers: {}, body: route.body };
  });
  return seen;
}

function actionContext({ propsValue }: { propsValue: Record<string, unknown> }) {
  return { ...createMockActionContext({ propsValue }), auth: AUTH };
}

function triggerContext({ store }: { store: Store }) {
  return { ...createMockPollingTriggerContext({ propsValue: {} }), auth: AUTH, store };
}

function memoryStore(): Store & { data: Map<string, unknown> } {
  const data = new Map<string, unknown>();
  return {
    data,
    async put<T>(key: string, value: T): Promise<T> {
      data.set(key, value);
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

async function validate({ baseUrl }: { baseUrl: string }) {
  const validator = postizAuth.validate;
  if (validator === undefined) {
    throw new Error('validate missing');
  }
  return validator({
    auth: { base_url: baseUrl, api_key: API_KEY },
    server: { apiUrl: '', publicUrl: '', token: '' },
  });
}

function bodyOf({ request }: { request: HttpRequest | undefined }): Record<string, unknown> {
  const body: unknown = request?.body;
  if (typeof body !== 'object' || body === null) {
    throw new Error('missing body');
  }
  return { ...body };
}

function firstPostItem({ request }: { request: HttpRequest | undefined }): Record<string, unknown> {
  const posts = bodyOf({ request })['posts'];
  if (!Array.isArray(posts)) {
    throw new Error('missing posts');
  }
  return { ...posts[0] };
}

function post({ id, state, publishDate }: { id: string; state: string; publishDate: string }) {
  return { id, content: 'hi', publishDate, releaseURL: null, state, integration: { id: CHANNEL.id, providerIdentifier: 'bluesky', name: 'My Bluesky' } };
}

describe('auth', () => {
  test('normalizes the base URL', () => {
    expect(normalizeBaseUrl({ baseUrl: ' example.com/api/public/v1// ' })).toBe('https://example.com/api/public/v1');
    expect(normalizeBaseUrl({ baseUrl: '' })).toBe('https://api.postiz.com/public/v1');
  });

  test('valid key hits is-connected with the raw key', async () => {
    const seen = stubPostiz({ routes: [{ method: 'GET', path: '/is-connected', body: { connected: true } }] });
    expect(await validate({ baseUrl: 'https://api.postiz.com/public/v1/' })).toEqual({ valid: true });
    expect(seen[0].url).toBe('https://api.postiz.com/public/v1/is-connected');
    expect(seen[0].headers?.['Authorization']).toBe(API_KEY);
  });

  test.each([401, 403])('%s is an invalid API key', async (status) => {
    stubPostiz({ routes: [{ method: 'GET', path: '/is-connected', status, body: { message: 'nope' } }] });
    expect(await validate({ baseUrl: 'https://api.postiz.com/public/v1' })).toEqual({ valid: false, error: 'Invalid API key' });
  });

  test('500 shows the vendor message', async () => {
    stubPostiz({ routes: [{ method: 'GET', path: '/is-connected', status: 500, body: { message: 'database down' } }] });
    const result = await validate({ baseUrl: 'https://api.postiz.com/public/v1' });
    expect(JSON.stringify(result)).toContain('500');
    expect(JSON.stringify(result)).toContain('database down');
    expect(JSON.stringify(result)).not.toContain('Invalid API key');
  });

  test('network failure shows the network message', async () => {
    stubPostiz({ routes: [{ method: 'GET', path: '/is-connected', networkError: true }] });
    const result = await validate({ baseUrl: 'https://api.postiz.com/public/v1' });
    expect(JSON.stringify(result)).toContain('Could not reach Postiz: fetch failed');
  });
});

describe('piece metadata', () => {
  test('create_post is human only and every action except custom call has an output schema', () => {
    expect(createPost.audience).toBe('human');
    for (const [name, action] of Object.entries(postiz.actions())) {
      if (name !== 'custom_api_call') {
        expect(action.outputSchema, name).toBeDefined();
      }
    }
    expect(newPost.outputSchema).toBeDefined();
  });

  test('ai twins are ai only and not idempotent', () => {
    for (const action of [aiCreateDraftPost, aiSchedulePost, aiPublishPostNow, getChannelSettings]) {
      expect(action.audience).toBe('ai');
    }
    for (const action of [aiCreateDraftPost, aiSchedulePost, aiPublishPostNow]) {
      expect(action.aiMetadata?.idempotent).toBe(false);
    }
  });
});

describe('create post body', () => {
  test('draft sends date, tags, __type from the channel and media with id and path', async () => {
    const seen = stubPostiz({
      routes: [
        { method: 'GET', path: '/media', body: { pages: 1, results: [MEDIA] } },
        { method: 'GET', path: '/integrations', body: [CHANNEL] },
        { method: 'POST', path: '/posts', body: [{ postId: 'post-1', integration: CHANNEL.id }] },
      ],
    });
    const result = await aiCreateDraftPost.run(actionContext({
      propsValue: { channel_id: CHANNEL.id, content: 'Hello', media: [MEDIA.path] },
    }));
    const request = seen.find((candidate) => candidate.method === 'POST');
    const body = bodyOf({ request });
    expect(body['type']).toBe('draft');
    expect(typeof body['date']).toBe('string');
    expect(body['tags']).toEqual([]);
    expect(body['shortLink']).toBe(false);
    const item = firstPostItem({ request });
    expect(item['integration']).toEqual({ id: CHANNEL.id });
    expect(item['settings']).toEqual({ __type: 'bluesky' });
    expect(item['value']).toEqual([{ content: 'Hello', image: [{ id: MEDIA.id, path: MEDIA.path }] }]);
    expect(result).toMatchObject({ post_id: 'post-1', integration_id: CHANNEL.id, type: 'draft' });
  });

  test('explicit __type is kept and channels are not fetched', async () => {
    const seen = stubPostiz({
      routes: [{ method: 'POST', path: '/posts', body: [{ postId: 'post-2', integration: 'x-1' }] }],
    });
    await aiPublishPostNow.run(actionContext({
      propsValue: { channel_id: 'x-1', content: 'Now', settings: '{"__type":"x","who_can_reply_post":"everyone"}' },
    }));
    expect(seen).toHaveLength(1);
    expect(bodyOf({ request: seen[0] })['type']).toBe('now');
    expect(firstPostItem({ request: seen[0] })['settings']).toEqual({ __type: 'x', who_can_reply_post: 'everyone' });
  });

  test('schedule rejects a past date before any request', async () => {
    const seen = stubPostiz({ routes: [] });
    await expect(aiSchedulePost.run(actionContext({
      propsValue: { channel_id: CHANNEL.id, content: 'Later', publish_date: '2020-01-01T00:00:00Z' },
    }))).rejects.toThrow('must be in the future');
    expect(seen).toHaveLength(0);
  });

  test('schedule sends the given date', async () => {
    const seen = stubPostiz({
      routes: [
        { method: 'GET', path: '/integrations', body: [CHANNEL] },
        { method: 'POST', path: '/posts', body: [{ postId: 'post-3', integration: CHANNEL.id }] },
      ],
    });
    const result = await aiSchedulePost.run(actionContext({
      propsValue: { channel_id: CHANNEL.id, content: 'Later', publish_date: '2099-01-01T09:00:00Z' },
    }));
    expect(bodyOf({ request: seen[1] })).toMatchObject({ type: 'schedule', date: '2099-01-01T09:00:00.000Z' });
    expect(result).toMatchObject({ publish_date: '2099-01-01T09:00:00.000Z' });
  });

  test('unknown media fails with a clear message and creates nothing', async () => {
    const seen = stubPostiz({ routes: [{ method: 'GET', path: '/media', body: { pages: 1, results: [MEDIA] } }] });
    await expect(aiCreateDraftPost.run(actionContext({
      propsValue: { channel_id: CHANNEL.id, content: 'Hello', media: ['missing'] },
    }))).rejects.toThrow('Media not found');
    expect(seen.some((request) => request.method === 'POST')).toBe(false);
  });

  test('human create post as draft without a date still sends a date', async () => {
    const seen = stubPostiz({
      routes: [
        { method: 'GET', path: '/integrations', body: [CHANNEL] },
        { method: 'POST', path: '/posts', body: [{ postId: 'post-4', integration: CHANNEL.id }] },
      ],
    });
    const result = await createPost.run(actionContext({
      propsValue: { type: 'draft', integration: CHANNEL.id, content: 'Hi', shortLink: false },
    }));
    expect(typeof bodyOf({ request: seen[1] })['date']).toBe('string');
    expect(result).toEqual({ postId: 'post-4', integration: CHANNEL.id });
  });

  test('human schedule without date is rejected', async () => {
    stubPostiz({ routes: [] });
    await expect(createPost.run(actionContext({
      propsValue: { type: 'schedule', integration: CHANNEL.id, content: 'Hi' },
    }))).rejects.toThrow('Publish Date is required');
  });
});

describe('path ids are encoded', () => {
  test('delete post', async () => {
    const seen = stubPostiz({ routes: [{ method: 'DELETE', path: '/posts/a%2Fb%3Fc', body: { id: 'a/b?c' } }] });
    await deletePost.run(actionContext({ propsValue: { postId: 'a/b?c' } }));
    expect(seen[0].url).toBe('https://api.postiz.com/public/v1/posts/a%2Fb%3Fc');
  });

  test('change post status refuses to schedule a published post', async () => {
    const seen = stubPostiz({ routes: [{ method: 'GET', path: '/posts', body: { posts: [post({ id: 'p1', state: 'PUBLISHED', publishDate: '2026-11-18T10:00:00.000Z' })] } }] });
    await expect(changePostStatus.run(actionContext({ propsValue: { post_id: 'p1', status: 'schedule' } }))).rejects.toThrow('already published');
    expect(seen.some((request) => request.method === 'PUT')).toBe(false);
  });

  test('change post status schedules a draft', async () => {
    const seen = stubPostiz({
      routes: [
        { method: 'GET', path: '/posts', body: { posts: [post({ id: 'p2', state: 'DRAFT', publishDate: '2099-01-01T10:00:00.000Z' })] } },
        { method: 'PUT', path: '/posts/p2/status', body: { id: 'p2', state: 'QUEUE' } },
      ],
    });
    const result = await changePostStatus.run(actionContext({ propsValue: { post_id: 'p2', status: 'schedule' } }));
    expect(seen[1].body).toEqual({ status: 'schedule' });
    expect(result).toEqual({ id: 'p2', state: 'QUEUE' });
  });

  test('change post status', async () => {
    const seen = stubPostiz({
      routes: [
        { method: 'PUT', path: '/posts/p%2F1/status', body: { id: 'p/1', state: 'DRAFT' } },
        { method: 'GET', path: '/posts', body: { posts: [post({ id: 'p/1', state: 'QUEUE', publishDate: '2099-01-01T10:00:00.000Z' })] } },
      ],
    });
    const result = await changePostStatus.run(actionContext({ propsValue: { post_id: 'p/1', status: 'draft' } }));
    expect(seen[0].method).toBe('GET');
    expect(seen[1].url).toBe('https://api.postiz.com/public/v1/posts/p%2F1/status');
    expect(seen[1].body).toEqual({ status: 'draft' });
    expect(result).toEqual({ id: 'p/1', state: 'DRAFT' });
  });

  test('post analytics', async () => {
    const seen = stubPostiz({ routes: [{ method: 'GET', path: '/analytics/post/x%23y', body: [] }] });
    await getPostAnalytics.run(actionContext({ propsValue: { postId: 'x#y', days: 7 } }));
    expect(seen[0].url).toBe('https://api.postiz.com/public/v1/analytics/post/x%23y');
  });

  test('channel settings maps output', async () => {
    stubPostiz({
      routes: [{
        method: 'GET',
        path: '/integration-settings/chan-1',
        body: { output: { rules: 'r', maxLength: 300, settings: 'none', tools: [{ methodName: 'm', description: 'd' }] } },
      }],
    });
    const result = await getChannelSettings.run(actionContext({ propsValue: { channel_id: 'chan-1' } }));
    expect(result).toEqual({ channel_id: 'chan-1', rules: 'r', max_length: 300, settings_schema: 'none', tools: [{ method_name: 'm', description: 'd' }] });
  });
});

describe('list media', () => {
  test('sends page and search, maps results', async () => {
    const seen = stubPostiz({ routes: [{ method: 'GET', path: '/media', body: { pages: 3, results: [MEDIA] } }] });
    const result = await listMedia.run(actionContext({ propsValue: { page: 2, search: ' cover ' } }));
    expect(seen[0].queryParams).toEqual({ page: '2', search: 'cover' });
    expect(result).toMatchObject({ page: 2, pages: 3, results: [{ id: MEDIA.id, original_name: 'cover.png', path: MEDIA.path }] });
  });
});

describe('new published post trigger', () => {
  test('test returns the sample post when no post is published yet', async () => {
    stubPostiz({ routes: [{ method: 'GET', path: '/posts', body: { posts: [] } }] });
    const result = await newPost.test(triggerContext({ store: memoryStore() }));
    expect(result).toEqual([newPost.sampleData]);
  });

  test('test returns real published posts when they exist', async () => {
    stubPostiz({ routes: [{ method: 'GET', path: '/posts', body: { posts: [post({ id: 'live', state: 'PUBLISHED', publishDate: '2026-11-18T10:00:00.000Z' })] } }] });
    const result = await newPost.test(triggerContext({ store: memoryStore() }));
    expect(result).toEqual([expect.objectContaining({ id: 'live', state: 'PUBLISHED' })]);
  });

  test('emits a post whose state flipped to PUBLISHED after an earlier poll', async () => {
    const store = memoryStore();
    const old = post({ id: 'old', state: 'PUBLISHED', publishDate: '2026-11-18T10:00:00.000Z' });
    stubPostiz({ routes: [{ method: 'GET', path: '/posts', body: { posts: [old, post({ id: 'late', state: 'QUEUE', publishDate: '2026-11-18T09:00:00.000Z' })] } }] });
    await newPost.onEnable(triggerContext({ store }));
    vi.restoreAllMocks();

    stubPostiz({ routes: [{ method: 'GET', path: '/posts', body: { posts: [old, post({ id: 'late', state: 'QUEUE', publishDate: '2026-11-18T09:00:00.000Z' })] } }] });
    expect(await newPost.run(triggerContext({ store }))).toEqual([]);
    vi.restoreAllMocks();

    stubPostiz({ routes: [{ method: 'GET', path: '/posts', body: { posts: [old, post({ id: 'late', state: 'PUBLISHED', publishDate: '2026-11-18T09:00:00.000Z' })] } }] });
    const emitted = await newPost.run(triggerContext({ store }));
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toMatchObject({ id: 'late', state: 'PUBLISHED' });
    vi.restoreAllMocks();

    stubPostiz({ routes: [{ method: 'GET', path: '/posts', body: { posts: [old, post({ id: 'late', state: 'PUBLISHED', publishDate: '2026-11-18T09:00:00.000Z' })] } }] });
    expect(await newPost.run(triggerContext({ store }))).toEqual([]);
  });

  test('first run without stored state seeds instead of replaying history', async () => {
    const store = memoryStore();
    stubPostiz({ routes: [{ method: 'GET', path: '/posts', body: { posts: [post({ id: 'a', state: 'PUBLISHED', publishDate: '2026-11-18T10:00:00.000Z' })] } }] });
    expect(await newPost.run(triggerContext({ store }))).toEqual([]);
    expect([...store.data.values()]).toEqual([['a']]);
  });

  test('a failed request leaves stored state untouched', async () => {
    const store = memoryStore();
    await store.put('postiz_new_post_seen_ids', ['a']);
    stubPostiz({ routes: [{ method: 'GET', path: '/posts', status: 500, body: { message: 'boom' } }] });
    await expect(newPost.run(triggerContext({ store }))).rejects.toThrow();
    expect(store.data.get('postiz_new_post_seen_ids')).toEqual(['a']);
  });
});

describe('bug hunt fixes', () => {
  test('find available slot appends Z to an offset-less date', async () => {
    stubPostiz({ routes: [{ method: 'GET', path: '/find-slot/chan-1', body: { date: '2026-11-19T16:00:00' } }] });
    expect(await findAvailableSlot.run(actionContext({ propsValue: { integration: 'chan-1' } }))).toEqual({ next_available_date: '2026-11-19T16:00:00Z' });
  });

  test('parseDate treats an offset-less date as UTC', () => {
    expect(parseDate({ value: '2099-01-01T09:00:00', label: 'Date' })).toBe('2099-01-01T09:00:00.000Z');
    expect(parseDate({ value: '2099-01-01T09:00:00+02:00', label: 'Date' })).toBe('2099-01-01T07:00:00.000Z');
  });

  test('create post refuses a past schedule date', async () => {
    const seen = stubPostiz({ routes: [] });
    await expect(createPost.run(actionContext({
      propsValue: { type: 'schedule', date: '2020-01-01T00:00:00Z', integration: CHANNEL.id, content: 'Hi' },
    }))).rejects.toThrow('must be in the future');
    expect(seen).toHaveLength(0);
  });

  test('change post status refuses draft on a published post', async () => {
    const seen = stubPostiz({ routes: [{ method: 'GET', path: '/posts', body: { posts: [post({ id: 'p1', state: 'PUBLISHED', publishDate: '2026-11-18T10:00:00.000Z' })] } }] });
    await expect(changePostStatus.run(actionContext({ propsValue: { post_id: 'p1', status: 'draft' } }))).rejects.toThrow('already published');
    expect(seen.some((request) => request.method === 'PUT')).toBe(false);
  });

  test.each(['draft', 'schedule'])('change post status reports an unknown id for %s', async (status) => {
    stubPostiz({ routes: [{ method: 'GET', path: '/posts', body: { posts: [] } }] });
    await expect(changePostStatus.run(actionContext({ propsValue: { post_id: 'nope', status } }))).rejects.toThrow('was not found');
  });

  test.each([0, -3, 2.5])('analytics refuses days %s', async (days) => {
    const seen = stubPostiz({ routes: [] });
    await expect(getPostAnalytics.run(actionContext({ propsValue: { postId: 'p1', days } }))).rejects.toThrow('whole number');
    await expect(getPlatformAnalytics.run(actionContext({ propsValue: { integration: 'chan-1', days } }))).rejects.toThrow('whole number');
    expect(seen).toHaveLength(0);
  });

  test('upload refuses an unsupported extension before calling Postiz', async () => {
    const seen = stubPostiz({ routes: [] });
    await expect(uploadFileFromUrl.run(actionContext({ propsValue: { url: 'https://example.com/file.pdf' } }))).rejects.toThrow('png, jpg, jpeg, gif, webp, mp4');
    expect(seen).toHaveLength(0);
  });

  test('upload accepts a png url', async () => {
    const seen = stubPostiz({ routes: [{ method: 'POST', path: '/upload-from-url', body: { id: 'm1', name: 'a.png', path: 'https://uploads.postiz.com/a.png' } }] });
    await uploadFileFromUrl.run(actionContext({ propsValue: { url: 'https://example.com/a.PNG?x=1' } }));
    expect(seen[0].body).toEqual({ url: 'https://example.com/a.PNG?x=1' });
  });

  test('upload passes a url with no extension through to Postiz', async () => {
    const seen = stubPostiz({ routes: [{ method: 'POST', path: '/upload-from-url', body: { id: 'm2', name: 'b.png', path: 'https://uploads.postiz.com/b.png' } }] });
    await uploadFileFromUrl.run(actionContext({ propsValue: { url: 'https://cdn.example.com/signed/abc123?sig=xyz' } }));
    expect(seen).toHaveLength(1);
  });

  test('list posts refuses start after end', async () => {
    const seen = stubPostiz({ routes: [] });
    await expect(listPosts.run(actionContext({
      propsValue: { startDate: '2026-12-01T00:00:00Z', endDate: '2026-11-01T00:00:00Z' },
    }))).rejects.toThrow('Start Date must be before End Date');
    expect(seen).toHaveLength(0);
  });
});

type Route = {
  method: string;
  path: string;
  status?: number;
  body?: unknown;
  networkError?: boolean;
};
