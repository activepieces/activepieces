import { PROJECT_COLOR_PALETTE } from '@activepieces/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { flowsApi } from '@/features/flows';
import { foldersApi } from '@/features/folders';
import { projectCollectionUtils, getProjectName } from '@/features/projects';
import { tablesApi } from '@/features/tables';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { STATIC_PAGES, type StaticPage } from './static-pages';

const SEARCH_LIMIT = 5;

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

export function useGlobalSearchResults(query: string, open: boolean) {
  const projectId = authenticationSession.getProjectId() ?? '';
  const isPlatformAdmin = useIsPlatformAdmin();
  const { data: allProjects = [] } = projectCollectionUtils.useAll();
  const currentProject = allProjects.find((p) => p.id === projectId);
  const currentProjectName = currentProject
    ? getProjectName(currentProject)
    : null;
  const hasQuery = query.length > 0;
  const searchEnabled = hasQuery && !!projectId;
  const suggestionsEnabled = !hasQuery && open && !!projectId;

  const foldersQuery = useQuery({
    queryKey: ['global-search-folders', projectId],
    queryFn: () => foldersApi.list(),
    staleTime: 60_000,
    enabled: !!projectId,
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
    enabled: searchEnabled || suggestionsEnabled,
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
  const isSuggestionLoading =
    (flowsQuery.isLoading || tablesQuery.isLoading || foldersQuery.isLoading) &&
    suggestionsEnabled;

  const groups: SearchResultGroup[] = [
    {
      type: 'flow',
      heading: 'Flows',
      items: flowResults,
      isLoading: flowsQuery.isLoading && (searchEnabled || suggestionsEnabled),
    },
    {
      type: 'table',
      heading: 'Tables',
      items: tableResults,
      isLoading: tablesQuery.isLoading && (searchEnabled || suggestionsEnabled),
    },
    {
      type: 'folder',
      heading: 'Folders',
      items: folderResults,
      isLoading:
        foldersQuery.isLoading && (searchEnabled || suggestionsEnabled),
    },
    {
      type: 'project',
      heading: 'Projects',
      items: projectResults,
      isLoading: false,
    },
    {
      type: 'page',
      heading: 'Pages',
      items: pageResults,
      isLoading: false,
    },
  ].filter((g) => g.isLoading || g.items.length > 0);

  return {
    groups,
    isLoading: isSearchLoading || isSuggestionLoading,
  };
}
