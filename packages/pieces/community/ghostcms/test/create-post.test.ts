/// <reference types="vitest/globals" />

import { createPost } from '../src/lib/actions/create-post';
import { mockGhost, runAction } from './helpers';

const BASE_PROPS = {
  title: 'Hello',
  html: '<p>x</p>',
  author: 'author-1',
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('scheduled date check', () => {
  test('a scheduled post without Published At is refused before any request', async () => {
    const requests = mockGhost({ replies: [] });
    await expect(
      runAction({ action: createPost, propsValue: { ...BASE_PROPS, status: 'scheduled' } })
    ).rejects.toThrow('Published At is required when Status is Scheduled.');
    expect(requests).toHaveLength(0);
  });

  test('a scheduled post with Published At sends it with the scheduled status', async () => {
    const publishedAt = '2099-01-01T10:00:00.000Z';
    const requests = mockGhost({ replies: [{ body: { posts: [{ id: 'p1' }] } }] });
    await runAction({ action: createPost, propsValue: { ...BASE_PROPS, status: 'scheduled', publishedAt } });
    expect(requests).toHaveLength(1);
    expect(requests[0].body).toMatchObject({ posts: [{ status: 'scheduled', published_at: publishedAt }] });
  });

  test('a draft without Published At is sent', async () => {
    const requests = mockGhost({ replies: [{ body: { posts: [{ id: 'p1' }] } }] });
    await runAction({ action: createPost, propsValue: { ...BASE_PROPS, status: 'draft' } });
    expect(requests).toHaveLength(1);
  });
});
