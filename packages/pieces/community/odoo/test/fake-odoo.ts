import { vi } from 'vitest';

export const fake = (() => {
  const state: FakeState = {
    calls: [],
    routes: new Map(),
    authUid: 2,
    version: { server_version: '18.0', server_serie: '18.0', protocol_version: 1 },
  };
  function client({ options, secure }: { options: ClientOptions; secure: boolean }) {
    return {
      methodCall(method: string, params: unknown[], cb: (err: unknown, value?: unknown) => void) {
        state.calls.push({ ...options, secure, method, params });
        try {
          if (method === 'authenticate') return cb(null, state.authUid);
          if (method === 'version') return cb(null, state.version);
          const call = toKwCall(params);
          const handler = state.routes.get(`${call.model}.${call.method}`) ?? state.routes.get(`*.${call.method}`);
          if (!handler) return cb({ faultCode: 1, faultString: `no fake route for ${call.model}.${call.method}` });
          return cb(null, handler(call));
        } catch (error) {
          return cb(error);
        }
      },
    };
  }
  return { state, client };
})();

vi.mock('xmlrpc', () => ({
  createClient: (options: ClientOptions) => fake.client({ options, secure: false }),
  createSecureClient: (options: ClientOptions) => fake.client({ options, secure: true }),
}));

export function resetFake() {
  fake.state.calls.length = 0;
  fake.state.routes.clear();
  fake.state.authUid = 2;
  fake.state.version = { server_version: '18.0', server_serie: '18.0', protocol_version: 1 };
}

export function route({ key, handler }: { key: string; handler: Route }) {
  fake.state.routes.set(key, handler);
}

export function fault(message: string): never {
  throw { faultCode: 1, faultString: `Traceback (most recent call last):\n  File "x.py"\n${message}` };
}

export function userFault(message: string): never {
  throw { faultCode: 4, faultString: message };
}

export function kwCalls(): KwCall[] {
  return fake.state.calls.filter((c) => c.method === 'execute_kw').map((c) => toKwCall(c.params));
}

export function callsTo({ model, method }: { model: string; method: string }): KwCall[] {
  return kwCalls().filter((c) => c.model === model && c.method === method);
}

export function firstArgList(call: KwCall): unknown[] {
  const [first] = call.args;
  return Array.isArray(first) ? first : [];
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function asRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`expected an object, got ${JSON.stringify(value)}`);
  return value;
}

export function asRecords(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) throw new Error(`expected a list, got ${JSON.stringify(value)}`);
  const records = value.filter(isRecord);
  if (records.length !== value.length) throw new Error('expected a list of objects');
  return records;
}

export const AUTH_PROPS = {
  base_url: 'https://acme.odoo.com',
  database: 'acme',
  username: 'bot@acme.example',
  api_key: 'key-123',
};

export function auth(extra: Record<string, unknown> = {}) {
  return { type: 'CUSTOM_AUTH', props: { ...AUTH_PROPS, ...extra } };
}

export function fieldsOf(spec: Record<string, string>) {
  return Object.fromEntries(Object.entries(spec).map(([name, type]) => [name, { type, string: name }]));
}

export function evalDomain({ record, domain }: { record: Record<string, unknown>; domain: unknown[] }): boolean {
  let index = 0;
  const next = (): boolean => {
    const term = domain[index++];
    if (term === '&') return [next(), next()].every(Boolean);
    if (term === '|') return [next(), next()].some(Boolean);
    if (term === '!') return !next();
    if (!Array.isArray(term) || term.length !== 3) throw new Error(`fake domain term ${JSON.stringify(term)}`);
    const field = String(term[0]);
    const operator = String(term[1]);
    const value: unknown = term[2];
    const actual = record[field];
    if (operator === '=') return actual === value;
    if (operator === '!=') return actual !== value;
    if (operator === 'in') return Array.isArray(value) && value.includes(actual);
    if (operator === 'not in') return Array.isArray(value) && !value.includes(actual);
    if (actual === null || actual === undefined || actual === false) return false;
    const cmp = typeof actual === 'number' && typeof value === 'number' ? actual - value : String(actual).localeCompare(String(value));
    if (operator === '>') return cmp > 0;
    if (operator === '>=') return cmp >= 0;
    if (operator === '<') return cmp < 0;
    if (operator === '<=') return cmp <= 0;
    throw new Error(`fake domain operator ${operator}`);
  };
  const results: boolean[] = [];
  while (index < domain.length) results.push(next());
  return results.every(Boolean);
}

export function routeTable({ model, dateField, rows }: { model: string; dateField: string; rows: TableRow[] }) {
  const view = (row: TableRow) => ({ ...row.values, id: row.id, [dateField]: row.stamp });
  const matching = (call: KwCall) => rows.filter((row) => evalDomain({ record: view(row), domain: firstArgList(call) }));
  const sorted = (call: KwCall) => {
    const keys = String(call.kwargs['order'] ?? 'id asc').split(',').map((part) => part.trim().split(/\s+/));
    return [...matching(call)].sort((a, b) => {
      for (const [field, direction] of keys) {
        const left = view(a)[field];
        const right = view(b)[field];
        const cmp = typeof left === 'number' && typeof right === 'number' ? left - right : String(left) < String(right) ? -1 : String(left) > String(right) ? 1 : 0;
        if (cmp !== 0) return direction === 'desc' ? -cmp : cmp;
      }
      return 0;
    });
  };
  const limited = (call: KwCall) => {
    const limit = call.kwargs['limit'];
    return typeof limit === 'number' ? sorted(call).slice(0, limit) : sorted(call);
  };
  route({ key: `${model}.search`, handler: (call) => limited(call).map((row) => row.id) });
  route({
    key: `${model}.search_read`,
    handler: (call) => limited(call).map((row) => ({ ...row.values, id: row.id, [dateField]: row.stamp.slice(0, 19) })),
  });
}

export function memoryStore() {
  const data = new Map<string, unknown>();
  return {
    data,
    get: async (key: string) => (data.has(key) ? data.get(key) : null),
    put: async (key: string, value: unknown) => {
      data.set(key, value);
      return value;
    },
    delete: async (key: string) => {
      data.delete(key);
    },
  };
}

function toKwCall(params: unknown[]): KwCall {
  const [, , , model, method, args, kwargs] = params;
  return {
    model: String(model),
    method: String(method),
    args: Array.isArray(args) ? args : [],
    kwargs: isRecord(kwargs) ? kwargs : {},
    raw: params,
  };
}

type ClientOptions = { host: string; port: number; path: string };

export type TableRow = { id: number; stamp: string; values: Record<string, unknown> };

type Route = (call: KwCall) => unknown;

type FakeState = {
  calls: RpcCall[];
  routes: Map<string, Route>;
  authUid: unknown;
  version: Record<string, unknown>;
};

export type RpcCall = {
  host: string;
  port: number;
  path: string;
  secure: boolean;
  method: string;
  params: unknown[];
};

export type KwCall = { model: string; method: string; args: unknown[]; kwargs: Record<string, unknown>; raw: unknown[] };
