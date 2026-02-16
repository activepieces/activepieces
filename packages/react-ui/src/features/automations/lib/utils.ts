import { FolderDto, PopulatedFlow, Table } from '@activepieces/shared';

import { AutomationsFilters, FolderContent, TreeItem } from './types';

export const ROOT_PAGE_SIZE = 20;
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
      parentId: null,
    });
  });

  tables.forEach((table) => {
    items.push({
      id: table.id,
      type: 'table',
      name: table.name,
      data: table,
      depth: 0,
      parentId: null,
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
      parentId: folderId,
    });
  });

  content.tables.forEach((table) => {
    children.push({
      id: table.id,
      type: 'table',
      name: table.name,
      data: table,
      depth: 1,
      parentId: folderId,
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
      parentId: folderId,
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
  expandedFolders: Set<string>,
  folderVisibleCounts: Map<string, number>,
  rootPage: number,
): { items: TreeItem[]; totalRootItems: number } {
  const seenIds = new Set<string>();

  const folderItems: TreeItem[] = folders.map((folder) => {
    return {
      id: folder.id,
      type: 'folder' as const,
      name: folder.displayName,
      data: folder,
      depth: 0,
      parentId: null,
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
  const start = rootPage * ROOT_PAGE_SIZE;
  const pageItems = allTopLevel.slice(start, start + ROOT_PAGE_SIZE);

  const result: TreeItem[] = [];

  pageItems.forEach((item) => {
    const key = `${item.type}-${item.id}`;
    if (seenIds.has(key)) return;
    seenIds.add(key);
    result.push(item);

    if (item.type === 'folder' && expandedFolders.has(item.id)) {
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
  page: number,
): { items: TreeItem[]; totalItems: number } {
  const merged = mergeAndSortItems(flows, tables);
  const total = merged.length;
  const start = page * ROOT_PAGE_SIZE;
  const pageItems = merged.slice(start, start + ROOT_PAGE_SIZE);
  return { items: pageItems, totalItems: total };
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
