import { FolderDto } from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { AutomationsSort } from '@/features/automations/lib/types';
import { buildTreeItems, nextSort } from '@/features/automations/lib/utils';

function folder({
  id,
  displayName,
  updated,
}: {
  id: string;
  displayName: string;
  updated: string;
}): FolderDto {
  return {
    id,
    displayName,
    created: updated,
    updated,
    projectId: 'project-1',
    displayOrder: 0,
    externalId: null,
    numberOfFlows: 0,
    numberOfTables: 0,
  };
}

function sortedNames({
  folders,
  sort,
  pinnedList,
}: {
  folders: FolderDto[];
  sort: AutomationsSort;
  pinnedList?: string[];
}): string[] {
  const { items } = buildTreeItems({
    folders,
    rootFlows: [],
    rootTables: [],
    folderContents: new Map(),
    folderCounts: new Map(),
    folderVisibleCounts: new Map(),
    rootPage: 0,
    pageSize: 100,
    pinnedList,
    sort,
  });
  return items.map((item) => item.name);
}

const zebra = folder({
  id: 'zebra',
  displayName: 'Zebra',
  updated: '2020-01-03T00:00:00.000Z',
});
const apple = folder({
  id: 'apple',
  displayName: 'apple',
  updated: '2020-01-02T00:00:00.000Z',
});
const mango = folder({
  id: 'mango',
  displayName: 'Mango',
  updated: '2020-01-01T00:00:00.000Z',
});

describe('automations name sort', () => {
  it('keeps the most recently updated first when sort is default', () => {
    expect(
      sortedNames({ folders: [apple, mango, zebra], sort: 'default' }),
    ).toEqual(['Zebra', 'apple', 'Mango']);
  });

  it('ignores case when sorting ascending', () => {
    expect(
      sortedNames({ folders: [zebra, apple, mango], sort: 'name-asc' }),
    ).toEqual(['apple', 'Mango', 'Zebra']);
  });

  it('ignores case when sorting descending', () => {
    expect(
      sortedNames({ folders: [apple, mango, zebra], sort: 'name-desc' }),
    ).toEqual(['Zebra', 'Mango', 'apple']);
  });

  it('orders embedded numbers lexically, matching the server', () => {
    const folders = [
      folder({
        id: 'two',
        displayName: 'Table 2',
        updated: '2020-01-01T00:00:00.000Z',
      }),
      folder({
        id: 'ten',
        displayName: 'Table 10',
        updated: '2020-01-01T00:00:00.000Z',
      }),
    ];
    expect(sortedNames({ folders, sort: 'name-asc' })).toEqual([
      'Table 10',
      'Table 2',
    ]);
  });

  it('distinguishes accents, matching LOWER() on the server', () => {
    const folders = [
      folder({
        id: 'accented',
        displayName: 'éclair',
        updated: '2020-01-01T00:00:00.000Z',
      }),
      folder({
        id: 'plain',
        displayName: 'Eclair',
        updated: '2020-01-01T00:00:00.000Z',
      }),
    ];
    expect(sortedNames({ folders, sort: 'name-asc' })).toEqual([
      'Eclair',
      'éclair',
    ]);
  });

  it('keeps pinned items first in both directions', () => {
    const folders = [zebra, apple, mango];
    expect(
      sortedNames({ folders, sort: 'name-asc', pinnedList: ['zebra'] }),
    ).toEqual(['Zebra', 'apple', 'Mango']);
    expect(
      sortedNames({ folders, sort: 'name-desc', pinnedList: ['apple'] }),
    ).toEqual(['apple', 'Zebra', 'Mango']);
  });
});

describe('nextSort', () => {
  it('cycles default to ascending to descending and back', () => {
    expect(nextSort('default')).toBe('name-asc');
    expect(nextSort('name-asc')).toBe('name-desc');
    expect(nextSort('name-desc')).toBe('default');
  });
});
