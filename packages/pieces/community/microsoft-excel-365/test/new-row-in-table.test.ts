import { Store } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const tableRows: { index: number; values: [[string]] }[] = [];

vi.mock('../src/lib/common/helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/common/helpers')>();
  return {
    ...actual,
    createMSGraphClient: () => ({
      api: () => ({ get: async () => ({ value: tableRows }) }),
    }),
  };
});

import { newRowInTableTrigger } from '../src/lib/trigger/new-row-in-table';

describe('newRowInTableTrigger', () => {
  beforeEach(() => {
    tableRows.length = 0;
  });

  it('emits only rows added after enable, once each', async () => {
    addRows(0, 1, 2);
    const context = makeContext();
    await newRowInTableTrigger.onEnable(context);

    addRows(3, 4);
    const firstPoll = await newRowInTableTrigger.run(context);
    expect(rowIndexes(firstPoll)).toEqual([4, 3]);

    const secondPoll = await newRowInTableTrigger.run(context);
    expect(secondPoll).toEqual([]);

    addRows(5);
    const thirdPoll = await newRowInTableTrigger.run(context);
    expect(rowIndexes(thirdPoll)).toEqual([5]);
  });
});

function addRows(...indexes: number[]): void {
  tableRows.push(...indexes.map((index) => ({ index, values: [[`row ${index}`]] as [[string]] })));
}

function rowIndexes(items: unknown[]): number[] {
  return items.map((item) => (item as { rowIndex: number }).rowIndex);
}

function makeContext(): Parameters<typeof newRowInTableTrigger.run>[0] {
  return {
    auth: { access_token: 'token', props: {} },
    propsValue: {
      storageSource: 'onedrive',
      workbookId: 'workbook',
      worksheetId: 'worksheet',
      tableId: 'table',
      has_headers: false,
    },
    store: memoryStore(),
    files: {},
  } as unknown as Parameters<typeof newRowInTableTrigger.run>[0];
}

function memoryStore(): Store {
  const data = new Map<string, unknown>();
  return {
    async put<T>(key: string, value: T): Promise<T> {
      data.set(key, value);
      return value;
    },
    async get<T>(key: string): Promise<T | null> {
      return (data.get(key) as T) ?? null;
    },
    async delete(key: string): Promise<void> {
      data.delete(key);
    },
  };
}
