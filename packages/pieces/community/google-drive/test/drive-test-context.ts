import {
  AppConnectionType,
  createMockActionContext,
  createMockPollingTriggerContext,
  FilesService,
  InputPropertyMap,
  StaticPropsValue,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { drive_v3 } from '@googleapis/drive';
import { Readable } from 'node:stream';
import { vi } from 'vitest';
import { GoogleDriveAuthValue } from '../src/lib/auth';

const connection: GoogleDriveAuthValue = {
  type: AppConnectionType.OAUTH2,
  access_token: 'ya29.test',
  refresh_token: 'refresh',
  token_type: 'Bearer',
  expires_in: 3600,
  claimed_at: 0,
  scope: '',
  client_id: 'client',
  client_secret: 'secret',
  redirect_url: 'https://example.com/redirect',
  token_url: 'https://oauth2.googleapis.com/token',
  data: {},
};

function memoryStore() {
  const data = new Map<string, string>();
  return {
    data,
    put: async <T>(key: string, value: T): Promise<T> => {
      data.set(key, JSON.stringify(value));
      return value;
    },
    get: async <T>(key: string): Promise<T | null> => {
      const raw = data.get(key);
      return raw === undefined ? null : JSON.parse(raw);
    },
    delete: async (key: string): Promise<void> => {
      data.delete(key);
    },
    read: (key: string): unknown => {
      const raw = data.get(key);
      return raw === undefined ? undefined : JSON.parse(raw);
    },
    write: (key: string, value: unknown): void => {
      data.set(key, JSON.stringify(value));
    },
  };
}

async function drainToBuffer(data: Buffer | Readable): Promise<Buffer> {
  if (Buffer.isBuffer(data)) {
    return data;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of data) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }
  return Buffer.concat(chunks);
}

const drainingFiles: FilesService = {
  write: async ({ fileName, data }) => {
    await drainToBuffer(data);
    return `https://files.example/${fileName}`;
  },
  upload: async () => {
    throw new Error('files.upload is not used by the Drive triggers');
  },
};

function asPolling<T extends { type: TriggerStrategy }>(trigger: T): Extract<T, { type: TriggerStrategy.POLLING }> {
  if (!isPolling(trigger)) {
    throw new Error('expected a polling trigger');
  }
  return trigger;
}

function isPolling<T extends { type: TriggerStrategy }>(trigger: T): trigger is Extract<T, { type: TriggerStrategy.POLLING }> {
  return trigger.type === TriggerStrategy.POLLING;
}

function triggerContext<Props extends InputPropertyMap>({
  trigger: _trigger,
  propsValue,
  store,
  files,
  isRepublish,
}: {
  trigger: { props: Props };
  propsValue: StaticPropsValue<Props>;
  store: TriggerStore;
  files?: FilesService;
  isRepublish?: boolean;
}) {
  return {
    ...createMockPollingTriggerContext<Props>({ propsValue }),
    auth: connection,
    store,
    files: files ?? drainingFiles,
    isRepublish,
  };
}

function actionContext<Props extends InputPropertyMap>({
  action: _action,
  propsValue,
  files,
}: {
  action: { props: Props };
  propsValue: StaticPropsValue<Props>;
  files?: FilesService;
}) {
  return {
    ...createMockActionContext<Props>({ propsValue }),
    auth: connection,
    files: files ?? drainingFiles,
  };
}

function listFilesResult(value: unknown): { incompleteSearch: unknown; files: unknown } {
  if (typeof value !== 'object' || value === null) {
    return { incompleteSearch: undefined, files: undefined };
  }
  return { incompleteSearch: Reflect.get(value, 'incompleteSearch'), files: Reflect.get(value, 'files') };
}

function compareTime({ value, op, bound }: { value: string; op: string; bound: string }): boolean {
  const epoch = Date.parse(value);
  return op === '>=' ? epoch >= Date.parse(bound) : epoch > Date.parse(bound);
}

