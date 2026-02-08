import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { createCollection, useLiveQuery } from '@tanstack/react-db';
import { QueryClient, useMutation } from '@tanstack/react-query';
import { useMemo, useState, useCallback } from 'react';

import { flowsApi } from '@/features/flows/lib/flows-api';
import { foldersApi } from '@/features/folders/lib/folders-api';
import { tablesApi } from '@/features/tables/lib/tables-api';
import { authenticationSession } from '@/lib/authentication-session';
import {
  FolderDto,
  FlowOperationType,
  PopulatedFlow,
  Table,
  UpdateTableRequest,
} from '@activepieces/shared';

import { TreeItemType } from './types';
import { FOLDER_PAGE_SIZE, ROOT_PAGE_SIZE } from './utils';

const FETCH_LIMIT = 100000;
const collectionQueryClient = new QueryClient();

export const flowsCollection = createCollection<PopulatedFlow, string>(
  queryCollectionOptions({
    queryKey: ['flows-collection'],
    queryClient: collectionQueryClient,
    queryFn: async () => {
      const projectId = authenticationSession.getProjectId()!;
      const response = await flowsApi.list({
        projectId,
        limit: FETCH_LIMIT,
        cursor: undefined,
      });
      return response.data;
    },
    getKey: (item) => item.id,
    onUpdate: async ({ transaction }) => {
      for (const { original, modified } of transaction.mutations) {
        if (original.folderId !== modified.folderId) {
          await flowsApi.update(original.id, {
            type: FlowOperationType.CHANGE_FOLDER,
            request: { folderId: modified.folderId ?? null },
          });
        }
        if (original.version.displayName !== modified.version.displayName) {
          await flowsApi.update(original.id, {
            type: FlowOperationType.CHANGE_NAME,
            request: { displayName: modified.version.displayName },
          });
        }
        if (original.status !== modified.status) {
          await flowsApi.update(original.id, {
            type: FlowOperationType.CHANGE_STATUS,
            request: { status: modified.status },
          });
        }
      }
    },
    onDelete: async ({ transaction }) => {
      for (const { original } of transaction.mutations) {
        await flowsApi.delete(original.id);
      }
    },
  }),
);

export type TableWithRowCount = Table & { rowCount?: number };

export const tablesCollection = createCollection<TableWithRowCount, string>(
  queryCollectionOptions({
    queryKey: ['tables-collection'],
    queryClient: collectionQueryClient,
    queryFn: async () => {
      const projectId = authenticationSession.getProjectId()!;
      const response = await tablesApi.list({
        projectId,
        limit: FETCH_LIMIT,
        cursor: undefined,
      });
      return response.data;
    },
    getKey: (item) => item.id,
    onUpdate: async ({ transaction }) => {
      for (const { original, modified } of transaction.mutations) {
        const updateRequest: UpdateTableRequest = {};

        if (original.name !== modified.name) {
          updateRequest.name = modified.name;
        }
        if (original.folderId !== modified.folderId) {
          updateRequest.folderId = modified.folderId;
        }

        if (Object.keys(updateRequest).length > 0) {
          await tablesApi.update(original.id, updateRequest);
        }
      }
    },
    onDelete: async ({ transaction }) => {
      for (const { original } of transaction.mutations) {
        await tablesApi.delete(original.id);
      }
    },
  }),
);

export const foldersCollection = createCollection<FolderDto, string>(
  queryCollectionOptions({
    queryKey: ['folders-collection'],
    queryClient: collectionQueryClient,
    queryFn: async () => {
      const folders = await foldersApi.list();
      return folders;
    },
    getKey: (item) => item.id,
    onUpdate: async ({ transaction }) => {
      for (const { original, modified } of transaction.mutations) {
        if (original.displayName !== modified.displayName) {
          await foldersApi.renameFolder(original.id, {
            displayName: modified.displayName,
          });
        }
      }
    },
    onDelete: async ({ transaction }) => {
      for (const { original } of transaction.mutations) {
        await foldersApi.delete(original.id);
      }
    },
  }),
);

