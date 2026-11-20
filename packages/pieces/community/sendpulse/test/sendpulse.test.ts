import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { httpClient, HttpError, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { clearSendPulseTokenCache, findWebhookId, sendpulseApiCall } from '../src/lib/common/client';
import { sendpulseAuth } from '../src/lib/common/auth';
import { updateSubscriberAction } from '../src/lib/actions/update-subscriber';
import { getContactAction } from '../src/lib/actions/get-contact';
import { listMailingListContactsAction } from '../src/lib/actions/list-mailing-list-contacts';
import { listMailingListsAction } from '../src/lib/actions/list-mailing-lists';
import { addSubscriberAction } from '../src/lib/actions/add-subscriber';
import { newSubscriberTrigger } from '../src/lib/triggers/new-subscriber';
import { newUnsubscriberTrigger } from '../src/lib/triggers/new-unsubscriber';
import { updatedSubscriberTrigger } from '../src/lib/triggers/updated-subscriber';

const AUTH_A = { clientId: 'id-a', clientSecret: 'secret-a' };
const AUTH_B = { clientId: 'id-b', clientSecret: 'secret-b' };

function stubHttp({ handler }: { handler: (request: HttpRequest) => Reply }): HttpRequest[] {
  const seen: HttpRequest[] = [];
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
    seen.push(request);
    const reply = handler(request);
    if (reply.status >= 400) {
      throw new HttpError(request.body, { status: reply.status, responseBody: reply.body });
    }
    return { status: reply.status, headers: {}, body: reply.body };
  });
  return seen;
}

function tokenFor({ request }: { request: HttpRequest }): Reply | null {
  if (!request.url.endsWith('/oauth/access_token')) {
    return null;
  }
  const body: unknown = request.body;
  const clientId = typeof body === 'object' && body !== null ? Reflect.get(body, 'client_id') : '';
  return { status: 200, body: { access_token: `token-${String(clientId)}`, expires_in: 3600 } };
}

function memoryStore() {
  const data = new Map<string, unknown>();
  return {
    data,
    async put<T>(key: string, value: T): Promise<T> {
      data.set(key, JSON.parse(JSON.stringify(value)));
      return value;
    },
    async get<T>(key: string): Promise<T | null> {
      return data.has(key) ? JSON.parse(JSON.stringify(data.get(key))) : null;
    },
    async delete(key: string): Promise<void> {
      data.delete(key);
    },
  };
}

function authHeader({ request }: { request: HttpRequest }): unknown {
  return request.headers ? request.headers['Authorization'] : undefined;
}

function runAction({ action, propsValue }: { action: { run: (ctx: never) => Promise<unknown> }; propsValue: Record<string, unknown> }): Promise<unknown> {
  const context = { auth: { type: 'CUSTOM_AUTH', props: AUTH_A }, propsValue };
  return Reflect.apply(action.run, action, [context]);
}

function runTrigger({ method, propsValue, store, body, isRepublish }: { method: () => Promise<unknown>; propsValue: Record<string, unknown>; store: ReturnType<typeof memoryStore>; body?: unknown; isRepublish?: boolean }): Promise<unknown> {
  const context = {
    auth: { type: 'CUSTOM_AUTH', props: AUTH_A },
    propsValue,
    store,
    payload: { body, headers: {}, queryParams: {} },
    webhookUrl: 'https://example.test/hook',
    isRepublish: isRepublish ?? false,
  };
  return Reflect.apply(method, undefined, [context]);
}

beforeEach(() => clearSendPulseTokenCache());
afterEach(() => vi.restoreAllMocks());

