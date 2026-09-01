import {
  McpActivityStatus,
  McpOAuthClientKey,
  PopulatedMcpActivity,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Activity, CircleCheck, FolderOpen, Plug, User } from 'lucide-react';
import { useMemo, useState } from 'react';
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
} from '@/components/custom/empty';
import { Button } from '@/components/ui/button';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { platformUserHooks } from '@/features/platform-admin/hooks/platform-user-hooks';
import { projectCollectionUtils } from '@/features/projects';
import { useIsPlatformPrivileged } from '@/hooks/authorization-hooks';
import { userHooks } from '@/hooks/user-hooks';

import { mcpActivityQueries } from '../mcp-activity-hooks';
import { mcpClientDisplay } from '../mcp-client-display';
import { useMcpNav } from '../mcp-nav';
import { PageBand } from '../page-band';

import { buildActivityColumns } from './activity-columns';
import { ActivityDetailSheet } from './activity-detail-sheet';

const DEFAULT_PAGE_SIZE = 10;

export function ActivityTab() {
  const nav = useMcpNav();
  const [searchParams] = useSearchParams();
  const [selected, setSelected] = useState<PopulatedMcpActivity | null>(null);
  const { data: currentUser } = userHooks.useCurrentUser();
  const { data: projects = [] } = projectCollectionUtils.useAll();
  const isPrivileged = useIsPlatformPrivileged();
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

  const { data, isLoading, isError } = mcpActivityQueries.useActivity({
    request,
    showErrorDialog: true,
  });

  const pieceNames = useMemo(
    () => distinctPieceNames(data?.data ?? []),
    [data?.data],
  );
  const pieceQueries = piecesHooks.useMultiplePieces({ names: pieceNames });
  const piecesByName = useMemo(
    () =>
      new Map(
        pieceQueries
          .map((query) => query.data)
          .filter((piece) => piece !== undefined)
          .map((piece) => [piece.name, piece]),
      ),
    [pieceQueries],
  );

  const resolvePieceDisplayName = (row: PopulatedMcpActivity) =>
    row.pieceName === null
      ? undefined
      : piecesByName.get(row.pieceName)?.displayName;

  const resolveActionDisplayName = (row: PopulatedMcpActivity) => {
    if (row.pieceName === null || row.actionName === null) {
      return undefined;
    }
    return piecesByName.get(row.pieceName)?.actions?.[row.actionName]
      ?.displayName;
  };

  const columns = buildActivityColumns({
    currentUserId: currentUser?.id,
    showMember: isPrivileged,
    resolveActionDisplayName,
    resolvePieceDisplayName,
  });

  if (
    !isLoading &&
    !isError &&
    !hasActiveFilters &&
    (data?.data.length ?? 0) === 0
  ) {
    return (
      <PageBand className="py-8">
        <Empty className="border border-dashed py-20">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Activity />
            </EmptyMedia>
            <EmptyTitle>{t('Nothing has run yet')}</EmptyTitle>
            <EmptyDescription>
              {t(
                'A client can be connected and still never run anything. Check Connections to confirm it signed in.',
              )}
            </EmptyDescription>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => nav.showTab('connections')}
            >
              {t('See who is connected')} →
            </Button>
          </EmptyHeader>
        </Empty>
      </PageBand>
    );
  }

  return (
    <PageBand className="flex flex-col gap-2 py-8">
      <DataTable
        columns={columns}
        page={data}
        isLoading={isLoading}
        filters={buildFilters({
          projects,
          members: isPrivileged ? users?.data ?? [] : [],
        })}
        bordered={true}
        onRowClick={(row) => setSelected(row)}
        emptyStateTextTitle={t('No runs match these filters')}
        emptyStateTextDescription={t('Clear a filter to see more.')}
        emptyStateIcon={<Activity className="size-10" />}
      />

      <ActivityDetailSheet
        row={selected}
        onClose={() => setSelected(null)}
        currentUserId={currentUser?.id}
        actionDisplayName={
          selected === null ? undefined : resolveActionDisplayName(selected)
        }
        pieceDisplayName={
          selected === null ? undefined : resolvePieceDisplayName(selected)
        }
      />
    </PageBand>
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
}: {
  projects: { id: string; displayName: string }[];
  members: { id: string; email: string; firstName: string; lastName: string }[];
}): DataTableFilters<string>[] {
  const projectFilter: DataTableFilters<string>[] =
    projects.length > 1
      ? [
          {
            type: 'select',
            title: t('Project'),
            accessorKey: 'project',
            icon: FolderOpen,
            options: projects.map((project) => ({
              label: project.displayName,
              value: project.id,
            })),
          },
        ]
      : [];

  const memberFilter: DataTableFilters<string>[] =
    members.length > 1
      ? [
          {
            type: 'select',
            title: t('Member'),
            accessorKey: 'member',
            icon: User,
            options: members.map((member) => ({
              label:
                `${member.firstName} ${member.lastName}`.trim() || member.email,
              value: member.id,
            })),
          },
        ]
      : [];

  return [
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
    ...projectFilter,
    ...memberFilter,
    {
      type: 'date',
      title: t('When'),
      accessorKey: 'when',
    },
  ];
}
