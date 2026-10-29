import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPost } from '../src/lib/actions/create-post';
import { createCollectionPost } from '../src/lib/actions/create-collection-post';
import { updatePost } from '../src/lib/actions/update-post';
import { deletePost } from '../src/lib/actions/delete-post';
import { listPosts } from '../src/lib/actions/list-posts';
import { listPublishedPosts } from '../src/lib/actions/list-published-posts';
import { uploadMedia } from '../src/lib/actions/upload-media';
import { aiListBrands } from '../src/lib/actions/ai/list-brands';
import { aiListCollections } from '../src/lib/actions/ai/list-collections';
import { BRAND, POST, apiKeyAuth, installFetch, jsonResponse, legacyAuth, listBody, publishedPost, requestOf, runAction } from './helpers';

let fetchMock: ReturnType<typeof installFetch>;
const BASE = 'https://app.nuelink.com/api/public/v1';

beforeEach(() => {
  fetchMock = installFetch();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Create Post (legacy, automation token)', () => {
  it('sends the same five fields to the legacy endpoint and returns the body unchanged', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { status: 'success', post: 1 } }));
    const result = await runAction({
      action: createPost,
      auth: legacyAuth(),
      propsValue: { body: 'Hello', media: '  https://cdn.example.com/a.jpg  ', title: 'T', altText: 'A', shareToFeed: true, postAsShort: false },
    });
    expect(result).toEqual({ status: 'success', post: 1 });
    const request = requestOf({ fetchMock, call: 0 });
    expect(request.url).toBe('https://nuelink.com/api/v1/pabbly');
    expect(request.method).toBe('POST');
    expect(request.headers['authorization']).toBe('Bearer tok_legacy');
    expect(request.body).toEqual({ body: 'Hello', media: 'https://cdn.example.com/a.jpg', title: 'T', altText: 'A', shareToFeed: true, postAsShort: false });
    expect(request.dispatcher).toBeDefined();
  });

  it('omits a blank media URL', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { status: 'success' } }));
    await runAction({ action: createPost, auth: legacyAuth(), propsValue: { body: 'Hello', media: '   ', shareToFeed: false, postAsShort: false } });
    expect(requestOf({ fetchMock, call: 0 }).body).toEqual({ body: 'Hello', shareToFeed: false, postAsShort: false });
  });

  it('maps a 401 to a token message', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 401, body: { status: 'error', errors: { token: 'Invalid token' } } }));
    await expect(runAction({ action: createPost, auth: legacyAuth(), propsValue: { body: 'Hello' } })).rejects.toThrow(
      'Nuelink did not accept the connection (401): token: Invalid token. Copy the automation token again'
    );
  });

  it('refuses an API key connection before any request', async () => {
    await expect(runAction({ action: createPost, auth: apiKeyAuth(), propsValue: { body: 'Hello' } })).rejects.toThrow('use Create Post in Collection');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('new actions refuse the legacy token', () => {
  it.each([
    ['create', createCollectionPost, { brand: 42, collection: 77, caption: 'x' }],
    ['list', listPosts, { brand: 42 }],
    ['brands', aiListBrands, {}],
  ])('%s', async (_name, action, propsValue) => {
    await expect(runAction({ action, auth: legacyAuth(), propsValue })).rejects.toThrow('needs a Nuelink API Key connection');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('Create Post in Collection', () => {
  it('returns brand and collection IDs as exact strings', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 201, body: { status: 'success', data: { id: 1, message: 'Post created successfully' } } }));
    const result = await runAction({ action: createCollectionPost, propsValue: { brand: '9007199254740993', collection: '9007199254740995', caption: 'Hi' } });
    expect(result).toMatchObject({ brandId: '9007199254740993', collectionId: '9007199254740995' });
    expect(requestOf({ fetchMock, call: 0 }).url).toBe(`${BASE}/brands/9007199254740993/collections/9007199254740995/posts`);
  });

  it('defaults to DRAFT and sends only what was set', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 201, body: { status: 'success', data: { id: 8801, message: 'Post created successfully' } } }));
    const result = await runAction({ action: createCollectionPost, propsValue: { brand: 42, collection: '77', caption: 'Hello world', postAsStory: false } });
    expect(result).toEqual({
      id: 8801,
      message: 'Post created successfully',
      brandId: '42',
      collectionId: '77',
      publishMode: 'DRAFT',
      scheduledAt: null,
      scheduledAtUtc: null,
      brandTimezone: null,
    });
    const request = requestOf({ fetchMock, call: 0 });
    expect(request.url).toBe(`${BASE}/brands/42/collections/77/posts`);
    expect(request.method).toBe('POST');
    expect(request.headers['content-type']).toBe('application/json');
    expect(request.body).toEqual({ caption: 'Hello world', publishMode: 'DRAFT' });
  });

  it('splits media into URLs and IDs and maps every option', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 201, body: { status: 'success', data: { id: 1, message: 'Post created successfully' } } }));
    await runAction({
      action: createCollectionPost,
      propsValue: {
        brand: 42,
        collection: 77,
        publishMode: 'QUEUE',
        caption: 'Hi',
        title: 'Launch',
        media: ['https://cdn.example.com/a.jpg', ' 9b8c7d6e5f4a.jpg ', ''],
        alt: 'Alt',
        link: 'https://example.com/p',
        postAsStory: true,
        autoThreadText: true,
        firstComment: 'More on our site',
        firstCommentDelaySeconds: '10',
        instagramShareToFeed: true,
        instagramCollab: 'partner',
        tiktokAutoAddMusic: true,
        youtubeTags: ['product', 'launch'],
      },
    });
    expect(requestOf({ fetchMock, call: 0 }).body).toEqual({
      caption: 'Hi',
      publishMode: 'QUEUE',
      title: 'Launch',
      alt: 'Alt',
      link: 'https://example.com/p',
      media: [{ url: 'https://cdn.example.com/a.jpg' }, { id: '9b8c7d6e5f4a.jpg' }],
      postAsStory: true,
      autoThreadText: true,
      comment: { comment: 'More on our site', delay: 10 },
      platforms: { instagram: { shareToFeed: true, collab: 'partner' }, tiktok: { autoAddMusic: true }, youtube: { tags: ['product', 'launch'] } },
    });
  });

  it('converts Scheduled Time to the brand timezone', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-07-01T00:00:00Z'));
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ body: listBody({ data: [{ ...BRAND, id: 7, timezone: 'UTC' }], currentPage: 1, lastPage: 2 }) }))
      .mockResolvedValueOnce(jsonResponse({ body: listBody({ data: [BRAND], currentPage: 2, lastPage: 2 }) }))
      .mockResolvedValueOnce(jsonResponse({ status: 201, body: { status: 'success', data: { id: 5, message: 'Post created successfully' } } }));
    const result = await runAction({
      action: createCollectionPost,
      propsValue: { brand: 42, collection: 77, publishMode: 'SCHEDULE', scheduledAt: '2026-07-02T08:00:00.000Z', caption: 'Hi' },
    });
    expect(requestOf({ fetchMock, call: 0 }).url).toBe(`${BASE}/brands?page=1&per_page=100`);
    expect(requestOf({ fetchMock, call: 1 }).url).toBe(`${BASE}/brands?page=2&per_page=100`);
    expect(requestOf({ fetchMock, call: 2 }).body).toEqual({ caption: 'Hi', publishMode: 'SCHEDULE', scheduledAt: '2026-07-02 09:00:00' });
    expect(result).toMatchObject({ publishMode: 'SCHEDULE', scheduledAt: '2026-07-02 09:00:00', scheduledAtUtc: '2026-07-02T08:00:00.000Z', brandTimezone: 'Europe/London' });
  });

  it('fails clearly when the brand has no timezone', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: listBody({ data: [{ ...BRAND, timezone: null }] }) }));
    await expect(
      runAction({ action: createCollectionPost, propsValue: { brand: 42, collection: 77, publishMode: 'SCHEDULE', scheduledAt: '2099-01-01T09:00:00Z', caption: 'Hi' } })
    ).rejects.toThrow('has no timezone set');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    [{ publishMode: 'SCHEDULE' }, 'set Scheduled Time'],
    [{ publishMode: 'DRAFT', scheduledAt: '2099-01-01T09:00:00Z' }, 'only used when Publish Mode is Schedule'],
    [{ publishMode: 'SCHEDULE', scheduledAt: '2000-01-01T09:00:00Z' }, 'at least 10 minutes in the future'],
    [{ publishMode: 'LATER' }, 'Publish Mode must be one of'],
    [{ caption: '   ' }, 'Caption is required'],
    [{ caption: 'x'.repeat(3001) }, 'at most 3000'],
    [{ media: Array.from({ length: 11 }, (_, i) => `https://cdn.example.com/${i}.jpg`) }, 'at most 10'],
    [{ media: ['ftp://cdn.example.com/a.jpg'] }, 'neither an http(s) URL nor a Nuelink media ID'],
    [{ link: 'javascript:alert(1)' }, 'Link must be a full http(s) URL'],
    [{ firstComment: 'hi' }, 'Set First Comment and First Comment Delay together'],
    [{ firstCommentDelaySeconds: 5 }, 'Set First Comment and First Comment Delay together'],
    [{ firstComment: 'hi', firstCommentDelaySeconds: -1 }, 'whole number from 0'],
    [{ brand: '42/../1' }, 'Brand must be a numeric Nuelink ID'],
  ])('rejects %j before any request', async (overrides, message) => {
    await expect(runAction({ action: createCollectionPost, propsValue: { brand: 42, collection: 77, caption: 'Hi', ...overrides } })).rejects.toThrow(message);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not retry a create that timed out and says to check first', async () => {
    fetchMock.mockImplementation(async () => {
      throw new DOMException('aborted', 'AbortError');
    });
    await expect(runAction({ action: createCollectionPost, propsValue: { brand: 42, collection: 77, caption: 'Hi' } })).rejects.toThrow(
      'did not answer within 120 seconds. The post may still have been created'
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('surfaces the vendor message when Nuelink cannot download media', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ status: 400, body: { status: 'error', message: 'Failed to download media from url: https://cdn.example.com/missing.jpg', errors: { media: 'Failed to download media from url: https://cdn.example.com/missing.jpg' } } })
    );
    await expect(runAction({ action: createCollectionPost, propsValue: { brand: 42, collection: 77, caption: 'Hi', media: ['https://cdn.example.com/missing.jpg'] } })).rejects.toThrow(
      'Nuelink rejected the request (400): media: Failed to download media'
    );
  });
});

