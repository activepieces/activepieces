import {
  AgentIcon,
  AgentSummary,
  AgentVisibility,
  ColorName,
  FolderDto,
  Table,
} from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { AutomationsSort } from '@/features/automations/lib/types';
import {
  buildFilteredTreeItems,
  buildTreeItems,
  nextSort,
} from '@/features/automations/lib/utils';

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
    rootAgents: [],
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

  it('pins the collation locale so every browser agrees', () => {
    const folders = [
      folder({
        id: 'z',
        displayName: 'zebra',
        updated: '2020-01-01T00:00:00.000Z',
      }),
      folder({
        id: 'a-ring',
        displayName: 'äpple',
        updated: '2020-01-01T00:00:00.000Z',
      }),
    ];
    expect(sortedNames({ folders, sort: 'name-asc' })).toEqual([
      'äpple',
      'zebra',
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

describe('automations tree with agents', () => {
  it('lists unfiled agents beside tables and files the rest under their folder', () => {
    const folder = makeAgentFolder({ id: 'folder1' });
    const filed = makeAgent({ id: 'agentFiled', folderId: folder.id });

    const { items, totalRootItems } = buildTreeItems({
      folders: [folder],
      rootFlows: [],
      rootTables: [makeTable({ id: 'table1', name: 'Leads' })],
      rootAgents: [makeAgent({ id: 'agentRoot', displayName: 'Triage' })],
      folderContents: new Map([
        [folder.id, { flows: [], tables: [], agents: [filed] }],
      ]),
      folderCounts: new Map([[folder.id, 1]]),
      folderVisibleCounts: new Map(),
      rootPage: 0,
      pageSize: 10,
      sort: 'name-asc',
    });

    expect(totalRootItems).toBe(3);
    expect(items.map((item) => [item.type, item.id, item.depth])).toEqual([
      ['folder', 'folder1', 0],
      ['agent', 'agentFiled', 1],
      ['table', 'table1', 0],
      ['agent', 'agentRoot', 0],
    ]);
  });

  it('sorts agents by name together with tables', () => {
    const { items } = buildTreeItems({
      folders: [],
      rootFlows: [],
      rootTables: [makeTable({ id: 'b', name: 'Beta' })],
      rootAgents: [
        makeAgent({ id: 'c', displayName: 'Gamma' }),
        makeAgent({ id: 'a', displayName: 'Alpha' }),
      ],
      folderContents: new Map(),
      folderCounts: new Map(),
      folderVisibleCounts: new Map(),
      rootPage: 0,
      pageSize: 10,
      sort: 'name-desc',
    });

    expect(items.map((item) => item.name)).toEqual(['Gamma', 'Beta', 'Alpha']);
  });

  it('keeps a matching agent under its folder while searching', () => {
    const folder = makeAgentFolder({ id: 'folder1' });

    const { items } = buildFilteredTreeItems({
      flows: [],
      tables: [],
      agents: [
        makeAgent({ id: 'inFolder', folderId: folder.id }),
        makeAgent({ id: 'atRoot' }),
      ],
      folders: [folder],
      folderVisibleCounts: new Map(),
      page: 0,
      pageSize: 10,
      sort: 'default',
    });

    expect(
      items.map((item) => [item.type, item.id, item.folderId, item.depth]),
    ).toEqual([
      ['folder', 'folder1', null, 0],
      ['agent', 'inFolder', 'folder1', 1],
      ['agent', 'atRoot', null, 0],
    ]);
  });
});

function makeAgent({
  id,
  displayName = id,
  folderId = null,
}: {
  id: string;
  displayName?: string;
  folderId?: string | null;
}): AgentSummary {
  return {
    id,
    created: CREATED,
    updated: CREATED,
    projectId: PROJECT_ID,
    ownerId: 'owner1',
    externalId: id,
    folderId,
    displayName,
    description: null,
    icon: AgentIcon.BOT,
    color: ColorName.PURPLE,
    visibility: AgentVisibility.PROJECT,
    sharedWithUserIds: [],
    isPublished: false,
    toolCount: 0,
    toolPieceNames: [],
    toolTypes: [],
    projectDisplayName: 'Project',
    projectIsPrivate: false,
  };
}

function makeTable({ id, name }: { id: string; name: string }): Table {
  return {
    id,
    created: CREATED,
    updated: CREATED,
    name,
    folderId: null,
    projectId: PROJECT_ID,
    externalId: id,
    status: null,
    trigger: null,
  };
}

function makeAgentFolder({ id }: { id: string }): FolderDto {
  return {
    id,
    created: CREATED,
    updated: CREATED,
    projectId: PROJECT_ID,
    displayName: id,
    displayOrder: 0,
    externalId: id,
    numberOfFlows: 0,
    numberOfTables: 0,
  };
}

const PROJECT_ID = 'project1';
const CREATED = '2026-09-30T00:00:00.000Z';
