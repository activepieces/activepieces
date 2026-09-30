import { isNil } from '@activepieces/core-utils';
import {
  newMemberSettingsUtils,
  PlatformWithoutSensitiveData,
  ProjectWithLimits,
  ProjectType,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  Lock,
  User,
  Tag,
  Users,
  Workflow,
  Clock,
  Hash,
  Link2,
} from 'lucide-react';

import { RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { FormattedDate } from '@/components/custom/formatted-date';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const projectsTableColumns = ({
  platform,
}: ProjectsTableColumnsProps): ColumnDef<
  RowDataWithActions<ProjectWithLimits & { globalConnectionsCount: number }>
>[] => {
  const columns: ColumnDef<
    RowDataWithActions<ProjectWithLimits & { globalConnectionsCount: number }>
  >[] = [
    {
      accessorKey: 'displayName',
      size: 270,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Name')} icon={Tag} />
      ),
      cell: ({ row }) => {
        const locked = row.original.plan.locked;
        const isPersonal = row.original.type === ProjectType.PERSONAL;
        const isDefault = newMemberSettingsUtils
          .activeDefaultProjectIds({
            defaultProjectIds: platform.defaultProjectIds,
            projectRolesEnabled: platform.plan.projectRolesEnabled,
          })
          .includes(row.original.id);

        return (
          <div className="text-left flex items-center justify-start ">
            {locked && <Lock className="size-3 mr-1.5" strokeWidth={2.5} />}
            {isPersonal && <User className="size-4 mr-1.5"></User>}
            <span className="flex items-baseline gap-1.5">
              <span className="font-medium">{row.original.displayName}</span>
              {isDefault && <DefaultProjectBadge />}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      enableHiding: true,
    },
    {
      accessorKey: 'users',
      size: 120,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Active Users')}
          icon={Users}
          className="w-full"
        />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left tabular-nums">
            <span className="font-medium">
              {row.original.analytics.activeUsers}
            </span>
            <span className="text-muted-foreground">
              {` / ${row.original.analytics.totalUsers}`}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'flows',
      size: 120,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Active Flows')}
          icon={Workflow}
          className="w-full"
        />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left tabular-nums">
            <span className="font-medium">
              {row.original.analytics.activeFlows}
            </span>
            <span className="text-muted-foreground">
              {` / ${row.original.analytics.totalFlows}`}
            </span>
          </div>
        );
      },
    },
  ];

  if (platform.plan.embeddingEnabled) {
    columns.push({
      accessorKey: 'externalId',
      size: 150,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('External ID')}
          icon={Hash}
        />
      ),
      cell: ({ row }) => {
        const displayValue =
          isNil(row.original.externalId) ||
          row.original.externalId?.length === 0
            ? '-'
            : row.original.externalId;
        return <div className="text-left truncate">{displayValue}</div>;
      },
    });
  }
  if (platform.plan.globalConnectionsEnabled) {
    columns.push({
      accessorKey: 'globalConnectionsCount',
      size: 135,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Global Connections')}
          icon={Link2}
          className="w-full"
        />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left tabular-nums">
            {row.original.globalConnectionsCount}
          </div>
        );
      },
    });
  }

  columns.push({
    accessorKey: 'createdAt',
    size: 110,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Created')}
        icon={Clock}
      />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-left">
          <FormattedDate date={new Date(row.original.created)} />
        </div>
      );
    },
  });

  return columns;
};

function DefaultProjectBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="accent"
          className="h-4 px-1.5 py-0 text-xss leading-none"
        >
          {t('Default')}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top">
        {t('All new members join this project as Editors.')}
      </TooltipContent>
    </Tooltip>
  );
}

type ProjectsTableColumnsProps = {
  platform: PlatformWithoutSensitiveData;
};