describe('Update Post', () => {
  it('reschedules in brand time and returns the updated post', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-01T00:00:00Z'));
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ body: listBody({ data: [BRAND] }) }))
      .mockResolvedValueOnce(jsonResponse({ body: { status: 'success', data: POST } }));
    const result = await runAction({ action: updatePost, propsValue: { brand: 42, postId: '8801', publishMode: 'SCHEDULE', scheduledAt: '2026-10-12T08:00:00Z' } });
    expect(result).toEqual(POST);
    const request = requestOf({ fetchMock, call: 1 });
    expect(request.url).toBe(`${BASE}/brands/42/posts/8801`);
    expect(request.method).toBe('PATCH');
    expect(request.body).toEqual({ publishMode: 'SCHEDULE', scheduledAt: '2026-10-12 09:00:00' });
  });

  it('sends only the fields that were set', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { status: 'success', data: POST } }));
    await runAction({ action: updatePost, propsValue: { brand: 42, postId: 8801, caption: 'New text', queuePosition: 'FRONT' } });
    expect(requestOf({ fetchMock, call: 0 }).body).toEqual({ caption: 'New text', queuePosition: 'FRONT' });
  });

  it.each([
    [{}, 'Nothing to update'],
    [{ caption: '' }, 'Nothing to update'],
    [{ publishMode: 'SCHEDULE' }, 'set Scheduled Time'],
    [{ publishMode: 'QUEUE', scheduledAt: '2099-01-01T00:00:00Z' }, 'only used when New Publish Mode is Schedule'],
    [{ publishMode: 'DRAFT', queuePosition: 'FRONT' }, 'Queue Position only works'],
    [{ postId: '8801?x=1', caption: 'x' }, 'Post ID must be a numeric'],
  ])('rejects %j before any request', async (overrides, message) => {
    await expect(runAction({ action: updatePost, propsValue: { brand: 42, postId: '8801', ...overrides } })).rejects.toThrow(message);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('explains a 409 on a published post', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ status: 409, body: { status: 'error', message: 'Only draft, queued or scheduled posts can be edited', errors: { post_id: 'Only draft, queued or scheduled posts can be edited' } } })
    );
    await expect(runAction({ action: updatePost, propsValue: { brand: 42, postId: 8801, caption: 'x' } })).rejects.toThrow('(409): post_id: Only draft');
  });
});

