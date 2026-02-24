import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { flowsApi } from '@/features/flows/lib/flows-api';
import { foldersApi } from '@/features/folders/lib/folders-api';
import { tablesApi } from '@/features/tables/lib/tables-api';
import { authenticationSession } from '@/lib/authentication-session';
import {
  FlowStatus,
  FolderDto,
  PopulatedFlow,
  SeekPage,
  Table,
  UncategorizedFolderId,
} from '@activepieces/shared';

import { AutomationsFilters, FolderContent } from '../lib/types';
import {
  buildFilteredTreeItems,
  buildTreeItems,
  DEFAULT_PAGE_SIZE,
  FOLDER_PAGE_SIZE,
  hasActiveFilters,
} from '../lib/utils';

export function useAutomationsData(filters: AutomationsFilters) {
  const { projectId: projectIdFromUrl } = useParams<{ projectId: string }>();
  const projectId = projectIdFromUrl ?? authenticationSession.getProjectId()!;
  const queryClient = useQueryClient();
  const isFiltered = hasActiveFilters(filters);

  const [rootPage, setRootPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [folderVisibleCounts, setFolderVisibleCounts] = useState<
    Map<string, number>
  >(new Map());
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());

  const foldersQuery = useQuery({
    queryKey: ['folders', projectId],
    queryFn: () => foldersApi.list(),
    staleTime: STALE_TIME,
    refetchOnMount: 'always',
  });

  const folderIds = foldersQuery.data?.map((f) => f.id).join(',') ?? '';

  const folderCountsQuery = useQuery<Map<string, number>>({
    queryKey: ['folder-counts', projectId, folderIds],
    queryFn: async () => {
      const folders = foldersQuery.data!;
      const [folderFlowCounts, folderTableCounts] = await Promise.all([
        Promise.all(
          folders.map(({ id }) => flowsApi.count({ projectId, folderId: id })),
        ),
        Promise.all(
          folders.map(({ id }) => tablesApi.count({ projectId, folderId: id })),
        ),
      ]);
      const folderTotalCounts = folderFlowCounts.map(
        (count, index) => count + folderTableCounts[index],
      );
      return new Map(
        folderTotalCounts.map((count, index) => [folders[index].id, count]),
      );
    },
    enabled: !!foldersQuery.data && foldersQuery.data.length > 0,
    staleTime: STALE_TIME,
    refetchOnMount: 'always',
  });

  const folderContentsQuery = useQuery<FolderContentsMap>({
    queryKey: ['all-folder-contents', projectId, folderIds],
    queryFn: async () => {
      const folders = foldersQuery.data!;
      const [folderFlowPages, folderTablePages] = await Promise.all([
        Promise.all(
          folders.map(({ id }) =>
            flowsApi.list({
              projectId,
              folderId: id,
              limit: FOLDER_PAGE_SIZE,
              cursor: undefined,
            }),
          ),
        ),
        Promise.all(
          folders.map(({ id }) =>
            tablesApi.list({
              projectId,
              folderId: id,
              limit: FOLDER_PAGE_SIZE,
              cursor: undefined,
            }),
          ),
        ),
      ]);
      return buildFolderContentsMap(folders, folderFlowPages, folderTablePages);
    },
    enabled: !!foldersQuery.data && foldersQuery.data.length > 0,
    staleTime: STALE_TIME,
    refetchOnMount: 'always',
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
    enabled: !skipTables,
    staleTime: STALE_TIME,
    refetchOnMount: 'always',
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

  const loadMoreInFolder = useCallback(
    async (folderId: string) => {
      const contents = folderContentsQuery.data?.get(folderId);

      if (!contents) {
        setFolderVisibleCounts((prev) => {
          const next = new Map(prev);
          const current = next.get(folderId) ?? FOLDER_PAGE_SIZE;
          next.set(folderId, current + FOLDER_PAGE_SIZE);
          return next;
        });
        return;
      }

      const hasMoreFlows = !!contents.flowsNextCursor;
      const hasMoreTables = !!contents.tablesNextCursor;
      if (!hasMoreFlows && !hasMoreTables) {
        setFolderVisibleCounts((prev) => {
          const next = new Map(prev);
          const current = next.get(folderId) ?? FOLDER_PAGE_SIZE;
          next.set(folderId, current + FOLDER_PAGE_SIZE);
          return next;
        });
        return;
      }

      setLoadingFolders((prev) => new Set(prev).add(folderId));

      const [newFlows, newTables] = await Promise.all([
        hasMoreFlows
          ? flowsApi.list({
              projectId,
              folderId,
              limit: FOLDER_PAGE_SIZE,
              cursor: contents.flowsNextCursor!,
            })
          : Promise.resolve({
              data: [],
              next: null,
              previous: null,
            } as SeekPage<PopulatedFlow>),
        hasMoreTables
          ? tablesApi.list({
              projectId,
              folderId,
              limit: FOLDER_PAGE_SIZE,
              cursor: contents.tablesNextCursor!,
            })
          : Promise.resolve({
              data: [],
              next: null,
              previous: null,
            } as SeekPage<Table>),
      ]);

      queryClient.setQueryData<FolderContentsMap>(
        ['all-folder-contents', projectId, folderIds],
        (old) => {
          if (!old) return old;
          const next = new Map(old);
          const existing = next.get(folderId)!;
          next.set(folderId, {
            flows: [...existing.flows, ...newFlows.data],
            tables: [...existing.tables, ...newTables.data],
            flowsNextCursor: newFlows.next,
            tablesNextCursor: newTables.next,
          });
          return next;
        },
      );

      setFolderVisibleCounts((prev) => {
        const next = new Map(prev);
        const current = next.get(folderId) ?? FOLDER_PAGE_SIZE;
        next.set(folderId, current + FOLDER_PAGE_SIZE);
        return next;
      });

      setLoadingFolders((prev) => {
        const next = new Set(prev);
        next.delete(folderId);
        return next;
      });
    },
    [folderContentsQuery.data, projectId, folderIds, queryClient],
  );

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
    const folders = foldersQuery.data ?? [];
    const rootFlows = rootFlowsQuery.data?.data ?? [];
    const rootTables = rootTablesQuery.data?.data ?? [];
    const folderContents = folderContentsQuery.data ?? new Map();
    const folderCounts = folderCountsQuery.data ?? new Map();

    if (isFiltered) {
      const { items, totalItems } = buildFilteredTreeItems(
        rootFlows,
        rootTables,
        folders,
        folderVisibleCounts,
        rootPage,
        pageSize,
      );
      return { treeItems: items, totalPageItems: totalItems };
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
    );

    return { treeItems: items, totalPageItems: totalRootItems };
  }, [
    foldersQuery.data,
    rootFlowsQuery.data,
    rootTablesQuery.data,
    folderContentsQuery.data,
    folderCountsQuery.data,
    folderVisibleCounts,
    rootPage,
    pageSize,
    isFiltered,
  ]);

  const effectiveExpandedFolders = useMemo(() => {
    if (!isFiltered) return expandedFolders;
    const all = new Set(expandedFolders);
    for (const item of treeItems) {
      if (item.type === 'folder') {
        all.add(item.id);
      }
    }
    return all;
  }, [isFiltered, expandedFolders, treeItems]);

  const totalPages = Math.ceil(totalPageItems / pageSize);
  const isLoading =
    foldersQuery.isLoading ||
    (rootFlowsQuery.isLoading && !skipFlows) ||
    (rootTablesQuery.isLoading && !skipTables) ||
    folderContentsQuery.isLoading;

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['folders'] });
    queryClient.invalidateQueries({ queryKey: ['root-flows'] });
    queryClient.invalidateQueries({ queryKey: ['root-tables'] });
    queryClient.invalidateQueries({ queryKey: ['all-folder-contents'] });
    queryClient.invalidateQueries({ queryKey: ['folder-counts'] });
  }, [queryClient]);

  const invalidateRoot = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['root-flows'] });
    queryClient.invalidateQueries({ queryKey: ['root-tables'] });
  }, [queryClient]);

  const invalidateFolder = useCallback(
    (_folderId: string) => {
      queryClient.invalidateQueries({ queryKey: ['all-folder-contents'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['folder-counts'] });
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
    loadingFolders,
    toggleFolder,
    loadMoreInFolder,
    rootPage,
    pageSize,
    changePageSize,
    totalPages,
    totalPageItems,
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
  flowPages: SeekPage<PopulatedFlow>[],
  tablePages: SeekPage<Table>[],
): FolderContentsMap {
  return new Map(
    folders.map((folder, i) => [
      folder.id,
      {
        flows: flowPages[i].data,
        tables: tablePages[i].data,
        flowsNextCursor: flowPages[i].next,
        tablesNextCursor: tablePages[i].next,
      },
    ]),
  );
}

const STALE_TIME = 30_000;