describe('token cache', () => {
  test('two connections in one process never share a token', async () => {
    const seen = stubHttp({ handler: (request) => tokenFor({ request }) ?? { status: 200, body: [] } });
    await sendpulseApiCall({ method: HttpMethod.GET, resourceUri: '/addressbooks', auth: AUTH_A });
    await sendpulseApiCall({ method: HttpMethod.GET, resourceUri: '/addressbooks', auth: AUTH_B });
    await sendpulseApiCall({ method: HttpMethod.GET, resourceUri: '/addressbooks', auth: AUTH_A });
    const apiCalls = seen.filter((request) => request.url.endsWith('/addressbooks'));
    expect(apiCalls.map((request) => authHeader({ request }))).toEqual(['Bearer token-id-a', 'Bearer token-id-b', 'Bearer token-id-a']);
    expect(seen.filter((request) => request.url.endsWith('/oauth/access_token'))).toHaveLength(2);
  });

  test('validate never uses a cached token and redacts the token request body', async () => {
    const seen = stubHttp({
      handler: (request) => {
        if (request.url.endsWith('/oauth/access_token')) {
          const body: unknown = request.body;
          const secret = typeof body === 'object' && body !== null ? Reflect.get(body, 'client_secret') : '';
          return secret === 'secret-a' ? { status: 200, body: { access_token: 'good', expires_in: 3600 } } : { status: 401, body: { error: 'invalid_client', error_description: 'Client authentication failed' } };
        }
        return { status: 200, body: [] };
      },
    });
    await sendpulseApiCall({ method: HttpMethod.GET, resourceUri: '/addressbooks', auth: AUTH_A });
    const result = await sendpulseAuth.validate?.({ auth: { clientId: 'id-a', clientSecret: 'wrong' }, server: { apiAddress: '', publicUrl: '' } });
    expect(result?.valid).toBe(false);
    expect(result && 'error' in result ? result.error : '').toContain('Client authentication failed');
    expect(seen.filter((request) => request.url.endsWith('/oauth/access_token')).every((request) => request.redactBodyInErrors === true)).toBe(true);
  });
});

describe('errors', () => {
  test('vendor message from the response body reaches the step error', async () => {
    stubHttp({ handler: (request) => tokenFor({ request }) ?? { status: 400, body: { is_error: true, message: 'Book not found', error_code: 213 } } });
    const error = await sendpulseApiCall({ method: HttpMethod.GET, resourceUri: '/addressbooks/1', auth: AUTH_A, operation: 'get book' }).catch((e: unknown) => e);
    expect(error instanceof Error ? error.message : '').toBe('SendPulse get book failed (HTTP 400): Book not found');
    expect(Reflect.has(Object(error), 'body')).toBe(false);
  });
});

describe('update subscriber', () => {
  test('fails and names what was applied when one update fails', async () => {
    stubHttp({
      handler: (request) => tokenFor({ request }) ?? (request.url.endsWith('/phone') ? { status: 400, body: { message: 'Invalid phone' } } : { status: 200, body: { result: true } }),
    });
    const error = await runAction({ action: updateSubscriberAction, propsValue: { mailingListId: 5, email: 'a@b.co', phone: 'x', variables: { name: 'N' } } }).catch((e: unknown) => e);
    const message = error instanceof Error ? error.message : '';
    expect(message).toContain('Invalid phone');
    expect(message).toContain('Already applied: variables');
  });

  test('accepts a mapped string mailing list id', async () => {
    const seen = stubHttp({ handler: (request) => tokenFor({ request }) ?? { status: 200, body: { result: true } } });
    const result = await runAction({ action: updateSubscriberAction, propsValue: { mailingListId: ' 77 ', email: 'a@b.co', variables: { score: 3 } } });
    expect(seen.some((request) => request.url.endsWith('/addressbooks/77/emails/variable'))).toBe(true);
    expect(result).toMatchObject({ success: true, variablesUpdated: ['score'] });
  });
});

