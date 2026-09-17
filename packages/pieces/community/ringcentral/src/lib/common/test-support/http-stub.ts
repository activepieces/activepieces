import { HttpError, httpClient } from '@activepieces/pieces-common';
import { vi } from 'vitest';

export type Recorded = {
  method: string;
  url: string;
  body?: Record<string, unknown>;
  queryParams?: Record<string, string>;
  timeout?: number;
  retries?: number;
  responseType?: string;
  authentication?: { type: string; token?: string };
};

export type Handler = Record<string, unknown> | ((req: { url: string }) => unknown);

/** Builds a real HttpError so `err instanceof HttpError` and its getters behave live. */
export function httpError(status: number, responseBody: unknown): HttpError {
  return new HttpError({}, { status, responseBody });
}

/**
 * Replaces `httpClient.sendRequest` for the duration of a test file. Routes are matched by
 * substring against the URL; an unrouted call fails loudly instead of returning a plausible
 * empty object.
 */
export function stubHttp() {
  const calls: Recorded[] = [];
  const routes: Array<{ fragment: string; handler: Handler }> = [];

  vi.spyOn(httpClient, 'sendRequest').mockImplementation((async (req: Recorded) => {
    calls.push({
      method: req.method,
      url: req.url,
      body: req.body,
      queryParams: req.queryParams,
      timeout: req.timeout,
      retries: req.retries,
      responseType: req.responseType,
      authentication: req.authentication,
    });

    const route = routes.find((r) => req.url.includes(r.fragment));
    if (!route) throw new Error(`no stub route for ${req.url}`);

    const result =
      typeof route.handler === 'function' ? route.handler({ url: req.url }) : route.handler;
    if (result instanceof Error) throw result;
    return { status: 200, headers: {}, body: result };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any);

  return {
    calls,
    route(fragment: string, handler: Handler) {
      const existing = routes.findIndex((r) => r.fragment === fragment);
      if (existing !== -1) routes.splice(existing, 1);
      routes.push({ fragment, handler });
    },
    find: (fragment: string) => calls.find((c) => c.url.includes(fragment)),
  };
}

/** In-memory stand-in for `context.store`. */
export function memStore() {
  const m = new Map<string, unknown>();
  return {
    map: m,
    get: async <T>(k: string) => (m.has(k) ? (m.get(k) as T) : null),
    put: async <T>(k: string, v: T) => {
      m.set(k, v);
      return v;
    },
    delete: async (k: string) => {
      m.delete(k);
    },
  };
}

/** In-memory stand-in for `context.files`, which the attachment download writes through. */
export function memFiles() {
  const written: Array<{ fileName: string; data: Buffer }> = [];
  return {
    written,
    write: async ({ fileName, data }: { fileName: string; data: Buffer }) => {
      written.push({ fileName, data });
      return `mock://files/${fileName}`;
    },
  };
}

/** An OAuth2 connection value as the platform hands it to a piece. */
export function oauth(overrides: Record<string, unknown> = {}) {
  return {
    access_token: 'RC_TOKEN',
    props: { environment: 'platform.devtest.ringcentral.com' },
    ...overrides,
  };
}
