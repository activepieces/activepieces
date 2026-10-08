import { PropertyType } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { adjustNumberByIdAction } from '../src/lib/actions/ai/adjust-number-by-id';
import { findObjectsByIdAction } from '../src/lib/actions/ai/find-objects-by-id';
import { updateObjectByIdAction } from '../src/lib/actions/ai/update-object-by-id';
import { uploadFileByIdAction } from '../src/lib/actions/ai/upload-file-by-id';
import { deleteObjectAction } from '../src/lib/actions/delete-object';
import { saveBlogPostAction } from '../src/lib/actions/save-blog-post';
import { saveDateAction } from '../src/lib/actions/save-date';
import { saveGalleryAction } from '../src/lib/actions/save-gallery';
import { saveImageAction } from '../src/lib/actions/save-image';
import { saveTextAction } from '../src/lib/actions/save-text';
import { saveToggleAction } from '../src/lib/actions/save-toggle';
import { context, stubFetch } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

const file = { filename: 'photo.png', extension: 'png', data: Buffer.from('png-bytes'), base64: Buffer.from('png-bytes').toString('base64') };

describe('typed save actions', () => {
  test('save_text upserts with PUT', async () => {
    const seen = stubFetch(() => ({ body: { data: { id: 'headline', text: 'Hello' } } }));
    const result = await saveTextAction.run(context({ collection: 'text', object_id: 'headline', text: 'Hello' }));
    expect(seen[0].method).toBe('PUT');
    expect(seen[0].json).toEqual({ text: 'Hello', id: 'headline' });
    expect(result).toEqual({ collection: 'text', id: 'headline', text: 'Hello' });
  });

  test('save_toggle sends a boolean status', async () => {
    const seen = stubFetch(() => ({ body: { data: { id: 'banner', status: false } } }));
    await saveToggleAction.run(context({ collection: 'toggle', object_id: 'banner', status: false }));
    expect(seen[0].json).toEqual({ status: false, id: 'banner' });
  });

  test('save_date validates and normalises the date', async () => {
    const seen = stubFetch(() => ({ body: { data: { id: 'launch', date: '2026-12-31T18:00:00+00:00' } } }));
    await saveDateAction.run(context({ collection: 'date', object_id: 'launch', date: '2026-12-31T18:00:00Z' }));
    expect(seen[0].json).toEqual({ date: '2026-12-31T18:00:00.000Z', id: 'launch' });
    await expect(saveDateAction.run(context({ collection: 'date', object_id: 'launch', date: 'soon' }))).rejects.toThrow('not a valid date');
    expect(seen).toHaveLength(1);
  });
});

