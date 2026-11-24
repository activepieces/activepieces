import { beforeEach, describe, expect, it, vi } from 'vitest';

const listBlobsFlat = vi.fn();

vi.mock('@azure/storage-blob', () => ({
  BlobServiceClient: {
    fromConnectionString: () => ({
      getContainerClient: () => ({ listBlobsFlat }),
    }),
  },
}));

import { newOrUpdatedBlob, newOrUpdatedBlobInternals } from '../src/lib/triggers/new-or-updated-blob';
import { BlobSummary } from '../src/lib/common/client';

function blob({ name, lastModified, etag }: { name: string; lastModified: string; etag: string }): BlobSummary {
  return {
    name,
    size: 1,
    contentType: 'text/plain',
    lastModified,
    createdOn: lastModified,
    etag,
    accessTier: 'Hot',
    blobType: 'BlockBlob',
    versionId: null,
    snapshot: null,
    metadata: {},
  };
}

function pagesOf({ count }: { count: number }) {
  const items = Array.from({ length: count }, (_, index) => ({
    name: `b${index}`,
    properties: { lastModified: new Date(1700000000000), etag: `e${index}` },
  }));
  return {
    byPage: () =>
      (async function* () {
        for (let start = 0; start < items.length; start += 5000) {
          yield { segment: { blobItems: items.slice(start, start + 5000) } };
        }
      })(),
  };
}

const T1 = '2026-11-23T10:00:01.000Z';
const T2 = '2026-11-23T10:00:02.000Z';

describe('computeChanges', () => {
  it('emits blobs sharing the boundary second that were not seen yet', () => {
    const first = newOrUpdatedBlobInternals.computeChanges({
      blobs: [blob({ name: 'a', lastModified: T1, etag: '1' }), blob({ name: 'b', lastModified: T2, etag: '1' })],
      checkpoint: { lastModifiedMs: 0, boundaryKeys: [] },
    });
    expect(first.emitted.map((item) => item.name)).toEqual(['a', 'b']);
    expect(first.next).toEqual({ lastModifiedMs: Date.parse(T2), boundaryKeys: ['b|1'] });

    const second = newOrUpdatedBlobInternals.computeChanges({
      blobs: [
        blob({ name: 'a', lastModified: T1, etag: '1' }),
        blob({ name: 'b', lastModified: T2, etag: '1' }),
        blob({ name: 'c', lastModified: T2, etag: '1' }),
      ],
      checkpoint: first.next,
    });
    expect(second.emitted.map((item) => item.name)).toEqual(['c']);
    expect(second.next.boundaryKeys.sort()).toEqual(['b|1', 'c|1']);

    const third = newOrUpdatedBlobInternals.computeChanges({
      blobs: [blob({ name: 'b', lastModified: T2, etag: '1' }), blob({ name: 'c', lastModified: T2, etag: '1' })],
      checkpoint: second.next,
    });
    expect(third.emitted).toEqual([]);
  });

  it('re-emits an overwritten blob', () => {
    const result = newOrUpdatedBlobInternals.computeChanges({
      blobs: [blob({ name: 'b', lastModified: T2, etag: '2' })],
      checkpoint: { lastModifiedMs: Date.parse(T1), boundaryKeys: ['b|1'] },
    });
    expect(result.emitted.map((item) => item.etag)).toEqual(['2']);
  });

  it('re-emits a blob overwritten within the same second', () => {
    const result = newOrUpdatedBlobInternals.computeChanges({
      blobs: [blob({ name: 'b', lastModified: T2, etag: '2' })],
      checkpoint: { lastModifiedMs: Date.parse(T2), boundaryKeys: ['b|1'] },
    });
    expect(result.emitted.map((item) => item.etag)).toEqual(['2']);
  });

  it('ignores older blobs', () => {
    const result = newOrUpdatedBlobInternals.computeChanges({
      blobs: [blob({ name: 'old', lastModified: T1, etag: '1' })],
      checkpoint: { lastModifiedMs: Date.parse(T2), boundaryKeys: [] },
    });
    expect(result.emitted).toEqual([]);
    expect(result.next.lastModifiedMs).toBe(Date.parse(T2));
  });
});

describe('scanBlobs', () => {
  beforeEach(() => {
    listBlobsFlat.mockReset();
  });

  it('returns every blob up to the cap', async () => {
    listBlobsFlat.mockReturnValue(pagesOf({ count: 10000 }));
    const blobs = await newOrUpdatedBlobInternals.scanBlobs({
      connectionString: 'UseDevelopmentStorage=true',
      container: 'c',
      prefix: undefined,
    });
    expect(blobs).toHaveLength(10000);
  });

  it('throws instead of silently truncating past the cap', async () => {
    listBlobsFlat.mockImplementation(() => pagesOf({ count: 10001 }));
    await expect(
      newOrUpdatedBlobInternals.scanBlobs({
        connectionString: 'UseDevelopmentStorage=true',
        container: 'c',
        prefix: undefined,
      })
    ).rejects.toThrow('Azure Blob trigger stopped: more than 10000 blobs');
    await expect(
      newOrUpdatedBlobInternals.scanBlobs({ connectionString: 'UseDevelopmentStorage=true', container: 'c', prefix: undefined })
    ).rejects.not.toThrow('network error');
  });
});