describe('new actions', () => {
  test('get contact returns found false on 400 No such email', async () => {
    stubHttp({ handler: (request) => tokenFor({ request }) ?? { status: 400, body: { is_error: true, message: 'No such email' } } });
    expect(await runAction({ action: getContactAction, propsValue: { email: 'x@y.co' } })).toEqual({ found: false, email: 'x@y.co', lists: [] });
  });

  test('get contact returns found false on 404', async () => {
    stubHttp({ handler: (request) => tokenFor({ request }) ?? { status: 404, body: { message: 'Not found' } } });
    expect(await runAction({ action: getContactAction, propsValue: { email: 'x@y.co' } })).toEqual({ found: false, email: 'x@y.co', lists: [] });
  });

  test('list contacts sends limit/offset and reports has_more', async () => {
    const seen = stubHttp({ handler: (request) => tokenFor({ request }) ?? { status: 200, body: [{ email: 'a@b.co', status: 0, variables: {} }, { email: 'c@d.co' }] } });
    const result = await runAction({ action: listMailingListContactsAction, propsValue: { mailingListId: 9, limit: 2, offset: 4 } });
    const call = seen.find((request) => request.url.endsWith('/addressbooks/9/emails'));
    expect(call?.queryParams).toEqual({ limit: '2', offset: '4' });
    expect(result).toMatchObject({ count: 2, has_more: true, next_offset: 6 });
  });
});

describe('webhook triggers', () => {
  test('new subscriber reads the email from variables when the payload has no top-level email', async () => {
    const events = [
      { event: 'new_emails', book_id: 869303, email: '', timestamp: 1795077550, source: 'address book', variables: { phone: '', Name: 'WH One', email: 'wh@x.co' } },
    ];
    const result = await runTrigger({ method: newSubscriberTrigger.run, propsValue: { mailingListId: 869303 }, store: memoryStore(), body: events });
    expect(result).toEqual([expect.objectContaining({ id: 'wh@x.co_1795077550', email: 'wh@x.co', mailingListId: '869303' })]);
  });

  test('numeric list id matches the string book_id and filters other lists', async () => {
    const events = [
      { event: 'new_emails', book_id: '123', email: 'in@x.co', timestamp: '1496827625', variables: [] },
      { event: 'new_emails', book_id: '999', email: 'out@x.co', timestamp: '1496827625' },
    ];
    const result = await runTrigger({ method: newSubscriberTrigger.run, propsValue: { mailingListId: 123 }, store: memoryStore(), body: events });
    expect(result).toEqual([expect.objectContaining({ email: 'in@x.co', mailingListId: '123', addedAt: '2017-06-07T09:27:05.000Z' })]);
  });

  test('unsubscriber filters by list too', async () => {
    const result = await runTrigger({ method: newUnsubscriberTrigger.run, propsValue: { mailingListId: 5 }, store: memoryStore(), body: { event: 'unsubscribe', book_id: '5', email: 'u@x.co', from_all: '1', timestamp: 'bad' } });
    expect(result).toEqual([expect.objectContaining({ email: 'u@x.co', fromAll: true, unsubscribedAt: null })]);
  });

  test('onEnable throws when the create response has no webhook id', async () => {
    stubHttp({ handler: (request) => tokenFor({ request }) ?? { status: 200, body: { success: true, data: [] } } });
    const store = memoryStore();
    await expect(runTrigger({ method: newSubscriberTrigger.onEnable, propsValue: { mailingListId: 1 }, store })).rejects.toThrow('no webhook ID');
    expect(store.data.has('webhook_id')).toBe(false);
  });

  test('webhook id is read from list or single-object responses', () => {
    expect(findWebhookId({ response: { success: true, data: [{ id: 7, action: 'new_emails' }, { id: 8, action: 'x' }] }, action: 'new_emails' })).toBe('7');
    expect(findWebhookId({ response: { data: { id: 9, action: 'unsubscribe' } }, action: 'unsubscribe' })).toBe('9');
  });
});

