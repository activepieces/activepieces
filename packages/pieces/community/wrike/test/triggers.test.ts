import { HttpError, httpClient } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { newFolder } from '../src/lib/triggers/new-folder';
import { newSubtask } from '../src/lib/triggers/new-subtask';
import { newTask } from '../src/lib/triggers/new-task';

const AUTH = { access_token: 'tok' };

function makeStore() {
  const data = new Map<string, unknown>();
  return {
    data,
    get: async (k: string) => (data.has(k) ? data.get(k) : null),
    put: async (k: string, v: unknown) => {
      data.set(k, v);
      return v;
    },
    delete: async (k: string) => {
      data.delete(k);
    },
  };
}

function ctx({
  body,
  propsValue = {},
  store = makeStore(),
}: {
  body?: unknown;
  propsValue?: Record<string, unknown>;
  store?: ReturnType<typeof makeStore>;
}) {
  return {
    auth: AUTH,
    propsValue,
    store,
    webhookUrl: 'https://hook.example/abc',
    payload: { body, headers: {}, queryParams: {} },
  };
}

function call({ fn, c }: { fn: unknown; c: unknown }): Promise<unknown> {
  if (typeof fn !== 'function') throw new Error('not a function');
  return Promise.resolve(Reflect.apply(fn, undefined, [c]));
}

function event({ eventType, taskId, folderId }: { eventType: string; taskId?: string; folderId?: string }) {
  return { webhookId: 'W1', eventAuthorId: 'U1', eventType, taskId, folderId, lastUpdatedDate: '2024-09-05T07:22:25Z' };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('wrike webhook triggers', () => {
  it('new_task returns one item per TaskCreated event in the array body', async () => {
    const body = [
      event({ eventType: 'TaskCreated', taskId: 'T1' }),
      event({ eventType: 'TaskStatusChanged', taskId: 'T2' }),
      event({ eventType: 'TaskCreated', taskId: 'T3' }),
    ];
    const out = await call({ fn: newTask.run, c: ctx({ body }) });
    expect(out).toEqual([body[0], body[2]]);
  });

  it('new_task returns nothing for unrelated events', async () => {
    const out = await call({ fn: newTask.run, c: ctx({ body: [event({ eventType: 'TaskStatusChanged', taskId: 'T2' })] }) });
    expect(out).toEqual([]);
  });

  it('new_folder returns FolderCreated events as a list', async () => {
    const created = event({ eventType: 'FolderCreated', folderId: 'F1' });
    const out = await call({ fn: newFolder.run, c: ctx({ body: [created, event({ eventType: 'FolderTitleChanged', folderId: 'F2' })] }) });
    expect(out).toEqual([created]);
  });

  it('new_subtask keeps only created tasks that have a super task', async () => {
    const tasks: Record<string, unknown> = {
      '/tasks/S1': { id: 'S1', superTaskIds: ['P1'] },
      '/tasks/T1': { id: 'T1', superTaskIds: [] },
    };
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (req) => ({
      status: 200,
      headers: {},
      body: { data: [tasks[new URL(req.url).pathname.replace('/api/v4', '')]] },
    }));
    const body = [
      event({ eventType: 'TaskCreated', taskId: 'S1' }),
      event({ eventType: 'TaskCreated', taskId: 'T1' }),
      event({ eventType: 'TaskStatusChanged', taskId: 'S1' }),
    ];
    const out = await call({ fn: newSubtask.run, c: ctx({ body }) });
    expect(out).toEqual([{ ...body[0], task: tasks['/tasks/S1'] }]);
  });

  it('new_subtask honours the parent task filter', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: { data: [{ id: 'S1', superTaskIds: ['P1'] }] },
    });
    const body = [event({ eventType: 'TaskCreated', taskId: 'S1' })];
    const other = await call({ fn: newSubtask.run, c: ctx({ body, propsValue: { parentTaskId: 'P2' } }) });
    const match = await call({ fn: newSubtask.run, c: ctx({ body, propsValue: { parentTaskId: 'P1' } }) });
    expect(other).toEqual([]);
    expect(match).toHaveLength(1);
  });

  it('new_subtask keeps the other subtasks when one task lookup fails', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (req) => {
      if (req.url.endsWith('/tasks/GONE')) {
        throw new HttpError({}, { status: 404, responseBody: { error: 'not_found' } });
      }
      return { status: 200, headers: {}, body: { data: [{ id: 'S1', superTaskIds: ['P1'] }] } };
    });
    const body = [
      event({ eventType: 'TaskCreated', taskId: 'GONE' }),
      event({ eventType: 'TaskCreated', taskId: 'S1' }),
    ];
    const out = await call({ fn: newSubtask.run, c: ctx({ body }) });
    expect(out).toEqual([{ ...body[1], task: { id: 'S1', superTaskIds: ['P1'] } }]);
  });

  it('onDisable keeps the webhook id when Wrike fails to delete it', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 500, responseBody: {} }));
    const store = makeStore();
    store.data.set('webhook_id', 'WH1');
    await call({ fn: newTask.onDisable, c: ctx({ store }) });
    expect(store.data.get('webhook_id')).toBe('WH1');
  });

  it('onDisable clears the webhook id once deleted or already gone', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    const store = makeStore();

    spy.mockResolvedValueOnce({ status: 200, headers: {}, body: {} });
    store.data.set('webhook_id', 'WH1');
    await call({ fn: newFolder.onDisable, c: ctx({ store }) });
    expect(spy.mock.calls[0][0]).toMatchObject({ method: 'DELETE', url: 'https://www.wrike.com/api/v4/webhooks/WH1' });
    expect(store.data.has('webhook_id')).toBe(false);

    spy.mockRejectedValueOnce(new HttpError({}, { status: 404, responseBody: {} }));
    store.data.set('webhook_id', 'WH2');
    await call({ fn: newSubtask.onDisable, c: ctx({ store }) });
    expect(store.data.has('webhook_id')).toBe(false);
  });

  it('onEnable subscribes to one event and uses the folder endpoint when a folder is set', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: { data: [{ id: 'WH1' }] },
    });
    const store = makeStore();
    await call({ fn: newTask.onEnable, c: ctx({ store, propsValue: { folderId: 'F9' } }) });
    expect(spy.mock.calls[0][0]).toMatchObject({
      method: 'POST',
      url: 'https://www.wrike.com/api/v4/folders/F9/webhooks',
      body: { hookUrl: 'https://hook.example/abc', events: ['TaskCreated'] },
    });
    expect(store.data.get('webhook_id')).toBe('WH1');

    await call({ fn: newFolder.onEnable, c: ctx({ store }) });
    expect(spy.mock.calls[1][0]).toMatchObject({
      url: 'https://www.wrike.com/api/v4/webhooks',
      body: { events: ['FolderCreated'] },
    });
  });
});
