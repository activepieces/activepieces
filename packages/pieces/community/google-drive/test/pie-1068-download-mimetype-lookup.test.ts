import { FilesService } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadFileFromDrive } from '../src/lib/common/get-file-content';
import { driveTestContext } from './drive-test-context';

const GOOGLE_DOC = 'application/vnd.google-apps.document';

const vendor: { lookup: { status: number; body: Record<string, unknown> }; lookups: number; written: string[] } = {
  lookup: { status: 200, body: { mimeType: GOOGLE_DOC } },
  lookups: 0,
  written: new Array<string>(),
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
  if (url.includes('fields=mimeType')) {
    vendor.lookups += 1;
    return new Response(JSON.stringify(vendor.lookup.body), { status: vendor.lookup.status });
  }
  if (url.includes('alt=media')) {
    return new Response(JSON.stringify({ error: { code: 403, message: 'Only files with binary content can be downloaded. Use Export with Docs Editors files.' } }), { status: 403, statusText: 'Forbidden' });
  }
  return new Response('docx bytes');
}

beforeEach(() => {
  vendor.lookup = { status: 200, body: { mimeType: GOOGLE_DOC } };
  vendor.lookups = 0;
  vendor.written = [];
  vi.stubGlobal('fetch', vi.fn(fakeFetch));
  driveTestContext.routeFileLookupsToFetch();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('PIE-1068 Drive download helper', () => {
  it('looks the file type up once per download', async () => {
    await downloadFileFromDrive({ auth: driveTestContext.connection, files, fileId: 'doc-1', fileName: 'Plan.docx' });
    expect(vendor.lookups).toBe(1);
  });

  it('a failed type lookup throws with Drive\'s own message', async () => {
    vendor.lookup = { status: 429, body: { error: { code: 429, message: 'User rate limit exceeded.' } } };
    await expect(
      downloadFileFromDrive({ auth: driveTestContext.connection, files, fileId: 'doc-1', fileName: undefined })
    ).rejects.toThrow(/User rate limit exceeded/);
  });

  it('an exported Google Doc saved without a name gets the .docx extension', async () => {
    await downloadFileFromDrive({ auth: driveTestContext.connection, files, fileId: 'doc-1', fileName: undefined });
    expect(vendor.written).toEqual(['doc-1.docx']);
  });

  it('an exported Google Doc saved under its Drive name gets the .docx extension', async () => {
    await downloadFileFromDrive({ auth: driveTestContext.connection, files, fileId: 'doc-1', fileName: 'Q3 plan' });
    expect(vendor.written).toEqual(['Q3 plan.docx']);
  });
});
