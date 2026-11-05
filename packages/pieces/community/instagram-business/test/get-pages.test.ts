import { afterEach, describe, expect, test, vi } from 'vitest';
import { instagramCommon } from '../src/lib/common';

function stubPages(respond: (after: string | null) => FakeBody): URL[] {
  const seen: URL[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      seen.push(url);
      return new Response(JSON.stringify(respond(url.searchParams.get('after'))), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    })
  );
  return seen;
}

function page(id: string): FakePage {
  return {
    id,
    name: `Page ${id}`,
    access_token: `token-${id}`,
    instagram_business_account: { id: `ig-${id}`, username: `user${id}` },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('instagram-business getPages', () => {
  test('requests /me/accounts with the username field and a page size of 100', async () => {
    const seen = stubPages(() => ({ data: [page('1')] }));
    await instagramCommon.getPages('TKN');
    expect(seen).toHaveLength(1);
    expect(`${seen[0].origin}${seen[0].pathname}`).toBe(
      'https://graph.facebook.com/v23.0/me/accounts'
    );
    expect(seen[0].searchParams.get('fields')).toBe(
      'id,name,access_token,instagram_business_account{id,username}'
    );
    expect(seen[0].searchParams.get('limit')).toBe('100');
    expect(seen[0].searchParams.has('after')).toBe(false);
  });

  test('follows the after cursor and combines every page in order', async () => {
    const seen = stubPages((after) => {
      if (after === null) {
        return {
          data: [page('1'), page('2')],
          paging: { cursors: { after: 'A' }, next: 'https://graph.facebook.com/next-a' },
        };
      }
      if (after === 'A') {
        return {
          data: [page('3')],
          paging: { cursors: { after: 'B' }, next: 'https://graph.facebook.com/next-b' },
        };
      }
      return { data: [page('4')], paging: { cursors: { after: 'C' } } };
    });
    const pages = await instagramCommon.getPages('TKN');
    expect(pages.map((p) => p.id)).toEqual(['1', '2', '3', '4']);
    expect(seen.map((u) => u.searchParams.get('after'))).toEqual([null, 'A', 'B']);
  });

  test('stops on the last page when paging.next is missing', async () => {
    const seen = stubPages(() => ({
      data: [page('1')],
      paging: { cursors: { after: 'A' } },
    }));
    const pages = await instagramCommon.getPages('TKN');
    expect(pages.map((p) => p.id)).toEqual(['1']);
    expect(seen).toHaveLength(1);
  });

  test('stops when Graph repeats the cursor it was given', async () => {
    const seen = stubPages(() => ({
      data: [page('1')],
      paging: { cursors: { after: 'A' }, next: 'https://graph.facebook.com/next-a' },
    }));
    const pages = await instagramCommon.getPages('TKN');
    expect(pages.map((p) => p.id)).toEqual(['1', '1']);
    expect(seen.map((u) => u.searchParams.get('after'))).toEqual([null, 'A']);
  });

  test('returns an empty list when Graph returns no data', async () => {
    stubPages(() => ({}));
    expect(await instagramCommon.getPages('TKN')).toEqual([]);
  });
});

type FakePage = {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account: { id: string; username: string };
};

type FakeBody = {
  data?: FakePage[];
  paging?: { cursors?: { after?: string }; next?: string };
};
