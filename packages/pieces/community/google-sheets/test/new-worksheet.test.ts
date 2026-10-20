/// <reference types="vitest/globals" />

import { Store } from '@activepieces/pieces-framework';

const sheetsInSpreadsheet: { properties: { sheetId: number; title: string } }[] = [];

vi.mock('@googleapis/sheets', () => ({
  sheets: () => ({
    spreadsheets: { get: async () => ({ data: { sheets: sheetsInSpreadsheet } }) },
  }),
}));

vi.mock('../src/lib/common/common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/common/common')>();
  return { ...actual, createGoogleClient: vi.fn().mockResolvedValue({}) };
});

import { newWorksheetTrigger } from '../src/lib/triggers/new-worksheet';

describe('newWorksheetTrigger', () => {
  beforeEach(() => {
    sheetsInSpreadsheet.length = 0;
  });

  it('treats the default sheet (id 0) as existing at enable time', async () => {
    sheetsInSpreadsheet.push(sheet(0, 'Sheet1'), sheet(123, 'Budget'));
    const context = makeContext();
    await newWorksheetTrigger.onEnable(context);

    expect(await newWorksheetTrigger.run(context)).toEqual([]);
  });

  it('emits a worksheet added after enable', async () => {
    sheetsInSpreadsheet.push(sheet(0, 'Sheet1'));
    const context = makeContext();
    await newWorksheetTrigger.onEnable(context);

    sheetsInSpreadsheet.push(sheet(456, 'Q3'));
    const emitted = await newWorksheetTrigger.run(context);
    expect(emitted.map((item) => (item as { properties: { sheetId: number } }).properties.sheetId)).toEqual([456]);
  });
});

function sheet(sheetId: number, title: string): { properties: { sheetId: number; title: string } } {
  return { properties: { sheetId, title } };
}

function makeContext(): Parameters<typeof newWorksheetTrigger.run>[0] {
  return {
    auth: {},
    propsValue: { spreadsheetId: 'spreadsheet-id', includeTeamDrives: false },
    store: memoryStore(),
    files: {},
  } as unknown as Parameters<typeof newWorksheetTrigger.run>[0];
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
