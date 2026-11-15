import { afterEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import {
  ISSUE_TRIGGER_STORE_KEY,
  isAuthenticDelivery,
  issuesEventTrigger,
} from '../src/lib/trigger/issue-event';
import { isRecord } from '../src/lib/common/secret-request';
import { auth, stubGitlab } from './helpers';

type Stored = Record<string, unknown>;

function memoryStore(initial?: Stored) {
  const data = new Map<string, unknown>(initial ? Object.entries(initial) : []);
  return {
    data,
    put: vi.fn(async (key: string, value: unknown) => {
      data.set(key, value);
      return value;
    }),
    get: vi.fn(async (key: string) => data.get(key) ?? null),
    delete: vi.fn(async (key: string) => {
      data.delete(key);
    }),
  };
}

const trigger = {
  onEnable: async (ctx: unknown): Promise<void> =>
    Reflect.apply(issuesEventTrigger.onEnable, issuesEventTrigger, [ctx]),
  onDisable: async (ctx: unknown): Promise<void> =>
    Reflect.apply(issuesEventTrigger.onDisable, issuesEventTrigger, [ctx]),
  run: async (ctx: unknown): Promise<unknown[]> =>
    Reflect.apply(issuesEventTrigger.run, issuesEventTrigger, [ctx]),
};

const issuePayload = (action: string) => ({
  object_kind: 'issue',
  object_attributes: { action, iid: 1 },
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('onEnable', () => {
  it('creates the hook with a random secret token and confidential issues via native fetch, then stores the token in the same key', async () => {
    const httpSpy = vi.spyOn(httpClient, 'sendRequest');
    const seen = stubGitlab([
      { status: 201, body: { id: 77, url: 'https://ap/webhook' } },
    ]);
    const store = memoryStore();
    await trigger.onEnable({
      auth,
      store,
      propsValue: { projectId: 'grp/proj', actiontype: 'all' },
      webhookUrl: 'https://ap/webhook',
    });
    expect(httpSpy).not.toHaveBeenCalled();
    expect(seen[0].method).toBe('POST');
    expect(seen[0].path).toBe('/projects/grp%2Fproj/hooks');
    const body = seen[0].body;
    const token = isRecord(body) ? body['token'] : undefined;
    expect(body).toMatchObject({
      url: 'https://ap/webhook',
      issues_events: true,
      confidential_issues_events: true,
      push_events: false,
    });
    expect(typeof token).toBe('string');
    expect(String(token).length).toBe(64);
    expect(store.data.get(ISSUE_TRIGGER_STORE_KEY)).toEqual({
      webhookId: 77,
      projectId: 'grp/proj',
      token,
    });
  });

  it('deletes the hook it created when storing fails, then rethrows', async () => {
    const seen = stubGitlab([
      { status: 201, body: { id: 77 } },
      { status: 204 },
    ]);
    const store = memoryStore();
    store.put.mockRejectedValueOnce(new Error('store down'));
    await expect(
      trigger.onEnable({
        auth,
        store,
        propsValue: { projectId: 5, actiontype: 'all' },
        webhookUrl: 'https://ap/w',
      })
    ).rejects.toThrow('store down');
    expect(seen[1]).toMatchObject({
      method: 'DELETE',
      path: '/projects/5/hooks/77',
    });
  });

  it('does not log the secret when GitLab rejects the hook', async () => {
    const errorLog = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    stubGitlab([{ status: 422, body: { message: 'Invalid url' } }]);
    const error = await trigger
      .onEnable({
        auth,
        store: memoryStore(),
        propsValue: { projectId: 5, actiontype: 'all' },
        webhookUrl: 'x',
      })
      .catch((e) => e);
    expect(error.status).toBe(422);
    expect(errorLog).not.toHaveBeenCalled();
  });
});

describe('onDisable', () => {
  it('awaits the delete and forgets the hook only after it is gone', async () => {
    const seen = stubGitlab([{ status: 204 }]);
    const store = memoryStore({
      [ISSUE_TRIGGER_STORE_KEY]: { webhookId: 9, projectId: 5, token: 't' },
    });
    await trigger.onDisable({ auth, store });
    expect(seen[0]).toMatchObject({
      method: 'DELETE',
      path: '/projects/5/hooks/9',
    });
    expect(store.data.has(ISSUE_TRIGGER_STORE_KEY)).toBe(false);
  });

  it('treats 404 as already deleted', async () => {
    stubGitlab([{ status: 404, body: { message: '404 Not found' } }]);
    const store = memoryStore({
      [ISSUE_TRIGGER_STORE_KEY]: { webhookId: '9', projectId: '5' },
    });
    await trigger.onDisable({ auth, store });
    expect(store.data.has(ISSUE_TRIGGER_STORE_KEY)).toBe(false);
  });

  it('keeps the stored hook and fails when the delete fails', async () => {
    stubGitlab([{ status: 500, body: { message: 'boom' } }]);
    const store = memoryStore({
      [ISSUE_TRIGGER_STORE_KEY]: { webhookId: 9, projectId: 5, token: 't' },
    });
    await expect(trigger.onDisable({ auth, store })).rejects.toThrow(
      /HTTP 500/
    );
    expect(store.data.has(ISSUE_TRIGGER_STORE_KEY)).toBe(true);
  });
});

describe('run', () => {
  const store = (token?: string) =>
    memoryStore({
      [ISSUE_TRIGGER_STORE_KEY]: {
        webhookId: 1,
        projectId: 1,
        ...(token ? { token } : {}),
      },
    });

  it('emits a delivery with the matching X-Gitlab-Token', async () => {
    const result = await trigger.run({
      store: store('secret-1'),
      payload: {
        headers: { 'X-Gitlab-Token': 'secret-1' },
        body: issuePayload('open'),
      },
      propsValue: { actiontype: 'all' },
    });
    expect(result).toHaveLength(1);
  });

  it('drops a forged delivery without the header', async () => {
    const result = await trigger.run({
      store: store('secret-1'),
      payload: { headers: {}, body: issuePayload('open') },
      propsValue: { actiontype: 'all' },
    });
    expect(result).toEqual([]);
  });

  it('drops a forged delivery with a wrong header of the same or different length', async () => {
    for (const token of ['secret-2', 'x']) {
      const result = await trigger.run({
        store: store('secret-1'),
        payload: {
          headers: { 'x-gitlab-token': token },
          body: issuePayload('open'),
        },
        propsValue: { actiontype: 'all' },
      });
      expect(result).toEqual([]);
    }
  });

  it('accepts deliveries for legacy hooks stored without a token', async () => {
    const result = await trigger.run({
      store: store(),
      payload: { headers: {}, body: issuePayload('close') },
      propsValue: { actiontype: 'close' },
    });
    expect(result).toHaveLength(1);
  });

  it('filters by action, supports reopen, and does not throw on payloads without object_attributes', async () => {
    const reopen = await trigger.run({
      store: store(),
      payload: { headers: {}, body: issuePayload('reopen') },
      propsValue: { actiontype: 'reopen' },
    });
    const other = await trigger.run({
      store: store(),
      payload: { headers: {}, body: issuePayload('update') },
      propsValue: { actiontype: 'reopen' },
    });
    const odd = await trigger.run({
      store: store(),
      payload: { headers: {}, body: { object_kind: 'push' } },
      propsValue: { actiontype: 'open' },
    });
    expect(reopen).toHaveLength(1);
    expect(other).toEqual([]);
    expect(odd).toEqual([]);
  });

  it('compares tokens in constant time only on equal-length buffers', () => {
    expect(
      isAuthenticDelivery({
        storedToken: 'abc',
        headers: { 'x-gitlab-token': 'abc' },
      })
    ).toBe(true);
    expect(
      isAuthenticDelivery({
        storedToken: 'abc',
        headers: { 'x-gitlab-token': 'abcd' },
      })
    ).toBe(false);
    expect(
      isAuthenticDelivery({ storedToken: 'abc', headers: undefined })
    ).toBe(false);
  });
});
