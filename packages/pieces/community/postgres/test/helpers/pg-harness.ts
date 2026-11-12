import { PGlite } from '@electric-sql/pglite';
import { AppConnectionType, createMockPollingTriggerContext, FilesService, TriggerStrategy } from '@activepieces/pieces-framework';
import type { OrderDirection } from '../../src/lib/new-row-poller';
import type { newRow } from '../../src/lib/triggers/new-row';

const state: PgShimState = { db: undefined, parsers: undefined, queries: [] };

function mockPg({ actual }: { actual?: unknown }) {
  if (actual !== undefined) {
    const getTypeParser = findTypeParser(actual);
    const parsers: Record<number, (value: string) => unknown> = {};
    for (let oid = 1; oid < 5000; oid++) {
      const parser = getTypeParser(oid, 'text');
      parsers[oid] = (value: string) => parser(value);
    }
    state.parsers = parsers;
  }
  class Client {
    async connect(): Promise<void> {
      return;
    }
    async end(): Promise<void> {
      return;
    }
    async query(sql: string) {
      state.queries.push(sql);
      const db = state.db;
      if (db === undefined) {
        throw new Error('pg shim: set pgHarness.state.db before running the trigger');
      }
      const result = state.parsers === undefined ? await db.query(sql) : await db.query(sql, [], { parsers: state.parsers });
      return { rows: result.rows, fields: result.fields, rowCount: result.rows.length };
    }
  }
  const base = isRecord(actual) ? actual : {};
  const defaultExport = base['default'];
  return { ...base, Client, default: { ...(isRecord(defaultExport) ? defaultExport : base), Client } };
}

function findTypeParser(mod: unknown): (oid: number, format: string) => (value: string) => unknown {
  const candidates = [mod, isRecord(mod) ? mod['default'] : undefined];
  for (const candidate of candidates) {
    const types = isRecord(candidate) ? candidate['types'] : undefined;
    const getTypeParser = isRecord(types) ? types['getTypeParser'] : undefined;
    if (typeof getTypeParser === 'function') {
      return (oid, format) => getTypeParser(oid, format);
    }
  }
  throw new Error('pg shim: pg.types.getTypeParser not found');
}

function memoryStore() {
  const data = new Map<string, string>();
  return {
    data,
    store: {
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
    },
  };
}

function storeValue({ data, key }: { data: Map<string, string>; key: string }): unknown {
  const raw = data.get(key);
  return raw === undefined ? undefined : JSON.parse(raw);
}

function hookContext({ store, table, schema, orderBy, direction, isRepublish, host, port }: Target): NewRowContext {
  return {
    ...createMockPollingTriggerContext<NewRowProps>({
      propsValue: {
        description: undefined,
        table: { table_schema: schema ?? 'public', table_name: table },
        order_by: orderBy ?? 'created_at',
        order_direction: direction ?? 'DESC',
      },
    }),
    auth: {
      type: AppConnectionType.CUSTOM_AUTH,
      props: { host: host ?? 'db', port: port ?? 5432, user: 'u', password: 'p', database: 'd', enable_ssl: false, reject_unauthorized: false, certificate: undefined },
    },
    store,
    files: unusedFiles,
    isRepublish,
  };
}

function asPolling<T extends { type: TriggerStrategy }>(trigger: T): Extract<T, { type: TriggerStrategy.POLLING }> {
  if (!isPolling(trigger)) {
    throw new Error('expected a polling trigger');
  }
  return trigger;
}

function isPolling<T extends { type: TriggerStrategy }>(trigger: T): trigger is Extract<T, { type: TriggerStrategy.POLLING }> {
  return trigger.type === TriggerStrategy.POLLING;
}

function rowField({ row, key }: { row: unknown; key: string }): unknown {
  return isRecord(row) ? row[key] : undefined;
}

function names({ events, column }: { events: unknown[]; column?: string }): string[] {
  return events.map((row) => String(rowField({ row, key: column ?? 'name' })));
}

function keysOf(value: unknown): string[] {
  return isRecord(value) ? Object.keys(value) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

const unusedFiles: FilesService = {
  write: async () => {
    throw new Error('files are not used by the Postgres triggers');
  },
  upload: async () => {
    throw new Error('files are not used by the Postgres triggers');
  },
};

export const pgHarness = { state, mockPg, memoryStore, storeValue, hookContext, asPolling, rowField, names, keysOf };

type PollingNewRow = Extract<typeof newRow, { type: TriggerStrategy.POLLING }>;
type NewRowProps = PollingNewRow['props'];
type NewRowContext = Parameters<PollingNewRow['run']>[0];
export type MemoryStore = ReturnType<typeof memoryStore>['store'];
export type Target = {
  store: MemoryStore;
  table: string;
  schema?: string;
  orderBy?: string;
  direction?: OrderDirection;
  isRepublish?: boolean;
  host?: string;
  port?: number;
};
type PgShimState = {
  db: PGlite | undefined;
  parsers: Record<number, (value: string) => unknown> | undefined;
  queries: string[];
};