function itemsOf({ items }: { items: { name: string; lastModified: string; etag: string }[] }) {
  return {
    byPage: () =>
      (async function* () {
        yield {
          segment: {
            blobItems: items.map((item) => ({
              name: item.name,
              properties: { lastModified: new Date(item.lastModified), etag: item.etag },
            })),
          },
        };
      })(),
  };
}

function makeContext({ isRepublish, stored }: { isRepublish?: boolean; stored?: unknown }) {
  const data = new Map<string, unknown>();
  if (stored !== undefined) {
    data.set(newOrUpdatedBlobInternals.STORE_KEY, stored);
  }
  return {
    data,
    context: {
      auth: { props: { connectionString: 'UseDevelopmentStorage=true' } },
      propsValue: { container: 'box', prefix: '' },
      isRepublish,
      store: {
        get: async (key: string) => data.get(key) ?? null,
        put: async (key: string, value: unknown) => {
          data.set(key, value);
          return value;
        },
        delete: async (key: string) => {
          data.delete(key);
        },
      },
    },
  };
}

async function callHook({ hook, context }: { hook: unknown; context: unknown }): Promise<unknown> {
  if (typeof hook !== 'function') {
    throw new Error('missing hook');
  }
  return Reflect.apply(hook, undefined, [context]);
}

describe('trigger hooks', () => {
  beforeEach(() => {
    listBlobsFlat.mockReset();
  });

  it('onEnable seeds the checkpoint from the newest blobs', async () => {
    listBlobsFlat.mockReturnValue(
      itemsOf({ items: [{ name: 'a', lastModified: T1, etag: '1' }, { name: 'b', lastModified: T2, etag: '1' }] })
    );
    const { context, data } = makeContext({});
    await callHook({ hook: newOrUpdatedBlob.onEnable, context });
    expect(data.get(newOrUpdatedBlobInternals.STORE_KEY)).toEqual({
      lastModifiedMs: Date.parse(T2),
      boundaryKeys: ['b|1'],
    });
  });

  it('onEnable on republish keeps an existing checkpoint', async () => {
    const stored = { lastModifiedMs: Date.parse(T1), boundaryKeys: ['a|1'] };
    const { context, data } = makeContext({ isRepublish: true, stored });
    await callHook({ hook: newOrUpdatedBlob.onEnable, context });
    expect(listBlobsFlat).not.toHaveBeenCalled();
    expect(data.get(newOrUpdatedBlobInternals.STORE_KEY)).toEqual(stored);
  });

  it('onEnable on republish seeds when nothing is stored', async () => {
    listBlobsFlat.mockReturnValue(itemsOf({ items: [{ name: 'a', lastModified: T1, etag: '1' }] }));
    const { context, data } = makeContext({ isRepublish: true });
    await callHook({ hook: newOrUpdatedBlob.onEnable, context });
    expect(data.get(newOrUpdatedBlobInternals.STORE_KEY)).toEqual({
      lastModifiedMs: Date.parse(T1),
      boundaryKeys: ['a|1'],
    });
  });

  it('run emits new blobs with container and advances the checkpoint', async () => {
    listBlobsFlat.mockReturnValue(
      itemsOf({ items: [{ name: 'a', lastModified: T1, etag: '1' }, { name: 'b', lastModified: T2, etag: '1' }] })
    );
    const { context, data } = makeContext({ stored: { lastModifiedMs: Date.parse(T1), boundaryKeys: ['a|1'] } });
    const result = await callHook({ hook: newOrUpdatedBlob.run, context });
    expect(result).toEqual([expect.objectContaining({ container: 'box', name: 'b', etag: '1' })]);
    expect(data.get(newOrUpdatedBlobInternals.STORE_KEY)).toEqual({
      lastModifiedMs: Date.parse(T2),
      boundaryKeys: ['b|1'],
    });
  });

  it('run without a stored checkpoint only emits blobs newer than now', async () => {
    const future = new Date(Date.now() + 3600000).toISOString();
    listBlobsFlat.mockReturnValue(
      itemsOf({ items: [{ name: 'old', lastModified: T1, etag: '1' }, { name: 'new', lastModified: future, etag: '1' }] })
    );
    const { context } = makeContext({});
    const result = await callHook({ hook: newOrUpdatedBlob.run, context });
    expect(result).toEqual([expect.objectContaining({ container: 'box', name: 'new' })]);
  });

  it('run does not write the checkpoint when the scan fails', async () => {
    listBlobsFlat.mockImplementation(() => pagesOf({ count: 10001 }));
    const stored = { lastModifiedMs: 1, boundaryKeys: [] };
    const { context, data } = makeContext({ stored });
    await expect(callHook({ hook: newOrUpdatedBlob.run, context })).rejects.toThrow('more than 10000');
    expect(data.get(newOrUpdatedBlobInternals.STORE_KEY)).toEqual(stored);
  });

  it('test returns the newest blobs first with container', async () => {
    listBlobsFlat.mockReturnValue(
      itemsOf({ items: [{ name: 'a', lastModified: T1, etag: '1' }, { name: 'b', lastModified: T2, etag: '1' }] })
    );
    const { context } = makeContext({});
    const result = await callHook({ hook: newOrUpdatedBlob.test, context });
    expect(result).toEqual([
      expect.objectContaining({ container: 'box', name: 'b' }),
      expect.objectContaining({ container: 'box', name: 'a' }),
    ]);
  });
});
