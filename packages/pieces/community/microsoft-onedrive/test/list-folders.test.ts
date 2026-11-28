/// <reference types="vitest/globals" />

import { createMockActionContext } from '@activepieces/pieces-framework';
import { listFolders } from '../src/lib/actions/list-folders';

const { sendRequest } = vi.hoisted(() => ({
  sendRequest: vi.fn(),
}));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    httpClient: { sendRequest },
  };
});

type ListFoldersContext = Parameters<typeof listFolders.run>[0];

function buildContext(parentFolder: string): ListFoldersContext {
  const base = createMockActionContext({
    propsValue: {
      parentFolder,
      markdown: undefined,
    },
  });
  return {
    ...base,
    auth: { access_token: 'test-token', props: {} },
  } as unknown as ListFoldersContext;
}

describe('OneDrive list folders', () => {
  beforeEach(() => {
    sendRequest.mockReset();
  });

  test('follows @odata.nextLink across pages', async () => {
    const nextLink = 'https://graph.microsoft.com/next';
    sendRequest
      .mockResolvedValueOnce({ body: { value: [{ id: 'a' }], '@odata.nextLink': nextLink } })
      .mockResolvedValueOnce({ body: { value: [{ id: 'b' }] } });

    const result = await listFolders.run(buildContext('root'));

    expect(result).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(sendRequest).toHaveBeenCalledTimes(2);
    const firstUrl: string = sendRequest.mock.calls[0][0].url;
    expect(firstUrl).toContain('/items/root/children');
    expect(firstUrl).toContain('folder ne null');
    expect(sendRequest.mock.calls[1][0].url).toBe(nextLink);
  });

  test('continues past an empty page that has a nextLink', async () => {
    sendRequest
      .mockResolvedValueOnce({ body: { value: [], '@odata.nextLink': 'https://graph.microsoft.com/next' } })
      .mockResolvedValueOnce({ body: { value: [{ id: 'c' }] } });

    const result = await listFolders.run(buildContext('root'));

    expect(result).toEqual([{ id: 'c' }]);
    expect(sendRequest).toHaveBeenCalledTimes(2);
  });

  test('falls back to root when the parent folder is empty', async () => {
    sendRequest.mockResolvedValueOnce({ body: { value: [] } });

    await listFolders.run(buildContext(''));

    expect(sendRequest.mock.calls[0][0].url).toContain('/items/root/children');
  });
});
