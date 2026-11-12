import { httpClient } from '@activepieces/pieces-common';
import { drive_v3 } from '@googleapis/drive';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { driveSearchFiles } from '../src/lib/action/drive-search-files';
import { googleDriveSearchFolder } from '../src/lib/action/search-folder-or-file.action';
import { googleDriveListFiles } from '../src/lib/action/list-files.action';
import { driveTestContext } from './drive-test-context';

const files = [
  { id: 'mine', name: 'report mine', driveId: 'my-drive', parents: ['my-folder'] },
  { id: 'shared', name: 'report shared', driveId: 'sd-1', parents: ['folder-1'] },
];

function inCorpus({ corpora, driveId, file }: { corpora?: string; driveId?: string; file: (typeof files)[number] }) {
  if (corpora === 'allDrives') return file.driveId === 'my-drive';
  if (corpora === 'drive') return file.driveId === driveId;
  return file.driveId === 'my-drive';
}

function listResult({ corpora, driveId }: { corpora?: string; driveId?: string }) {
  return {
    incompleteSearch: corpora === 'allDrives',
    files: files.filter((file) => inCorpus({ corpora, driveId, file })).map(({ id, name, parents }) => ({ id, name, parents, mimeType: 'application/pdf', kind: 'drive#file' })),
  };
}

beforeEach(() => {
  vi.spyOn(drive_v3.Resource$Files.prototype, 'list').mockImplementation((async (...args: unknown[]) => {
    const params = driveTestContext.listParams(args);
    return { status: 200, data: listResult({ corpora: params.corpora, driveId: params.driveId }) };
  }));
  vi.spyOn(drive_v3.Resource$Drives.prototype, 'list').mockImplementation((async () => ({ status: 200, data: { drives: [{ id: 'sd-1' }] } })));
  vi.spyOn(drive_v3.Resource$Files.prototype, 'get').mockImplementation((async () => ({ status: 200, data: { id: 'folder-1', driveId: 'sd-1' } })));
  vi.spyOn(httpClient, 'sendRequest').mockImplementation((async (request: { url: string }) => {
    const query = new URL(request.url).searchParams;
    return { status: 200, headers: {}, body: listResult({ corpora: query.get('corpora') ?? undefined, driveId: query.get('driveId') ?? undefined }) };
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

const idsOf = (value: unknown): string[] =>
  (Array.isArray(value) ? value : []).map((file: { id: string }) => file.id).sort();

describe('PIE-1069 search and list actions with an incomplete shared-drive search', () => {
  it('Search Files and Folders (drive_search_files) returns the files from every drive', async () => {
    const context = driveTestContext.actionContext({ action: driveSearchFiles, propsValue: { query_term: 'name', operator: 'contains', value: 'report', type: 'all', parent_folder_id: undefined, include_team_drives: true } });
    expect(idsOf(await driveSearchFiles.run(context))).toEqual(['mine', 'shared']);
  });

  it('Search Folder or File (search-folder) returns the files from every drive', async () => {
    const context = driveTestContext.actionContext({ action: googleDriveSearchFolder, propsValue: { queryTerm: 'name', operator: 'contains', query: 'report', type: 'all', parentFolder: undefined, include_team_drives: true } });
    expect(idsOf(await googleDriveSearchFolder.run(context))).toEqual(['mine', 'shared']);
  });

  it('List Files does not report a partial listing as complete', async () => {
    const context = driveTestContext.actionContext({ action: googleDriveListFiles, propsValue: { folderId: 'folder-1', depthLevel: 1, downloadFiles: false, include_team_drives: true, includeTrashed: false } });
    const result = driveTestContext.listFilesResult(await googleDriveListFiles.run(context));
    const complete = idsOf(result.files).join(',') === 'shared';
    expect(complete || result.incompleteSearch).toBe(true);
  });

  it('List Files on a shared-drive folder lists only that drive, never allDrives', async () => {
    const context = driveTestContext.actionContext({ action: googleDriveListFiles, propsValue: { folderId: 'folder-1', depthLevel: 1, downloadFiles: false, include_team_drives: true, includeTrashed: false } });
    await googleDriveListFiles.run(context);
    const queries = vi.mocked(httpClient.sendRequest).mock.calls.map(([request]) => new URL(request.url).searchParams);
    expect(queries.map((query) => [query.get('corpora'), query.get('driveId')])).toEqual([['drive', 'sd-1']]);
  });

  it('List Files reports incompleteSearch when Google could not search the folder\'s drive', async () => {
    vi.mocked(httpClient.sendRequest).mockImplementation((async () => ({ status: 200, headers: {}, body: { incompleteSearch: true, files: [] } })));
    const context = driveTestContext.actionContext({ action: googleDriveListFiles, propsValue: { folderId: 'folder-1', depthLevel: 1, downloadFiles: false, include_team_drives: true, includeTrashed: false } });
    const result = driveTestContext.listFilesResult(await googleDriveListFiles.run(context));
    expect(result.incompleteSearch).toBe(true);
  });

  it('Search Files with team drives off makes one files.list call on the user corpus', async () => {
    const context = driveTestContext.actionContext({ action: driveSearchFiles, propsValue: { query_term: 'name', operator: 'contains', value: 'report', type: 'all', parent_folder_id: undefined, include_team_drives: false } });
    expect(idsOf(await driveSearchFiles.run(context))).toEqual(['mine']);
    const calls = vi.mocked(drive_v3.Resource$Files.prototype.list).mock.calls.map((args) => driveTestContext.listParams(args).corpora);
    expect(calls).toEqual(['user']);
  });

  it('Search Files fails with the action message when a shared drive search is incomplete', async () => {
    vi.mocked(drive_v3.Resource$Files.prototype.list).mockImplementation((async () => ({ status: 200, data: { incompleteSearch: true, files: [] } })));
    const context = driveTestContext.actionContext({ action: driveSearchFiles, propsValue: { query_term: 'name', operator: 'contains', value: 'report', type: 'all', parent_folder_id: undefined, include_team_drives: true } });
    await expect(driveSearchFiles.run(context)).rejects.toThrow('Try again');
  });
});

describe('search action page timeout', () => {
  it('Search Files and Folders waits for a files.list page slower than the 10 s poll cap', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    vi.mocked(drive_v3.Resource$Files.prototype.list).mockImplementation((async () => {
      await new Promise((resolve) => setTimeout(resolve, 15_000));
      return { status: 200, data: { files: [{ id: 'slow', name: 'report slow', mimeType: 'application/pdf' }] } };
    }));
    const context = driveTestContext.actionContext({ action: driveSearchFiles, propsValue: { query_term: 'name', operator: 'contains', value: 'report', type: 'all', parent_folder_id: undefined, include_team_drives: false } });
    const run = driveSearchFiles.run(context);
    await vi.advanceTimersByTimeAsync(16_000);
    expect(idsOf(await run)).toEqual(['slow']);
    vi.useRealTimers();
  });
});
