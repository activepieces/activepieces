import { httpClient } from '@activepieces/pieces-common';
import { FilesService } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { googleDriveListFiles } from '../src/lib/action/list-files.action';
import { downloadFileFromDrive } from '../src/lib/common/get-file-content';
import { driveTestContext } from './drive-test-context';

const vendor: { types: Map<string, string>; lookupError: LookupError | undefined; written: string[]; downloads: string[] } = {
  types: new Map<string, string>(),
  lookupError: undefined,
  written: new Array<string>(),
  downloads: new Array<string>(),
};

const files: FilesService = {
  write: async ({ fileName, data }) => {
    await driveTestContext.drainToBuffer(data);
    vendor.written.push(fileName);
    return `https://files.example/${fileName}`;
  },
  upload: async () => {
    throw new Error('not used');
  },
};

async function fakeFetch(input: string | URL) {
  const url = String(input);
  const id = /\/files\/([^/?]+)/.exec(url)?.[1] ?? '';
  if (url.includes('fields=mimeType')) {
    if (vendor.lookupError) {
      return new Response(JSON.stringify({ error: { code: vendor.lookupError.status, message: vendor.lookupError.message } }), { status: vendor.lookupError.status });
    }
    return new Response(JSON.stringify({ mimeType: vendor.types.get(id) ?? 'application/pdf' }));
  }
  vendor.downloads.push(url);
  return new Response('bytes');
}

beforeEach(() => {
  vendor.types = new Map([
    ['sheet-1', 'application/vnd.google-apps.spreadsheet'],
    ['slides-1', 'application/vnd.google-apps.presentation'],
    ['doc-1', 'application/vnd.google-apps.document'],
    ['pdf-1', 'application/pdf'],
  ]);
  vendor.lookupError = undefined;
  vendor.written = [];
  vendor.downloads = [];
  vi.stubGlobal('fetch', vi.fn(fakeFetch));
  driveTestContext.routeFileLookupsToFetch();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Drive download naming', () => {
  it.each([
    { fileId: 'sheet-1', fileName: 'Budget', expected: 'Budget.xlsx' },
    { fileId: 'slides-1', fileName: undefined, expected: 'slides-1.pptx' },
    { fileId: 'doc-1', fileName: 'Plan.docx', expected: 'Plan.docx' },
    { fileId: 'doc-1', fileName: 'Plan.DOCX', expected: 'Plan.DOCX' },
    { fileId: 'pdf-1', fileName: undefined, expected: 'pdf-1.pdf' },
    { fileId: 'pdf-1', fileName: 'scan', expected: 'scan' },
  ])('$fileId saved as $fileName is written as $expected', async ({ fileId, fileName, expected }) => {
    await downloadFileFromDrive({ auth: driveTestContext.connection, files, fileId: fileId, fileName: fileName });
    expect(vendor.written).toEqual([expected]);
  });

  it('exports Google files and downloads other files', async () => {
    await downloadFileFromDrive({ auth: driveTestContext.connection, files, fileId: 'sheet-1', fileName: undefined });
    await downloadFileFromDrive({ auth: driveTestContext.connection, files, fileId: 'pdf-1', fileName: undefined });
    expect(vendor.downloads[0]).toContain('/files/sheet-1/export?mimeType=application%2Fvnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(vendor.downloads[1]).toContain('/files/pdf-1?alt=media');
  });

  it.each([
    { status: 404, message: 'File not found: missing.' },
    { status: 403, message: 'The user does not have sufficient permissions for this file.' },
    { status: 401, message: 'Request had invalid authentication credentials.' },
  ])('a $status lookup fails with Drive\'s message and downloads nothing', async ({ status, message }) => {
    vendor.lookupError = { status, message };
    await expect(downloadFileFromDrive({ auth: driveTestContext.connection, files, fileId: 'missing', fileName: undefined })).rejects.toThrow(message);
    expect(vendor.downloads).toEqual([]);
  });

  it('List Files names an exported Google Doc .docx, never .gdoc.docx', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockImplementation((async () => ({
      status: 200,
      headers: {},
      body: {
        incompleteSearch: false,
        files: [
          { id: 'doc-1', name: 'Q3 plan', mimeType: 'application/vnd.google-apps.document', kind: 'drive#file' },
          { id: 'pdf-1', name: 'scan', mimeType: 'application/pdf', kind: 'drive#file' },
        ],
      },
    })));
    const context = driveTestContext.actionContext({ action: googleDriveListFiles, propsValue: { folderId: 'folder-1', depthLevel: 1, downloadFiles: true, include_team_drives: false, includeTrashed: false }, files });
    await googleDriveListFiles.run(context);
    expect(vendor.written).toEqual(['Q3 plan.docx', 'scan.pdf']);
  });
});

type LookupError = { status: number; message: string };
