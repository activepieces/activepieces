/// <reference types="vitest/globals" />

import jwt from 'jsonwebtoken';
import { ghostCreatePost } from '../src/lib/actions/ai/create-post';
import { ghostListPosts } from '../src/lib/actions/ai/list-posts';
import { ghostUpdatePage } from '../src/lib/actions/ai/update-page';
import { ghostUpdatePost } from '../src/lib/actions/ai/update-post';
import { ADMIN_URL, FIXTURE_KEY_ID, FIXTURE_KEY_SECRET, mockGhost, runAction } from './helpers';

const CURRENT = { id: 'p1', title: 'Old', updated_at: '2026-09-01T10:00:00.000Z' };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('requests', () => {
  test('signs a short-lived admin JWT with the key id and sends it to the admin API of the connection', async () => {
    const requests = mockGhost({ replies: [{ body: { posts: [], meta: { pagination: { page: 1, pages: 1, total: 0 } } } }] });
    await runAction({ action: ghostListPosts, propsValue: {} });
    expect(requests[0].url).toBe(`${ADMIN_URL}/posts`);
    const token = String(requests[0].headers?.['Authorization']).replace(/^Ghost /, '');
    const decoded = jwt.verify(token, Buffer.from(FIXTURE_KEY_SECRET, 'hex'), { audience: '/admin/', complete: true });
    expect(decoded.header.kid).toBe(FIXTURE_KEY_ID);
  });

  test('list posts sends paging defaults, includes tags and authors, and drops the body unless asked', async () => {
    const requests = mockGhost({
      replies: [
        {
          body: {
            posts: [{ id: 'p1', title: 'T', html: '<p>x</p>', lexical: '{}' }],
            meta: { pagination: { page: 1, limit: 15, pages: 3, total: 31, next: 2, prev: null } },
          },
        },
      ],
    });
    const result = await runAction({ action: ghostListPosts, propsValue: {} });
    expect(requests[0].method).toBe('GET');
    expect(requests[0].queryParams).toEqual({ limit: '15', page: '1', include: 'tags,authors' });
    expect(result).toEqual({ posts: [{ id: 'p1', title: 'T' }], page: 1, limit: 15, total_pages: 3, total: 31, next: 2, prev: null });
  });

  test('list posts asks for html only when Include Content is on', async () => {
    const requests = mockGhost({ replies: [{ body: { posts: [{ id: 'p1', html: '<p>x</p>' }], meta: {} } }] });
    const result = await runAction({ action: ghostListPosts, propsValue: { include_content: true, limit: 500 } });
    expect(requests[0].queryParams).toEqual({ limit: '100', page: '1', include: 'tags,authors', formats: 'html' });
    expect(result).toMatchObject({ posts: [{ id: 'p1', html: '<p>x</p>' }] });
  });

  test('create post wraps the body as a draft, marks the html source and turns tag names into objects', async () => {
    const requests = mockGhost({ replies: [{ body: { posts: [{ id: 'p1' }] } }] });
    await runAction({ action: ghostCreatePost, propsValue: { title: ' Hello ', html: '<p>x</p>', tags: ['news', ' '] } });
    expect(requests[0].method).toBe('POST');
    expect(requests[0].url).toBe(`${ADMIN_URL}/posts`);
    expect(requests[0].queryParams).toEqual({ formats: 'html', include: 'tags,authors', source: 'html' });
    expect(requests[0].body).toEqual({ posts: [{ title: 'Hello', html: '<p>x</p>', tags: [{ name: 'news' }], status: 'draft' }] });
  });
});

describe('updates have three states', () => {
  test('omitted fields are not sent and updated_at comes from a fresh read', async () => {
    const requests = mockGhost({ replies: [{ body: { posts: [CURRENT] } }, { body: { posts: [{ id: 'p1' }] } }] });
    await runAction({ action: ghostUpdatePost, propsValue: { post_id: 'p1', custom_excerpt: 'New excerpt' } });
    expect(requests.map((request) => request.method)).toEqual(['GET', 'PUT']);
    expect(requests[1].url).toBe(`${ADMIN_URL}/posts/p1`);
    expect(requests[1].body).toEqual({ posts: [{ custom_excerpt: 'New excerpt', updated_at: CURRENT.updated_at }] });
  });

  test('an explicit empty Tags list clears the tags', async () => {
    const requests = mockGhost({ replies: [{ body: { posts: [CURRENT] } }, { body: { posts: [{ id: 'p1' }] } }] });
    await runAction({ action: ghostUpdatePost, propsValue: { post_id: 'p1', tags: [] } });
    expect(requests[1].body).toEqual({ posts: [{ tags: [], updated_at: CURRENT.updated_at }] });
  });

  test('an empty Authors list is refused before any request, because Ghost needs one author', async () => {
    const requests = mockGhost({ replies: [] });
    await expect(runAction({ action: ghostUpdatePost, propsValue: { post_id: 'p1', authors: [] } })).rejects.toThrow(
      'Ghost requires at least one author'
    );
    expect(requests).toHaveLength(0);
  });

  test('Clear Fields sends null for the listed fields', async () => {
    const requests = mockGhost({ replies: [{ body: { posts: [CURRENT] } }, { body: { posts: [{ id: 'p1' }] } }] });
    await runAction({ action: ghostUpdatePost, propsValue: { post_id: 'p1', clear_fields: ['custom_excerpt', 'meta_title'] } });
    expect(requests[1].body).toEqual({
      posts: [{ custom_excerpt: null, meta_title: null, updated_at: CURRENT.updated_at }],
    });
  });

  test('a field that is both set and cleared is refused before any request', async () => {
    const requests = mockGhost({ replies: [] });
    await expect(
      runAction({ action: ghostUpdatePost, propsValue: { post_id: 'p1', meta_title: 'SEO', clear_fields: ['meta_title'] } })
    ).rejects.toThrow('both set to a new value and listed in Clear Fields');
    expect(requests).toHaveLength(0);
  });

  test('an update with nothing to change is refused before any request', async () => {
    const requests = mockGhost({ replies: [] });
    await expect(runAction({ action: ghostUpdatePost, propsValue: { post_id: 'p1' } })).rejects.toThrow(
      'Provide at least one field to change.'
    );
    expect(requests).toHaveLength(0);
  });

  test('scheduling a page requires a future publish time', async () => {
    const requests = mockGhost({ replies: [] });
    await expect(
      runAction({ action: ghostUpdatePage, propsValue: { page_id: 'g1', status: 'scheduled', published_at: '2020-01-01T00:00:00Z' } })
    ).rejects.toThrow('Published At must be in the future.');
    expect(requests).toHaveLength(0);
  });
});
