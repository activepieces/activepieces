import {
  McpActivityStatus,
  McpOAuthClientKey,
  PopulatedMcpActivity,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Activity, CircleCheck, FolderOpen, Plug, User } from 'lucide-react';
import { ReactNode, useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  CURSOR_QUERY_PARAM,
  DataTable,
  DataTableFilters,
  LIMIT_QUERY_PARAM,
} from '@/components/custom/data-table';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { platformUserHooks } from '@/features/platform-admin/hooks/platform-user-hooks';
import { projectCollectionUtils } from '@/features/projects';
import { useIsPlatformPrivileged } from '@/hooks/authorization-hooks';
import { userHooks } from '@/hooks/user-hooks';

import { mcpActivityQueries } from '../mcp-activity-hooks';
import { mcpClientDisplay } from '../mcp-client-display';

import { buildActivityColumns } from './activity-columns';
import { ActivityDetailSheet } from './activity-detail-sheet';
import { ActivitySelection, activityUtils } from './activity-utils';

const DEFAULT_PAGE_SIZE = 10;

export function ActivityFeed({
  emptyStateAction,
  emptyStateTitle,
  emptyStateDescription,
}: ActivityFeedProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selection, setSelection] = useState<ActivitySelection | null>(null);
  const { data: currentUser } = userHooks.useCurrentUser();
  const isPrivileged = useIsPlatformPrivileged();
  const { data: memberProjects = [] } = projectCollectionUtils.useAll();
  const { data: platformProjects = [] } =
    projectCollectionUtils.useAllPlatformProjects();
  const projects = isPrivileged ? platformProjects : memberProjects;
  const { data: users } = platformUserHooks.useUsers();

  const request = useMemo(
    () => ({
      cursor: searchParams.get(CURSOR_QUERY_PARAM) ?? undefined,
      limit: Number(searchParams.get(LIMIT_QUERY_PARAM)) || DEFAULT_PAGE_SIZE,
      projectIds: undefinedIfEmpty(searchParams.getAll('project')),
      memberIds: undefinedIfEmpty(searchParams.getAll('member')),
      clientKeys: undefinedIfEmpty(
        searchParams.getAll('client').filter(isClientKey),
      ),
      statuses: undefinedIfEmpty(
        searchParams.getAll('result').filter(isStatus),
      ),
      createdAfter: searchParams.get('whenAfter') ?? undefined,
      createdBefore: searchParams.get('whenBefore') ?? undefined,
    }),
    [searchParams],
  );
  const hasActiveFilters =
    request.projectIds !== undefined ||
    request.memberIds !== undefined ||
    request.clientKeys !== undefined ||
    request.statuses !== undefined ||
    request.createdAfter !== undefined ||
    request.createdBefore !== undefined;

  const { data, isLoading, isError, isPaused, isPlaceholderData, refetch } =
    mcpActivityQueries.useActivity({
      request,
    });
  const couldNotLoad = isError || (isPaused && data === undefined);

  const pieceNames = useMemo(
    () => distinctPieceNames(data?.data ?? []),
    [data?.data],
  );
  const piecesByName = piecesHooks.usePiecesByName({ names: pieceNames });

  const resolvePieceDisplayName = useCallback(
    (row: PopulatedMcpActivity) =>
      row.pieceName === null
        ? undefined
        : piecesByName.get(row.pieceName)?.displayName,
    [piecesByName],
  );

  const projectTypes = useMemo(
    () => new Map(projects.map((project) => [project.id, project.type])),
    [projects],
  );

  const resolvePieceLogoUrl = useCallback(
    (row: PopulatedMcpActivity) =>
      row.pieceName === null
        ? undefined
        : piecesByName.get(row.pieceName)?.logoUrl,
    [piecesByName],
  );

  const resolveProjectType = useCallback(
    (row: PopulatedMcpActivity) =>
      row.projectId === null ? undefined : projectTypes.get(row.projectId),
    [projectTypes],
  );

  const resolveActionDisplayName = useCallback(
    (row: PopulatedMcpActivity) => {
      if (row.pieceName === null || row.actionName === null) {
        return undefined;
      }
      return piecesByName.get(row.pieceName)?.actions?.[row.actionName]
        ?.displayName;
    },
    [piecesByName],
  );

  const rows = data?.data ?? [];
  const selected = activityUtils.resolveSelection({
    selection,
    rows,
    cursor: request.cursor,
    isPlaceholderData,
  });
  if (
    selection?.pending !== undefined &&
    selected !== null &&
    selected !== selection.row
  ) {
    setSelection({ row: selected });
  }
  const selectedIndex =
    selected === null ? -1 : rows.findIndex((row) => row.id === selected.id);

  const goToPage = ({
    cursor,
    edge,
  }: {
    cursor: string;
    edge: 'first' | 'last';
  }) => {
    if (selected === null) {
      return;
    }
    setSelection({ row: selected, pending: { cursor, edge } });
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(CURSOR_QUERY_PARAM, cursor);
        return next;
      },
      { replace: true },
    );
  };

  const previousPageCursor = data?.previous ?? null;
  const nextPageCursor = data?.next ?? null;
  const onPrevious =
    selectedIndex > 0
      ? () => setSelection({ row: rows[selectedIndex - 1] })
      : selectedIndex === 0 && previousPageCursor !== null
      ? () => goToPage({ cursor: previousPageCursor, edge: 'last' })
      : undefined;
  const onNext =
    selectedIndex >= 0 && selectedIndex < rows.length - 1
      ? () => setSelection({ row: rows[selectedIndex + 1] })
      : selectedIndex >= 0 &&
        selectedIndex === rows.length - 1 &&
        nextPageCursor !== null
      ? () => goToPage({ cursor: nextPageCursor, edge: 'first' })
      : undefined;

  const columns = useMemo(
    () =>
      buildActivityColumns({
        currentUserId: currentUser?.id,
        showMember: isPrivileged,
        resolveActionDisplayName,
        resolvePieceDisplayName,
        resolvePieceLogoUrl,
        resolveProjectType,
      }),
    [
      currentUser?.id,
      isPrivileged,
      resolveActionDisplayName,
      resolvePieceDisplayName,
      resolvePieceLogoUrl,
      resolveProjectType,
    ],
  );

  if (
    !isLoading &&
    !couldNotLoad &&
    !hasActiveFilters &&
    data !== undefined &&
    data.data.length === 0
  ) {
    return (
      <Empty className="border border-dashed py-20">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Activity />
          </EmptyMedia>
          <EmptyTitle>{emptyStateTitle ?? t('Nothing has run yet')}</EmptyTitle>
          <EmptyDescription>
            {emptyStateDescription ??
              t(
                'A client can be connected and still never run anything. Check Connections to confirm it signed in.',
              )}
          </EmptyDescription>
          {emptyStateAction}
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      <DataTable
        columns={columns}
        page={data}
        isLoading={isLoading}
        isError={couldNotLoad}
        errorStateEntity={t('activity')}
        onRetry={refetch}
        filters={buildFilters({
          projects,
          members: isPrivileged ? users?.data ?? [] : [],
        })}
        bordered={true}
        onRowClick={(row) => setSelection({ row })}
        getRowClassName={(row) =>
          row.id === selected?.id ? 'bg-accent-3 hover:bg-accent-4' : ''
        }
        emptyStateTextTitle={t('No runs match these filters')}
        emptyStateTextDescription={t('Clear a filter to see more.')}
        emptyStateIcon={<Activity className="size-10" />}
      />

      <ActivityDetailSheet
        row={selected}
        onClose={() => setSelection(null)}
        onPrevious={isPlaceholderData ? undefined : onPrevious}
        onNext={isPlaceholderData ? undefined : onNext}
        currentUserId={currentUser?.id}
        actionDisplayName={
          selected === null ? undefined : resolveActionDisplayName(selected)
        }
        pieceDisplayName={
          selected === null ? undefined : resolvePieceDisplayName(selected)
        }
        pieceLogoUrl={
          selected === null ? undefined : resolvePieceLogoUrl(selected)
        }
        projectType={
          selected === null ? undefined : resolveProjectType(selected)
        }
      />
    </>
  );
}

