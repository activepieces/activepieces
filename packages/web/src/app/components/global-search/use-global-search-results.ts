import { PROJECT_COLOR_PALETTE } from '@activepieces/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';

import { useEmbedding } from '@/components/providers/embed-provider';
import { flowsApi } from '@/features/flows';
import { foldersApi } from '@/features/folders';
import { projectCollectionUtils, getProjectName } from '@/features/projects';
import { tablesApi } from '@/features/tables';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { getAccessHistory } from './access-history';
import { STATIC_PAGES, type StaticPage } from './static-pages';

const SEARCH_LIMIT = 6;
const SUPPLEMENT_THRESHOLD = 5;

function getTimePeriod(
  timestamp: number,
): 'today' | 'yesterday' | 'last-week' | 'last-30-days' {
  const now = new Date();
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDay = new Date(timestamp);
  const itemDayStart = new Date(
    itemDay.getFullYear(),
    itemDay.getMonth(),
    itemDay.getDate(),
  );
  const diffDays = Math.floor(
    (nowDay.getTime() - itemDayStart.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays <= 7) return 'last-week';
  return 'last-30-days';
}

export function useGlobalSearchResults(query: string, open: boolean) {
  const projectId = authenticationSession.getProjectId() ?? '';
  const isPlatformAdmin = useIsPlatformAdmin();
  const { embedState } = useEmbedding();
  const hideTables = embedState.hideTables;
  const { data: allProjects = [] } = projectCollectionUtils.useAll();
  const currentProject = allProjects.find((p) => p.id === projectId);
  const currentProjectName = currentProject
    ? getProjectName(currentProject)
    : null;
  const hasQuery = query.length > 0;

  const accessHistory = hideTables
    ? getAccessHistory().filter((h) => h.type !== 'table')
    : getAccessHistory();
  const hasHistory = accessHistory.length > 0;
  const needsSupplement =
    !hasQuery && accessHistory.length < SUPPLEMENT_THRESHOLD;

  const searchEnabled = hasQuery && !!projectId;
  const suggestionsEnabled =
    !hasQuery && needsSupplement && open && !!projectId;

  const foldersQuery = useQuery({
    queryKey: ['global-search-folders', projectId],
    queryFn: () => foldersApi.list(),
    staleTime: 60_000,
    enabled: !!projectId && open,
  });

  const folderMap = new Map(
    (foldersQuery.data ?? []).map((f) => [f.id, f.displayName]),
  );

  const flowsQuery = useQuery({
    queryKey: ['global-search-flows', projectId, query],
    queryFn: () =>
      flowsApi.list({
        projectId,
        ...(hasQuery ? { name: query } : {}),
        limit: SEARCH_LIMIT,
        cursor: undefined,
      }),
    enabled: searchEnabled || suggestionsEnabled,
    staleTime: hasQuery ? 15_000 : 60_000,
    placeholderData: keepPreviousData,
  });

  const tablesQuery = useQuery({
    queryKey: ['global-search-tables', projectId, query],
    queryFn: () =>
      tablesApi.list({
        projectId,
        ...(hasQuery ? { name: query } : {}),
        limit: SEARCH_LIMIT,
        cursor: undefined,
      }),
    enabled: (searchEnabled || suggestionsEnabled) && !hideTables,
    staleTime: hasQuery ? 15_000 : 60_000,
    placeholderData: keepPreviousData,
  });

  const matchedPages = STATIC_PAGES.filter(
    (p) =>
      (!p.requiresPlatformAdmin || isPlatformAdmin) &&
      (!hasQuery || p.label.toLowerCase().includes(query.toLowerCase())),
  ).slice(0, SEARCH_LIMIT);

  const matchedProjects = allProjects
    .filter(
      (p) =>
        !hasQuery || p.displayName.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, SEARCH_LIMIT);

  const allFolders = foldersQuery.data ?? [];
  const matchedFolders = hasQuery
    ? allFolders.filter((f) =>
        f.displayName.toLowerCase().includes(query.toLowerCase()),
      )
    : allFolders;

  const flowResults: SearchResultItem[] = (flowsQuery.data?.data ?? []).map(
    (flow) => ({
      id: `flow-${flow.id}`,
      type: 'flow' as const,
      label: flow.version.displayName,
      href: authenticationSession.appendProjectRoutePrefix(`/flows/${flow.id}`),
      folderName: flow.folderId ? folderMap.get(flow.folderId) ?? null : null,
      updated: flow.updated ? String(flow.updated) : null,
      status: flow.status,
      projectName: currentProjectName,
    }),
  );

  const tableResults: SearchResultItem[] = (tablesQuery.data?.data ?? []).map(
    (table) => ({
      id: `table-${table.id}`,
      type: 'table' as const,
      label: table.name,
      href: authenticationSession.appendProjectRoutePrefix(
        `/tables/${table.id}`,
      ),
      folderName: table.folderId ? folderMap.get(table.folderId) ?? null : null,
      updated: table.updated ? String(table.updated) : null,
      projectName: currentProjectName,
    }),
  );

  const folderResults: SearchResultItem[] = matchedFolders
    .slice(0, SEARCH_LIMIT)
    .map((folder) => ({
      id: `folder-${folder.id}`,
      type: 'folder' as const,
      label: folder.displayName,
      href:
        authenticationSession.appendProjectRoutePrefix('/automations') +
        `?folder=${folder.id}`,
      projectName: currentProjectName,
    }));

  const projectResults: SearchResultItem[] = matchedProjects.map((project) => {
    const palette = project.icon
      ? PROJECT_COLOR_PALETTE[project.icon.color]
      : null;
    const name = getProjectName(project);
    return {
      id: `project-${project.id}`,
      type: 'project' as const,
      label: name,
      href: `/projects/${project.id}/automations`,
      iconBgColor: palette?.color,
      iconTextColor: palette?.textColor,
      iconLetter: name.charAt(0).toUpperCase(),
    };
  });

  const pageResults: SearchResultItem[] = matchedPages.map((page) => ({
    id: page.id,
    type: 'page' as const,
    label: page.label,
    href: page.href,
    pageIcon: page.icon,
  }));

  const isSearchLoading =
    (flowsQuery.isLoading || tablesQuery.isLoading) && searchEnabled;

  if (!hasQuery) {
    if (hasHistory) {
      const historyIds = new Set(accessHistory.map((h) => h.id));

      type PoolItem = { item: SearchResultItem; timestamp: number };

      const historyPool: PoolItem[] = accessHistory.map((h) => ({
        timestamp: h.accessedAt,
        item: {
          id: h.id,
          type: h.type,
          label: h.label,
          href: h.href,
          status: h.status,
          folderName: h.folderName,
          projectName: h.projectName,
          iconBgColor: h.iconBgColor,
          iconTextColor: h.iconTextColor,
          iconLetter: h.iconLetter,
          pageIcon:
            h.type === 'page'
              ? STATIC_PAGES.find((p) => p.id === h.id)?.icon
              : undefined,
        },
      }));

      const suggestedItems: SearchResultItem[] = [];

      if (needsSupplement) {
        const remaining = SUPPLEMENT_THRESHOLD - accessHistory.length;
        const fillCandidates: PoolItem[] = [
          ...flowResults.map((r) => ({
            item: r,
            timestamp: r.updated ? new Date(r.updated).getTime() : 0,
          })),
          ...tableResults.map((r) => ({
            item: r,
            timestamp: r.updated ? new Date(r.updated).getTime() : 0,
          })),
          ...projectResults.map((r) => ({ item: r, timestamp: 0 })),
          ...pageResults.map((r) => ({ item: r, timestamp: 0 })),
        ].filter((p) => !historyIds.has(p.item.id));

        suggestedItems.push(
          ...fillCandidates.slice(0, remaining).map((p) => p.item),
        );
      }

      const buckets: Record<string, SearchResultItem[]> = {
        today: [],
        yesterday: [],
        'last-week': [],
        'last-30-days': [],
      };

      for (const { item, timestamp } of historyPool) {
        buckets[getTimePeriod(timestamp)].push(item);
      }

      const periodDefs = [
        { key: 'today', label: t('Today') },
        { key: 'yesterday', label: t('Yesterday') },
        { key: 'last-week', label: t('Last Week') },
        { key: 'last-30-days', label: t('Last 30 Days') },
      ];

      const isFillLoading =
        needsSupplement &&
        (flowsQuery.isLoading || tablesQuery.isLoading) &&
        suggestionsEnabled;

      const groups: SearchResultGroup[] = periodDefs
        .filter((p) => buckets[p.key].length > 0)
        .map((p) => ({
          type: `history-${p.key}`,
          heading: p.label,
          items: buckets[p.key],
          isLoading: false,
        }));

      if (suggestedItems.length > 0) {
        groups.push({
          type: 'suggestions',
          heading: t('Suggested'),
          items: suggestedItems,
          isLoading: false,
        });
      }

      if (
        isFillLoading &&
        historyPool.length + suggestedItems.length < SUPPLEMENT_THRESHOLD
      ) {
        groups.push({
          type: 'suggestions-loading',
          heading: '',
          items: [],
          isLoading: true,
        });
      }

      return { groups, isLoading: false };
    }

    const isFallbackLoading =
      (flowsQuery.isLoading || tablesQuery.isLoading) && suggestionsEnabled;
    const flatItems: SearchResultItem[] = [
      ...flowResults.slice(0, 5),
      ...tableResults.slice(0, 5),
      ...projectResults.slice(0, 5),
      ...pageResults.slice(0, 5),
    ];
    return {
      groups:
        isFallbackLoading || flatItems.length > 0
          ? ([
              {
                type: 'suggestions',
                heading: '',
                items: flatItems,
                isLoading: isFallbackLoading,
              },
            ] as SearchResultGroup[])
          : [],
      isLoading: isFallbackLoading,
    };
  }

  const groups: SearchResultGroup[] = [
    {
      type: 'flow',
      heading: t('Flows'),
      items: flowResults,
      isLoading: flowsQuery.isLoading && searchEnabled,
    },
    {
      type: 'table',
      heading: t('Tables'),
      items: tableResults,
      isLoading: tablesQuery.isLoading && searchEnabled,
    },
    {
      type: 'folder',
      heading: t('Folders'),
      items: folderResults,
      isLoading: foldersQuery.isLoading && searchEnabled,
    },
    {
      type: 'project',
      heading: t('Projects'),
      items: projectResults,
      isLoading: false,
    },
    {
      type: 'page',
      heading: t('Pages'),
      items: pageResults,
      isLoading: false,
    },
  ].filter((g) => g.isLoading || g.items.length > 0);

  return { groups, isLoading: isSearchLoading };
}

export type SearchResultItem = {
  id: string;
  type: 'flow' | 'table' | 'folder' | 'project' | 'page';
  label: string;
  href: string;
  status?: 'ENABLED' | 'DISABLED' | null;
  folderName?: string | null;
  updated?: string | null;
  iconBgColor?: string;
  iconTextColor?: string;
  iconLetter?: string;
  pageIcon?: StaticPage['icon'];
  projectName?: string | null;
};

export type SearchResultGroup = {
  type: string;
  heading: string;
  items: SearchResultItem[];
  isLoading: boolean;
};
