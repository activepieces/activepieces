import { beforeEach, describe, expect, it, vi } from 'vitest';

const findBlobsByTags = vi.fn();
const containerFindBlobsByTags = vi.fn();
const deleteIfExists = vi.fn();
const getTags = vi.fn();
const setTags = vi.fn();
const uploadData = vi.fn();
const getProperties = vi.fn();
const generateSasUrl = vi.fn();
const containerDeleteIfExists = vi.fn();
const setAccessTier = vi.fn();
const createContainer = vi.fn();
const uploadStream = vi.fn();
const SAS_URL = 'https://acct.blob.core.windows.net/c/b.txt?sv=2022-11-02&sp=rwdlacupiytfx&sig=SECRET';
const blobUrl = { value: 'https://acct.blob.core.windows.net/c/b' };
const credential: { value: unknown } = { value: { accountName: 'acct', computeHMACSHA256: () => 'sig' } };

vi.mock('@azure/storage-blob', () => ({
  BlobSASPermissions: { parse: (value: string) => value },
  SASProtocol: { Https: 'https', HttpsAndHttp: 'https,http' },
  BlobServiceClient: {
    fromConnectionString: () => ({
      findBlobsByTags,
      createContainer,
      getContainerClient: () => ({
        findBlobsByTags: containerFindBlobsByTags,
        deleteIfExists: containerDeleteIfExists,
        getBlobClient: () => ({ url: blobUrl.value, credential: credential.value, setAccessTier, deleteIfExists, getTags, setTags, getProperties, generateSasUrl }),
        getBlockBlobClient: () => ({ uploadData, uploadStream, url: SAS_URL }),
      }),
    }),
  },
}));

import { aiFindBlobsByTags } from '../src/lib/actions/ai/find-blobs-by-tags';
import { aiDeleteBlob } from '../src/lib/actions/ai/delete-blob';
import { aiSetBlobTags } from '../src/lib/actions/ai/set-blob-tags';
import { aiUploadBlob } from '../src/lib/actions/ai/upload-blob';
import { aiGetBlobProperties } from '../src/lib/actions/ai/get-blob-properties';
import { aiGenerateSasUrl } from '../src/lib/actions/ai/generate-sas-url';
import { findBlobs } from '../src/lib/actions/find-blobs';
import { deleteContainer } from '../src/lib/actions/delete-container';
import { aiSetAccessTier } from '../src/lib/actions/ai/set-access-tier';
import { aiGetBlobTags } from '../src/lib/actions/ai/get-blob-tags';
import { createBlob } from '../src/lib/actions/create-blob';
import { createContainer as createContainerAction } from '../src/lib/actions/create-container';

async function runAction({ action, propsValue }: { action: { run: unknown }; propsValue: Record<string, unknown> }): Promise<unknown> {
  const context = {
    auth: { type: 'CUSTOM_AUTH', props: { connectionString: 'UseDevelopmentStorage=true' } },
    propsValue,
    files: { write: vi.fn().mockResolvedValue('file://stored') },
  };
  if (typeof action.run !== 'function') {
    throw new Error('action has no run');
  }
  return Reflect.apply(action.run, undefined, [context]);
}

