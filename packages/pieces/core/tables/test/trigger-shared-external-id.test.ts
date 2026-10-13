/// <reference types="vitest/globals" />

import { HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { createMockActionContext, Store } from '@activepieces/pieces-framework';
import { randomUUID } from 'crypto';
import qs from 'qs';
import { deletedRecordTrigger } from '../src/lib/triggers/deleted-record';
import { newRecordTrigger } from '../src/lib/triggers/new-record';
import { updatedRecordTrigger } from '../src/lib/triggers/updated-record';

const { tablesApi } = vi.hoisted(() => {
  const tablesApi: FakeTablesApi = { tables: [], webhooks: [] };
  return { tablesApi };
});

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const original = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...original,
    httpClient: {
      sendRequest: async (request: HttpRequest) => ({ status: 200, headers: {}, body: answer(request) }),
    },
  };
});

describe.each([
  ['New Record', newRecordTrigger],
  ['Updated Record', updatedRecordTrigger],
  ['Deleted Record', deletedRecordTrigger],
])('Tables %s trigger', (_name, trigger) => {
  beforeEach(() => {
    tablesApi.tables = [];
    tablesApi.webhooks = [];
  });

  test('disabling removes the subscription that enabling created', async () => {
    tablesApi.tables = [{ id: 'original-table', externalId: 'leads' }];
    const store = memoryStore();

    await trigger.onEnable(hookContext(store));
    const subscribed = tablesApi.webhooks.map((webhook) => webhook.tableId);
    await trigger.onDisable(hookContext(store));

    expect(subscribed).toEqual(['original-table']);
    expect(tablesApi.webhooks).toEqual([]);
  });

  test('disabling removes the subscription that enabling created, even after a second table took the same externalId', async () => {
    tablesApi.tables = [{ id: 'original-table', externalId: 'leads' }];
    const store = memoryStore();

    await trigger.onEnable(hookContext(store));
    tablesApi.tables = [{ id: 'imported-copy', externalId: 'leads' }, ...tablesApi.tables];
    await trigger.onDisable(hookContext(store));
    const afterDisable = tablesApi.webhooks;
    await trigger.onEnable(hookContext(store));

    expect(afterDisable).toEqual([]);
    expect(tablesApi.webhooks).toHaveLength(1);
  });

  test('disabling leaves the subscriptions of other flows on tables that share the externalId', async () => {
    tablesApi.tables = [{ id: 'original-table', externalId: 'leads' }];
    const store = memoryStore();

    await trigger.onEnable(hookContext(store));
    tablesApi.tables = [{ id: 'imported-copy', externalId: 'leads' }, ...tablesApi.tables];
    const otherFlowWebhooks = [
      { id: 'other-flow-on-original', tableId: 'original-table' },
      { id: 'other-flow-on-copy', tableId: 'imported-copy' },
    ];
    tablesApi.webhooks = [...tablesApi.webhooks, ...otherFlowWebhooks];
    await trigger.onDisable(hookContext(store));

    expect(tablesApi.webhooks).toEqual(otherFlowWebhooks);
  });
});

function answer(request: HttpRequest): unknown {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\//, '');
  const webhookPath = path.match(/^v1\/tables\/([^/]+)\/webhooks(?:\/([^/]+))?$/);
  if (request.method === HttpMethod.GET && path === 'v1/tables') {
    const { externalIds } = qs.parse(url.search.slice(1));
    const wanted = Array.isArray(externalIds) ? externalIds : [externalIds];
    return { data: tablesApi.tables.filter((table) => wanted.includes(table.externalId)), next: null, previous: null };
  }
  if (request.method === HttpMethod.POST && webhookPath) {
    const webhook = { id: `webhook-${randomUUID()}`, tableId: webhookPath[1] };
    tablesApi.webhooks = [...tablesApi.webhooks, webhook];
    return webhook;
  }
  if (request.method === HttpMethod.DELETE && webhookPath) {
    tablesApi.webhooks = tablesApi.webhooks.filter((webhook) => !(webhook.tableId === webhookPath[1] && webhook.id === webhookPath[2]));
    return {};
  }
  throw new Error(`unexpected request ${request.method} ${request.url}`);
}

function hookContext(store: Store) {
  return {
    ...createMockActionContext({ propsValue: { table_id: 'leads' } }),
    webhookUrl: 'http://localhost:4200/api/v1/webhooks/flow-1',
    payload: { body: {}, headers: {}, queryParams: {} },
    server: { apiUrl: 'http://localhost:4200/api/', publicUrl: 'http://localhost:4200/', token: 'engine-token' },
    store,
  };
}

function memoryStore(): Store {
  const entries = new Map<string, string>();
  return {
    async put<T>(key: string, value: T): Promise<T> {
      entries.set(key, JSON.stringify(value));
      return value;
    },
    async get<T>(key: string): Promise<T | null> {
      const saved = entries.get(key);
      return saved === undefined ? null : JSON.parse(saved);
    },
    async delete(key: string): Promise<void> {
      entries.delete(key);
    },
  };
}

type FakeTablesApi = {
  tables: { id: string; externalId: string }[];
  webhooks: { id: string; tableId: string }[];
};
