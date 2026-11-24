import { _Object, ListObjectsV2CommandOutput, S3 } from '@aws-sdk/client-s3';
import {
  Property,
  Store,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { backBlazeS3Auth } from '../..';
import { BackBlazeAuthProps, backblazeCommon } from '../common';
import { backblazeNewFileOutputSchema } from '../output-schemas';

export const newBackBlazeFileTrigger = createTrigger({
  auth: backBlazeS3Auth,
  name: 'new_backblaze_file',
  classification: 'READ',
  displayName: 'New File',
  description: 'Trigger when a new file is uploaded.',
  aiMetadata: {
    description:
      'Fires when a new object appears in the configured Backblaze B2 (S3-compatible) bucket, discovered by polling the bucket listing and comparing last-modified times. An optional folder path restricts watching to objects inside that folder. Each event represents one newly seen object; an overwritten object fires again.',
  },
  outputSchema: backblazeNewFileOutputSchema,
  props: {
    folderPath: Property.ShortText({
      displayName: 'Folder Path',
      description: 'Only watch files inside this folder, e.g. "invoices" or "invoices/2024".',
      required: false,
    }),
  },
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    const existing = await readState({ store: context.store });
    if (context.isRepublish && existing) {
      return;
    }
    await context.store.put<PollState>(STATE_KEY, { lastModifiedMs: Date.now(), seenKeys: [] });
  },
  onDisable: async (context) => {
    await context.store.delete(STATE_KEY);
    await context.store.delete(LEGACY_KEY);
  },
  run: async (context) => {
    const stored = await readState({ store: context.store });
    const legacyItem = stored ? null : await context.store.get<unknown>(LEGACY_KEY);
    if (!stored && (legacyItem === null || legacyItem === undefined)) {
      await context.store.put<PollState>(STATE_KEY, { lastModifiedMs: Date.now(), seenKeys: [] });
      return [];
    }
    const objects = await listAllObjects({
      auth: context.auth.props,
      folderPath: context.propsValue.folderPath,
    });
    const state = stored ?? seedFromLegacy({ legacyItem, objects });
    if (!state) {
      await context.store.put<PollState>(STATE_KEY, { lastModifiedMs: Date.now(), seenKeys: [] });
      await context.store.delete(LEGACY_KEY);
      return [];
    }
    const { items, nextState } = selectNewObjects({ objects, state });
    await context.store.put<PollState>(STATE_KEY, nextState);
    if (!stored) {
      await context.store.delete(LEGACY_KEY);
    }
    return items;
  },
  test: async (context) => {
    const objects = await listAllObjects({
      auth: context.auth.props,
      folderPath: context.propsValue.folderPath,
    });
    return [...objects]
      .sort((a, b) => toMs(b.LastModified) - toMs(a.LastModified))
      .slice(0, 5)
      .map(toItem);
  },
  sampleData: {
    Key: 'myfolder/100-3.png',
    LastModified: '2023-08-04T13:51:26.000Z',
    ETag: '"e9f16cce12352322272525f5af65a2e"',
    Size: 40239,
    StorageClass: 'STANDARD',
  },
});

function normalizePrefix(folderPath: string | undefined): string | undefined {
  const trimmed = (folderPath ?? '').trim().replace(/^\/+/, '');
  if (trimmed === '') {
    return undefined;
  }
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

async function listAllObjects({
  auth,
  folderPath,
}: {
  auth: BackBlazeAuthProps;
  folderPath: string | undefined;
}): Promise<_Object[]> {
  const s3: S3 = backblazeCommon.createBackBlazeS3(auth);
  const prefix = normalizePrefix(folderPath);
  const pages: _Object[][] = [];
  let continuationToken: string | undefined = undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const response: ListObjectsV2CommandOutput = await s3.listObjectsV2({
      Bucket: auth.bucket,
      Prefix: prefix,
      MaxKeys: 1000,
      ContinuationToken: continuationToken,
    });
    pages.push(response.Contents ?? []);
    if (!response.IsTruncated || !response.NextContinuationToken) {
      return pages.flat();
    }
    continuationToken = response.NextContinuationToken;
  }
  throw new Error(
    `Backblaze New File: the watched folder holds more than ${MAX_PAGES * 1000} files, too many to scan each poll. Set a narrower Folder Path.`,
  );
}

