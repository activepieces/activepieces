import { Readable } from 'stream';
import { vi } from 'vitest';
import { AppConnectionType } from '@activepieces/pieces-framework';

export type Call = { sql: string; binds: unknown[] | undefined };
type Responder = { match: RegExp; rows: Record<string, unknown>[] | Error };

export const state: State = {
  calls: [],
  responders: [],
  connectError: undefined,
  lastOptions: undefined,
  queryStatus: 'SUCCESS',
};

export function resetSnowflake() {
  state.calls = [];
  state.responders = [];
  state.connectError = undefined;
  state.lastOptions = undefined;
  state.queryStatus = 'SUCCESS';
  fakeSdk.createConnection.mockClear();
  fakeSdk.configure.mockClear();
}

export function respond({ match, rows }: { match: RegExp; rows: Record<string, unknown>[] | Error }) {
  state.responders.push({ match, rows });
}

export function userCalls(): Call[] {
  return state.calls.filter((call) => !call.sql.startsWith('ALTER SESSION SET STATEMENT_TIMEOUT'));
}

export function lastCall(): Call {
  const calls = userCalls();
  const call = calls[calls.length - 1];
  if (!call) throw new Error('no call');
  return call;
}

function statement(rows: Record<string, unknown>[]) {
  return {
    getNumRows: () => rows.length,
    getQueryId: () => '01b2c3d4-0000-1234-0000-0001a2b3c4d5',
    getColumns: () => Object.keys(rows[0] ?? {}).map((name) => ({ getName: () => name })),
    streamRows: ({ start = 0, end }: { start?: number; end?: number }) =>
      Readable.from(rows.slice(start, (end ?? rows.length - 1) + 1)),
  };
}

const connection = {
  connect: (cb: (error?: Error) => void) => cb(state.connectError),
  destroy: (cb: (error?: Error) => void) => cb(undefined),
  getQueryStatus: async () => state.queryStatus,
  execute: ({
    sqlText,
    binds,
    complete,
  }: {
    sqlText: string;
    binds?: unknown[];
    complete: (error: Error | undefined, stmt: unknown) => void;
  }) => {
    state.calls.push({ sql: sqlText, binds });
    const responder = state.responders.find((r) => r.match.test(sqlText));
    const rows = responder ? responder.rows : [];
    if (rows instanceof Error) {
      complete(rows, statement([]));
      return;
    }
    complete(undefined, statement(rows));
  },
};

export const fakeSdk = {
  configure: vi.fn(),
  createConnection: vi.fn((options: Record<string, unknown>) => {
    state.lastOptions = options;
    return connection;
  }),
};

export const customAuth = {
  type: AppConnectionType.CUSTOM_AUTH,
  props: {
    account: 'org-acct',
    username: 'AP_TEST',
    password: 'secret',
    database: 'AP_TEST_DB',
    warehouse: 'AP_TEST_WH',
  },
};

export const oauthAuth = {
  type: AppConnectionType.OAUTH2,
  access_token: 'token-123',
  props: { account: 'org-acct', role: 'AP_ROLE' },
};

export function runAction({
  action,
  propsValue,
  auth = customAuth,
}: {
  action: { run: (...args: never[]) => Promise<unknown> };
  propsValue: Record<string, unknown>;
  auth?: unknown;
}): Promise<unknown> {
  return Reflect.apply(action.run, action, [{ auth, propsValue }]);
}

export function callHook({
  trigger,
  hook,
  context,
}: {
  trigger: object;
  hook: 'onEnable' | 'onDisable' | 'run' | 'test';
  context: unknown;
}): Promise<unknown> {
  const fn: unknown = Reflect.get(trigger, hook);
  if (typeof fn !== 'function') throw new Error(`missing ${hook}`);
  return Reflect.apply(fn, trigger, [context]);
}

type State = {
  calls: Call[];
  responders: Responder[];
  connectError: Error | undefined;
  lastOptions: Record<string, unknown> | undefined;
  queryStatus: string;
};

export function memoryStore() {
  const data = new Map<string, unknown>();
  return {
    data,
    store: {
      get: async (key: string) => (data.has(key) ? data.get(key) : null),
      put: async (key: string, value: unknown) => {
        data.set(key, value);
        return value;
      },
      delete: async (key: string) => {
        data.delete(key);
      },
    },
  };
}
