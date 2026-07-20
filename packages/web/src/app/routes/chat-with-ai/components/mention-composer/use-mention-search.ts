import { SeekPage } from '@activepieces/core-utils';
import { AppConnectionStatus, ChatMentionType } from '@activepieces/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Fuse from 'fuse.js';
import { useCallback, useMemo } from 'react';
import { useDebounce } from 'use-debounce';

import { appConnectionsApi } from '@/features/connections/api/app-connections';
import { flowsApi } from '@/features/flows/api/flows-api';
import { piecesApi } from '@/features/pieces/api/pieces-api';
import { tablesApi } from '@/features/tables/api/tables-api';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

const BASE_LIMIT = 100;
const MAX_PER_GROUP = 8;
const FUSE_OPTIONS = {
  keys: ['label', 'secondary'],
  threshold: 0.4,
  ignoreLocation: true,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 1,
};

function isInternalFlowName(name: string): boolean {
  const n = name.trim();
  if (n.startsWith('__')) {
    return true;
  }
  return /^[A-Za-z0-9_-]{16,}$/.test(n) && /[0-9]/.test(n);
}

function flowsQueryOptions(projectId: string) {
  return {
    queryKey: ['mention-search', 'flows', projectId],
    queryFn: async (): Promise<MentionItem[]> => {
      const page = await flowsApi.list({
        projectId,
        limit: BASE_LIMIT,
        cursor: undefined,
      });
      return page.data
        .filter((flow) => !isInternalFlowName(flow.version.displayName))
        .map((flow) => ({
          type: ChatMentionType.FLOW,
          id: flow.id,
          label: flow.version.displayName,
          secondary: flow.status,
          updated: flow.updated,
        }));
    },
    staleTime: 30_000,
  };
}

function tablesQueryOptions(projectId: string) {
  return {
    queryKey: ['mention-search', 'tables', projectId],
    queryFn: async (): Promise<MentionItem[]> => {
      const page = await tablesApi.list({
        projectId,
        limit: BASE_LIMIT,
        cursor: undefined,
      });
      return page.data.map((table) => ({
        type: ChatMentionType.TABLE,
        id: table.id,
        label: table.name,
        updated: table.updated,
      }));
    },
    staleTime: 30_000,
  };
}

function appsQueryOptions() {
  return {
    queryKey: ['mention-search', 'apps'],
    queryFn: async (): Promise<MentionItem[]> => {
      const pieces = await piecesApi.list({});
      return pieces.map((piece) => ({
        type: ChatMentionType.APP,
        id: piece.name,
        label: piece.displayName,
        secondary: piece.categories?.join(', '),
        logoUrl: piece.logoUrl,
      }));
    },
    staleTime: 5 * 60_000,
  };
}

function rank(items: MentionItem[], query: string): RankedItem[] {
  if (query.trim().length === 0) {
    return [...items]
      .sort((a, b) => (b.updated ?? '').localeCompare(a.updated ?? ''))
      .slice(0, MAX_PER_GROUP)
      .map((item) => ({ item, matchIndices: [] }));
  }
  const fuse = new Fuse(items, FUSE_OPTIONS);
  return fuse
    .search(query)
    .slice(0, MAX_PER_GROUP)
    .map((result) => ({
      item: result.item,
      matchIndices:
        result.matches
          ?.find((m) => m.key === 'label')
          ?.indices?.map((pair) => [pair[0], pair[1]]) ?? [],
    }));
}

function usePrefetchMentionData(): () => void {
  const client = useQueryClient();
  const projectId = authenticationSession.getProjectId();
  return useCallback(() => {
    if (!projectId) {
      return;
    }
    void client.prefetchQuery(flowsQueryOptions(projectId));
    void client.prefetchQuery(tablesQueryOptions(projectId));
    void client.prefetchQuery(appsQueryOptions());
  }, [client, projectId]);
}

function useMentionSearch(query: string): MentionSearchResult {
  const projectId = authenticationSession.getProjectId() ?? '';
  const [debouncedQuery] = useDebounce(query, 120);

  const flowsQuery = useQuery({
    ...flowsQueryOptions(projectId),
    enabled: projectId.length > 0,
  });
  const tablesQuery = useQuery({
    ...tablesQueryOptions(projectId),
    enabled: projectId.length > 0,
  });
  const appsQuery = useQuery(appsQueryOptions());

  const groups = useMemo<MentionGroup[]>(() => {
    return [
      {
        type: ChatMentionType.FLOW,
        items: rank(flowsQuery.data ?? [], debouncedQuery),
        failed: flowsQuery.isError,
      },
      {
        type: ChatMentionType.TABLE,
        items: rank(tablesQuery.data ?? [], debouncedQuery),
        failed: tablesQuery.isError,
      },
      {
        type: ChatMentionType.APP,
        items: rank(appsQuery.data ?? [], debouncedQuery),
        failed: appsQuery.isError,
      },
    ];
  }, [
    flowsQuery.data,
    tablesQuery.data,
    appsQuery.data,
    flowsQuery.isError,
    tablesQuery.isError,
    appsQuery.isError,
    debouncedQuery,
  ]);

  const isLoading =
    flowsQuery.isLoading || tablesQuery.isLoading || appsQuery.isLoading;
  const totalCount = groups.reduce((sum, g) => sum + g.items.length, 0);

  return { groups, isLoading, totalCount };
}

async function fetchConnectionsAcrossProjects(
  pieceName: string,
): Promise<MentionConnection[]> {
  const projects = await api.get<SeekPage<{ id: string; displayName: string }>>(
    '/v1/projects',
    { limit: 100 },
  );
  const perProject = await Promise.all(
    projects.data.map(async (project) => {
      const page = await appConnectionsApi
        .list({
          projectId: project.id,
          pieceName,
          limit: 50,
          cursor: undefined,
        })
        .catch(() => null);
      return (page?.data ?? []).map((conn) => ({
        id: conn.id,
        displayName: conn.displayName,
        status: conn.status,
        projectName: project.displayName,
      }));
    }),
  );
  const seen = new Set<string>();
  const result: MentionConnection[] = [];
  for (const conn of perProject.flat()) {
    if (!seen.has(conn.id)) {
      seen.add(conn.id);
      result.push(conn);
    }
  }
  return result;
}

export const mentionSearch = {
  useMentionSearch,
  usePrefetchMentionData,
  fetchConnectionsAcrossProjects,
};

export type MentionItem = {
  type: ChatMentionType;
  id: string;
  label: string;
  secondary?: string;
  logoUrl?: string;
  updated?: string;
};

export type RankedItem = {
  item: MentionItem;
  matchIndices: number[][];
};

export type MentionGroup = {
  type: ChatMentionType;
  items: RankedItem[];
  failed: boolean;
};

export type MentionSearchResult = {
  groups: MentionGroup[];
  isLoading: boolean;
  totalCount: number;
};

export type MentionConnection = {
  id: string;
  displayName: string;
  status: AppConnectionStatus;
  projectName: string;
};
