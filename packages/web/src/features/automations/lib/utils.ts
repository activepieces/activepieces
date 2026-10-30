import {
  AgentSummary,
  FolderDto,
  PopulatedFlow,
  Table,
} from '@activepieces/shared';

import {
  AutomationsFilters,
  AutomationsSort,
  FolderContent,
  TreeItem,
} from './types';

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50];
export const FOLDER_PAGE_SIZE = 50;
export const ROOT_ITEMS_LIMIT = 1000;

export function getUpdatedDate(
  item: PopulatedFlow | Table | AgentSummary | FolderDto,
): number {
  return new Date(item.updated).getTime();
}

export function mergeAndSortItems({
  flows,
  tables,
  agents,
  sort,
}: {
  flows: PopulatedFlow[];
  tables: Table[];
  agents: AgentSummary[];
  sort: AutomationsSort;
}): TreeItem[] {
  return toTreeItems({
    content: { flows, tables, agents },
    placeIn: () => null,
  }).sort(treeItemComparator(sort));
}

export function buildFolderChildren({
  content,
  folderId,
  visibleCount,
  totalCount,
  sort,
}: {
  content: FolderContent;
  folderId: string;
  visibleCount: number;
  totalCount: number;
  sort: AutomationsSort;
}): TreeItem[] {
  const children = toTreeItems({ content, placeIn: () => folderId }).sort(
    treeItemComparator(sort),
  );

  const visible = children.slice(0, visibleCount);
  const remaining = totalCount - Math.min(visibleCount, children.length);

  if (remaining > 0) {
    visible.push({
      id: `load-more-${folderId}`,
      type: 'load-more-folder',
      name: '',
      data: null,
      depth: 1,
      folderId,
      loadMoreCount: remaining,
    });
  }

  return visible;
}

export function buildTreeItems({
  folders,
  rootFlows,
  rootTables,
  rootAgents,
  folderContents,
  folderCounts,
  folderVisibleCounts,
  rootPage,
  pageSize,
  pinnedList,
  sort,
}: {
  folders: FolderDto[];
  rootFlows: PopulatedFlow[];
  rootTables: Table[];
  rootAgents: AgentSummary[];
  folderContents: Map<string, FolderContent>;
  folderCounts: Map<string, number>;
  folderVisibleCounts: Map<string, number>;
  rootPage: number;
  pageSize: number;
  pinnedList?: string[];
  sort: AutomationsSort;
}): { items: TreeItem[]; totalRootItems: number } {
  const seenIds = new Set<string>();

  const folderItems: TreeItem[] = folders.map((folder) => {
    return {
      id: folder.id,
      type: 'folder' as const,
      name: folder.displayName,
      data: folder,
      depth: 0,
      folderId: null,
      childCount: folderCounts.get(folder.id) ?? 0,
    };
  });

  const folderIdSet = new Set(folders.map((f) => f.id));
  const dedupedFlows = rootFlows.filter(
    (f) => !f.folderId || !folderIdSet.has(f.folderId),
  );
  const dedupedTables = rootTables.filter(
    (t) => !t.folderId || !folderIdSet.has(t.folderId),
  );
  const dedupedAgents = rootAgents.filter(
    (a) => !a.folderId || !folderIdSet.has(a.folderId),
  );

  const rootItems = mergeAndSortItems({
    flows: dedupedFlows,
    tables: dedupedTables,
    agents: dedupedAgents,
    sort,
  });
  const compareItems = treeItemComparator(sort);
  const allTopLevel = [...folderItems, ...rootItems];
  allTopLevel.sort((a, b) => {
    const aOrder = pinnedList ? pinnedList.indexOf(a.id) : -1;
    const bOrder = pinnedList ? pinnedList.indexOf(b.id) : -1;
    const aPinned = aOrder !== -1;
    const bPinned = bOrder !== -1;
    if (aPinned && bPinned) return aOrder - bOrder;
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    return compareItems(a, b);
  });

  const totalRootItems = allTopLevel.length;
  const start = rootPage * pageSize;
  const pageItems = allTopLevel.slice(start, start + pageSize);

  const result: TreeItem[] = [];

  pageItems.forEach((item) => {
    const key = `${item.type}-${item.id}`;
    if (seenIds.has(key)) return;
    seenIds.add(key);
    result.push(item);

    if (item.type === 'folder') {
      const content = folderContents.get(item.id);
      if (content) {
        const visibleCount =
          folderVisibleCounts.get(item.id) ?? FOLDER_PAGE_SIZE;
        const totalCount = folderCounts.get(item.id) ?? 0;
        const children = buildFolderChildren({
          content,
          folderId: item.id,
          visibleCount,
          totalCount,
          sort,
        });
        children.forEach((child) => {
          const childKey = `${child.type}-${child.id}`;
          if (seenIds.has(childKey)) return;
          seenIds.add(childKey);
          result.push(child);
        });
      }
    }
  });

  return { items: result, totalRootItems };
}