function undefinedIfEmpty<T>(values: T[]): T[] | undefined {
  return values.length === 0 ? undefined : values;
}

function distinctPieceNames(rows: PopulatedMcpActivity[]): string[] {
  return [
    ...new Set(
      rows
        .map((row) => row.pieceName)
        .filter((pieceName): pieceName is string => pieceName !== null),
    ),
  ];
}

function isClientKey(value: string): value is McpOAuthClientKey {
  return McpOAuthClientKey.safeParse(value).success;
}

function isStatus(value: string): value is McpActivityStatus {
  return McpActivityStatus.safeParse(value).success;
}

function buildFilters({
  projects,
  members,
}: BuildFiltersParams): DataTableFilters<string>[] {
  const filters: DataTableFilters<string>[] = [];

  if (projects.length > 1) {
    filters.push({
      type: 'select',
      title: t('Project'),
      accessorKey: 'project',
      icon: FolderOpen,
      options: projects.map((project) => ({
        label: project.displayName,
        value: project.id,
      })),
    });
  }

  if (members.length > 1) {
    filters.push({
      type: 'select',
      title: t('Member'),
      accessorKey: 'member',
      icon: User,
      options: members.map((member) => ({
        label: activityUtils.memberName(member),
        value: member.id,
      })),
    });
  }

  filters.push(
    {
      type: 'select',
      title: t('Client'),
      accessorKey: 'client',
      icon: Plug,
      options: McpOAuthClientKey.options.map((clientKey) => ({
        label: mcpClientDisplay.label({ key: clientKey, clientName: null }),
        value: clientKey,
        icon: mcpClientDisplay.icon(clientKey),
      })),
    },
    {
      type: 'select',
      title: t('Result'),
      accessorKey: 'result',
      icon: CircleCheck,
      options: McpActivityStatus.options.map((status) => ({
        label: status === 'SUCCEEDED' ? t('Succeeded') : t('Failed'),
        value: status,
      })),
    },
    {
      type: 'date',
      title: t('When'),
      accessorKey: 'when',
    },
  );

  return filters;
}

type ActivityFeedProps = {
  emptyStateAction?: ReactNode;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
};

type BuildFiltersParams = {
  projects: { id: string; displayName: string }[];
  members: { id: string; email: string; firstName: string; lastName: string }[];
};
