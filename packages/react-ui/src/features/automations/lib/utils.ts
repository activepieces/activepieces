import { FolderDto, PopulatedFlow, Table } from '@activepieces/shared';

import { AutomationsFilters, FolderContent, TreeItem } from './types';

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50];
export const FOLDER_PAGE_SIZE = 10;
export const PARALLEL_FOLDER_THRESHOLD = 50;

export function getUpdatedDate(
  item: PopulatedFlow | Table | FolderDto,
): number {
  return new Date(item.updated).getTime();
}

export function getItemName(item: PopulatedFlow | Table): string {
  if ('version' in item) {
    return item.version.displayName;
  }
  return item.name;
}

export function mergeAndSortItems(
  flows: PopulatedFlow[],
  tables: Table[],
): TreeItem[] {
  const items: TreeItem[] = [];

  flows.forEach((flow) => {
    items.push({
      id: flow.id,
      type: 'flow',
      name: flow.version.displayName,
      data: flow,
      depth: 0,
      folderId: null,
    });
  });

  tables.forEach((table) => {
    items.push({
      id: table.id,
      type: 'table',
      name: table.name,
      data: table,
      depth: 0,
      folderId: null,
    });
  });

  items.sort((a, b) => getUpdatedDate(b.data!) - getUpdatedDate(a.data!));
  return items;
}

export function buildFolderChildren(
  content: FolderContent,
  folderId: string,
  visibleCount: number,
  totalCount: number,
): TreeItem[] {
  const children: TreeItem[] = [];

  content.flows.forEach((flow) => {
    children.push({
      id: flow.id,
      type: 'flow',
      name: flow.version.displayName,
      data: flow,
      depth: 1,
      folderId,
    });
  });

  content.tables.forEach((table) => {
    children.push({
      id: table.id,
      type: 'table',
      name: table.name,
      data: table,
      depth: 1,
      folderId,
    });
  });

  children.sort((a, b) => getUpdatedDate(b.data!) - getUpdatedDate(a.data!));

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

export function buildTreeItems(
  folders: FolderDto[],
  rootFlows: PopulatedFlow[],
  rootTables: Table[],
  folderContents: Map<string, FolderContent>,
  folderCounts: Map<string, number>,
  folderVisibleCounts: Map<string, number>,
  rootPage: number,
  pageSize: number,
): { items: TreeItem[]; totalRootItems: number } {
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

  const rootItems = mergeAndSortItems(dedupedFlows, dedupedTables);
  const allTopLevel = [...folderItems, ...rootItems];
  allTopLevel.sort((a, b) => getUpdatedDate(b.data!) - getUpdatedDate(a.data!));

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
        const children = buildFolderChildren(
          content,
          item.id,
          visibleCount,
          totalCount,
        );
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

export function buildFilteredTreeItems(
  flows: PopulatedFlow[],
  tables: Table[],
  folders: FolderDto[],
  folderVisibleCounts: Map<string, number>,
  page: number,
  pageSize: number,
): { items: TreeItem[]; totalItems: number } {
  const folderMap = new Map<string, FolderDto>();
  folders.forEach((f) => folderMap.set(f.id, f));

  const folderChildren = new Map<string, TreeItem[]>();
  const rootItems: TreeItem[] = [];

  flows.forEach((flow) => {
    const itemFolderId =
      flow.folderId && folderMap.has(flow.folderId) ? flow.folderId : null;
    const item: TreeItem = {
      id: flow.id,
      type: 'flow',
      name: flow.version.displayName,
      data: flow,
      depth: itemFolderId ? 1 : 0,
      folderId: itemFolderId,
    };
    if (item.folderId) {
      const list = folderChildren.get(item.folderId) ?? [];
      list.push(item);
      folderChildren.set(item.folderId, list);
    } else {
      rootItems.push(item);
    }
  });

  tables.forEach((table) => {
    const itemFolderId =
      table.folderId && folderMap.has(table.folderId) ? table.folderId : null;
    const item: TreeItem = {
      id: table.id,
      type: 'table',
      name: table.name,
      data: table,
      depth: itemFolderId ? 1 : 0,
      folderId: itemFolderId,
    };
    if (item.folderId) {
      const list = folderChildren.get(item.folderId) ?? [];
      list.push(item);
      folderChildren.set(item.folderId, list);
    } else {
      rootItems.push(item);
    }
  });

  const folderItems: TreeItem[] = [];
  for (const [folderId, children] of folderChildren) {
    const folder = folderMap.get(folderId)!;
    children.sort((a, b) => getUpdatedDate(b.data!) - getUpdatedDate(a.data!));
    folderItems.push({
      id: folder.id,
      type: 'folder',
      name: folder.displayName,
      data: folder,
      depth: 0,
      folderId: null,
      childCount: children.length,
    });
  }

  const allTopLevel = [...folderItems, ...rootItems];
  allTopLevel.sort((a, b) => getUpdatedDate(b.data!) - getUpdatedDate(a.data!));

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
    filters.ownerFilter.length > 0
  );
}

export function getItemKey(item: TreeItem): string {
  return `${item.type}-${item.id}`;
}

export type TreeRow = { item: TreeItem; children: TreeItem[] };

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