describe('updated subscriber polling', () => {
  test('pages past 100 contacts and emits only changed contacts', async () => {
    const page = ({ offset, version }: { offset: number; version: number }) =>
      Array.from({ length: offset === 0 ? 100 : 30 }, (_, i) => ({ email: `u${offset + i}@x.co`, variables: { v: offset + i === 120 ? version : 0 } }));
    let version = 1;
    const seen = stubHttp({
      handler: (request) => tokenFor({ request }) ?? { status: 200, body: page({ offset: Number(request.queryParams?.['offset']), version }) },
    });
    const store = memoryStore();
    await runTrigger({ method: updatedSubscriberTrigger.onEnable, propsValue: { mailingListId: 3 }, store });
    expect(await runTrigger({ method: updatedSubscriberTrigger.run, propsValue: { mailingListId: 3 }, store })).toEqual([]);
    version = 2;
    const changes = await runTrigger({ method: updatedSubscriberTrigger.run, propsValue: { mailingListId: 3 }, store });
    expect(changes).toEqual([expect.objectContaining({ email: 'u120@x.co', changes: { variables: { from: { v: 1 }, to: { v: 2 } } } })]);
    expect(seen.some((request) => request.queryParams?.['offset'] === '100')).toBe(true);
  });

  test('a failed poll throws and keeps the previous snapshot', async () => {
    stubHttp({ handler: (request) => tokenFor({ request }) ?? { status: 200, body: [{ email: 'a@x.co' }] } });
    const store = memoryStore();
    await runTrigger({ method: updatedSubscriberTrigger.onEnable, propsValue: { mailingListId: 3 }, store });
    const before = JSON.stringify(store.data.get('subscribers_snapshot'));
    vi.restoreAllMocks();
    stubHttp({ handler: (request) => tokenFor({ request }) ?? { status: 500, body: { message: 'boom' } } });
    await expect(runTrigger({ method: updatedSubscriberTrigger.run, propsValue: { mailingListId: 3 }, store })).rejects.toThrow('boom');
    expect(JSON.stringify(store.data.get('subscribers_snapshot'))).toBe(before);
  });
});

type Reply = { status: number; body: unknown };

describe('qa edge cases', () => {
  test('list mailing lists sends paging and reports a short page as the end', async () => {
    const seen = stubHttp({ handler: (request) => tokenFor({ request }) ?? { status: 200, body: [{ id: 7, name: 'A', all_email_qty: 3 }] } });
    const result = await runAction({ action: listMailingListsAction, propsValue: { limit: 5, offset: 10 } });
    expect(seen.find((request) => request.url.endsWith('/addressbooks'))?.queryParams).toEqual({ limit: '5', offset: '10' });
    expect(result).toMatchObject({ count: 1, has_more: false, next_offset: null });
  });

  test('limit outside 1-100 is rejected before any request', async () => {
    const seen = stubHttp({ handler: (request) => tokenFor({ request }) ?? { status: 200, body: [] } });
    await expect(runAction({ action: listMailingListsAction, propsValue: { limit: 101, offset: 0 } })).rejects.toThrow('between 1 and 100');
    await expect(runAction({ action: listMailingListsAction, propsValue: { limit: 0, offset: 0 } })).rejects.toThrow('between 1 and 100');
    expect(seen).toHaveLength(0);
  });

  test('non-numeric mailing list id is rejected', async () => {
    stubHttp({ handler: (request) => tokenFor({ request }) ?? { status: 200, body: { result: true } } });
    await expect(runAction({ action: listMailingListContactsAction, propsValue: { mailingListId: '12abc' } })).rejects.toThrow('Invalid mailing list ID');
  });

  test('network failure on a write says the change may have been applied', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
      const token = tokenFor({ request });
      if (token) {
        return { status: 200, headers: {}, body: token.body };
      }
      throw new Error('socket hang up');
    });
    await expect(runAction({ action: addSubscriberAction, propsValue: { mailingListId: 3, email: 'a@b.co' } })).rejects.toThrow(/network error or timeout \(socket hang up\)\. The change may still have been applied/);
  });

  test('get contact rethrows non-not-found errors such as 401', async () => {
    stubHttp({ handler: (request) => tokenFor({ request }) ?? { status: 401, body: { error_description: 'bad token' } } });
    await expect(runAction({ action: getContactAction, propsValue: { email: 'x@y.co' } })).rejects.toThrow('HTTP 401): bad token');
  });
});