describe('Delete Post', () => {
  it('sends DELETE and returns id and message', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { status: 'success', data: { id: 8801, message: 'Post deleted successfully' } } }));
    const result = await runAction({ action: deletePost, propsValue: { brand: 42, postId: '8801' } });
    expect(result).toEqual({ id: 8801, message: 'Post deleted successfully' });
    expect(requestOf({ fetchMock, call: 0 })).toMatchObject({ url: `${BASE}/brands/42/posts/8801`, method: 'DELETE' });
  });

  it('names the sensitive-actions setting on 403', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        status: 403,
        body: { status: 'error', message: 'Deleting posts through the API is disabled.', errors: { permissions: 'Deleting posts through the API is disabled.' } },
      })
    );
    await expect(runAction({ action: deletePost, propsValue: { brand: 42, postId: 1 } })).rejects.toThrow('Allow AI to perform sensitive actions');
  });
});

describe('List Posts', () => {
  it('maps filters to the query, formats dates in UTC and returns one page with hasMore', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: listBody({ data: [POST], currentPage: 2, lastPage: 3, perPage: 10, total: 25 }) }));
    const result = await runAction({
      action: listPosts,
      propsValue: {
        brand: 42,
        collection: 77,
        view: 'DRAFT',
        postType: 'IMAGE',
        createdFrom: '2026-10-01T02:00:00+02:00',
        createdTo: '2026-10-31T23:59:59Z',
        sortBy: 'post_date',
        sortOrder: 'asc',
        page: 2,
        perPage: '10',
      },
    });
    expect(result).toEqual({ items: [POST], page: 2, perPage: 10, total: 25, lastPage: 3, hasMore: true });
    const request = requestOf({ fetchMock, call: 0 });
    expect(request.path).toBe('/api/public/v1/brands/42/posts');
    expect(request.query).toEqual({
      collection_id: '77',
      view: 'DRAFT',
      post_type: 'IMAGE',
      created_from: '2026-10-01 00:00:00',
      created_to: '2026-10-31 23:59:59',
      sort_by: 'post_date',
      sort_order: 'asc',
      page: '2',
      per_page: '10',
    });
  });

  it.each([
    [{ perPage: 101 }, 'Results per Page must be a whole number from 1 to 100'],
    [{ page: 0 }, 'Page must be a whole number'],
    [{ createdFrom: '2026-10-02T00:00:00Z', createdTo: '2026-10-01T00:00:00Z' }, 'Created To must not be earlier'],
  ])('rejects %j', async (overrides, message) => {
    await expect(runAction({ action: listPosts, propsValue: { brand: 42, ...overrides } })).rejects.toThrow(message);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('List Published Posts', () => {
  it('maps every filter', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: listBody({ data: [publishedPost({ id: 1 })] }) }));
    const result = await runAction({
      action: listPublishedPosts,
      propsValue: { brand: 42, status: 'FAILED', collection: 77, channel: 501, postId: '8801', search: ' launch ', publishedFrom: '2026-10-01', sortBy: 'likes', sortOrder: 'desc' },
    });
    expect(result).toMatchObject({ items: [publishedPost({ id: 1 })], hasMore: false });
    expect(requestOf({ fetchMock, call: 0 }).query).toEqual({
      status: 'FAILED',
      collection_id: '77',
      channel_id: '501',
      post_id: '8801',
      search: 'launch',
      published_from: '2026-10-01 00:00:00',
      sort_by: 'likes',
      sort_order: 'desc',
      page: '1',
      per_page: '25',
    });
  });
});