function selectNewObjects({
  objects,
  state,
}: {
  objects: _Object[];
  state: PollState;
}): { items: NewFileItem[]; nextState: PollState } {
  const seen = new Set(state.seenKeys);
  const fresh = objects
    .filter((object) => {
      const ms = toMs(object.LastModified);
      if (ms > state.lastModifiedMs) {
        return true;
      }
      return ms === state.lastModifiedMs && !seen.has(object.Key ?? '');
    })
    .sort((a, b) => toMs(a.LastModified) - toMs(b.LastModified));
  const maxMs = fresh.reduce(
    (acc, object) => (toMs(object.LastModified) > acc ? toMs(object.LastModified) : acc),
    state.lastModifiedMs,
  );
  const boundaryKeys = objects
    .filter((object) => toMs(object.LastModified) === maxMs)
    .map((object) => object.Key ?? '');
  const carriedKeys = maxMs === state.lastModifiedMs ? state.seenKeys : [];
  return {
    items: fresh.map(toItem),
    nextState: {
      lastModifiedMs: maxMs,
      seenKeys: Array.from(new Set([...carriedKeys, ...boundaryKeys])),
    },
  };
}

function seedFromLegacy({
  legacyItem,
  objects,
}: {
  legacyItem: unknown;
  objects: _Object[];
}): PollState | null {
  if (typeof legacyItem === 'string' && legacyItem !== '') {
    const match = objects.find((object) => object.Key === legacyItem);
    return match?.LastModified ? { lastModifiedMs: match.LastModified.getTime(), seenKeys: [legacyItem] } : null;
  }
  if (typeof legacyItem === 'object' && legacyItem !== null && 'Key' in legacyItem && typeof legacyItem.Key === 'string') {
    const lastModified = 'LastModified' in legacyItem ? parseLegacyDate(legacyItem.LastModified) : null;
    if (lastModified !== null) {
      return { lastModifiedMs: lastModified, seenKeys: [legacyItem.Key] };
    }
    return seedFromLegacy({ legacyItem: legacyItem.Key, objects });
  }
  return null;
}

function parseLegacyDate(value: unknown): number | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.getTime();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? null : ms;
  }
  return null;
}

function toMs(date: Date | undefined): number {
  return date ? date.getTime() : 0;
}

function toItem(object: _Object): NewFileItem {
  return {
    Key: object.Key ?? '',
    LastModified: object.LastModified ? object.LastModified.toISOString() : null,
    ETag: object.ETag ?? null,
    Size: object.Size ?? null,
    StorageClass: object.StorageClass ?? null,
  };
}

async function readState({ store }: { store: Store }): Promise<PollState | null> {
  const value = await store.get<unknown>(STATE_KEY);
  if (
    typeof value === 'object' &&
    value !== null &&
    'lastModifiedMs' in value &&
    typeof value.lastModifiedMs === 'number' &&
    'seenKeys' in value &&
    Array.isArray(value.seenKeys)
  ) {
    return {
      lastModifiedMs: value.lastModifiedMs,
      seenKeys: value.seenKeys.filter((key): key is string => typeof key === 'string'),
    };
  }
  return null;
}

const STATE_KEY = 'backblaze_new_file_state';
const LEGACY_KEY = 'lastItem';
const MAX_PAGES = 50;

export const newFileTriggerInternals = { selectNewObjects, normalizePrefix, seedFromLegacy };

type PollState = {
  lastModifiedMs: number;
  seenKeys: string[];
};

type NewFileItem = {
  Key: string;
  LastModified: string | null;
  ETag: string | null;
  Size: number | null;
  StorageClass: string | null;
};
