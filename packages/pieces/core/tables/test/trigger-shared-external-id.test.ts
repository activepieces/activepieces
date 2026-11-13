/// <reference types="vitest/globals" />

import { HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { createMockActionContext, Store, TableWebhookEventType } from '@activepieces/pieces-framework';
import { randomUUID } from 'crypto';
import qs from 'qs';
import { tablesCommon } from '../src/lib/common';
import { deletedRecordTrigger } from '../src/lib/triggers/deleted-record';
import { newRecordTrigger } from '../src/lib/triggers/new-record';
import { updatedRecordTrigger } from '../src/lib/triggers/updated-record';

const PAGE_SIZE = 2;
const CURSOR_PREFIX = 'seek+/=';

const { tablesApi } = vi.hoisted(() => {
  const tablesApi: FakeTablesApi = { tables: [], webhooks: [], requests: [] };
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

beforeEach(() => {
  tablesApi.tables = [];
  tablesApi.webhooks = [];
  tablesApi.requests = [];
});

describe.each([
  ['New Record', newRecordTrigger, TableWebhookEventType.RECORD_CREATED],
  ['Updated Record', updatedRecordTrigger, TableWebhookEventType.RECORD_UPDATED],
  ['Deleted Record', deletedRecordTrigger, TableWebhookEventType.RECORD_DELETED],
])('Tables %s trigger', (_name, trigger, event) => {
  afterEach(() => {
    const unfilteredTableLists = tablesApi.requests.filter((request) => isTableList(request) && !request.url.includes('externalIds'));
    expect(unfilteredTableLists).toEqual([]);
  });

  test('enabling subscribes the resolved table to this trigger\'s event', async () => {
    tablesApi.tables = [{ id: 'original-table', externalId: 'leads' }];

    await trigger.onEnable(hookContext(memoryStore()));

    expect(tablesApi.webhooks).toEqual([expect.objectContaining({ tableId: 'original-table', events: [event] })]);
  });

  test('enabling and disabling without a selected table make no requests', async () => {
    tablesApi.tables = [{ id: 'original-table', externalId: 'leads' }];
    const store = memoryStore();

    await trigger.onEnable(hookContext(store, ''));
    await trigger.onDisable(hookContext(store, ''));

    expect(tablesApi.requests).toEqual([]);
  });

  test('disabling without a stored subscription makes no requests', async () => {
    tablesApi.tables = [{ id: 'original-table', externalId: 'leads' }];

    await trigger.onDisable(hookContext(memoryStore()));

    expect(tablesApi.requests).toEqual([]);
  });

  test('disabling after the original table was deleted leaves the copy untouched', async () => {
    tablesApi.tables = [{ id: 'original-table', externalId: 'leads' }];
    const store = memoryStore();

    await trigger.onEnable(hookContext(store));
    const otherFlowWebhook = { id: 'other-flow-on-copy', tableId: 'imported-copy' };
    tablesApi.tables = [{ id: 'imported-copy', externalId: 'leads' }];
    tablesApi.webhooks = [otherFlowWebhook];
    await trigger.onDisable(hookContext(store));

    expect(tablesApi.webhooks).toEqual([otherFlowWebhook]);
  });

  test('disabling when no table has the externalId anymore succeeds without deleting', async () => {
    tablesApi.tables = [{ id: 'original-table', externalId: 'leads' }];
    const store = memoryStore();

    await trigger.onEnable(hookContext(store));
    tablesApi.tables = [];
    tablesApi.webhooks = [];
    await trigger.onDisable(hookContext(store));

    expect(tablesApi.requests.filter((request) => request.method === HttpMethod.DELETE)).toEqual([]);
  });

  test('disabling twice leaves nothing behind and does not fail', async () => {
    tablesApi.tables = [{ id: 'original-table', externalId: 'leads' }];
    const store = memoryStore();

    await trigger.onEnable(hookContext(store));
    tablesApi.tables = [{ id: 'imported-copy', externalId: 'leads' }, ...tablesApi.tables];
    await trigger.onDisable(hookContext(store));
    await trigger.onDisable(hookContext(store));

    expect(tablesApi.webhooks).toEqual([]);
  });

  test('disabling leaves tables with a different externalId untouched', async () => {
    tablesApi.tables = [{ id: 'original-table', externalId: 'leads' }];
    const store = memoryStore();

    await trigger.onEnable(hookContext(store));
    const unrelatedWebhook = { id: 'other-flow-on-customers', tableId: 'customers-table' };
    tablesApi.tables = [...tablesApi.tables, { id: 'customers-table', externalId: 'customers' }];
    tablesApi.webhooks = [...tablesApi.webhooks, unrelatedWebhook];
    await trigger.onDisable(hookContext(store));

    expect(tablesApi.webhooks).toEqual([unrelatedWebhook]);
    expect(deletedTableIds()).toEqual(['original-table']);
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

  test('disabling finds the subscribed table on a later page of tables that share the externalId', async () => {
    tablesApi.tables = [{ id: 'original-table', externalId: 'leads' }];
    const store = memoryStore();

    await trigger.onEnable(hookContext(store));
    tablesApi.tables = [
      { id: 'copy-3', externalId: 'leads' },
      { id: 'copy-2', externalId: 'leads' },
      { id: 'copy-1', externalId: 'leads' },
      ...tablesApi.tables,
    ];
    const otherFlowWebhook = { id: 'other-flow-on-original', tableId: 'original-table' };
    tablesApi.webhooks = [...tablesApi.webhooks, otherFlowWebhook];
    await trigger.onDisable(hookContext(store));

    expect(tablesApi.webhooks).toEqual([otherFlowWebhook]);
  });
});

describe('Tables table dropdown', () => {
  test('lists every table in the project across pages', async () => {
    tablesApi.tables = [
      { id: 'table-1', externalId: 'leads' },
      { id: 'table-2', externalId: 'leads' },
      { id: 'table-3', externalId: 'customers' },
    ];

    const dropdown = await tablesCommon.table_id.options({}, hookContext(memoryStore()));

    expect(dropdown.options.map((option) => option.value)).toEqual(['leads', 'leads', 'customers']);
  });
});

function answer(request: HttpRequest): unknown {
  tablesApi.requests = [...tablesApi.requests, request];
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\//, '');
  const webhookPath = path.match(/^v1\/tables\/([^/]+)\/webhooks(?:\/([^/]+))?$/);
  if (isTableList(request)) {
    const { externalIds, cursor } = qs.parse(url.search.slice(1));
    const matching = Array.isArray(externalIds)
      ? tablesApi.tables.filter((table) => externalIds.includes(table.externalId))
      : tablesApi.tables;
    const offset = cursor === undefined ? 0 : pageOffset(cursor);
    const nextOffset = offset + PAGE_SIZE;
    return {
      data: matching.slice(offset, nextOffset),
      next: nextOffset < matching.length ? `${CURSOR_PREFIX}${nextOffset}` : null,
      previous: null,
    };
  }
  if (request.method === HttpMethod.POST && webhookPath) {
    const { events } = request.body as { events: TableWebhookEventType[] };
    const webhook = { id: `webhook-${randomUUID()}`, tableId: webhookPath[1], events };
    tablesApi.webhooks = [...tablesApi.webhooks, webhook];
    return webhook;
  }
  if (request.method === HttpMethod.DELETE && webhookPath) {
    tablesApi.webhooks = tablesApi.webhooks.filter((webhook) => !(webhook.tableId === webhookPath[1] && webhook.id === webhookPath[2]));
    return {};
  }
  throw new Error(`unexpected request ${request.method} ${request.url}`);
}

function pageOffset(cursor: unknown): number {
  if (typeof cursor !== 'string' || !cursor.startsWith(CURSOR_PREFIX)) {
    throw new Error(`cursor arrived altered: ${String(cursor)}`);
  }
  return Number(cursor.slice(CURSOR_PREFIX.length));
}

function isTableList(request: HttpRequest): boolean {
  return request.method === HttpMethod.GET && new URL(request.url).pathname.endsWith('/v1/tables');
}

function deletedTableIds(): string[] {
  return tablesApi.requests
    .filter((request) => request.method === HttpMethod.DELETE)
    .map((request) => new URL(request.url).pathname.split('/')[4]);
}

function hookContext(store: Store, tableExternalId = 'leads') {
  return {
    ...createMockActionContext({ propsValue: { table_id: tableExternalId } }),
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
  webhooks: { id: string; tableId: string; events?: TableWebhookEventType[] }[];
  requests: HttpRequest[];
};