describe('Upload Media', () => {
  it('posts multipart field media with a 300 s budget', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 201, body: { status: 'success', data: { id: '9b8c.jpg', type: 'image/jpeg', size: 3 } } }));
    const result = await runAction({ action: uploadMedia, propsValue: { brand: 42, file: { filename: 'photo.JPG', extension: 'jpg', data: Buffer.from('abc') } } });
    expect(result).toEqual({ id: '9b8c.jpg', type: 'image/jpeg', size: 3 });
    const request = requestOf({ fetchMock, call: 0 });
    expect(request.url).toBe(`${BASE}/brands/42/media`);
    expect(request.headers['content-type']).toBeUndefined();
    expect(request.body).toBeInstanceOf(FormData);
    const body = request.body;
    if (!(body instanceof FormData)) {
      throw new Error('expected a FormData body');
    }
    const part = body.get('media');
    expect(part).toBeInstanceOf(File);
    expect(part).toMatchObject({ name: 'photo.JPG', type: 'image/jpeg' });
    const wire = new Request(request.url, { method: 'POST', body, headers: request.headers });
    expect(wire.headers.get('content-type')).toMatch(/^multipart\/form-data; boundary=/);
    expect(await wire.text()).toContain('name="media"; filename="photo.JPG"');
  });

  it.each([
    [{ filename: 'anim.gif', data: Buffer.from('x') }, 'Nuelink accepts JPG'],
    [{ filename: 'empty.png', data: Buffer.alloc(0) }, 'is empty'],
    [{ filename: 'big.mp4', data: Buffer.alloc(104_857_601) }, 'up to 100 MB'],
    [{ name: 'x' }, 'did not contain a readable file'],
  ])('rejects %#', async (file, message) => {
    await expect(runAction({ action: uploadMedia, propsValue: { brand: 42, file } })).rejects.toThrow(message);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('AI list atomics', () => {
  it('List Brands returns one page', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: listBody({ data: [BRAND] }) }));
    await expect(runAction({ action: aiListBrands, propsValue: { page: 1, perPage: 50 } })).resolves.toEqual({
      items: [BRAND],
      page: 1,
      perPage: 25,
      total: 1,
      lastPage: 1,
      hasMore: false,
    });
    expect(requestOf({ fetchMock, call: 0 }).url).toBe(`${BASE}/brands?page=1&per_page=50`);
  });

  it('List Collections takes a ShortText brand ID and guards it', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: listBody({ data: [] }) }));
    await runAction({ action: aiListCollections, propsValue: { brandId: ' 42 ' } });
    expect(requestOf({ fetchMock, call: 0 }).url).toBe(`${BASE}/brands/42/collections?page=1&per_page=25`);
    await expect(runAction({ action: aiListCollections, propsValue: { brandId: '42/../../auth' } })).rejects.toThrow('Brand ID must be a numeric');
  });
});