function onePage({ page }: { page: unknown }) {
  return {
    byPage: vi.fn(() => ({ next: async () => ({ done: false, value: page }) })),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('find blobs by tags', () => {
  it('AI tool rejects a quote before calling Azure', async () => {
    await expect(
      runAction({ action: aiFindBlobsByTags, propsValue: { tags: { owner: "O'Brien" } } })
    ).rejects.toThrow('invalid value');
    expect(findBlobsByTags).not.toHaveBeenCalled();
  });

  it('AI tool quotes a dashed key and returns a flat page', async () => {
    findBlobsByTags.mockReturnValue(
      onePage({
        page: {
          blobs: [{ name: 'x.txt', containerName: 'c', tags: { 'project-id': 'a b' } }],
          continuationToken: '',
        },
      })
    );
    const result = await runAction({
      action: aiFindBlobsByTags,
      propsValue: { tags: { 'project-id': 'a b' }, container: 'c', maxResults: 10 },
    });
    expect(findBlobsByTags).toHaveBeenCalledWith(`@container='c' AND "project-id"='a b'`);
    expect(result).toEqual({
      blobs: [{ name: 'x.txt', container: 'c', tags: { 'project-id': 'a b' } }],
      count: 1,
      nextContinuationToken: null,
    });
  });

  it('human action quotes keys and rejects a quoted value', async () => {
    containerFindBlobsByTags.mockReturnValue(
      (async function* () {
        yield { name: 'x.txt', containerName: 'c', tags: { 'doc-type': 'pdf' } };
      })()
    );
    const result = await runAction({
      action: findBlobs,
      propsValue: { container: 'c', tags: { 'doc-type': 'pdf' } },
    });
    expect(containerFindBlobsByTags).toHaveBeenCalledWith(`"doc-type"='pdf'`);
    expect(result).toEqual([{ name: 'x.txt', container: 'c', tags: { 'doc-type': 'pdf' } }]);
    await expect(
      runAction({ action: findBlobs, propsValue: { container: 'c', tags: { status: "it's" } } })
    ).rejects.toThrow('invalid value');
  });
});

describe('delete blob', () => {
  it('returns deleted false on repeat', async () => {
    deleteIfExists.mockResolvedValue({ succeeded: false, _response: { request: {} } });
    const result = await runAction({ action: aiDeleteBlob, propsValue: { container: 'c', blobName: 'b' } });
    expect(result).toEqual({ container: 'c', blobName: 'b', deleted: false });
    expect(deleteIfExists).toHaveBeenCalledWith({ deleteSnapshots: 'include' });
  });
});

describe('set blob tags', () => {
  it('merges with existing tags', async () => {
    getTags.mockResolvedValue({ tags: { a: '1', b: '2' } });
    setTags.mockResolvedValue({});
    const result = await runAction({
      action: aiSetBlobTags,
      propsValue: { container: 'c', blobName: 'b', tags: { b: '3' }, mode: 'merge' },
    });
    expect(setTags).toHaveBeenCalledWith({ a: '1', b: '3' });
    expect(result).toEqual({ container: 'c', blobName: 'b', tags: { a: '1', b: '3' }, tagCount: 2 });
  });
});

describe('upload blob', () => {
  it('uploads text with ifNoneMatch when overwrite is no', async () => {
    uploadData.mockResolvedValue({
      etag: '"e"',
      lastModified: new Date('2026-11-23T10:00:00Z'),
      _response: { request: { headers: 'Authorization' } },
    });
    const result = await runAction({
      action: aiUploadBlob,
      propsValue: { container: 'c', blobName: 'b.txt', content: 'hello', overwrite: 'no' },
    });
    const [body, options] = uploadData.mock.calls[0];
    expect(body.toString()).toBe('hello');
    expect(options.conditions).toEqual({ ifNoneMatch: '*' });
    expect(options.blobHTTPHeaders).toEqual({ blobContentType: 'text/plain; charset=utf-8' });
    expect(result).toEqual({
      container: 'c',
      blobName: 'b.txt',
      etag: '"e"',
      lastModified: '2026-11-23T10:00:00.000Z',
      versionId: null,
      url: 'https://acct.blob.core.windows.net/c/b.txt',
    });
  });

  it('rejects both text and file', async () => {
    await expect(
      runAction({
        action: aiUploadBlob,
        propsValue: { container: 'c', blobName: 'b', content: 'x', file: { data: Buffer.from('y') } },
      })
    ).rejects.toThrow('exactly one');
  });
});

describe('get blob properties', () => {
  it('maps to nulls and maps Azure errors', async () => {
    getProperties.mockResolvedValueOnce({ contentLength: 5, metadata: { a: 'b' } });
    const result = await runAction({ action: aiGetBlobProperties, propsValue: { container: 'c', blobName: 'b' } });
    expect(result).toEqual({
      container: 'c',
      blobName: 'b',
      size: 5,
      contentType: null,
      contentEncoding: null,
      lastModified: null,
      createdOn: null,
      etag: null,
      accessTier: null,
      blobType: null,
      versionId: null,
      tagCount: 0,
      leaseState: null,
      archiveStatus: null,
      rehydratePriority: null,
      metadata: { a: 'b' },
    });

    getProperties.mockRejectedValueOnce(
      Object.assign(new Error('The specified blob does not exist.'), { statusCode: 404, code: 'BlobNotFound' })
    );
    await expect(
      runAction({ action: aiGetBlobProperties, propsValue: { container: 'c', blobName: 'b' } })
    ).rejects.toThrow('Azure Blob get blob properties failed: BlobNotFound The specified blob does not exist.');

    getProperties.mockRejectedValueOnce(Object.assign(new Error(''), { statusCode: 404 }));
    await expect(
      runAction({ action: aiGetBlobProperties, propsValue: { container: 'c', blobName: 'b' } })
    ).rejects.toThrow('Azure Blob get blob properties failed: blob "b" not found in container "c".');
  });
});

describe('generate SAS URL', () => {
  it('explains the account-key requirement without calling the SDK', async () => {
    credential.value = { anonymous: true };
    await expect(
      runAction({ action: aiGenerateSasUrl, propsValue: { container: 'c', blobName: 'b' } })
    ).rejects.toThrow('account-key connection string');
    expect(generateSasUrl).not.toHaveBeenCalled();
    credential.value = { accountName: 'acct', computeHMACSHA256: () => 'sig' };
  });

  it('passes other SDK errors through the error mapper', async () => {
    generateSasUrl.mockRejectedValueOnce(new RangeError('Must provide startsOn'));
    await expect(
      runAction({ action: aiGenerateSasUrl, propsValue: { container: 'c', blobName: 'b' } })
    ).rejects.toThrow('Azure Blob generate SAS URL failed: network error Must provide startsOn.');
  });

  it('picks the protocol from the endpoint scheme', async () => {
    generateSasUrl.mockResolvedValue('signed');
    await runAction({ action: aiGenerateSasUrl, propsValue: { container: 'c', blobName: 'b' } });
    expect(generateSasUrl.mock.calls[0][0].protocol).toBe('https');
    blobUrl.value = 'http://127.0.0.1:10000/devstoreaccount1/c/b';
    await runAction({ action: aiGenerateSasUrl, propsValue: { container: 'c', blobName: 'b' } });
    expect(generateSasUrl.mock.calls[1][0].protocol).toBe('https,http');
    blobUrl.value = 'https://acct.blob.core.windows.net/c/b';
  });

  it('bounds expiry to 7 days', async () => {
    await expect(
      runAction({ action: aiGenerateSasUrl, propsValue: { container: 'c', blobName: 'b', expiresInMinutes: 10081 } })
    ).rejects.toThrow('between 1 and 10080');
  });
});

describe('delete container', () => {
  it('reports deleted true, then false when missing', async () => {
    containerDeleteIfExists.mockResolvedValueOnce({ succeeded: true }).mockResolvedValueOnce({ succeeded: false });
    expect(await runAction({ action: deleteContainer, propsValue: { container: 'c' } })).toEqual({
      containerName: 'c',
      deleted: true,
    });
    expect(await runAction({ action: deleteContainer, propsValue: { container: 'c' } })).toEqual({
      containerName: 'c',
      deleted: false,
    });
  });
});

describe('upload blob content type', () => {
  it('derives it from the file name and lets an explicit value win', async () => {
    uploadData.mockResolvedValue({});
    await runAction({
      action: aiUploadBlob,
      propsValue: { container: 'c', blobName: 'data', file: { data: Buffer.from('{}'), filename: 'x.json', extension: 'json' } },
    });
    expect(uploadData.mock.calls[0][1].blobHTTPHeaders).toEqual({ blobContentType: 'application/json' });
    await runAction({
      action: aiUploadBlob,
      propsValue: {
        container: 'c',
        blobName: 'data.json',
        contentType: 'text/x-custom',
        file: { data: Buffer.from('{}'), filename: 'x.json' },
      },
    });
    expect(uploadData.mock.calls[1][1].blobHTTPHeaders).toEqual({ blobContentType: 'text/x-custom' });
  });
});

describe('set access tier', () => {
  it('returns the tier actually in effect while rehydrating', async () => {
    setAccessTier.mockResolvedValue({});
    getProperties.mockResolvedValueOnce({
      accessTier: 'Archive',
      archiveStatus: 'rehydrate-pending-to-hot',
      rehydratePriority: 'Standard',
    });
    const result = await runAction({
      action: aiSetAccessTier,
      propsValue: { container: 'c', blobName: 'b', tier: 'Hot' },
    });
    expect(setAccessTier).toHaveBeenCalledWith('Hot');
    expect(result).toEqual({
      container: 'c',
      blobName: 'b',
      requestedTier: 'Hot',
      accessTier: 'Archive',
      archiveStatus: 'rehydrate-pending-to-hot',
      rehydratePriority: 'Standard',
    });
  });
});

describe('empty metadata and tags from real Azure', () => {
  it('get blob properties returns {} for metadata ""', async () => {
    getProperties.mockResolvedValueOnce({ metadata: '' });
    const result = await runAction({ action: aiGetBlobProperties, propsValue: { container: 'c', blobName: 'b' } });
    expect(result).toMatchObject({ metadata: {} });
  });

  it('get blob tags returns {} for tags ""', async () => {
    getTags.mockResolvedValueOnce({ tags: '' });
    const result = await runAction({ action: aiGetBlobTags, propsValue: { container: 'c', blobName: 'b' } });
    expect(result).toEqual({ container: 'c', blobName: 'b', tags: {}, tagCount: 0 });
  });
});

describe('SAS URL leak', () => {
  it('upload blob strips the SAS from url', async () => {
    uploadData.mockResolvedValue({});
    const result = await runAction({ action: aiUploadBlob, propsValue: { container: 'c', blobName: 'b.txt', content: 'x' } });
    expect(JSON.stringify(result)).not.toContain('sig=');
    expect(result).toMatchObject({ url: 'https://acct.blob.core.windows.net/c/b.txt' });
  });

  it('create blob strips the SAS from url', async () => {
    uploadStream.mockResolvedValue({});
    const result = await runAction({
      action: createBlob,
      propsValue: { container: 'c', blobName: 'b.txt', file: { filename: 'b.txt', data: Buffer.from('x') } },
    });
    expect(JSON.stringify(result)).not.toContain('sig=');
    expect(result).toMatchObject({ url: 'https://acct.blob.core.windows.net/c/b.txt' });
  });

  it('create container strips the SAS from url', async () => {
    createContainer.mockResolvedValue({
      containerCreateResponse: {},
      containerClient: { containerName: 'c', accountName: 'acct', url: 'https://acct.blob.core.windows.net/c?sv=1&sig=SECRET' },
    });
    const result = await runAction({ action: createContainerAction, propsValue: { containerName: 'c' } });
    expect(JSON.stringify(result)).not.toContain('sig=');
    expect(result).toMatchObject({ url: 'https://acct.blob.core.windows.net/c' });
  });
});