export const automationsCollectionUtils = {
  useAllFlows: () => {
    return useLiveQuery(
      (q) =>
        q.from({ flow: flowsCollection }).select(({ flow }) => ({ ...flow })),
      [],
    );
  },

  updateFlow: (flowId: string, updates: Partial<PopulatedFlow>) => {
    flowsCollection.update(flowId, (draft) => {
      Object.assign(draft, updates);
    });
  },

  moveFlowToFolder: (flowId: string, folderId: string | null) => {
    flowsCollection.update(flowId, (draft) => {
      draft.folderId = folderId;
    });
  },

  renameFlow: (flowId: string, displayName: string) => {
    flowsCollection.update(flowId, (draft) => {
      draft.version.displayName = displayName;
    });
  },

  deleteFlows: (flowIds: string[]) => {
    flowsCollection.delete(flowIds);
  },

  useAllTables: () => {
    return useLiveQuery(
      (q) =>
        q
          .from({ table: tablesCollection })
          .select(({ table }) => ({ ...table })),
      [],
    );
  },

  updateTable: (tableId: string, updates: Partial<TableWithRowCount>) => {
    tablesCollection.update(tableId, (draft) => {
      Object.assign(draft, updates);
    });
  },

  moveTableToFolder: (tableId: string, folderId: string | null) => {
    tablesCollection.update(tableId, (draft) => {
      draft.folderId = folderId;
    });
  },

  renameTable: (tableId: string, name: string) => {
    tablesCollection.update(tableId, (draft) => {
      draft.name = name;
    });
  },

  deleteTables: (tableIds: string[]) => {
    tablesCollection.delete(tableIds);
  },

  useAllFolders: () => {
    return useLiveQuery(
      (q) =>
        q
          .from({ folder: foldersCollection })
          .select(({ folder }) => ({ ...folder })),
      [],
    );
  },

  renameFolder: (folderId: string, displayName: string) => {
    foldersCollection.update(folderId, (draft) => {
      draft.displayName = displayName;
    });
  },

  deleteFolders: (folderIds: string[]) => {
    foldersCollection.delete(folderIds);
  },

  useCreateFolder: (
    onSuccess: (folder: FolderDto) => void,
    onError: (error: Error) => void,
  ) => {
    const projectId = authenticationSession.getProjectId()!;
    return useMutation({
      mutationFn: (displayName: string) =>
        foldersApi.create({ projectId, displayName }),
      onSuccess: (data) => {
        foldersCollection.utils.writeInsert(data);
        onSuccess(data);
      },
      onError: (error) => {
        onError(error);
      },
    });
  },
};

export type TreeItem = {
  id: string;
  type: TreeItemType;
  name: string;
  data: FolderDto | PopulatedFlow | TableWithRowCount | null;
  depth: number;
  parentId: string | null;
  childCount?: number;
  folderId?: string;
  loadMoreCount?: number;
};

export type AutomationsFilters = {
  searchTerm: string;
  typeFilter: string[];
  statusFilter: string[];
  connectionFilter: string[];
  ownerFilter: string[];
};

