import {
  type FolderDto,
  FlowStatus,
  type PopulatedFlow,
  type Table,
} from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';

import { useEmbedding } from '@/components/providers/embed-provider';
import { flowsApi } from '@/features/flows';
import { foldersApi } from '@/features/folders';
import { tablesApi } from '@/features/tables';

import { buildRecentGroups } from './recent-history';
import {
  type BrowseCategory,
  type ProjectFilter,
} from './use-browse-navigation';
import {
  type SearchResultGroup,
  type SearchResultItem,
} from './use-global-search-results';

const LIST_LIMIT = 1000;

function buildMergedFolderGroups(opts: {
  folders: FolderDto[];
  items: { folderId: string | null; item: SearchResultItem }[];
}): SearchResultGroup[] {
  const { folders, items } = opts;
  const byFolder = new Map<string, SearchResultItem[]>();
  const uncategorized: SearchResultItem[] = [];
  for (const { folderId, item } of items) {
    const folder = folderId
      ? folders.find((f) => f.id === folderId)
      : undefined;
    if (folder) {
      const list = byFolder.get(folder.id) ?? [];
      list.push(item);
      byFolder.set(folder.id, list);
    } else {
      uncategorized.push(item);
    }
  }

  const groups: SearchResultGroup[] = [];
  for (const folder of folders) {
    const list = byFolder.get(folder.id);
    if (!list || list.length === 0) continue;
    groups.push({
      type: `folder-${folder.id}`,
      heading: `${folder.displayName} · ${list.length}`,
      items: list,
      isLoading: false,
    });
  }
  if (uncategorized.length > 0) {
    groups.push({
      type: 'uncategorized',
      heading: `${t('Uncategorized')} · ${uncategorized.length}`,
      items: uncategorized,
      isLoading: false,
    });
  }
  return groups;
}

export function useBrowseResults({
  projectId,
  category,
  projectFilter,
  enabled,
}: {
  projectId: string;
  category: BrowseCategory;
  projectFilter: ProjectFilter;
  enabled: boolean;
}): BrowseResults {
  const { embedState } = useEmbedding();
  const hideTables = embedState.hideTables;

  const isProject = enabled && category === 'project' && !!projectId;
  const wantsFlows = isProject && projectFilter !== 'tables';
  const wantsTables =
    isProject &&
    !hideTables &&
    (projectFilter === 'all' || projectFilter === 'tables');

  const foldersQuery = useQuery({
    queryKey: ['browse-folders', projectId],
    queryFn: () => foldersApi.list({ projectId }),
    staleTime: 30_000,
    enabled: isProject,
  });

  const flowsQuery = useQuery({
    queryKey: ['browse-flows', projectId],
    queryFn: () =>
      flowsApi.list({ projectId, limit: LIST_LIMIT, cursor: undefined }),
    staleTime: 30_000,
    enabled: wantsFlows,
  });

  const tablesQuery = useQuery({
    queryKey: ['browse-tables', projectId],
    queryFn: () =>
      tablesApi.list({ projectId, limit: LIST_LIMIT, cursor: undefined }),
    staleTime: 30_000,
    enabled: wantsTables,
  });

  const folders = foldersQuery.data ?? [];
  const flows = flowsQuery.data?.data ?? [];
  const tables = tablesQuery.data?.data ?? [];
  const flowsById = new Map(flows.map((f) => [f.id, f]));
  const tablesById = new Map(tables.map((tbl) => [tbl.id, tbl]));
  const base = { folders, flowsById, tablesById };

  if (!enabled) {
    return { groups: [], isLoading: false, ...base };
  }

  if (category === 'recent') {
    return {
      groups: buildRecentGroups({ hideTables }),
      isLoading: false,
      ...base,
    };
  }

  const visibleFlows =
    projectFilter === 'active'
      ? flows.filter((flow) => flow.status === FlowStatus.ENABLED)
      : flows;

  const merged: { folderId: string | null; item: SearchResultItem }[] = [];
  if (wantsFlows) {
    for (const flow of visibleFlows) {
      merged.push({
        folderId: flow.folderId ?? null,
        item: {
          id: `browse-flow-${flow.id}`,
          type: 'flow',
          label: flow.version.displayName,
          href: `/projects/${projectId}/flows/${flow.id}`,
          action: 'open',
          projectId,
          status: flow.status,
        },
      });
    }
  }
  if (wantsTables) {
    for (const table of tables) {
      merged.push({
        folderId: table.folderId ?? null,
        item: {
          id: `browse-table-${table.id}`,
          type: 'table',
          label: table.name,
          href: `/projects/${projectId}/tables/${table.id}`,
          action: 'open',
          projectId,
        },
      });
    }
  }

  return {
    groups: buildMergedFolderGroups({ folders, items: merged }),
    isLoading:
      foldersQuery.isLoading ||
      (wantsFlows && flowsQuery.isLoading) ||
      (wantsTables && tablesQuery.isLoading),
    ...base,
  };
}

export type BrowseResults = {
  groups: SearchResultGroup[];
  isLoading: boolean;
  folders: FolderDto[];
  flowsById: Map<string, PopulatedFlow>;
  tablesById: Map<string, Table>;
};
