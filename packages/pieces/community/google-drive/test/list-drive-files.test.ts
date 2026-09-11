/// <reference types="vitest/globals" />

import { AppConnectionType } from '@activepieces/pieces-framework';

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

const { listDriveFiles, listDriveFilesRecursive } = await import('../src/lib/common/list-drive-files');

const auth = { type: AppConnectionType.OAUTH2, access_token: 'test-token' } as any;

function lastRequest() {
  return sendRequest.mock.calls[sendRequest.mock.calls.length - 1][0];
}

function decodedQuery(request: { url: string }) {
  return decodeURIComponent(request.url.split('q=')[1].split('&')[0]);
}

function driveFile(overrides: Record<string, any>) {
  return {
    id: 'id',
    kind: 'drive#file',
    mimeType: 'text/plain',
    name: 'file',
    trashed: false,
    parents: [],
    ...overrides,
  };
}

function page(files: unknown[], nextPageToken?: string) {
  return { status: 200, headers: {}, body: { files, nextPageToken } };
}

beforeEach(() => {
  sendRequest.mockReset();
});

describe('listDriveFiles pagination', () => {
  test('follows nextPageToken across multiple pages and concatenates results', async () => {
    sendRequest
      .mockResolvedValueOnce(page([driveFile({ id: 'a' })], 'page2'))
      .mockResolvedValueOnce(page([driveFile({ id: 'b' })]));

    const result = await listDriveFiles({ auth, params: { q: "'root' in parents" } });

    expect(result.map((f: any) => f.id)).toEqual(['a', 'b']);
    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(sendRequest.mock.calls[1][0].url).toContain('pageToken=page2');
  });

  test('the first request carries no pageToken param', async () => {
    sendRequest.mockResolvedValueOnce(page([]));

    await listDriveFiles({ auth, params: { q: "'root' in parents" } });

    expect(lastRequest().url).not.toContain('pageToken');
  });

  test('a page with no files does not throw', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: {} });

    await expect(listDriveFiles({ auth, params: { q: "'root' in parents" } })).resolves.toEqual([]);
  });
});

describe('listDriveFilesRecursive query construction', () => {
  test('a single parent folder produces an un-parenthesized clause, matching the old per-folder query', async () => {
    sendRequest.mockResolvedValueOnce(page([]));

    await listDriveFilesRecursive({
      auth,
      rootFolderId: 'root',
      maxLevel: 1,
      includeTrashed: false,
      includeTeamDrives: false,
    });

    expect(decodedQuery(lastRequest())).toBe("'root' in parents and trashed=false");
  });

  test('includeTrashed omits the trashed=false clause', async () => {
    sendRequest.mockResolvedValueOnce(page([]));

    await listDriveFilesRecursive({
      auth,
      rootFolderId: 'root',
      maxLevel: 1,
      includeTrashed: true,
      includeTeamDrives: false,
    });

    expect(decodedQuery(lastRequest())).toBe("'root' in parents");
  });
});

describe('listDriveFilesRecursive batching across >50 sibling folders', () => {
  test('chunks parent ids at 50 per query and returns files from every chunk', async () => {
    const folderIds = Array.from({ length: 60 }, (_, i) => `folder-${i}`);

    sendRequest
      // level 0: single query for the root folder returns 60 subfolders
      .mockResolvedValueOnce(
        page(folderIds.map((id) => driveFile({ id, mimeType: 'application/vnd.google-apps.folder' })))
      )
      // level 1, chunk 1 (ids 0-49)
      .mockResolvedValueOnce(page([driveFile({ id: 'chunk1-file' })]))
      // level 1, chunk 2 (ids 50-59)
      .mockResolvedValueOnce(page([driveFile({ id: 'chunk2-file' })]));

    const result = await listDriveFilesRecursive({
      auth,
      rootFolderId: 'root',
      maxLevel: 2,
      includeTrashed: false,
      includeTeamDrives: false,
    });

    expect(sendRequest).toHaveBeenCalledTimes(3);

    const chunk1Query = decodedQuery(sendRequest.mock.calls[1][0]);
    const chunk2Query = decodedQuery(sendRequest.mock.calls[2][0]);

    expect(chunk1Query).toContain(folderIds[0]);
    expect(chunk1Query).toContain(folderIds[49]);
    expect(chunk1Query).not.toContain(`'${folderIds[50]}'`);
    expect(chunk2Query).toContain(folderIds[50]);
    expect(chunk2Query).toContain(folderIds[59]);
    expect(chunk2Query).not.toContain(`'${folderIds[49]}'`);

    // 60 folders from level 0 + 1 file from each of the 2 level-1 chunks
    expect(result).toHaveLength(62);
    const ids = result.map((f: any) => f.id);
    expect(ids).toEqual(expect.arrayContaining(['chunk1-file', 'chunk2-file']));
  });

  test('pagination within one chunk is followed before moving to the next level', async () => {
    sendRequest
      .mockResolvedValueOnce(page([driveFile({ id: 'p1' })], 'tok'))
      .mockResolvedValueOnce(page([driveFile({ id: 'p2' })]));

    const result = await listDriveFilesRecursive({
      auth,
      rootFolderId: 'root',
      maxLevel: 1,
      includeTrashed: false,
      includeTeamDrives: false,
    });

    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(sendRequest.mock.calls[1][0].url).toContain('pageToken=tok');
    expect(result.map((f: any) => f.id)).toEqual(['p1', 'p2']);
  });
});

describe('listDriveFilesRecursive depth limits', () => {
  test('depth 1 only fetches the root level', async () => {
    sendRequest.mockResolvedValueOnce(
      page([driveFile({ id: 'child-folder', mimeType: 'application/vnd.google-apps.folder' })])
    );

    const result = await listDriveFilesRecursive({
      auth,
      rootFolderId: 'root',
      maxLevel: 1,
      includeTrashed: false,
      includeTeamDrives: false,
    });

    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(result.map((f: any) => f.id)).toEqual(['child-folder']);
  });

  test('depth 2 also fetches the next level down', async () => {
    sendRequest
      .mockResolvedValueOnce(page([driveFile({ id: 'child-folder', mimeType: 'application/vnd.google-apps.folder' })]))
      .mockResolvedValueOnce(page([driveFile({ id: 'grandchild-file' })]));

    const result = await listDriveFilesRecursive({
      auth,
      rootFolderId: 'root',
      maxLevel: 2,
      includeTrashed: false,
      includeTeamDrives: false,
    });

    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(result.map((f: any) => f.id)).toEqual(['child-folder', 'grandchild-file']);
  });

  test('traversal stops early once a level has no subfolders left, even before maxLevel is reached', async () => {
    sendRequest.mockResolvedValueOnce(page([driveFile({ id: 'leaf-file' })]));

    const result = await listDriveFilesRecursive({
      auth,
      rootFolderId: 'root',
      maxLevel: 5,
      includeTrashed: false,
      includeTeamDrives: false,
    });

    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(result.map((f: any) => f.id)).toEqual(['leaf-file']);
  });
});
