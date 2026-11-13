import { vi } from 'vitest';

export type GraphqlCall = {
  url: string;
  headers: Record<string, string>;
  operation: string;
  query: string;
  variables: Record<string, unknown>;
  redirect: string | undefined;
};

export type FakeReply = { status?: number; body: unknown };

export type Handler = (call: GraphqlCall) => FakeReply | undefined;

export function operationName(query: string): string {
  const match = /^\s*(?:query|mutation)\s+(\w+)/.exec(query);
  return match ? match[1] : 'anonymous';
}

export function stubGraphql(handlers: Record<string, Handler | FakeReply | FakeReply[] | unknown>) {
  const calls: GraphqlCall[] = [];
  const queues = new Map<string, FakeReply[]>();
  const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
    const headers: Record<string, string> = {};
    new Headers(init?.headers).forEach((value, key) => {
      headers[key] = value;
    });
    const parsed = JSON.parse(String(init?.body ?? '{}'));
    const call: GraphqlCall = {
      url: String(input),
      headers,
      operation: operationName(parsed.query),
      query: parsed.query,
      variables: parsed.variables,
      redirect: init?.redirect,
    };
    calls.push(call);
    const reply = resolve({ call, handlers, queues });
    return new Response(JSON.stringify(reply.body), {
      status: reply.status ?? 200,
      headers: { 'content-type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return calls;
}

function resolve({
  call,
  handlers,
  queues,
}: {
  call: GraphqlCall;
  handlers: Record<string, unknown>;
  queues: Map<string, FakeReply[]>;
}): FakeReply {
  if (call.operation === 'GetGuestToken' && !(call.operation in handlers)) {
    return { body: { data: { tokens: { accessToken: GUEST_TOKEN } } } };
  }
  if (call.operation === 'Login' && !(call.operation in handlers)) {
    return { body: { data: { loginNetwork: { accessToken: MEMBER_TOKEN, member: { id: SELF_ID, name: 'Self' } } } } };
  }
  const handler = handlers[call.operation];
  if (handler === undefined) {
    throw new Error(`Unexpected operation ${call.operation}`);
  }
  if (typeof handler === 'function') {
    const reply = handler(call);
    if (reply === undefined) {
      throw new Error(`Handler for ${call.operation} returned nothing`);
    }
    return reply;
  }
  if (Array.isArray(handler)) {
    const queue = queues.get(call.operation) ?? [...handler];
    queues.set(call.operation, queue);
    const next = queue.shift();
    if (next === undefined) {
      throw new Error(`No more replies for ${call.operation}`);
    }
    return next;
  }
  if (isReply(handler)) {
    return handler;
  }
  return { body: { data: handler } };
}

function isReply(value: unknown): value is FakeReply {
  return typeof value === 'object' && value !== null && 'body' in value;
}

export function makeAuth(overrides: Record<string, string> = {}) {
  return {
    region: 'https://api.bettermode.com',
    domain: 'community.example.com',
    email: 'admin@example.com',
    password: 'hunter2-secret',
    ...overrides,
  };
}

export function makeStore() {
  const data = new Map<string, unknown>();
  return {
    data,
    get: vi.fn(async (key: string) => (data.has(key) ? data.get(key) : null)),
    put: vi.fn(async (key: string, value: unknown) => {
      data.set(key, value);
      return value;
    }),
    delete: vi.fn(async (key: string) => {
      data.delete(key);
    }),
  };
}

export function makeContext({ props = {}, auth = makeAuth() }: { props?: Record<string, unknown>; auth?: Record<string, string> }) {
  const connection = { type: 'CUSTOM_AUTH', props: auth };
  return {
    auth: connection,
    propsValue: { auth: connection, ...props },
    store: makeStore(),
  };
}

export function call({ fn, ctx }: { fn: unknown; ctx: unknown }): Promise<unknown> {
  if (typeof fn !== 'function') {
    throw new Error('not callable');
  }
  return fn(ctx);
}

export function businessCalls(calls: GraphqlCall[]): GraphqlCall[] {
  return calls.filter((item) => item.operation !== 'GetGuestToken' && item.operation !== 'Login');
}

export function pageOf(input: unknown[] | { nodes: unknown[]; hasNextPage?: boolean; endCursor?: string | null }) {
  const { nodes, hasNextPage = false, endCursor = null } = Array.isArray(input) ? { nodes: input } : input;
  return { nodes, pageInfo: { hasNextPage, endCursor }, totalCount: nodes.length };
}

export const GUEST_TOKEN = 'guest-token';
export const MEMBER_TOKEN = 'member-token';
export const SELF_ID = 'selfMember1';