describe('save_blog_post', () => {
  test('updates only the given fields of an existing post', async () => {
    const seen = stubFetch((request) =>
      request.method === 'GET' ? { body: { data: { id: 'hello', title: 'Hello' } } } : { body: { data: { id: 'hello', title: 'Hello', summary: 'New' } } },
    );
    const result = await saveBlogPostAction.run(context({ collection: 'blog', post_id: 'hello', summary: 'New', categories: '', tags: undefined }));
    expect(seen.map((request) => request.method)).toEqual(['GET', 'PATCH']);
    expect(seen[1].json).toEqual({ summary: 'New' });
    expect(result).toMatchObject({ result: 'updated', collection: 'blog', id: 'hello' });
  });

  test('creates a new post with the given id, published by default', async () => {
    const seen = stubFetch((request) =>
      request.method === 'GET' ? { status: 404, body: { error: { message: 'Not Found' } } } : { body: { data: { id: 'new-post', title: 'New' } } },
    );
    const result = await saveBlogPostAction.run(
      context({ collection: 'blog', post_id: 'new-post', title: 'New', categories: 'News, Tech', featured: 'yes', draft: 'draft' }),
    );
    expect(seen[1].method).toBe('POST');
    expect(seen[1].path).toBe('/api/collections/blog');
    expect(seen[1].json).toEqual({ id: 'new-post', draft: true, title: 'New', categories: ['News', 'Tech'], featured: true });
    expect(result).toMatchObject({ result: 'created' });
  });

  test('requires a title to create', async () => {
    const seen = stubFetch(() => ({ status: 404, body: {} }));
    await expect(saveBlogPostAction.run(context({ collection: 'blog', post_id: 'x', summary: 's' }))).rejects.toThrow('Title is required');
    expect(seen.filter((request) => request.method !== 'GET')).toHaveLength(0);
  });

  test('without a post id it creates and lets Total CMS make the slug', async () => {
    const seen = stubFetch(() => ({ body: { data: { id: 'my-title', title: 'My Title' } } }));
    await saveBlogPostAction.run(context({ collection: 'blog', title: 'My Title' }));
    expect(seen).toHaveLength(1);
    expect(seen[0].json).toEqual({ draft: false, title: 'My Title' });
  });

  test('accepts categories and tags passed as a string expression', async () => {
    const seen = stubFetch(() => ({ body: { data: { id: 'my-title', title: 'My Title' } } }));
    await saveBlogPostAction.run(context({ collection: 'blog', title: 'My Title', categories: '["News","Tech"]', tags: 'a, b' }));
    expect(seen[0].json).toEqual({ draft: false, title: 'My Title', categories: ['News', 'Tech'], tags: ['a', 'b'] });
  });

  test('categories and tags are text inputs, so the engine accepts typed and mapped values', () => {
    expect(saveBlogPostAction.props.categories.type).toBe(PropertyType.SHORT_TEXT);
    expect(saveBlogPostAction.props.tags.type).toBe(PropertyType.SHORT_TEXT);
  });

  test('keeps commas inside list entries and splits only plain text', async () => {
    const seen = stubFetch(() => ({ body: { data: { id: 'my-title', title: 'My Title' } } }));
    await saveBlogPostAction.run(context({ collection: 'blog', title: 'My Title', categories: '["News, Events","Tech"]', tags: 'one,  two ,' }));
    await saveBlogPostAction.run(context({ collection: 'blog', title: 'My Title', categories: ['News, Events'] }));
    expect(seen[0].json).toEqual({ draft: false, title: 'My Title', categories: ['News, Events', 'Tech'], tags: ['one', 'two'] });
    expect(seen[1].json).toEqual({ draft: false, title: 'My Title', categories: ['News, Events'] });
  });
});

describe('uploads', () => {
  test('save_image sends multipart under the field name and saves alt text', async () => {
    const seen = stubFetch((request) =>
      request.method === 'POST'
        ? { body: { data: { id: 'hero', image: { name: 'photo.png', alt: '' } }, meta: { preview: '/imageworks/image/hero/image.png?w=600' } } }
        : { body: { data: { id: 'hero', image: { name: 'photo.png', alt: 'Sunset' } } } },
    );
    const result = await saveImageAction.run(context({ collection: 'image', object_id: 'hero', file, alt: 'Sunset' }));
    expect(seen[0].path).toBe('/api/collections/image/hero/image');
    expect(seen[0].headers.get('content-type')).toContain('multipart/form-data');
    expect(seen[0].text).toContain('name="image"; filename="photo.png"');
    expect(seen[1].method).toBe('PATCH');
    expect(seen[1].path).toBe('/api/collections/image/hero/image');
    expect(seen[1].json).toEqual({ alt: 'Sunset' });
    expect(result).toMatchObject({ preview_url: 'https://cms.example.com/imageworks/image/hero/image.png?w=600', warning: null });
  });

  test('save_gallery sets alt on the newly added image and reports alt failures as a warning', async () => {
    const seen = stubFetch((request) =>
      request.method === 'POST'
        ? { body: { data: { id: 'g', gallery: [{ name: 'old.png' }, { name: 'photo-2.png' }] } } }
        : { status: 500, body: { error: { message: 'disk full' } } },
    );
    const result = await saveGalleryAction.run(context({ collection: 'gallery', object_id: 'g', file, alt: 'Alt' }));
    expect(seen[1].path).toBe('/api/collections/gallery/g/gallery/photo-2.png');
    expect(result).toMatchObject({ id: 'g', warning: expect.stringContaining('disk full') });
  });

  test('upload by URL sends JSON and a depot folder targets the last folder segment', async () => {
    const seen = stubFetch(() => ({ body: { data: { id: 'docs', depot: { files: [] } } } }));
    await uploadFileByIdAction.run(
      context({ collection: 'depot', object_id: 'docs', field: 'depot', file_url: 'https://files.example.com/a.pdf', folder: '2026/reports' }),
    );
    expect(seen[0].path).toBe('/api/collections/depot/docs/depot/2026/reports');
    expect(seen[0].json).toEqual({ reports: 'https://files.example.com/a.pdf' });
  });

  test('refuses both a file and a URL, or neither, and folder traversal', async () => {
    const seen = stubFetch(() => ({ body: {} }));
    await expect(uploadFileByIdAction.run(context({ collection: 'c', object_id: 'o', field: 'f', file, file_url: 'https://x.io/a' }))).rejects.toThrow('not both');
    await expect(uploadFileByIdAction.run(context({ collection: 'c', object_id: 'o', field: 'f' }))).rejects.toThrow('Provide a file');
    await expect(uploadFileByIdAction.run(context({ collection: 'c', object_id: 'o', field: 'f', file_url: 'file:///etc/passwd' }))).rejects.toThrow('http');
    await expect(uploadFileByIdAction.run(context({ collection: 'c', object_id: 'o', field: 'f', file, folder: '../x' }))).rejects.toThrow('not valid');
    expect(seen).toHaveLength(0);
  });
});

