import { afterEach, describe, expect, test, vi } from 'vitest';
import { newBlogPost } from '../src/lib/triggers/new-blog-post';
import { updatedObjectTrigger } from '../src/lib/triggers/updated-object';
import { context, contextWithStore, memoryStore, stubFetch } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

const schema = { data: { id: 'blog', properties: { created: {}, updated: {} }, index: ['id', 'created', 'updated'] } };

function site(objects: () => Record<string, unknown>[]) {
  return stubFetch((request) => {
    if (request.path.endsWith('/schema')) {
      return { body: schema };
    }
    if (request.path.endsWith('/query')) {
      const sortField = (request.query.get('sort') ?? '-created').replace('-', '');
      const sorted = [...objects()].sort((a, b) => String(b[sortField]).localeCompare(String(a[sortField])));
      const offset = Number(request.query.get('offset'));
      const limit = Number(request.query.get('limit'));
      return { body: { data: sorted.slice(offset, offset + limit), meta: { pagination: { total: sorted.length } } } };
    }
    const id = request.path.split('/').pop();
    const found = objects().find((object) => object['id'] === id);
    return found ? { body: { data: { ...found, content: 'full' } } } : { status: 404, body: {} };
  });
}

describe('new_blog_post', () => {
  test('emits each new post once, including one created in the same second as the checkpoint', async () => {
    let objects: Record<string, unknown>[] = [{ id: 'old', created: '2026-10-07T10:00:00+00:00', draft: false }];
    site(() => objects);
    const store = memoryStore();
    const ctx = contextWithStore({ propsValue: { collection: 'blog', include_drafts: false }, store });
    await newBlogPost.onEnable(ctx);
    expect(await newBlogPost.run(ctx)).toEqual([]);
    objects = [...objects, { id: 'a', created: '2026-10-07T10:05:00+00:00', draft: false }, { id: 'draft', created: '2026-10-07T10:05:00+00:00', draft: true }];
    const first = await newBlogPost.run(ctx);
    expect(first.map((post) => Reflect.get(Object(post), 'id'))).toEqual(['a']);
    expect(first[0]).toMatchObject({ collection: 'blog', content: 'full' });
    objects = [...objects, { id: 'b', created: '2026-10-07T10:05:00+00:00', draft: false }];
    expect((await newBlogPost.run(ctx)).map((post) => Reflect.get(Object(post), 'id'))).toEqual(['b']);
    expect(await newBlogPost.run(ctx)).toEqual([]);
  });

  test('pages back past 100 new items to the checkpoint', async () => {
    let objects: Record<string, unknown>[] = [{ id: 'old', created: '2026-01-01T00:00:00+00:00' }];
    const seen = site(() => objects);
    const ctx = context({ collection: 'blog', include_drafts: true });
    await newBlogPost.onEnable(ctx);
    objects = [...objects, ...Array.from({ length: 150 }, (_, i) => ({ id: `p${i}`, created: `2026-02-01T00:00:${String(i % 60).padStart(2, '0')}+00:00`, minute: i }))];
    objects = objects.map((object, i) => (i === 0 ? object : { ...object, created: new Date(Date.UTC(2026, 1, 1, 0, 0, i)).toISOString() }));
    const emitted = await newBlogPost.run(ctx);
    expect(emitted).toHaveLength(150);
    expect(seen.filter((request) => request.path.endsWith('/query')).length).toBeGreaterThanOrEqual(3);
  });

  test('enable records every existing post that shares the newest timestamp', async () => {
    let objects: Record<string, unknown>[] = [
      { id: 'older', created: '2026-10-07T09:00:00+00:00' },
      ...Array.from({ length: 250 }, (_, i) => ({ id: `same${i}`, created: '2026-10-07T10:00:00+00:00' })),
    ];
    const seen = site(() => objects);
    const ctx = context({ collection: 'blog', include_drafts: true });
    await newBlogPost.onEnable(ctx);
    expect(seen.filter((request) => request.path.endsWith('/query')).map((request) => request.query.get('offset'))).toEqual(['0', '100', '200']);
    expect(await newBlogPost.run(ctx)).toEqual([]);
    objects = [...objects, { id: 'fresh', created: '2026-10-07T10:00:00+00:00' }];
    expect((await newBlogPost.run(ctx)).map((post) => Reflect.get(Object(post), 'id'))).toEqual(['fresh']);
  });

  test('a collection without a created field fails clearly', async () => {
    stubFetch((request) => (request.path.endsWith('/schema') ? { body: { data: { properties: { text: {} }, index: ['id', 'text'] } } } : { body: { data: [] } }));
    await expect(newBlogPost.onEnable(context({ collection: 'text' }))).rejects.toThrow('does not record a "created" date');
  });
});

describe('updated_object', () => {
  test('skips new objects by default and reports later changes', async () => {
    let objects: Record<string, unknown>[] = [{ id: 'a', created: '2026-10-07T10:00:00+00:00', updated: '2026-10-07T10:00:00+00:00' }];
    site(() => objects);
    const ctx = context({ collection: 'blog', include_new: false });
    await updatedObjectTrigger.onEnable(ctx);
    objects = [...objects, { id: 'b', created: '2026-10-07T11:00:00+00:00', updated: '2026-10-07T11:00:00+00:00' }];
    expect(await updatedObjectTrigger.run(ctx)).toEqual([]);
    objects = objects.map((object) => (object['id'] === 'a' ? { ...object, updated: '2026-10-07T12:00:00+00:00' } : object));
    expect((await updatedObjectTrigger.run(ctx)).map((object) => Reflect.get(Object(object), 'id'))).toEqual(['a']);
    expect(await updatedObjectTrigger.run(ctx)).toEqual([]);
  });
});
