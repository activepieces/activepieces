import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpRequest, httpClient } from '@activepieces/pieces-common';
import {
  AppConnectionType,
  AppConnectionValueForAuthProperty,
  createMockActionContext,
} from '@activepieces/pieces-framework';
import { dropboxAuth } from '../auth';
import { dropboxListAFolder } from './list-a-folder';

const AUTH: AppConnectionValueForAuthProperty<typeof dropboxAuth> = {
  type: AppConnectionType.OAUTH2,
  access_token: 'test-token',
  client_id: 'client',
  client_secret: 'secret',
  redirect_url: 'https://example.com',
  token_type: 'Bearer',
  claimed_at: 0,
  refresh_token: 'refresh',
  scope: '',
  token_url: 'https://api.dropboxapi.com/oauth2/token',
  data: {},
};

let requests: HttpRequest[] = [];
let pages: Page[] = [];

beforeEach(() => {
  requests = [];
  pages = [];
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
    requests.push(request);
    const body = pages.shift();
    if (!body) {
      throw new Error('Unexpected Dropbox request');
    }
    return { status: 200, headers: {}, body };
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('List Folder', () => {
  it('returns a single page as is when Dropbox has nothing more', async () => {
    pages = [page({ names: ['a', 'b'], cursor: 'c1', hasMore: false })];

    const result = await run({ path: '/Reports' });

    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe('https://api.dropboxapi.com/2/files/list_folder');
    expect(requests[0].body).toEqual({ path: '/Reports', recursive: false, limit: 2000 });
    expect(result).toEqual(page({ names: ['a', 'b'], cursor: 'c1', hasMore: false }));
  });

  it('follows the cursor across short pages until Dropbox reports no more', async () => {
    pages = [
      page({ names: ['a'], cursor: 'c1', hasMore: true }),
      page({ names: [], cursor: 'c2', hasMore: true }),
      page({ names: ['b', 'c'], cursor: 'c3', hasMore: false }),
    ];

    const result = await run({ path: '/Reports' });

    expect(requests.map((request) => request.url)).toEqual([
      'https://api.dropboxapi.com/2/files/list_folder',
      'https://api.dropboxapi.com/2/files/list_folder/continue',
      'https://api.dropboxapi.com/2/files/list_folder/continue',
    ]);
    expect(requests[1].body).toEqual({ cursor: 'c1' });
    expect(requests[2].body).toEqual({ cursor: 'c2' });
    expect(result).toEqual(page({ names: ['a', 'b', 'c'], cursor: 'c3', hasMore: false }));
  });

  it('stops once the limit is reached and keeps the cursor of the last page it read', async () => {
    pages = [
      page({ names: ['a', 'b'], cursor: 'c1', hasMore: true }),
      page({ names: ['c', 'd'], cursor: 'c2', hasMore: true }),
      page({ names: ['e'], cursor: 'c3', hasMore: false }),
    ];

    const result = await run({ path: '/Reports', limit: 3 });

    expect(requests).toHaveLength(2);
    expect(requests[0].body).toEqual({ path: '/Reports', recursive: false, limit: 3 });
    expect(result).toEqual(page({ names: ['a', 'b', 'c', 'd'], cursor: 'c2', hasMore: true }));
  });

  it('asks Dropbox for at most 2,000 entries per page even with a larger limit', async () => {
    pages = [page({ names: ['a'], cursor: 'c1', hasMore: false })];

    await run({ path: '/Reports', limit: 5000 });

    expect(requests[0].body).toEqual({ path: '/Reports', recursive: false, limit: 2000 });
  });

  it('sends the root as an empty path when the user types a slash', async () => {
    pages = [page({ names: [], cursor: 'c1', hasMore: false })];

    await run({ path: '/' });

    expect(requests[0].body).toEqual({ path: '', recursive: false, limit: 2000 });
  });
});

function run({ path, limit }: { path: string; limit?: number }): Promise<unknown> {
  return dropboxListAFolder.run({
    ...createMockActionContext<typeof dropboxListAFolder.props>({
      propsValue: { path, recursive: false, limit },
    }),
    auth: AUTH,
  });
}

function page({ names, cursor, hasMore }: { names: string[]; cursor: string; hasMore: boolean }): Page {
  return {
    entries: names.map((name) => ({ '.tag': 'file', name })),
    cursor,
    has_more: hasMore,
  };
}

type Page = {
  entries: { '.tag': string; name: string }[];
  cursor: string;
  has_more: boolean;
};
