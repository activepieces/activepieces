import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nuelink } from '../src/index';
import { createCollectionPost } from '../src/lib/actions/create-collection-post';
import { updatePost } from '../src/lib/actions/update-post';
import { deletePost } from '../src/lib/actions/delete-post';
import { listPosts } from '../src/lib/actions/list-posts';
import { listPublishedPosts } from '../src/lib/actions/list-published-posts';
import { uploadMedia } from '../src/lib/actions/upload-media';
import { aiGetMe } from '../src/lib/actions/ai/get-me';
import { aiGetSchedule } from '../src/lib/actions/ai/get-schedule';
import { aiListChannels } from '../src/lib/actions/ai/list-channels';
import { aiCreateCollection } from '../src/lib/actions/ai/create-collection';
import { aiUpdateCollection } from '../src/lib/actions/ai/update-collection';
import { aiAddCollectionChannel } from '../src/lib/actions/ai/add-collection-channel';
import { aiRemoveCollectionChannel } from '../src/lib/actions/ai/remove-collection-channel';
import { aiAddCollectionQueueSlot } from '../src/lib/actions/ai/add-collection-queue-slot';
import { aiDeleteCollectionQueueSlot } from '../src/lib/actions/ai/delete-collection-queue-slot';
import { aiListAutomations } from '../src/lib/actions/ai/list-automations';
import { aiCreateAutomation } from '../src/lib/actions/ai/create-automation';
import { aiUpdateAutomationStatus } from '../src/lib/actions/ai/update-automation-status';
import { aiListMedia } from '../src/lib/actions/ai/list-media';
import { aiUploadFile } from '../src/lib/actions/ai/upload-file';
import { aiCreatePost } from '../src/lib/actions/ai/create-post';
import { aiUpdatePost } from '../src/lib/actions/ai/update-post';
import { aiMovePosts } from '../src/lib/actions/ai/move-posts';
import { aiDeletePost } from '../src/lib/actions/ai/delete-post';
import { aiListBrandPosts } from '../src/lib/actions/ai/list-brand-posts';
import { aiListPublishedPosts } from '../src/lib/actions/ai/list-published-posts';
import { BRAND, POST, installFetch, jsonResponse, legacyAuth, listBody, requestOf, runAction } from './helpers';

let fetchMock: ReturnType<typeof installFetch>;
const BASE = 'https://app.nuelink.com/api/public/v1';
const ok = ({ data, status = 200 }: { data: unknown; status?: number }) => jsonResponse({ status, body: { status: 'success', data } });

