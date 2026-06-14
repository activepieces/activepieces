import {
  FlowStatus,
  FolderDto,
  PopulatedFlow,
  SeekPage,
  Table,
  UncategorizedFolderId,
} from '@activepieces/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useEmbedding } from '@/components/providers/embed-provider';
import { flowsApi } from '@/features/flows/api/flows-api';
import { foldersApi } from '@/features/folders/api/folders-api';
import { tablesApi } from '@/features/tables/api/tables-api';
import { authenticationSession } from '@/lib/authentication-session';

import { AutomationsFilters, FolderContent } from '../lib/types';
import {
  buildFilteredTreeItems,
  buildTreeItems,
  DEFAULT_PAGE_SIZE,
  FOLDER_PAGE_SIZE,
  hasNonFolderFilters,
} from '../lib/utils';

export function useAutomationsData(
  filters: AutomationsFilters,
  pinnedList?: string[],
) {
  const { projectId: projectIdFromUrl } = useParams<{ projectId: string }>();
  const projectId = projectIdFromUrl ?? authenticationSession.getProjectId()!;
  const queryClient = useQueryClient();
  const { embedState } = useEmbedding();
  const hideTables = embedState.hideTables;
  const isFiltered = hasNonFolderFilters(filters);

  const [rootPage, setRootPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [folderVisibleCounts, setFolderVisibleCounts] = useState<
    Map<string, number>
  >(new Map());

  const foldersQuery = useQuery({
    queryKey: ['folders', projectId],
    queryFn: () => foldersApi.list(),
    staleTime: STALE_TIME,
    refetchOnMount: 'always',
    meta: { showErrorDialog: true, loadSubsetOptions: {} },
  });

  const folderIds = foldersQuery.data?.map((f) => f.id).join(',') ?? '';

  const folderCounts = useMemo(() => {
    const folders = foldersQuery.data ?? [];
    return new Map(
      folders.map((folder) => [
        folder.id,
        hideTables
          ? folder.numberOfFlows
          : folder.numberOfFlows + folder.numberOfTables,
      ]),
    );
  }, [foldersQuery.data, hideTables]);

  const folderContentsQuery = useQuery<FolderContentsMap>({
    queryKey: ['all-folder-contents', projectId, folderIds, hideTables],
    queryFn: async () => {
      const folders = foldersQuery.data!;
      const allFolderIds = folders.map((f) => f.id);
      const [flowsPage, tablesPage] = await Promise.all([
        flowsApi.list({
          projectId,
          folderIds: allFolderIds,
          limit: FOLDER_CONTENTS_LIMIT,
          cursor: undefined,
        }),
        hideTables
          ? Promise.resolve(emptyTablePage())
          : tablesApi.list({
              projectId,
              folderIds: allFolderIds,
              limit: FOLDER_CONTENTS_LIMIT,
              cursor: undefined,
            }),
      ]);
      return buildFolderContentsMap(folders, flowsPage.data, tablesPage.data);
    },
    enabled: !!foldersQuery.data && foldersQuery.data.length > 0,
    staleTime: STALE_TIME,
    refetchOnMount: 'always',
    meta: { showErrorDialog: true, loadSubsetOptions: {} },
  });

  const skipFlows =
    filters.typeFilter.length > 0 && !filters.typeFilter.includes('flow');
  const skipTables =
    filters.typeFilter.length > 0 && !filters.typeFilter.includes('table');

  const rootFlowsQuery = useQuery({
    queryKey: ['root-flows', projectId, filters],
    queryFn: () =>
      flowsApi.list({
        projectId,
        folderId: isFiltered ? undefined : UncategorizedFolderId,
        limit: 1000,
        cursor: undefined,
        name: filters.searchTerm || undefined,
        status:
          filters.statusFilter.length > 0
            ? (filters.statusFilter as FlowStatus[])
            : undefined,
        connectionExternalIds:
          filters.connectionFilter.length > 0
            ? filters.connectionFilter
            : undefined,
      }),
    enabled: !skipFlows,
    staleTime: STALE_TIME,
    refetchOnMount: 'always',
    meta: { showErrorDialog: true, loadSubsetOptions: {} },
  });

  const rootTablesQuery = useQuery({
    queryKey: ['root-tables', projectId, filters],
    queryFn: () =>
      tablesApi.list({
        projectId,
        folderId: isFiltered ? undefined : UncategorizedFolderId,
        limit: 1000,
        cursor: undefined,
        name: filters.searchTerm || undefined,
      }),
    enabled: !skipTables && !hideTables,
    staleTime: STALE_TIME,
    refetchOnMount: 'always',
    meta: { showErrorDialog: true, loadSubsetOptions: {} },
  });

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
    setFolderVisibleCounts((prev) => {
      const next = new Map(prev);
      const current = next.get(folderId) ?? FOLDER_PAGE_SIZE;
      next.set(folderId, current + FOLDER_PAGE_SIZE);
      return next;
    });
  }, []);

  const nextRootPage = useCallback(() => {
    setRootPage((prev) => prev + 1);
  }, []);

  const prevRootPage = useCallback(() => {
    setRootPage((prev) => Math.max(0, prev - 1));
  }, []);

  const resetPagination = useCallback(() => {
    setRootPage(0);
    setFolderVisibleCounts(new Map());
  }, []);

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
    setRootPage(0);
  }, []);

  const { treeItems, totalPageItems } = useMemo(() => {
    let folders = foldersQuery.data ?? [];
    let rootFlows = rootFlowsQuery.data?.data ?? [];
    let rootTables = rootTablesQuery.data?.data ?? [];
    const folderContents = folderContentsQuery.data ?? new Map();

    const hasFolderFilter = filters.folderFilter.length > 0;

    if (isFiltered) {
      if (hasFolderFilter) {
        const folderSet = new Set(filters.folderFilter);
        rootFlows = rootFlows.filter(
          (f) => f.folderId && folderSet.has(f.folderId),
        );
        rootTables = rootTables.filter(
          (t) => t.folderId && folderSet.has(t.folderId),
        );
      }

      const { items, totalItems } = buildFilteredTreeItems(
        rootFlows,
        rootTables,
        folders,
        folderVisibleCounts,
        rootPage,
        pageSize,
        pinnedList,
        filters.searchTerm,
        folderContents,
        folderCounts,
      );
      return { treeItems: items, totalPageItems: totalItems };
    }

    if (hasFolderFilter) {
      const folderSet = new Set(filters.folderFilter);
      folders = folders.filter((f) => folderSet.has(f.id));
      rootFlows = [];
      rootTables = [];
    }

    const { items, totalRootItems } = buildTreeItems(
      folders,
      rootFlows,
      rootTables,
      folderContents,
      folderCounts,
      folderVisibleCounts,
      rootPage,
      pageSize,
      pinnedList,
    );

    return { treeItems: items, totalPageItems: totalRootItems };
  }, [
    foldersQuery.data,
    rootFlowsQuery.data,
    rootTablesQuery.data,
    folderContentsQuery.data,
    folderCounts,
    folderVisibleCounts,
    rootPage,
    pageSize,
    isFiltered,
    filters.searchTerm,
    filters.folderFilter,
    pinnedList,
  ]);

  const hasFolderFilter = filters.folderFilter.length > 0;
  const effectiveExpandedFolders = useMemo(() => {
    if (!isFiltered && !hasFolderFilter) return expandedFolders;
    const all = new Set(expandedFolders);
    for (const item of treeItems) {
      if (item.type === 'folder') {
        all.add(item.id);
      }
    }
    return all;
  }, [isFiltered, hasFolderFilter, expandedFolders, treeItems]);

  const totalPages = Math.ceil(totalPageItems / pageSize);
  const isLoading =
    foldersQuery.isLoading ||
    (rootFlowsQuery.isLoading && !skipFlows) ||
    (rootTablesQuery.isLoading && !skipTables && !hideTables) ||
    folderContentsQuery.isLoading;

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['folders'] });
    queryClient.invalidateQueries({ queryKey: ['root-flows'] });
    queryClient.invalidateQueries({ queryKey: ['root-tables'] });
    queryClient.invalidateQueries({ queryKey: ['all-folder-contents'] });
  }, [queryClient]);

  const invalidateRoot = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['root-flows'] });
    queryClient.invalidateQueries({ queryKey: ['root-tables'] });
  }, [queryClient]);

  const invalidateFolder = useCallback(
    (_folderId: string) => {
      queryClient.invalidateQueries({ queryKey: ['all-folder-contents'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
    [queryClient],
  );

  return {
    treeItems,
    folders: foldersQuery.data ?? [],
    rootFlows: rootFlowsQuery.data?.data ?? [],
    rootTables: rootTablesQuery.data?.data ?? [],
    isLoading,
    isFiltered,
    expandedFolders: effectiveExpandedFolders,
    toggleFolder,
    loadMoreInFolder,
    rootPage,
    pageSize,
    changePageSize,
    totalPages,
    nextRootPage,
    prevRootPage,
    resetPagination,
    invalidateAll,
    invalidateRoot,
    invalidateFolder,
  };
}

type FolderContentsMap = Map<string, FolderContent>;

function buildFolderContentsMap(
  folders: FolderDto[],
  flows: PopulatedFlow[],
  tables: Table[],
): FolderContentsMap {
  const map: FolderContentsMap = new Map(
    folders.map((folder) => [folder.id, { flows: [], tables: [] }]),
  );
  flows.forEach((flow) => {
    if (flow.folderId) {
      map.get(flow.folderId)?.flows.push(flow);
    }
  });
  tables.forEach((table) => {
    if (table.folderId) {
      map.get(table.folderId)?.tables.push(table);
    }
  });
  return map;
}

function emptyTablePage(): SeekPage<Table> {
  return { data: [], next: null, previous: null };
}

const STALE_TIME = 30_000;
const FOLDER_CONTENTS_LIMIT = 1500;