export function buildFilteredTreeItems({
  flows,
  tables,
  agents,
  folders,
  folderVisibleCounts,
  page,
  pageSize,
  pinnedList,
  searchTerm,
  folderContents,
  folderCounts,
  sort,
}: {
  flows: PopulatedFlow[];
  tables: Table[];
  agents: AgentSummary[];
  folders: FolderDto[];
  folderVisibleCounts: Map<string, number>;
  page: number;
  pageSize: number;
  pinnedList?: string[];
  searchTerm?: string;
  folderContents?: Map<string, FolderContent>;
  folderCounts?: Map<string, number>;
  sort: AutomationsSort;
}): { items: TreeItem[]; totalItems: number } {
  const compareItems = treeItemComparator(sort);
  const folderMap = new Map<string, FolderDto>();
  folders.forEach((f) => folderMap.set(f.id, f));

  const folderChildren = new Map<string, TreeItem[]>();
  const rootItems: TreeItem[] = [];

  toTreeItems({
    content: { flows, tables, agents },
    placeIn: (entityFolderId) =>
      entityFolderId && folderMap.has(entityFolderId) ? entityFolderId : null,
  }).forEach((item) => {
    if (item.folderId) {
      const list = folderChildren.get(item.folderId) ?? [];
      list.push(item);
      folderChildren.set(item.folderId, list);
    } else {
      rootItems.push(item);
    }
  });

  const folderItems: TreeItem[] = [];
  const addedFolderIds = new Set<string>();

  for (const [folderId, children] of folderChildren) {
    const folder = folderMap.get(folderId)!;
    children.sort(compareItems);
    folderItems.push({
      id: folder.id,
      type: 'folder',
      name: folder.displayName,
      data: folder,
      depth: 0,
      folderId: null,
      childCount: children.length,
    });
    addedFolderIds.add(folderId);
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    for (const folder of folders) {
      if (
        !addedFolderIds.has(folder.id) &&
        folder.displayName.toLowerCase().includes(term)
      ) {
        const content = folderContents?.get(folder.id);
        const totalCount = folderCounts?.get(folder.id) ?? 0;
        if (content) {
          const children = buildFolderChildren({
            content,
            folderId: folder.id,
            visibleCount:
              folderVisibleCounts.get(folder.id) ?? FOLDER_PAGE_SIZE,
            totalCount,
            sort,
          });
          folderChildren.set(folder.id, children);
        }
        folderItems.push({
          id: folder.id,
          type: 'folder',
          name: folder.displayName,
          data: folder,
          depth: 0,
          folderId: null,
          childCount: totalCount,
        });
        addedFolderIds.add(folder.id);
      }
    }
  }

  const allTopLevel = [...folderItems, ...rootItems];
  allTopLevel.sort((a, b) => {
    const aOrder = pinnedList ? pinnedList.indexOf(a.id) : -1;
    const bOrder = pinnedList ? pinnedList.indexOf(b.id) : -1;
    const aPinned = aOrder !== -1;
    const bPinned = bOrder !== -1;
    if (aPinned && bPinned) return aOrder - bOrder;
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    return compareItems(a, b);
  });

  const totalItems = allTopLevel.length;
  const start = page * pageSize;
  const pageTopLevel = allTopLevel.slice(start, start + pageSize);

  const result: TreeItem[] = [];
  for (const item of pageTopLevel) {
    result.push(item);
    if (item.type === 'folder') {
      const children = folderChildren.get(item.id) ?? [];
      const visibleCount = folderVisibleCounts.get(item.id) ?? FOLDER_PAGE_SIZE;
      const visible = children.slice(0, visibleCount);
      result.push(...visible);
      const remaining = children.length - visible.length;
      if (remaining > 0) {
        result.push({
          id: `load-more-${item.id}`,
          type: 'load-more-folder',
          name: '',
          data: null,
          depth: 1,
          folderId: item.id,
          loadMoreCount: remaining,
        });
      }
    }
  }

  return { items: result, totalItems };
}