beforeEach(() => {
  fetchMock = installFetch();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('piece surface', () => {
  it('registers 22 ai actions, 7 human actions and no both', () => {
    const actions = Object.values(nuelink.actions());
    const count = (audience: string) => actions.filter((action) => action.audience === audience).length;
    expect(count('ai')).toBe(22);
    expect(count('human')).toBe(7);
    expect(count('both')).toBe(0);
  });

  it('ai aiMetadata never names a demoted action', () => {
    const ai = Object.values(nuelink.actions()).filter((action) => action.audience === 'ai');
    for (const action of ai) {
      const text = action.aiMetadata?.description ?? '';
      expect(text).not.toMatch(/Create Post in Collection|List Posts\b|Upload Media\b/);
    }
  });
});

describe('read atomics', () => {
  it('get_me calls /me', async () => {
    fetchMock.mockResolvedValueOnce(ok({ data: { id: 'abc', name: 'Odai', joinedAt: '2026-01-01T00:00:00Z', timezone: null } }));
    const result = await runAction({ action: aiGetMe, propsValue: {} });
    expect(result).toEqual({ id: 'abc', name: 'Odai', joinedAt: '2026-01-01T00:00:00Z', timezone: null });
    expect(requestOf({ fetchMock, call: 0 }).url).toBe(`${BASE}/me`);
  });

  it('get_schedule calls the brand schedule', async () => {
    fetchMock.mockResolvedValueOnce(ok({ data: { timezone: 'Asia/Amman', queueStatus: 'ACTIVE', schedule: { MON: [] } } }));
    await runAction({ action: aiGetSchedule, propsValue: { brandId: ' 42 ' } });
    expect(requestOf({ fetchMock, call: 0 }).path).toBe('/api/public/v1/brands/42/schedule');
  });

  it('list_channels takes hasMore from lastPage even on a short page', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: listBody({ data: [], currentPage: 1, lastPage: 2, total: 30 }) }));
    const result = await runAction({ action: aiListChannels, propsValue: { brandId: '42', perPage: 10 } });
    expect(result).toMatchObject({ items: [], hasMore: true, total: 30 });
    expect(requestOf({ fetchMock, call: 0 }).query).toEqual({ page: '1', per_page: '10' });
  });

  it('list_automations pages', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: listBody({ data: [{ id: 315, name: 'Blog' }] }) }));
    const result = await runAction({ action: aiListAutomations, propsValue: { brandId: '42' } });
    expect(result).toMatchObject({ items: [{ id: 315 }], hasMore: false });
    expect(requestOf({ fetchMock, call: 0 }).path).toBe('/api/public/v1/brands/42/automations');
  });

  it('list_media sends the type filter and rejects an unknown one', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: listBody({ data: [{ id: 'a.jpg' }] }) }));
    await runAction({ action: aiListMedia, propsValue: { brandId: '42', type: 'image' } });
    expect(requestOf({ fetchMock, call: 0 }).query).toMatchObject({ type: 'IMAGE' });
    await expect(runAction({ action: aiListMedia, propsValue: { brandId: '42', type: 'AUDIO' } })).rejects.toThrow('Type must be one of');
  });

  it('refuses a non-numeric brand ID and the legacy token before any request', async () => {
    await expect(runAction({ action: aiGetSchedule, propsValue: { brandId: '../1' } })).rejects.toThrow('numeric Nuelink ID');
    await expect(runAction({ action: aiGetMe, auth: legacyAuth(), propsValue: {} })).rejects.toThrow('needs a Nuelink API Key connection');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('collections', () => {
  it('create_collection normalizes and deduplicates slots and channels', async () => {
    fetchMock.mockResolvedValueOnce(ok({ data: { id: 9, title: 'AP Test' }, status: 201 }));
    await runAction({
      action: aiCreateCollection,
      propsValue: { brandId: '42', title: ' AP Test ', maxRepublish: 0, channels: ['5', 5, '6'], queues: ['tue 09:00', 'Tue 09:00', 'MON  18:30'] },
    });
    const request = requestOf({ fetchMock, call: 0 });
    expect(request.method).toBe('POST');
    expect(request.path).toBe('/api/public/v1/brands/42/collections');
    expect(request.body).toEqual({ title: 'AP Test', maxRepublish: 0, channels: [5, 6], queues: ['Tue 09:00', 'Mon 18:30'] });
  });

  it('create_collection rejects a bad slot and an unsafe channel ID', async () => {
    await expect(runAction({ action: aiCreateCollection, propsValue: { brandId: '42', title: 'X', queues: ['Tue 9am'] } })).rejects.toThrow('like "Tue 09:00"');
    await expect(runAction({ action: aiCreateCollection, propsValue: { brandId: '42', title: 'X', channels: ['123456789012345678'] } })).rejects.toThrow('too large');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('update_collection sends only set fields', async () => {
    fetchMock.mockResolvedValueOnce(ok({ data: { id: 9 } }));
    await runAction({ action: aiUpdateCollection, propsValue: { brandId: '42', collectionId: '9', status: 'paused' } });
    const request = requestOf({ fetchMock, call: 0 });
    expect(request.method).toBe('PATCH');
    expect(request.path).toBe('/api/public/v1/brands/42/collections/9');
    expect(request.body).toEqual({ status: 'PAUSED' });
  });

  it('update_collection clears the description with null', async () => {
    fetchMock.mockResolvedValueOnce(ok({ data: { id: 9 } }));
    await runAction({ action: aiUpdateCollection, propsValue: { brandId: '42', collectionId: '9', clearDescription: true } });
    expect(requestOf({ fetchMock, call: 0 }).body).toEqual({ description: null });
  });

  it('update_collection refuses empty and conflicting updates', async () => {
    await expect(runAction({ action: aiUpdateCollection, propsValue: { brandId: '42', collectionId: '9', clearDescription: false } })).rejects.toThrow('Nothing to update');
    await expect(runAction({ action: aiUpdateCollection, propsValue: { brandId: '42', collectionId: '9', description: 'x', clearDescription: true } })).rejects.toThrow('not both');
    await expect(runAction({ action: aiUpdateCollection, propsValue: { brandId: '42', collectionId: '9', maxRepublish: -1 } })).rejects.toThrow('whole number');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('add_collection_channel sends a numeric channelId', async () => {
    fetchMock.mockResolvedValueOnce(ok({ data: { collectionId: 9, channelId: 5 } }));
    await runAction({ action: aiAddCollectionChannel, propsValue: { brandId: '42', collectionId: '9', channelId: '5' } });
    const request = requestOf({ fetchMock, call: 0 });
    expect(request.path).toBe('/api/public/v1/brands/42/collections/9/channels');
    expect(request.body).toEqual({ channelId: 5 });
  });

  it('remove_collection_channel deletes by path', async () => {
    fetchMock.mockResolvedValueOnce(ok({ data: { collectionId: 9, channelId: 5 } }));
    await runAction({ action: aiRemoveCollectionChannel, propsValue: { brandId: '42', collectionId: '9', channelId: '5' } });
    const request = requestOf({ fetchMock, call: 0 });
    expect(request.method).toBe('DELETE');
    expect(request.path).toBe('/api/public/v1/brands/42/collections/9/channels/5');
  });

  it('add_collection_queue_slot sends a brand-local slot without conversion', async () => {
    fetchMock.mockResolvedValueOnce(ok({ data: { id: 910, day: 'TUE', time: '09:00', date: 'TUE 09:00', status: 'PENDING' }, status: 201 }));
    await runAction({ action: aiAddCollectionQueueSlot, propsValue: { brandId: '42', collectionId: '9', slot: 'TUE 09:00' } });
    expect(requestOf({ fetchMock, call: 0 }).body).toEqual({ date: 'Tue 09:00' });
    await expect(runAction({ action: aiAddCollectionQueueSlot, propsValue: { brandId: '42', collectionId: '9', slot: 'Tue 24:00' } })).rejects.toThrow('like "Tue 09:00"');
  });

  it('delete_collection_queue_slot deletes by path', async () => {
    fetchMock.mockResolvedValueOnce(ok({ data: { collectionId: 9, queueId: 910 } }));
    await runAction({ action: aiDeleteCollectionQueueSlot, propsValue: { brandId: '42', collectionId: '9', queueId: '910' } });
    const request = requestOf({ fetchMock, call: 0 });
    expect(request.method).toBe('DELETE');
    expect(request.path).toBe('/api/public/v1/brands/42/collections/9/queues/910');
  });
});

describe('automations', () => {
  const base = { brandId: '42', collectionId: '9', name: 'Blog', type: 'rss', feedUrl: 'https://example.com/feed.xml', importAsType: 'LINK' };

  it('create_automation defaults to drafts and no back-fill, always sending both', async () => {
    fetchMock.mockResolvedValueOnce(ok({ data: { id: 315 }, status: 201 }));
    await runAction({ action: aiCreateAutomation, propsValue: base });
    expect(requestOf({ fetchMock, call: 0 }).body).toEqual({
      name: 'Blog',
      collectionId: 9,
      type: 'RSS',
      feedUrl: 'https://example.com/feed.xml',
      importAsType: 'LINK',
      addPostsAsDraft: true,
      loadOldPosts: false,
    });
  });

  it('create_automation refuses a back-fill straight into the queue and bad refresh rates', async () => {
    await expect(runAction({ action: aiCreateAutomation, propsValue: { ...base, loadOldPosts: true, addPostsAsDraft: false } })).rejects.toThrow('only allowed with Add Posts as Drafts');
    await expect(runAction({ action: aiCreateAutomation, propsValue: { ...base, refreshRate: 3 } })).rejects.toThrow('1, 6, 12 or 24');
    await expect(runAction({ action: aiCreateAutomation, propsValue: { ...base, feedUrl: 'ftp://x' } })).rejects.toThrow('http(s) URL');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('update_automation_status patches the status', async () => {
    fetchMock.mockResolvedValueOnce(ok({ data: { id: 315, name: 'Blog', status: 'INACTIVE' } }));
    const result = await runAction({ action: aiUpdateAutomationStatus, propsValue: { brandId: '42', automationId: '315', status: 'PAUSED' } });
    expect(result).toEqual({ id: 315, name: 'Blog', status: 'INACTIVE' });
    const request = requestOf({ fetchMock, call: 0 });
    expect(request.method).toBe('PATCH');
    expect(request.path).toBe('/api/public/v1/brands/42/automations/315');
    expect(request.body).toEqual({ status: 'PAUSED' });
    await expect(runAction({ action: aiUpdateAutomationStatus, propsValue: { brandId: '42', automationId: '315', status: 'INACTIVE' } })).rejects.toThrow('Status must be one of');
  });
});

describe('move_posts', () => {
  it('normalizes and deduplicates post IDs', async () => {
    fetchMock.mockResolvedValueOnce(ok({ data: { moved: 2, sourceCollectionId: 1, destinationCollectionId: 2, message: 'Post(s) moved successfully' } }));
    await runAction({ action: aiMovePosts, propsValue: { brandId: '42', sourceCollectionId: '1', destinationCollectionId: 2, postIds: ['10', 10, ' 11 '] } });
    const request = requestOf({ fetchMock, call: 0 });
    expect(request.method).toBe('PATCH');
    expect(request.path).toBe('/api/public/v1/brands/42/posts/move');
    expect(request.body).toEqual({ sourceCollectionId: 1, destinationCollectionId: 2, postIds: [10, 11] });
  });

  it('refuses same source and destination, empty and oversize lists', async () => {
    await expect(runAction({ action: aiMovePosts, propsValue: { brandId: '42', sourceCollectionId: '1', destinationCollectionId: ' 1', postIds: [1] } })).rejects.toThrow('must be different');
    await expect(runAction({ action: aiMovePosts, propsValue: { brandId: '42', sourceCollectionId: '1', destinationCollectionId: '2', postIds: [] } })).rejects.toThrow('at least one');
    const many = Array.from({ length: 101 }, (_, index) => index + 1);
    await expect(runAction({ action: aiMovePosts, propsValue: { brandId: '42', sourceCollectionId: '1', destinationCollectionId: '2', postIds: many } })).rejects.toThrow('at most 100');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('twins send the identical request as the human actions', () => {
  it('create post', async () => {
    fetchMock.mockImplementation(async () => ok({ data: { id: 8801, message: 'Post created successfully' }, status: 201 }));
    const shared = { caption: 'Hello', media: ['https://cdn.example.com/a.jpg', 'abc.jpg'], firstComment: 'c', firstCommentDelaySeconds: 30, youtubeTags: ['t'] };
    const human = await runAction({ action: createCollectionPost, propsValue: { brand: 42, collection: 77, ...shared } });
    const ai = await runAction({ action: aiCreatePost, propsValue: { brandId: '42', collectionId: '77', ...shared } });
    expect(ai).toEqual(human);
    expect(requestOf({ fetchMock, call: 1 }).url).toBe(requestOf({ fetchMock, call: 0 }).url);
    expect(requestOf({ fetchMock, call: 1 }).body).toEqual(requestOf({ fetchMock, call: 0 }).body);
    expect(requestOf({ fetchMock, call: 0 }).body).toMatchObject({ publishMode: 'DRAFT' });
  });

  it('update, delete, list, published, upload', async () => {
    const pairs: Array<[{ run: (context: never) => Promise<unknown> }, Record<string, unknown>, { run: (context: never) => Promise<unknown> }, Record<string, unknown>, unknown]> = [
      [updatePost, { brand: 42, postId: '8801', publishMode: 'DRAFT' }, aiUpdatePost, { brandId: '42', postId: '8801', publishMode: 'DRAFT' }, ok({ data: POST })],
      [deletePost, { brand: 42, postId: '8801' }, aiDeletePost, { brandId: '42', postId: '8801' }, ok({ data: { id: 8801, message: 'deleted' } })],
      [listPosts, { brand: 42, collection: 77, view: 'DRAFT' }, aiListBrandPosts, { brandId: '42', collectionId: '77', view: 'DRAFT' }, jsonResponse({ body: listBody({ data: [POST] }) })],
      [listPublishedPosts, { brand: 42, status: 'FAILED', postId: '8801' }, aiListPublishedPosts, { brandId: '42', status: 'FAILED', postId: '8801' }, jsonResponse({ body: listBody({ data: [] }) })],
    ];
    for (const [human, humanProps, ai, aiProps, response] of pairs) {
      fetchMock.mockReset();
      fetchMock.mockResolvedValueOnce(response).mockResolvedValueOnce(response instanceof Response ? response.clone() : response);
      const first = await runAction({ action: human, propsValue: humanProps });
      const second = await runAction({ action: ai, propsValue: aiProps });
      expect(second).toEqual(first);
      const [a, b] = [requestOf({ fetchMock, call: 0 }), requestOf({ fetchMock, call: 1 })];
      expect(b.url).toBe(a.url);
      expect(b.method).toBe(a.method);
      expect(b.body).toEqual(a.body);
    }
  });

  it('upload', async () => {
    const file = { filename: 'a.jpg', extension: 'jpg', data: Buffer.from('img') };
    fetchMock.mockResolvedValueOnce(ok({ data: { id: 'x.jpg', type: 'image/jpeg', size: 3 }, status: 201 })).mockResolvedValueOnce(ok({ data: { id: 'x.jpg', type: 'image/jpeg', size: 3 }, status: 201 }));
    const human = await runAction({ action: uploadMedia, propsValue: { brand: 42, file } });
    const ai = await runAction({ action: aiUploadFile, propsValue: { brandId: '42', file } });
    expect(ai).toEqual(human);
    expect(requestOf({ fetchMock, call: 1 }).url).toBe(`${BASE}/brands/42/media`);
    await expect(runAction({ action: aiUploadFile, propsValue: { brandId: '42', file: { filename: 'a.gif', data: Buffer.from('x') } } })).rejects.toThrow('not one of them');
  });
});

describe('twin supersets', () => {
  it('create post with a poll and no caption', async () => {
    fetchMock.mockResolvedValueOnce(ok({ data: { id: 1 }, status: 201 }));
    await runAction({ action: aiCreatePost, propsValue: { brandId: '42', collectionId: '77', pollQuestion: 'Q?', pollOptions: ['A', 'B'], pollPeriod: '3d', pollCorrectOptionIndex: 1 } });
    expect(requestOf({ fetchMock, call: 0 }).body).toEqual({ poll: { question: 'Q?', options: ['A', 'B'], period: '3d', correctOptionIndex: 1 }, publishMode: 'DRAFT' });
  });

  it('create post with caption and poll together', async () => {
    fetchMock.mockResolvedValueOnce(ok({ data: { id: 1 }, status: 201 }));
    await runAction({ action: aiCreatePost, propsValue: { brandId: '42', collectionId: '77', caption: 'Vote', pollQuestion: 'Q?', pollOptions: ['A', 'B'], pollPeriod: '1d' } });
    expect(requestOf({ fetchMock, call: 0 }).body).toMatchObject({ caption: 'Vote', poll: { question: 'Q?' } });
  });

  it('create post rejects neither, an incomplete poll and an out-of-range answer', async () => {
    await expect(runAction({ action: aiCreatePost, propsValue: { brandId: '42', collectionId: '77' } })).rejects.toThrow('Caption is required');
    await expect(runAction({ action: aiCreatePost, propsValue: { brandId: '42', collectionId: '77', caption: 'x', pollQuestion: 'Q?' } })).rejects.toThrow('A poll needs');
    await expect(
      runAction({ action: aiCreatePost, propsValue: { brandId: '42', collectionId: '77', pollQuestion: 'Q?', pollOptions: ['A', 'B'], pollPeriod: '1d', pollCorrectOptionIndex: 2 } })
    ).rejects.toThrow('from 0 to 1');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('the human create action has no poll path', async () => {
    await expect(runAction({ action: createCollectionPost, propsValue: { brand: 42, collection: 77, pollQuestion: 'Q?' } })).rejects.toThrow('Caption is required');
  });

  it('create post rejects a scheduled time without an offset, in both shapes', async () => {
    await expect(runAction({ action: aiCreatePost, propsValue: { brandId: '42', collectionId: '77', caption: 'x', publishMode: 'SCHEDULE', scheduledAt: '2030-10-12 09:00:00' } })).rejects.toThrow(
      'with an offset'
    );
    await expect(runAction({ action: createCollectionPost, propsValue: { brand: 42, collection: 77, caption: 'x', publishMode: 'SCHEDULE', scheduledAt: '2030-10-12T09:00:00' } })).rejects.toThrow(
      'with an offset'
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('create post converts an offset time to brand-local', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: listBody({ data: [{ ...BRAND, timezone: 'Asia/Amman' }] }) })).mockResolvedValueOnce(ok({ data: { id: 1 }, status: 201 }));
    const result = await runAction({ action: aiCreatePost, propsValue: { brandId: '42', collectionId: '77', caption: 'x', publishMode: 'SCHEDULE', scheduledAt: '2030-10-12T06:00:00Z' } });
    expect(requestOf({ fetchMock, call: 1 }).body).toMatchObject({ scheduledAt: '2030-10-12 09:00:00', publishMode: 'SCHEDULE' });
    expect(result).toMatchObject({ scheduledAt: '2030-10-12 09:00:00', brandTimezone: 'Asia/Amman' });
  });

  it('list brand posts sends status and posting type', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: listBody({ data: [] }) }));
    await runAction({ action: aiListBrandPosts, propsValue: { brandId: '42', status: 'pending', postingType: 'QUEUE' } });
    expect(requestOf({ fetchMock, call: 0 }).query).toMatchObject({ status: 'PENDING', posting_type: 'QUEUE' });
  });

  it('list published posts sends post type and checks query IDs', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: listBody({ data: [] }) }));
    await runAction({ action: aiListPublishedPosts, propsValue: { brandId: '42', postType: ' IMAGE ', channelId: '5' } });
    expect(requestOf({ fetchMock, call: 0 }).query).toMatchObject({ post_type: 'IMAGE', channel_id: '5' });
    await expect(runAction({ action: aiListPublishedPosts, propsValue: { brandId: '42', channelId: 'x' } })).rejects.toThrow('numeric Nuelink ID');
  });
});