function matchesTimeQuery({ q, item }: { q: string; item: TimedItem }): boolean {
  const changedClause = /\(modifiedTime (>=?) '([^']+)' or createdTime (>=?) '([^']+)'\)/;
  const changed = changedClause.exec(q);
  if (changed && !(compareTime({ value: item.modifiedTime, op: changed[1], bound: changed[2] }) || compareTime({ value: item.createdTime, op: changed[3], bound: changed[4] }))) {
    return false;
  }
  const rest = q.replace(changedClause, '');
  for (const [, field, op, bound] of rest.matchAll(/\b(createdTime|modifiedTime) (>=?) '([^']+)'/g)) {
    if (!compareTime({ value: field === 'createdTime' ? item.createdTime : item.modifiedTime, op, bound })) return false;
  }
  return true;
}

function sortForOrderBy<T extends TimedItem>({ items, orderBy }: { items: T[]; orderBy: string | undefined }): T[] {
  const key = orderBy?.startsWith('modifiedTime') ? 'modifiedTime' : 'createdTime';
  const direction = orderBy?.endsWith(' desc') ? -1 : 1;
  return [...items].sort((a, b) => direction * (Date.parse(a[key]) - Date.parse(b[key])) || a.id.localeCompare(b.id));
}

function listParams(args: unknown[]): ListParams {
  const [first] = args;
  if (typeof first !== 'object' || first === null) {
    return {};
  }
  return {
    q: stringField({ source: first, key: 'q' }),
    orderBy: stringField({ source: first, key: 'orderBy' }),
    pageToken: stringField({ source: first, key: 'pageToken' }),
    corpora: stringField({ source: first, key: 'corpora' }),
    driveId: stringField({ source: first, key: 'driveId' }),
    fields: stringField({ source: first, key: 'fields' }),
    pageSize: 'pageSize' in first && typeof first.pageSize === 'number' ? first.pageSize : undefined,
  };
}

function listSignal(args: unknown[]): AbortSignal | undefined {
  const options = args[1];
  if (typeof options === 'object' && options !== null && 'signal' in options && options.signal instanceof AbortSignal) {
    return options.signal;
  }
  return undefined;
}

function stringField({ source, key }: { source: object; key: string }): string | undefined {
  const value: unknown = Reflect.get(source, key);
  return typeof value === 'string' ? value : undefined;
}

function isDriveEvent(value: unknown): value is DriveEvent {
  return typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'string';
}

function driveEvents(events: unknown[]): DriveEvent[] {
  return events.filter(isDriveEvent);
}

async function lookupThroughFetch(...args: unknown[]) {
  const [first] = args;
  const source = typeof first === 'object' && first !== null ? first : {};
  const fileId = stringField({ source, key: 'fileId' }) ?? '';
  const fields = stringField({ source, key: 'fields' }) ?? '';
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=${encodeURIComponent(fields)}&supportsAllDrives=true`,
    { signal: listSignal(args) }
  );
  const body: unknown = await response.json();
  if (!response.ok) {
    throw Object.assign(new Error(driveErrorMessage({ body, fallback: response.statusText })), { status: response.status });
  }
  return { status: response.status, data: body };
}

function driveErrorMessage({ body, fallback }: { body: unknown; fallback: string }): string {
  if (typeof body !== 'object' || body === null || !('error' in body)) return fallback;
  const error: unknown = body.error;
  if (typeof error !== 'object' || error === null || !('message' in error)) return fallback;
  return typeof error.message === 'string' ? error.message : fallback;
}

function routeFileLookupsToFetch(): void {
  vi.spyOn(drive_v3.Resource$Files.prototype, 'get').mockImplementation(lookupThroughFetch);
}

export const driveTestContext = {
  connection,
  memoryStore,
  drainToBuffer,
  drainingFiles,
  asPolling,
  triggerContext,
  actionContext,
  listFilesResult,
  matchesTimeQuery,
  sortForOrderBy,
  driveEvents,
  listParams,
  listSignal,
  routeFileLookupsToFetch,
};

export type DriveEvent = {
  id: string;
  name?: string;
  content?: string;
  contentError?: string;
  [key: string]: unknown;
};

export type ListParams = {
  q?: string;
  orderBy?: string;
  pageToken?: string;
  corpora?: string;
  driveId?: string;
  fields?: string;
  pageSize?: number;
};

export type TriggerStore = Pick<ReturnType<typeof memoryStore>, 'put' | 'get' | 'delete'>;

export type TimedItem = { id: string; createdTime: string; modifiedTime: string };
