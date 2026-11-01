import { SeekPage } from '@activepieces/core-utils';
import {
  AgentSummary,
  FlowStatus,
  FolderDto,
  PopulatedFlow,
  Table,
  MAX_AGENT_PAGE_SIZE,
  UncategorizedFolderId,
} from '@activepieces/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useEmbedding } from '@/components/providers/embed-provider';
import { useAgentsNavVisible } from '@/features/agents';
import { agentsApi } from '@/features/agents/api/agents';
import { flowsApi } from '@/features/flows/api/flows-api';
import { foldersApi } from '@/features/folders/api/folders-api';
import { tablesApi } from '@/features/tables/api/tables-api';
import { authenticationSession } from '@/lib/authentication-session';

import {
  AutomationsFilters,
  AutomationsSort,
  FolderContent,
} from '../lib/types';
import {
  buildFilteredTreeItems,
  buildTreeItems,
  DEFAULT_PAGE_SIZE,
  FOLDER_PAGE_SIZE,
  hasNonFolderFilters,
  ROOT_ITEMS_LIMIT,
} from '../lib/utils';

export function useAutomationsData({
  filters,
  pinnedList,
  sort,
}: {
  filters: AutomationsFilters;
  pinnedList?: string[];
  sort: AutomationsSort;
}) {
  const { projectId: projectIdFromUrl } = useParams<{ projectId: string }>();
  const projectId = projectIdFromUrl ?? authenticationSession.getProjectId()!;
  const queryClient = useQueryClient();
  const { embedState } = useEmbedding();
  const hideTables = embedState.hideTables;
  const agentsVisible = useAgentsNavVisible() && !embedState.isEmbedded;
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
  });

  const folderIds = foldersQuery.data?.map((f) => f.id).join(',') ?? '';

  const hasConnectionFilter = filters.connectionFilter.length > 0;
  const skipFlows =
    filters.typeFilter.length > 0 && !filters.typeFilter.includes('flow');
  const skipTables =
    (filters.typeFilter.length > 0 && !filters.typeFilter.includes('table')) ||
    hasConnectionFilter;
  const skipAgents =
    !agentsVisible ||
    (filters.typeFilter.length > 0 && !filters.typeFilter.includes('agent')) ||
    hasConnectionFilter ||
    filters.statusFilter.length > 0;

  const agentsQuery = useQuery({
    queryKey: ['agents', 'automations', projectId],
    queryFn: () => listAllProjectAgents(projectId),
    enabled: !skipAgents,
    staleTime: STALE_TIME,
    refetchOnMount: 'always',
  });
  const allAgents = useMemo(
    () => (skipAgents ? [] : agentsQuery.data ?? []),
    [skipAgents, agentsQuery.data],
  );
  const agentsByFolder = useMemo(
    () => groupAgentsByFolder(allAgents),
    [allAgents],
  );

  const folderCounts = useMemo(() => {
    const folders = foldersQuery.data ?? [];
    return new Map(
      folders.map((folder) => [
        folder.id,
        (skipFlows ? 0 : folder.numberOfFlows) +
          (hideTables || skipTables ? 0 : folder.numberOfTables) +
          (agentsByFolder.get(folder.id)?.length ?? 0),
      ]),
    );
  }, [foldersQuery.data, hideTables, skipFlows, skipTables, agentsByFolder]);

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
      return buildFolderContentsMap({
        folders,
        flows: flowsPage.data,
        tables: tablesPage.data,
      });
    },
    enabled: !!foldersQuery.data && foldersQuery.data.length > 0,
    staleTime: STALE_TIME,
    refetchOnMount: 'always',
  });

  const rootFlowsQuery = useQuery({
    queryKey: ['root-flows', projectId, filters, sort],
    queryFn: () =>
      flowsApi.list({
        projectId,
        folderId: isFiltered ? undefined : UncategorizedFolderId,
        limit: ROOT_ITEMS_LIMIT,
        cursor: undefined,
        name: filters.searchTerm || undefined,
        status:
          filters.statusFilter.length > 0
            ? (filters.statusFilter as FlowStatus[])
            : undefined,
        connectionExternalIds: hasConnectionFilter
          ? filters.connectionFilter
          : undefined,
        sortBy: sort === 'default' ? undefined : 'NAME',
        order: sortOrder(sort),
      }),
    enabled: !skipFlows,
    staleTime: STALE_TIME,
    refetchOnMount: 'always',
  });

  const rootTablesQuery = useQuery({
    queryKey: ['root-tables', projectId, filters, sort],
    queryFn: () =>
      tablesApi.list({
        projectId,
        folderId: isFiltered ? undefined : UncategorizedFolderId,
        limit: ROOT_ITEMS_LIMIT,
        cursor: undefined,
        name: filters.searchTerm || undefined,
        sortBy: sort === 'default' ? undefined : 'NAME',
        order: sortOrder(sort),
      }),
    enabled: !skipTables && !hideTables,
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
    let rootAgents = matchingAgents({
      agents: allAgents,
      searchTerm: filters.searchTerm,
      onlyUnfiled: !isFiltered,
    });
    const folderContents = filterFolderContents({
      folderContents: new Map(
        [...(folderContentsQuery.data ?? [])].map(([folderId, content]) => [
          folderId,
          { ...content, agents: agentsByFolder.get(folderId) ?? [] },
        ]),
      ),
      skipFlows,
      skipTables,
      connectionFilter: filters.connectionFilter,
    });
    const effectiveFolderCounts = hasConnectionFilter
      ? new Map(
          [...folderContents].map(([folderId, content]) => [
            folderId,
            content.flows.length +
              content.tables.length +
              content.agents.length,
          ]),
        )
      : folderCounts;

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
        rootAgents = rootAgents.filter(
          (a) => a.folderId && folderSet.has(a.folderId),
        );
      }

      const { items, totalItems } = buildFilteredTreeItems({
        flows: rootFlows,
        tables: rootTables,
        agents: rootAgents,
        folders,
        folderVisibleCounts,
        page: rootPage,
        pageSize,
        pinnedList,
        searchTerm: filters.searchTerm,
        folderContents,
        folderCounts: effectiveFolderCounts,
        sort,
      });
      return { treeItems: items, totalPageItems: totalItems };
    }

    if (hasFolderFilter) {
      const folderSet = new Set(filters.folderFilter);
      folders = folders.filter((f) => folderSet.has(f.id));
      rootFlows = [];
      rootTables = [];
      rootAgents = [];
    }

    const { items, totalRootItems } = buildTreeItems({
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
    });

    return { treeItems: items, totalPageItems: totalRootItems };
  }, [
    foldersQuery.data,
    rootFlowsQuery.data,
    rootTablesQuery.data,
    allAgents,
    agentsByFolder,
    folderContentsQuery.data,
    folderCounts,
    folderVisibleCounts,
    rootPage,
    pageSize,
    isFiltered,
    filters.searchTerm,
    filters.folderFilter,
    filters.connectionFilter,
    hasConnectionFilter,
    pinnedList,
    sort,
    skipFlows,
    skipTables,
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
    (agentsQuery.isLoading && !skipAgents) ||
    folderContentsQuery.isLoading;

  const isError =
    foldersQuery.isError ||
    (rootFlowsQuery.isError && !skipFlows) ||
    (rootTablesQuery.isError && !skipTables && !hideTables) ||
    (agentsQuery.isError && !skipAgents) ||
    folderContentsQuery.isError;

  const invalidateAll = useCallback(() => {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: ['folders'] }),
      queryClient.invalidateQueries({ queryKey: ['root-flows'] }),
      queryClient.invalidateQueries({ queryKey: ['root-tables'] }),
      queryClient.invalidateQueries({ queryKey: ['all-folder-contents'] }),
      queryClient.invalidateQueries({ queryKey: ['agents'] }),
    ]);
  }, [queryClient]);

  const invalidateRoot = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['root-flows'] });
    queryClient.invalidateQueries({ queryKey: ['root-tables'] });
    queryClient.invalidateQueries({ queryKey: ['agents'] });
  }, [queryClient]);

  const invalidateFolder = useCallback(
    (_folderId: string) => {
      queryClient.invalidateQueries({ queryKey: ['all-folder-contents'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
    [queryClient],
  );

  return {
    treeItems,
    folders: foldersQuery.data ?? [],
    rootFlows: rootFlowsQuery.data?.data ?? [],
    rootTables: rootTablesQuery.data?.data ?? [],
    agents: allAgents,
    agentsVisible,
    isLoading,
    isError,
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

function sortOrder(sort: AutomationsSort): 'ASC' | 'DESC' | undefined {
  switch (sort) {
    case 'name-asc':
      return 'ASC';
    case 'name-desc':
      return 'DESC';
    case 'default':
      return undefined;
  }
}

type FolderContentsMap = Map<string, FolderContent>;

async function listAllProjectAgents(
  projectId: string,
): Promise<AgentSummary[]> {
  const agents: AgentSummary[] = [];
  let cursor: string | undefined = undefined;
  do {
    const page: SeekPage<AgentSummary> = await agentsApi.list({
      projectId,
      limit: MAX_AGENT_PAGE_SIZE,
      ...(cursor ? { cursor } : {}),
    });
    agents.push(...page.data);
    cursor = page.next ?? undefined;
  } while (cursor);
  return agents;
}

function groupAgentsByFolder(
  agents: AgentSummary[],
): Map<string, AgentSummary[]> {
  return agents.reduce((byFolder, agent) => {
    if (agent.folderId) {
      byFolder.set(agent.folderId, [
        ...(byFolder.get(agent.folderId) ?? []),
        agent,
      ]);
    }
    return byFolder;
  }, new Map<string, AgentSummary[]>());
}

function matchingAgents({
  agents,
  searchTerm,
  onlyUnfiled,
}: {
  agents: AgentSummary[];
  searchTerm: string;
  onlyUnfiled: boolean;
}): AgentSummary[] {
  const term = searchTerm.trim().toLowerCase();
  return agents.filter(
    (agent) =>
      (!onlyUnfiled || !agent.folderId) &&
      (term.length === 0 || agent.displayName.toLowerCase().includes(term)),
  );
}

function buildFolderContentsMap({
  folders,
  flows,
  tables,
}: {
  folders: FolderDto[];
  flows: PopulatedFlow[];
  tables: Table[];
}): FolderContentsMap {
  const map: FolderContentsMap = new Map(
    folders.map((folder) => [folder.id, { flows: [], tables: [], agents: [] }]),
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

function filterFolderContents({
  folderContents,
  skipFlows,
  skipTables,
  connectionFilter,
}: {
  folderContents: FolderContentsMap;
  skipFlows: boolean;
  skipTables: boolean;
  connectionFilter: string[];
}): FolderContentsMap {
  if (!skipFlows && !skipTables && connectionFilter.length === 0) {
    return folderContents;
  }
  const connectionSet = new Set(connectionFilter);
  const keepFlow = (flow: PopulatedFlow) =>
    connectionSet.size === 0 ||
    flow.version.connectionIds.some((connectionId) =>
      connectionSet.has(connectionId),
    );
  return new Map(
    [...folderContents].map(([folderId, content]) => [
      folderId,
      {
        flows: skipFlows ? [] : content.flows.filter(keepFlow),
        tables: skipTables ? [] : content.tables,
        agents: content.agents,
      },
    ]),
  );
}

function emptyTablePage(): SeekPage<Table> {
  return { data: [], next: null, previous: null };
}

const STALE_TIME = 30_000;
const FOLDER_CONTENTS_LIMIT = 1500;