export function hasActiveFilters(filters: AutomationsFilters): boolean {
  return (
    filters.searchTerm.length > 0 ||
    filters.typeFilter.length > 0 ||
    filters.statusFilter.length > 0 ||
    filters.connectionFilter.length > 0 ||
    filters.ownerFilter.length > 0 ||
    filters.folderFilter.length > 0
  );
}

export function hasNonFolderFilters(filters: AutomationsFilters): boolean {
  return (
    filters.searchTerm.length > 0 ||
    filters.typeFilter.length > 0 ||
    filters.statusFilter.length > 0 ||
    filters.connectionFilter.length > 0 ||
    filters.ownerFilter.length > 0
  );
}

export function getItemKey(item: TreeItem): string {
  return `${item.type}-${item.id}`;
}

export function nextSort(sort: AutomationsSort): AutomationsSort {
  switch (sort) {
    case 'default':
      return 'name-asc';
    case 'name-asc':
      return 'name-desc';
    case 'name-desc':
      return 'default';
  }
}

export function groupTreeItemsByFolder(items: TreeItem[]): TreeRow[] {
  return items.reduce<TreeRow[]>((rows, item) => {
    if (item.depth === 1) {
      const parent = rows[rows.length - 1];
      if (parent) parent.children.push(item);
    } else {
      rows.push({ item, children: [] });
    }
    return rows;
  }, []);
}

function toTreeItems({
  content,
  placeIn,
}: {
  content: FolderContent;
  placeIn: (entityFolderId: string | null) => string | null;
}): TreeItem[] {
  const entries = [
    ...content.flows.map((flow) => ({
      id: flow.id,
      type: 'flow' as const,
      name: flow.version.displayName,
      data: flow,
      entityFolderId: flow.folderId ?? null,
    })),
    ...content.tables.map((table) => ({
      id: table.id,
      type: 'table' as const,
      name: table.name,
      data: table,
      entityFolderId: table.folderId ?? null,
    })),
    ...content.agents.map((agent) => ({
      id: agent.id,
      type: 'agent' as const,
      name: agent.displayName,
      data: agent,
      entityFolderId: agent.folderId ?? null,
    })),
  ];
  return entries.map(({ entityFolderId, ...entry }) => {
    const folderId = placeIn(entityFolderId);
    return { ...entry, depth: folderId ? 1 : 0, folderId };
  });
}

function treeItemComparator(
  sort: AutomationsSort,
): (a: TreeItem, b: TreeItem) => number {
  if (sort === 'default') {
    return (a, b) => getUpdatedDate(b.data!) - getUpdatedDate(a.data!);
  }
  const direction = sort === 'name-asc' ? 1 : -1;
  return (a, b) =>
    direction *
    a.name.localeCompare(b.name, NAME_SORT_LOCALE, { sensitivity: 'accent' });
}

const NAME_SORT_LOCALE = 'en';

export type TreeRow = { item: TreeItem; children: TreeItem[] };
