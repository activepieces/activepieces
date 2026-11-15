import { HttpRequest, HttpResponse, httpClient } from '@activepieces/pieces-common';

export const SECRET = 'sk_test_fixture_secret_000000000000';
export const AUTH = { secret_text: SECRET };

export type Reply = { status?: number; body?: unknown } | { error: { status: number; body: unknown } };

export function mockKit(replies: Reply[]) {
  const requests: HttpRequest[] = [];
  const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest): Promise<HttpResponse> => {
    requests.push(request);
    const reply = replies.shift() ?? { status: 200, body: {} };
    if ('error' in reply) {
      throw Object.assign(new Error(`Request failed with status ${reply.error.status}: ${JSON.stringify(request)}`), {
        response: { status: reply.error.status, body: reply.error.body },
      });
    }
    return { status: reply.status ?? 200, headers: {}, body: reply.body ?? {} };
  });
  return { requests, spy };
}

export function call({ target, method, context }: { target: object; method: string; context: unknown }): Promise<unknown> {
  const fn: unknown = Reflect.get(target, method);
  if (typeof fn !== 'function') {
    throw new Error(`${method} is not a function`);
  }
  return Promise.resolve(Reflect.apply(fn, target, [context]));
}

export function run({ action, propsValue }: { action: object; propsValue: Record<string, unknown> }) {
  return call({ target: action, method: 'run', context: { auth: AUTH, propsValue } });
}

export function messageOf(error: unknown): string {
  if (!(error instanceof Error)) {
    throw new Error('expected an Error');
  }
  return error.message;
}