describe('generic object actions', () => {
  test('find_objects_by_id validates limit and reports paging', async () => {
    const seen = stubFetch(() => ({ body: { data: [{ id: 'a' }, { id: 'b' }], meta: { pagination: { total: 5 } } } }));
    const result = await findObjectsByIdAction.run(context({ collection: 'blog', limit: 2, offset: 2, sort: '-created' }));
    expect(result).toMatchObject({ count: 2, total: 5, has_more: true, next_offset: 4 });
    await expect(findObjectsByIdAction.run(context({ collection: 'blog', limit: 500 }))).rejects.toThrow('from 1 to 100');
    expect(seen).toHaveLength(1);
  });

  test('update_object_by_id patches existing objects and refuses id changes', async () => {
    const seen = stubFetch((request) => (request.method === 'GET' ? { body: { data: { id: 'a' } } } : { body: { data: { id: 'a', title: 'T' } } }));
    const result = await updateObjectByIdAction.run(context({ collection: 'blog', object_id: 'a', fields: '{"title":"T","id":"a"}' }));
    expect(seen[1].method).toBe('PATCH');
    expect(seen[1].json).toEqual({ title: 'T' });
    expect(result).toEqual({ collection: 'blog', id: 'a', object: { id: 'a', title: 'T' } });
    await expect(updateObjectByIdAction.run(context({ collection: 'blog', object_id: 'a', fields: { id: 'b' } }))).rejects.toThrow('cannot be changed');
    await expect(updateObjectByIdAction.run(context({ collection: 'blog', object_id: 'a', fields: {} }))).rejects.toThrow('empty');
  });

  test('update_object_by_id fails clearly when the object is missing', async () => {
    const seen = stubFetch(() => ({ status: 404, body: { error: { message: 'Not Found' } } }));
    await expect(updateObjectByIdAction.run(context({ collection: 'blog', object_id: 'gone', fields: { title: 'x' } }))).rejects.toThrow('was not found');
    expect(seen.filter((request) => request.method === 'PATCH')).toHaveLength(0);
  });

  test('adjust_number_by_id calls increment with the amount and rejects non-positive amounts', async () => {
    const seen = stubFetch(() => ({ body: { property: 'views', value: 12 } }));
    const result = await adjustNumberByIdAction.run(context({ collection: 'stats', object_id: 'home', field: 'views', direction: 'increment', amount: 2 }));
    expect(seen[0].method).toBe('POST');
    expect(seen[0].path).toBe('/api/collections/stats/home/views/increment/2');
    expect(result).toEqual({ collection: 'stats', id: 'home', field: 'views', value: 12 });
    await expect(adjustNumberByIdAction.run(context({ collection: 'stats', object_id: 'home', field: 'views', direction: 'increment', amount: 0 }))).rejects.toThrow('greater than 0');
  });

  test('delete_object refuses a missing object and deletes an existing one', async () => {
    const seen = stubFetch((request) => (request.method === 'GET' ? { body: { data: { id: 'a' } } } : { body: { deleted: true } }));
    const result = await deleteObjectAction.run(context({ collection: 'blog', object_id: 'a' }));
    expect(seen.map((request) => request.method)).toEqual(['GET', 'DELETE']);
    expect(result).toEqual({ deleted: true, collection: 'blog', id: 'a' });
    stubFetch(() => ({ status: 404, body: {} }));
    await expect(deleteObjectAction.run(context({ collection: 'blog', object_id: 'a' }))).rejects.toThrow('not found');
  });
});
