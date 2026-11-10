/// <reference types="vitest/globals" />

import { AppConnectionType, Store, TriggerStrategy } from '@activepieces/pieces-framework';

const sheet = vi.hoisted((): { title: string; rows: string[][] } => ({ title: 'Orders', rows: [] }));

vi.mock('../src/lib/triggers/helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/triggers/helpers')>();
  return {
    ...actual,
    getWorkSheetName: async () => sheet.title,
    getWorkSheetValues: async (_auth: unknown, _spreadsheetId: string, range: string) => readRange(range),
    createFileNotification: async () => ({ data: { id: 'channel', resourceId: 'resource' } }),
    deleteFileNotification: async () => ({ data: undefined }),
  };
});

import { newOrUpdatedRowTrigger } from '../src/lib/triggers/new-or-updated-row.trigger';
import { newRowAddedTrigger } from '../src/lib/triggers/new-row-added-webhook';

const rowAdded = rowAddedWebhook();
const newOrUpdated = newOrUpdatedWebhook();

describe('Google Sheets row triggers on republish', () => {
  beforeEach(() => {
    sheet.rows = [
      ['Email', 'Status'],
      ['a@x.com', 'new'],
      ['b@x.com', 'new'],
    ];
  });

  it('New Row Added keeps its row count, so a row added just before the republish still fires', async () => {
    const store = memoryStore();
    const propsValue = rowAddedProps();
    await rowAdded.onEnable(hookContext({ store, propsValue }));

    sheet.rows.push(['c@x.com', 'new']);
    await rowAdded.onDisable(hookContext({ store, propsValue }));
    await rowAdded.onEnable(hookContext({ store, propsValue, isRepublish: true }));
    sheet.rows.push(['d@x.com', 'new']);

    const emitted = await rowAdded.run(hookContext({ store, propsValue }));
    expect(emitted.map(rowNumber)).toEqual([4, 5]);
  });

  it('New Row Added starts from the current rows when the flow is turned off and on', async () => {
    const store = memoryStore();
    const propsValue = rowAddedProps();
    await rowAdded.onEnable(hookContext({ store, propsValue }));

    sheet.rows.push(['c@x.com', 'new']);
    await rowAdded.onDisable(hookContext({ store, propsValue }));
    await rowAdded.onEnable(hookContext({ store, propsValue }));

    expect(await rowAdded.run(hookContext({ store, propsValue }))).toEqual([]);
  });

  it('New or Updated Row keeps its row hashes, so a row edited just before the republish still fires', async () => {
    const store = memoryStore();
    const propsValue = newOrUpdatedProps();
    await newOrUpdated.onEnable(hookContext({ store, propsValue }));

    sheet.rows[1] = ['a@x.com', 'paid'];
    await newOrUpdated.onDisable(hookContext({ store, propsValue }));
    await newOrUpdated.onEnable(hookContext({ store, propsValue, isRepublish: true }));
    sheet.rows[2] = ['b@x.com', 'paid'];

    const emitted = await newOrUpdated.run(hookContext({ store, propsValue }));
    expect(emitted.map(rowNumber)).toEqual([2, 3]);
  });

  it('New or Updated Row starts from the current rows when the flow is turned off and on', async () => {
    const store = memoryStore();
    const propsValue = newOrUpdatedProps();
    await newOrUpdated.onEnable(hookContext({ store, propsValue }));

    sheet.rows[1] = ['a@x.com', 'paid'];
    await newOrUpdated.onDisable(hookContext({ store, propsValue }));
    await newOrUpdated.onEnable(hookContext({ store, propsValue }));

    expect(await newOrUpdated.run(hookContext({ store, propsValue }))).toEqual([]);
  });
});

function rowAddedWebhook() {
  if (newRowAddedTrigger.type !== TriggerStrategy.WEBHOOK) {
    throw new Error('New Row Added is expected to be a webhook trigger');
  }
  return newRowAddedTrigger;
}

function newOrUpdatedWebhook() {
  if (newOrUpdatedRowTrigger.type !== TriggerStrategy.WEBHOOK) {
    throw new Error('New or Updated Row is expected to be a webhook trigger');
  }
  return newOrUpdatedRowTrigger;
}

function readRange(range: string): string[][] {
  const [, a1] = range.split('!');
  if (a1 === undefined) {
    return sheet.rows.map((row) => [...row]);
  }
  const [from, to] = a1.split(':').map(Number);
  return sheet.rows.slice(from - 1, to).map((row) => [...row]);
}

function rowNumber(item: unknown): unknown {
  return typeof item === 'object' && item !== null && 'row' in item ? item.row : undefined;
}

function rowAddedProps(): Parameters<typeof rowAdded.run>[0]['propsValue'] {
  return { info: undefined, spreadsheetId: 'sp1', sheetId: 7, includeTeamDrives: false };
}

function newOrUpdatedProps(): Parameters<typeof newOrUpdated.run>[0]['propsValue'] {
  return { ...rowAddedProps(), trigger_column: 'all_columns' };
}

function hookContext<P>({ store, propsValue, isRepublish }: { store: Store; propsValue: P; isRepublish?: boolean }) {
  return {
    store,
    propsValue,
    isRepublish,
    auth: connection,
    webhookUrl: 'https://example.com/api/v1/webhooks/flow1',
    payload: { headers: { 'x-goog-resource-state': 'update', 'x-goog-changed': 'content' }, body: {}, queryParams: {} },
    server: { apiUrl: 'http://localhost', publicUrl: 'http://localhost', token: 'token' },
    flows: { list: async () => ({ data: [], next: null, previous: null }), current: { id: 'flow1', version: { id: 'version1' } } },
    step: { name: 'trigger' },
    project: { id: 'project1', externalId: async () => undefined },
    connections: { get: async () => null },
    files: { write: async () => '', upload: async () => ({ id: '', url: '' }) },
  };
}

function memoryStore(): Store {
  const data = new Map<string, string>();
  return {
    async put<T>(key: string, value: T): Promise<T> {
      data.set(key, JSON.stringify(value));
      return value;
    },
    async get<T>(key: string): Promise<T | null> {
      const saved = data.get(key);
      return saved === undefined ? null : JSON.parse(saved);
    },
    async delete(key: string): Promise<void> {
      data.delete(key);
    },
  };
}

const connection: Parameters<typeof rowAdded.run>[0]['auth'] = {
  type: AppConnectionType.OAUTH2,
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  client_id: 'client-id',
  client_secret: 'client-secret',
  redirect_url: 'https://example.com/redirect',
  token_type: 'Bearer',
  token_url: 'https://oauth2.googleapis.com/token',
  scope: 'email',
  claimed_at: 0,
  expires_in: 3600,
  data: {},
};