export const useAutomationsTree = (filters: AutomationsFilters) => {
  const { data: flows, isLoading: isLoadingFlows } =
    automationsCollectionUtils.useAllFlows();
  const { data: tables, isLoading: isLoadingTables } =
    automationsCollectionUtils.useAllTables();
  const { data: folders, isLoading: isLoadingFolders } =
    automationsCollectionUtils.useAllFolders();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );

  const [folderItemLimits, setFolderItemLimits] = useState<Map<string, number>>(
    new Map(),
  );

  const [rootItemLimit, setRootItemLimit] = useState(ROOT_PAGE_SIZE);

  const hasActiveFilters =
    filters.searchTerm !== '' ||
    filters.typeFilter.length > 0 ||
    filters.statusFilter.length > 0 ||
    filters.connectionFilter.length > 0 ||
    filters.ownerFilter.length > 0;

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const loadMoreInFolder = useCallback((folderId: string) => {
    setFolderItemLimits((prev) => {
      const next = new Map(prev);
      const currentLimit = next.get(folderId) ?? FOLDER_PAGE_SIZE;
      next.set(folderId, currentLimit + FOLDER_PAGE_SIZE);
      return next;
    });
  }, []);

  const loadMoreRoot = useCallback(() => {
    setRootItemLimit((prev) => prev + ROOT_PAGE_SIZE);
  }, []);

  const resetPagination = useCallback(() => {
    setFolderItemLimits(new Map());
    setRootItemLimit(ROOT_PAGE_SIZE);
  }, []);

  const { treeItems, totalRootItems, folderChildCounts } = useMemo(() => {
    const items: TreeItem[] = [];
    const {
      searchTerm,
      typeFilter,
      statusFilter,
      connectionFilter,
      ownerFilter,
    } = filters;

    const matchesSearch = (name: string) =>
      !searchTerm || name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFlowFilters = (flow: PopulatedFlow) => {
      if (typeFilter.length > 0 && !typeFilter.includes('flow')) return false;
      if (statusFilter.length > 0 && !statusFilter.includes(flow.status))
        return false;
      if (connectionFilter.length > 0) {
        const flowConnectionIds = flow.version.connectionIds || [];
        const hasMatchingConnection = connectionFilter.some((connId) =>
          flowConnectionIds.includes(connId),
        );
        if (!hasMatchingConnection) return false;
      }
      if (ownerFilter.length > 0 && !ownerFilter.includes(flow.ownerId || ''))
        return false;
      return matchesSearch(flow.version.displayName);
    };

    const matchesTableFilters = (table: TableWithRowCount) => {
      if (typeFilter.length > 0 && !typeFilter.includes('table')) return false;
      if (statusFilter.length > 0) return false;
      if (connectionFilter.length > 0) return false;
      if (ownerFilter.length > 0) return false;
      return matchesSearch(table.name);
    };

    const flowsByFolder = new Map<string | null, PopulatedFlow[]>();
    const tablesByFolder = new Map<string | null, TableWithRowCount[]>();

    flows?.forEach((flow) => {
      const folderId = flow.folderId ?? null;
      if (!flowsByFolder.has(folderId)) {
        flowsByFolder.set(folderId, []);
      }
      if (matchesFlowFilters(flow)) {
        flowsByFolder.get(folderId)!.push(flow);
      }
    });

    tables?.forEach((table) => {
      const folderId = table.folderId ?? null;
      if (!tablesByFolder.has(folderId)) {
        tablesByFolder.set(folderId, []);
      }
      if (matchesTableFilters(table)) {
        tablesByFolder.get(folderId)!.push(table);
      }
    });

    const sortByUpdated = (a: { updated: string }, b: { updated: string }) =>
      new Date(b.updated).getTime() - new Date(a.updated).getTime();

    const folderChildCounts = new Map<string, number>();

    folders?.forEach((folder) => {
      const folderFlows = flowsByFolder.get(folder.id) || [];
      const folderTables = tablesByFolder.get(folder.id) || [];
      const totalChildren = folderFlows.length + folderTables.length;
      folderChildCounts.set(folder.id, totalChildren);

      const folderMatchesSearch = matchesSearch(folder.displayName);
      const hasMatchingChildren = totalChildren > 0;

      if (
        (folderMatchesSearch || hasMatchingChildren) &&
        (typeFilter.length === 0 || hasMatchingChildren)
      ) {
        items.push({
          id: folder.id,
          type: 'folder',
          name: folder.displayName,
          data: folder,
          depth: 0,
          parentId: null,
          childCount: totalChildren,
        });

        if (expandedFolders.has(folder.id)) {
          const allChildren: TreeItem[] = [];

          folderFlows.sort(sortByUpdated).forEach((flow) => {
            allChildren.push({
              id: flow.id,
              type: 'flow',
              name: flow.version.displayName,
              data: flow,
              depth: 1,
              parentId: folder.id,
            });
          });

          folderTables.sort(sortByUpdated).forEach((table) => {
            allChildren.push({
              id: table.id,
              type: 'table',
              name: table.name,
              data: table,
              depth: 1,
              parentId: folder.id,
            });
          });

          allChildren.sort((a, b) => {
            const aDate =
              a.type === 'flow'
                ? (a.data as PopulatedFlow).updated
                : (a.data as TableWithRowCount).updated;
            const bDate =
              b.type === 'flow'
                ? (b.data as PopulatedFlow).updated
                : (b.data as TableWithRowCount).updated;
            return new Date(bDate).getTime() - new Date(aDate).getTime();
          });

          if (hasActiveFilters) {
            items.push(...allChildren);
          } else {
            const folderLimit =
              folderItemLimits.get(folder.id) ?? FOLDER_PAGE_SIZE;
            const visibleChildren = allChildren.slice(0, folderLimit);
            items.push(...visibleChildren);

            if (allChildren.length > folderLimit) {
              items.push({
                id: `load-more-${folder.id}`,
                type: 'load-more-folder',
                name: `Load ${Math.min(
                  FOLDER_PAGE_SIZE,
                  allChildren.length - folderLimit,
                )} more...`,
                data: null,
                depth: 1,
                parentId: folder.id,
                folderId: folder.id,
                loadMoreCount: allChildren.length - folderLimit,
              });
            }
          }
        }
      }
    });

    const rootFlows = flowsByFolder.get(null) || [];
    const rootTables = tablesByFolder.get(null) || [];

    const rootItems: TreeItem[] = [];

    rootFlows.sort(sortByUpdated).forEach((flow) => {
      rootItems.push({
        id: flow.id,
        type: 'flow',
        name: flow.version.displayName,
        data: flow,
        depth: 0,
        parentId: null,
      });
    });

    rootTables.sort(sortByUpdated).forEach((table) => {
      rootItems.push({
        id: table.id,
        type: 'table',
        name: table.name,
        data: table,
        depth: 0,
        parentId: null,
      });
    });

    rootItems.sort((a, b) => {
      const aDate =
        a.type === 'flow'
          ? (a.data as PopulatedFlow).updated
          : (a.data as TableWithRowCount).updated;
      const bDate =
        b.type === 'flow'
          ? (b.data as PopulatedFlow).updated
          : (b.data as TableWithRowCount).updated;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    const totalRootItems = rootItems.length;

    if (hasActiveFilters) {
      items.push(...rootItems);
    } else {
      const visibleRootItems = rootItems.slice(0, rootItemLimit);
      items.push(...visibleRootItems);

      if (totalRootItems > rootItemLimit) {
        items.push({
          id: 'load-more-root',
          type: 'load-more-root',
          name: `Load ${Math.min(
            ROOT_PAGE_SIZE,
            totalRootItems - rootItemLimit,
          )} more...`,
          data: null,
          depth: 0,
          parentId: null,
          loadMoreCount: totalRootItems - rootItemLimit,
        });
      }
    }

    return { treeItems: items, totalRootItems, folderChildCounts };
  }, [
    flows,
    tables,
    folders,
    filters,
    expandedFolders,
    folderItemLimits,
    rootItemLimit,
    hasActiveFilters,
  ]);

  const isLoading = isLoadingFlows || isLoadingTables || isLoadingFolders;

  return {
    treeItems,
    expandedFolders,
    toggleFolder,
    loadMoreInFolder,
    loadMoreRoot,
    resetPagination,
    isLoading,
    totalRootItems,
    folderChildCounts,
    flows: flows ?? [],
    tables: tables ?? [],
    folders: folders ?? [],
  };
};

export const useAutomationsSelection = (
  treeItems: TreeItem[],
  flows: PopulatedFlow[],
  tables: TableWithRowCount[],
) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const getChildrenIds = useCallback(
    (folderId: string): string[] => {
      const ids: string[] = [];
      flows.forEach((flow) => {
        if (flow.folderId === folderId) {
          ids.push(`flow-${flow.id}`);
        }
      });
      tables.forEach((table) => {
        if (table.folderId === folderId) {
          ids.push(`table-${table.id}`);
        }
      });
      return ids;
    },
    [flows, tables],
  );

  const toggleItemSelection = useCallback(
    (item: TreeItem) => {
      const key = `${item.type}-${item.id}`;
      setSelectedItems((prev) => {
        const next = new Set(prev);

        if (item.type === 'folder') {
          const childrenIds = getChildrenIds(item.id);
          const folderKey = key;

          if (next.has(folderKey)) {
            next.delete(folderKey);
            childrenIds.forEach((id) => next.delete(id));
          } else {
            next.add(folderKey);
            childrenIds.forEach((id) => next.add(id));
          }
        } else if (item.type === 'flow' || item.type === 'table') {
          if (next.has(key)) {
            next.delete(key);
            if (item.parentId) {
              next.delete(`folder-${item.parentId}`);
            }
          } else {
            next.add(key);
            if (item.parentId) {
              const childrenIds = getChildrenIds(item.parentId);
              const allChildrenSelected = childrenIds.every(
                (id) => id === key || next.has(id),
              );
              if (allChildrenSelected) {
                next.add(`folder-${item.parentId}`);
              }
            }
          }
        }

        return next;
      });
    },
    [getChildrenIds],
  );

  const toggleAllSelection = useCallback(() => {
    const selectableItems = treeItems.filter(
      (item) =>
        item.type !== 'load-more-folder' && item.type !== 'load-more-root',
    );

    if (selectedItems.size === selectableItems.length) {
      setSelectedItems(new Set());
    } else {
      const allKeys = new Set<string>();
      selectableItems.forEach((item) => {
        allKeys.add(`${item.type}-${item.id}`);
      });
      setSelectedItems(allKeys);
    }
  }, [treeItems, selectedItems.size]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const selectedItemsList = useMemo(() => {
    return treeItems.filter((item) =>
      selectedItems.has(`${item.type}-${item.id}`),
    );
  }, [treeItems, selectedItems]);

  const isItemSelected = useCallback(
    (item: TreeItem): boolean => {
      const key = `${item.type}-${item.id}`;
      if (selectedItems.has(key)) return true;

      if (item.parentId && selectedItems.has(`folder-${item.parentId}`)) {
        return true;
      }

      return false;
    },
    [selectedItems],
  );

  return {
    selectedItems,
    selectedItemsList,
    toggleItemSelection,
    toggleAllSelection,
    clearSelection,
    setSelectedItems,
    isItemSelected,
  };
};

export const getSelectedIdsByType = (selectedKeys: Set<string>) => {
  const flowIds: string[] = [];
  const tableIds: string[] = [];
  const folderIds: string[] = [];

  for (const key of selectedKeys) {
    if (key.startsWith('flow-')) {
      flowIds.push(key.replace('flow-', ''));
    } else if (key.startsWith('table-')) {
      tableIds.push(key.replace('table-', ''));
    } else if (key.startsWith('folder-')) {
      folderIds.push(key.replace('folder-', ''));
    }
  }

  return { flowIds, tableIds, folderIds };
};

export const hasMovableOrExportableItems = (selectedKeys: Set<string>) => {
  for (const key of selectedKeys) {
    if (key.startsWith('flow-') || key.startsWith('table-')) {
      return true;
    }
  }
  return false;
};
