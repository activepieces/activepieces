import {
  AppConnectionScope,
  AppConnectionStatus,
  MAX_PLATFORM_APP_CONNECTION_OWNERS,
  PlatformAppConnectionsListItem,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  Activity,
  CheckIcon,
  Clock,
  Folder,
  Globe,
  Puzzle,
  Shield,
  Unplug,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { CopyTextTooltip } from '@/components/custom/clipboard/copy-text-tooltip';
import {
  DataTable,
  DataTableFilters,
  RowDataWithActions,
} from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { FormattedDate } from '@/components/custom/formatted-date';
import { StatusIconWithText } from '@/components/custom/status-icon-with-text';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { appConnectionUtils } from '@/features/connections';
import { PieceIconWithPieceName, piecesHooks } from '@/features/pieces';
import { platformAppConnectionsQueries } from '@/features/platform-admin/hooks/platform-app-connections-hooks';
import { getProjectName, projectCollectionUtils } from '@/features/projects';
import { formatUtils } from '@/lib/format-utils';

export default function PlatformConnectionsPage() {
  const { data: connections, isLoading } =
    platformAppConnectionsQueries.useList();
  const { data: owners } = platformAppConnectionsQueries.useOwners();
  const { data: projects } = projectCollectionUtils.useAllPlatformProjects();
  const { pieces } = piecesHooks.usePieces({});

  const filters: DataTableFilters<
    keyof PlatformAppConnectionsListItem | 'ownerIds'
  >[] = [
    {
      type: 'input',
      title: t('Name'),
      accessorKey: 'displayName',
      icon: Unplug,
    },
    {
      type: 'select',
      title: t('Status'),
      accessorKey: 'status',
      icon: CheckIcon,
      options: Object.values(AppConnectionStatus).map((status) => ({
        label: formatUtils.convertEnumToHumanReadable(status),
        value: status,
      })),
    },
    {
      type: 'select',
      title: t('Piece'),
      accessorKey: 'pieceName',
      icon: Puzzle,
      options: (pieces ?? []).map((piece) => ({
        label: piece.displayName,
        value: piece.name,
      })),
    },
    {
      type: 'select',
      title: t('Project'),
      accessorKey: 'projectIds',
      icon: Folder,
      options: (projects ?? []).map((project) => ({
        label: getProjectName(project),
        value: project.id,
      })),
    },
    {
      type: 'select',
      title: t('Owner'),
      accessorKey: 'ownerIds',
      icon: User,
      options: (owners?.data ?? []).map((owner) => ({
        label: owner.email,
        value: owner.id,
      })),
    },
  ];

  const columns: ColumnDef<
    RowDataWithActions<PlatformAppConnectionsListItem>
  >[] = [
    {
      accessorKey: 'displayName',
      size: 280,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Name')}
          icon={Unplug}
        />
      ),
      cell: ({ row }) => (
        <CopyTextTooltip
          title={t('External ID')}
          text={row.original.externalId || ''}
        >
          <div className="flex items-center gap-2 w-fit min-w-0">
            <PieceIconWithPieceName
              pieceName={row.original.pieceName}
              showTooltip={false}
              size="sm"
            />
            <TextWithTooltip tooltipMessage={row.original.displayName}>
              <span className="truncate max-w-[160px] 2xl:max-w-[260px]">
                {row.original.displayName}
              </span>
            </TextWithTooltip>
          </div>
        </CopyTextTooltip>
      ),
    },
    {
      accessorKey: 'status',
      size: 130,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Status')}
          icon={Activity}
        />
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        const { variant, icon: Icon } =
          appConnectionUtils.getStatusIcon(status);
        return (
          <StatusIconWithText
            icon={Icon}
            text={formatUtils.convertEnumToHumanReadable(status)}
            variant={variant}
          />
        );
      },
    },
    {
      accessorKey: 'projects',
      size: 220,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Project')}
          icon={Folder}
        />
      ),
      cell: ({ row }) => <ProjectsCell projects={row.original.projects} />,
    },
    {
      accessorKey: 'scope',
      size: 120,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Scope')}
          icon={Shield}
        />
      ),
      cell: ({ row }) => <ScopeBadge scope={row.original.scope} />,
    },
    {
      accessorKey: 'owner',
      size: 200,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Owner')} icon={User} />
      ),
      cell: ({ row }) => {
        const owner = row.original.owner;
        if (!owner) {
          return <span className="text-muted-foreground">{t('N/A')}</span>;
        }
        const fullName = [owner.firstName, owner.lastName]
          .filter(Boolean)
          .join(' ');
        const label = fullName || owner.email;
        return (
          <TextWithTooltip tooltipMessage={owner.email}>
            <span className="truncate max-w-[180px]">{label}</span>
          </TextWithTooltip>
        );
      },
    },
    {
      accessorKey: 'updated',
      size: 150,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Connected At')}
          icon={Clock}
        />
      ),
      cell: ({ row }) => (
        <FormattedDate date={new Date(row.original.updated)} />
      ),
    },
  ];

  return (
    <div className="flex flex-col w-full">
      <DashboardPageHeader
        title={t('Connections')}
        description={t(
          'All app connections across every project on this platform',
        )}
      />
      {owners?.truncated && (
        <div className="px-6 pb-2 text-xs text-muted-foreground">
          {t('Owner filter is limited to the first {count} owners', {
            count: MAX_PLATFORM_APP_CONNECTION_OWNERS,
          })}
        </div>
      )}
      <DataTable
        emptyStateTextTitle={t('No connections found')}
        emptyStateTextDescription={t(
          'Connections created in any project on this platform will appear here.',
        )}
        emptyStateIcon={<Unplug className="size-14" />}
        columns={columns}
        page={connections}
        isLoading={isLoading}
        filters={filters}
      />
    </div>
  );
}

const ScopeBadge = ({ scope }: { scope: AppConnectionScope }) => {
  if (scope === AppConnectionScope.PLATFORM) {
    return (
      <Badge variant="accent">
        <Globe />
        {t('Global')}
      </Badge>
    );
  }
  return <Badge variant="outline">{t('Project')}</Badge>;
};

const ProjectsCell = ({
  projects,
}: {
  projects: PlatformAppConnectionsListItem['projects'];
}) => {
  if (projects.length === 0) {
    return <span className="text-muted-foreground">{t('N/A')}</span>;
  }
  if (projects.length === 1) {
    const project = projects[0];
    const name = getProjectName(project);
    return (
      <Link to={`/projects/${project.id}`}>
        <TextWithTooltip tooltipMessage={name}>
          <span className="truncate max-w-[200px] text-primary hover:underline">
            {name}
          </span>
        </TextWithTooltip>
      </Link>
    );
  }
  const label = t('{count, plural, =1 {1 project} other {# projects}}', {
    count: projects.length,
  });
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-default underline decoration-dashed underline-offset-2">
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <ul className="flex flex-col gap-1 max-w-[260px]">
          {projects.map((project) => (
            <li key={project.id} className="truncate">
              {getProjectName(project)}
            </li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
};
