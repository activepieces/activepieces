import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { vtigerAuth } from '../auth';
import { elementTypeProperty, propText } from '../common';
import { isRecord, VtigerApiError, VtigerCredentials, vtigerRest } from '../rest-client';
import { restOrVtws, vtwsCall, vtwsLogin, vtwsQuery, VtwsSession } from '../vtws';
import { assertModuleName, clampLimit } from '../vtql';

dayjs.extend(utc);

export function vtigerTimeToEpochMs(value: unknown): number {
  if (typeof value !== 'string' || value.trim() === '') {
    return 0;
  }
  const parsed = dayjs.utc(value.trim(), 'YYYY-MM-DD HH:mm:ss');
  return parsed.isValid() ? parsed.valueOf() : 0;
}

export async function fetchChangedRecords({
  creds,
  module,
  syncType,
  limit,
  lastFetchEpochMS,
}: {
  creds: VtigerCredentials;
  module: string;
  syncType: string;
  limit: number;
  lastFetchEpochMS: number;
}): Promise<Record<string, unknown>[]> {
  const transport = changeTransport(creds);
  let modifiedTimeSec = Math.floor(lastFetchEpochMS / 1000);
  let changed: SyncItem[] = [];
  let more = true;
  let pages = 0;
  while (more && changed.length < limit && pages < MAX_SYNC_PAGES) {
    const res = await transport.sync({ modifiedTime: String(modifiedTimeSec), elementType: module, syncType });
    const deleted = new Set(syncIds(res.deleted));
    const seen = new Set(changed.map((item) => item.id));
    const fresh = syncItems(res.updated).filter((item) => !deleted.has(item.id) && !seen.has(item.id));
    changed = [...changed, ...fresh].slice(0, limit);
    more = res.more === true;
    const next = Number(res.lastModifiedTime);
    if (!Number.isFinite(next) || next <= modifiedTimeSec) {
      break;
    }
    modifiedTimeSec = next;
    pages++;
  }
  const records: Record<string, unknown>[] = [];
  for (const item of changed) {
    const record = item.record ?? (await retrieveUnlessDeleted({ retrieve: transport.retrieve, id: item.id }));
    if (record !== undefined) {
      records.push(record);
    }
  }
  return records;
}

export function isMissingRecordError(error: unknown): boolean {
  return (
    error instanceof VtigerApiError &&
    (error.status === 400 || error.status === 404 || MISSING_RECORD_CODES.has(error.code))
  );
}

async function retrieveUnlessDeleted({
  retrieve,
  id,
}: {
  retrieve: (id: string) => Promise<Record<string, unknown>>;
  id: string;
}): Promise<Record<string, unknown> | undefined> {
  try {
    return await retrieve(id);
  } catch (error) {
    if (isMissingRecordError(error)) {
      return undefined;
    }
    throw error;
  }
}

export async function fetchNewestRecords({
  creds,
  module,
  watchBy,
}: {
  creds: VtigerCredentials;
  module: string;
  watchBy: string;
}): Promise<Record<string, unknown>[]> {
  const column = watchBy === 'createdtime' ? 'createdtime' : 'modifiedtime';
  const query = `SELECT * FROM ${assertModuleName(module)} ORDER BY ${column} DESC LIMIT ${TEST_SAMPLE_SIZE};`;
  const rows = await restOrVtws<unknown>({
    rest: () => vtigerRest<unknown>({ creds, method: HttpMethod.GET, path: 'query', query: { query } }),
    vtws: async () => vtwsQuery<unknown>({ creds, session: await vtwsLogin(creds), query }),
  });
  return Array.isArray(rows) ? rows.filter(isRecord) : [];
}

function changeTransport(creds: VtigerCredentials) {
  let mode: 'rest' | 'vtws' = 'rest';
  let session: Promise<VtwsSession> | undefined;
  const vtwsSession = () => {
    session ??= vtwsLogin(creds);
    return session;
  };
  const vtwsSync = async (params: Record<string, string>) =>
    (await vtwsCall<SyncResult>({ creds, session: await vtwsSession(), operation: 'sync', params })).result;
  const vtwsRetrieve = async (id: string) =>
    (await vtwsCall<Record<string, unknown>>({ creds, session: await vtwsSession(), operation: 'retrieve', params: { id } }))
      .result;
  return {
    sync: async (params: Record<string, string>): Promise<SyncResult> => {
      if (mode === 'vtws') {
        return vtwsSync(params);
      }
      return restOrVtws<SyncResult>({
        rest: () => vtigerRest<SyncResult>({ creds, method: HttpMethod.GET, path: 'sync', query: params }),
        vtws: () => {
          mode = 'vtws';
          return vtwsSync(params);
        },
      });
    },
    retrieve: async (id: string): Promise<Record<string, unknown>> =>
      mode === 'vtws'
        ? vtwsRetrieve(id)
        : vtigerRest<Record<string, unknown>>({ creds, method: HttpMethod.GET, path: 'retrieve', query: { id } }),
  };
}