describe('bug hunt fixes', () => {
  test('a 401 drops the cached token and retries once with a fresh token', async () => {
    let tokenCount = 0;
    const seen = stubHttp({
      handler: (request) => {
        if (request.url.endsWith('/oauth/access_token')) {
          tokenCount++;
          return { status: 200, body: { access_token: `t${tokenCount}`, expires_in: 3600 } };
        }
        return authHeader({ request }) === 'Bearer t1' ? { status: 401, body: { message: 'expired' } } : { status: 200, body: [] };
      },
    });
    await expect(sendpulseApiCall({ method: HttpMethod.GET, resourceUri: '/addressbooks', auth: AUTH_A })).resolves.toEqual([]);
    expect(seen.filter((request) => request.url.endsWith('/addressbooks')).map((request) => authHeader({ request }))).toEqual(['Bearer t1', 'Bearer t2']);
  });

  test('a repeated 401 is retried only once', async () => {
    const seen = stubHttp({ handler: (request) => tokenFor({ request }) ?? { status: 401, body: { message: 'nope' } } });
    await expect(sendpulseApiCall({ method: HttpMethod.GET, resourceUri: '/addressbooks', auth: AUTH_A })).rejects.toThrow('HTTP 401');
    expect(seen.filter((request) => request.url.endsWith('/addressbooks'))).toHaveLength(2);
  });

  test('large lists use short hashes and stay under the store limit', async () => {
    const contacts = Array.from({ length: 3000 }, (_, i) => ({ email: `user${i}@example.com`, variables: { bio: 'x'.repeat(200) } }));
    stubHttp({ handler: (request) => tokenFor({ request }) ?? { status: 200, body: contacts.slice(Number(request.queryParams?.['offset']), Number(request.queryParams?.['offset']) + 100) } });
    const store = memoryStore();
    await runTrigger({ method: updatedSubscriberTrigger.onEnable, propsValue: { mailingListId: 3 }, store });
    const snapshot = store.data.get('subscribers_snapshot');
    expect(JSON.stringify(snapshot).length).toBeLessThan(400 * 1024);
    expect(Reflect.get(Object(snapshot), 'mode')).toBe('hash');
    expect(Reflect.get(Object(Reflect.get(Object(snapshot), 'entries')), 'user0@example.com')).toHaveLength(16);
  });

  test('a list too big for the store fails with a clear error in onEnable and run', async () => {
    const contacts = Array.from({ length: 4999 }, (_, i) => ({ email: `a-very-long-mailbox-name-number-${i}@some-long-domain-name.example.com` }));
    stubHttp({ handler: (request) => tokenFor({ request }) ?? { status: 200, body: contacts.slice(Number(request.queryParams?.['offset']), Number(request.queryParams?.['offset']) + 100) } });
    const store = memoryStore();
    await expect(runTrigger({ method: updatedSubscriberTrigger.onEnable, propsValue: { mailingListId: 3 }, store })).rejects.toThrow('512 KB trigger storage limit');
    await expect(runTrigger({ method: updatedSubscriberTrigger.run, propsValue: { mailingListId: 3 }, store })).rejects.toThrow('512 KB trigger storage limit');
  });

  test('A to B and B to A changes get distinct event ids', async () => {
    let value = 'A';
    stubHttp({ handler: (request) => tokenFor({ request }) ?? { status: 200, body: [{ email: 'a@x.co', variables: { v: value } }] } });
    const store = memoryStore();
    await runTrigger({ method: updatedSubscriberTrigger.onEnable, propsValue: { mailingListId: 3 }, store });
    const ids: unknown[] = [];
    for (const next of ['B', 'A', 'B']) {
      value = next;
      const events = await runTrigger({ method: updatedSubscriberTrigger.run, propsValue: { mailingListId: 3 }, store });
      ids.push(Array.isArray(events) ? Reflect.get(Object(events[0]), 'id') : undefined);
    }
    expect(ids[0]).not.toEqual(ids[1]);
    expect(ids[1]).not.toEqual(ids[2]);
    expect(ids[0]).toEqual(ids[2]);
  });
});
