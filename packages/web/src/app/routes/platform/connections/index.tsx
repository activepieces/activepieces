import {
  AppConnectionScope,
  AppConnectionStatus,
  MAX_PLATFORM_APP_CONNECTION_OWNERS,
  PlatformAppConnectionsListItem,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Unplug } from 'lucide-react';
import { Link } from 'react-router-dom';

import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { DataTableFilter } from '@/components/custom/data-table/data-table-filter';
import { Page, PageHeader, Toolbar } from '@/components/custom/page';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { EmptyMedia } from '@/components/ui/empty';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { piecesHooks } from '@/features/pieces';
import { platformAppConnectionsQueries } from '@/features/platform-admin/hooks/platform-app-connections-hooks';
import { getProjectName, projectCollectionUtils } from '@/features/projects';

import { listFormat, MutedCell } from '../components/list-cell';

import {
  ConnectionNameCell,
  ConnectionStatus,
  connectionStatusLabel,
  ParamSearchInput,
} from './connection-cells';

export default function PlatformConnectionsPage() {
  const {
    data: connections,
    isLoading,
    isError,
    refetch,
  } = platformAppConnectionsQueries.useList();
  const { data: owners } = platformAppConnectionsQueries.useOwners();
  const { data: projects } = projectCollectionUtils.useAllPlatformProjects();
  const { pieces } = piecesHooks.usePieces({});

  const columns: ColumnDef<
    RowDataWithActions<PlatformAppConnectionsListItem>
  >[] = [
    {
      accessorKey: 'displayName',
      size: 360,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Connection')} />
      ),
      cell: ({ row }) => (
        <ConnectionNameCell
          pieceName={row.original.pieceName}
          displayName={row.original.displayName}
        />
      ),
    },
    {
      accessorKey: 'projects',
      size: 240,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Project')} />
      ),
      cell: ({ row }) => (
        <ProjectsCell
          scope={row.original.scope}
          projects={row.original.projects}
        />
      ),
    },
    {
      accessorKey: 'owner',
      size: 200,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Owner')} />
      ),
      cell: ({ row }) => {
        const owner = row.original.owner;
        if (!owner) {
          return <MutedCell>{t('Platform')}</MutedCell>;
        }
        const fullName = [owner.firstName, owner.lastName]
          .filter(Boolean)
          .join(' ');
        const label = fullName || owner.email;
        return (
          <TextWithTooltip tooltipMessage={owner.email}>
            <span className="block truncate text-gray-11">{label}</span>
          </TextWithTooltip>
        );
      },
    },
    {
      accessorKey: 'status',
      size: 140,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Status')} />
      ),
      cell: ({ row }) => <ConnectionStatus status={row.original.status} />,
    },
    {
      accessorKey: 'updated',
      size: 150,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Updated')} />
      ),
      cell: ({ row }) => (
        <MutedCell>{listFormat.relativeDate(row.original.updated)}</MutedCell>
      ),
    },
  ];

  return (
    <Page>
      <PageHeader
        title={t('Connections')}
        description={t(
          'Every app connection in every project on the platform, and the global ones shared between them.',
        )}
      />
      <Toolbar>
        <div className="min-w-64 flex-1">
          <ParamSearchInput
            paramKey="displayName"
            placeholder={t('Search connections')}
          />
        </div>
        <DataTableFilter
          type="select"
          title={t('Project')}
          accessorKey="projectIds"
          options={(projects ?? []).map((project) => ({
            label: getProjectName(project),
            value: project.id,
          }))}
        />
        <DataTableFilter
          type="select"
          title={t('Owner')}
          accessorKey="ownerIds"
          options={(owners?.data ?? []).map((owner) => ({
            label:
              [owner.firstName, owner.lastName].filter(Boolean).join(' ') ||
              owner.email,
            value: owner.id,
          }))}
        />
        <DataTableFilter
          type="select"
          title={t('Piece')}
          accessorKey="pieceName"
          options={(pieces ?? []).map((piece) => ({
            label: piece.displayName,
            value: piece.name,
          }))}
        />
        <DataTableFilter
          type="select"
          title={t('Status')}
          accessorKey="status"
          options={Object.values(AppConnectionStatus).map((status) => ({
            label: connectionStatusLabel(status),
            value: status,
          }))}
        />
      </Toolbar>
      {owners?.truncated && (
        <p className="text-xs text-gray-11">
          {t('Owner filter is limited to the first {count} owners', {
            count: MAX_PLATFORM_APP_CONNECTION_OWNERS,
          })}
        </p>
      )}
      <DataTable
        emptyStateTextTitle={t('No connections yet')}
        emptyStateTextDescription={t(
          'Connections created in any project on this platform appear here.',
        )}
        emptyStateIcon={
          <EmptyMedia variant="icon">
            <Unplug />
          </EmptyMedia>
        }
        columns={columns}
        page={connections}
        isLoading={isLoading}
        isError={isError}
        errorStateEntity={t('connections')}
        onRetry={refetch}
      />
    </Page>
  );
}

const ProjectsCell = ({
  scope,
  projects,
}: {
  scope: AppConnectionScope;
  projects: PlatformAppConnectionsListItem['projects'];
}) => {
  const isGlobal = scope === AppConnectionScope.PLATFORM;
  const countLabel =
    projects.length === 1
      ? getProjectName(projects[0])
      : t('{count, plural, =1 {1 project} other {# projects}}', {
          count: projects.length,
        });
  return (
    <div className="flex min-w-0 items-center gap-2">
      {isGlobal && (
        <Badge variant="secondary" className="shrink-0">
          {t('Global')}
        </Badge>
      )}
      {projects.length === 0 ? (
        !isGlobal && <MutedCell>—</MutedCell>
      ) : projects.length === 1 ? (
        <Link
          to={`/projects/${projects[0].id}`}
          className="min-w-0 truncate text-gray-11 hover:text-gray-12 hover:underline"
        >
          {countLabel}
        </Link>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="min-w-0 cursor-default truncate text-gray-11">
              {countLabel}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <ul className="flex max-w-64 flex-col gap-1">
              {projects.map((project) => (
                <li key={project.id} className="truncate">
                  {getProjectName(project)}
                </li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};
