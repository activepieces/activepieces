import { httpClient } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { DrupalAuthType, drupal } from '../src/lib/common/jsonapi';

describe('drupal.listEntities pagination limit', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('stops fetching pages once the limit is reached', async () => {
    const sendRequest = mockPages([
      pageResponse({ ids: ['uuid-1', 'uuid-2'], nextOffset: 2 }),
      pageResponse({ ids: ['uuid-3', 'uuid-4'], nextOffset: 4 }),
      pageResponse({ ids: ['uuid-5', 'uuid-6'] }),
    ]);

    const entities = await drupal.listEntities(buildAuth(), 'node', 'article', { limit: 3 });

    expect(idsOf(entities)).toEqual(['uuid-1', 'uuid-2', 'uuid-3']);
    expect(sendRequest).toHaveBeenCalledTimes(2);
  });

  test('trims an oversized final page down to the limit', async () => {
    const sendRequest = mockPages([
      pageResponse({ ids: ['uuid-1', 'uuid-2', 'uuid-3', 'uuid-4', 'uuid-5'], nextOffset: 5 }),
      pageResponse({ ids: ['uuid-6'] }),
    ]);

    const entities = await drupal.listEntities(buildAuth(), 'node', 'article', { limit: 3 });

    expect(idsOf(entities)).toEqual(['uuid-1', 'uuid-2', 'uuid-3']);
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  test('limit 0 follows every next link', async () => {
    const sendRequest = mockPages(threePages());

    const entities = await drupal.listEntities(buildAuth(), 'node', 'article', { limit: 0 });

    expect(idsOf(entities)).toEqual(['uuid-1', 'uuid-2', 'uuid-3', 'uuid-4', 'uuid-5']);
    expect(sendRequest).toHaveBeenCalledTimes(3);
  });

  test('no limit option follows every next link', async () => {
    const sendRequest = mockPages(threePages());

    const entities = await drupal.listEntities(buildAuth(), 'node', 'article');

    expect(idsOf(entities)).toEqual(['uuid-1', 'uuid-2', 'uuid-3', 'uuid-4', 'uuid-5']);
    expect(sendRequest).toHaveBeenCalledTimes(3);
  });

  test('the first request carries page[limit] when the limit is positive', async () => {
    const sendRequest = mockPages([pageResponse({ ids: ['uuid-1'] })]);

    await drupal.listEntities(buildAuth(), 'node', 'article', { limit: 3 });

    expect(decodeURIComponent(sendRequest.mock.calls[0][0].url)).toContain('page[limit]=3');
  });

  test('the first request omits page[limit] when the limit is 0', async () => {
    const sendRequest = mockPages([pageResponse({ ids: ['uuid-1'] })]);

    await drupal.listEntities(buildAuth(), 'node', 'article', { limit: 0 });

    expect(decodeURIComponent(sendRequest.mock.calls[0][0].url)).not.toContain('page[limit]');
  });
});

function buildAuth(): DrupalAuthType {
  return {
    type: AppConnectionType.CUSTOM_AUTH,
    props: {
      website_url: 'https://example.com',
      username: 'user',
      password: 'pass',
    },
  };
}

function idsOf(entities: unknown[]): unknown[] {
  return entities.map((entity) =>
    typeof entity === 'object' && entity !== null && 'id' in entity ? entity.id : undefined,
  );
}

function pageResponse({ ids, nextOffset }: { ids: string[]; nextOffset?: number }) {
  const data = ids.map((id) => ({
    type: 'node--article',
    id,
    attributes: { title: `Title ${id}` },
  }));
  const links =
    nextOffset === undefined
      ? undefined
      : { next: { href: `https://example.com/jsonapi/node/article?page[offset]=${nextOffset}` } };
  return {
    status: 200,
    headers: {},
    body: links ? { data, links } : { data },
  };
}

function threePages() {
  return [
    pageResponse({ ids: ['uuid-1', 'uuid-2'], nextOffset: 2 }),
    pageResponse({ ids: ['uuid-3', 'uuid-4'], nextOffset: 4 }),
    pageResponse({ ids: ['uuid-5'] }),
  ];
}

function mockPages(pages: ReturnType<typeof pageResponse>[]) {
  const sendRequest = vi.spyOn(httpClient, 'sendRequest');
  for (const page of pages) {
    sendRequest.mockResolvedValueOnce(page);
  }
  return sendRequest;
}