function syncItems(value: unknown): SyncItem[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item): SyncItem[] => {
    if (typeof item === 'string') {
      return [{ id: item }];
    }
    if (isRecord(item) && typeof item['id'] === 'string') {
      return [{ id: item['id'], record: Object.keys(item).length > 1 ? item : undefined }];
    }
    return [];
  });
}

export const newOrUpdatedRecord = createTrigger({
  auth: vtigerAuth,
  name: 'new_or_updated_record',
  classification: 'READ',
  displayName: 'New or Updated Record',
  description:
    'Triggers when a new record is introduced or a record is updated. Deleted records are not emitted.',
  aiMetadata: {
    description:
      'Fires when a record in the selected Vtiger module (element type) is created or modified, polling the sync API. Whether new records, updated records, or both fire is governed by the watched timestamp column (created time vs. modified time); the sync scope can be limited to the user, their groups, or the whole application. Deletions are not emitted.',
  },
  props: {
    elementType: elementTypeProperty,
    watchBy: Property.StaticDropdown({
      displayName: 'Watch By',
      description: 'Column to watch for trigger',
      required: true,
      options: {
        options: [
          { value: 'createdtime', label: 'Created Time' },
          { value: 'modifiedtime', label: 'Modified Time' },
        ],
      },
    }),
    syncType: Property.StaticDropdown({
      displayName: 'Sync Scope',
      description: 'Records visibility scope for sync',
      required: false,
      options: {
        options: [
          { value: 'application', label: 'Application (all records)' },
          { value: 'userandgroup', label: "User's groups" },
          { value: 'user', label: 'User only' },
        ],
      },
      defaultValue: 'application',
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Enter the maximum number of records to return per poll (1 to 1000).',
      defaultValue: 100,
      required: true,
    }),
  },
  sampleData: {
    id: '3x291',
    createdtime: '2020-07-22 12:46:55',
    modifiedtime: '2020-07-22 12:46:55',
  },
  type: TriggerStrategy.POLLING,
  async test(ctx) {
    const records = await fetchNewestRecords({
      creds: ctx.auth.props,
      module: propText(ctx.propsValue.elementType),
      watchBy: propText(ctx.propsValue.watchBy),
    });
    return records;
  },
  async onEnable(ctx) {
    await pollingHelper.onEnable(polling, ctx);
  },
  async onDisable(ctx) {
    await pollingHelper.onDisable(polling, ctx);
  },
  async run(ctx) {
    return await pollingHelper.poll(polling, ctx);
  },
});

function syncIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item): string[] => {
    if (typeof item === 'string') {
      return [item];
    }
    if (typeof item === 'object' && item !== null && 'id' in item && typeof item.id === 'string') {
      return [item.id];
    }
    return [];
  });
}

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof vtigerAuth>,
  { elementType?: string; watchBy?: string; limit?: number; syncType?: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const items = await fetchChangedRecords({
      creds: auth.props,
      module: assertModuleName(propsValue.elementType),
      syncType: propsValue.syncType || 'application',
      limit: clampLimit({ value: propsValue.limit, fallback: 100, max: 1000 }),
      lastFetchEpochMS: lastFetchEpochMS || 0,
    });
    return items.map((item) => ({
      epochMilliSeconds: vtigerTimeToEpochMs(
        propsValue.watchBy === 'createdtime' ? item['createdtime'] : item['modifiedtime']
      ),
      data: item,
    }));
  },
};

const MAX_SYNC_PAGES = 10;
const MISSING_RECORD_CODES = new Set(['RECORD_NOT_FOUND']);
const TEST_SAMPLE_SIZE = 5;

type SyncResult = {
  updated?: unknown;
  deleted?: unknown;
  more?: boolean;
  lastModifiedTime?: number | string;
};

type SyncItem = { id: string; record?: Record<string, unknown> };
