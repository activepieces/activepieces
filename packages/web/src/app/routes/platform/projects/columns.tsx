import { isNil } from '@activepieces/core-utils';
import {
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
  Sparkles,
} from 'lucide-react';

import { RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { FormattedDate } from '@/components/custom/formatted-date';

type ProjectsTableColumnsProps = {
  platform: PlatformWithoutSensitiveData;
};

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

        return (
          <div className="text-left flex items-center justify-start ">
            {locked && <Lock className="size-3 mr-1.5" strokeWidth={2.5} />}
            {isPersonal && <User className="size-4 mr-1.5"></User>}
            <span className="font-medium">{row.original.displayName}</span>
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
    {
      id: 'aiUsage',
      size: 130,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('AI Usage')}
          icon={Sparkles}
          className="w-full"
        />
      ),
      cell: ({ row }) => {
        const { used, limit } = mockAiUsage(row.original.id);
        return (
          <div className="text-left tabular-nums">
            <span className="font-medium">{used.toLocaleString()}</span>
            <span className="text-muted-foreground">
              {` / ${limit === null ? t('Unlimited') : limit.toLocaleString()}`}
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

// ponytail: prototype mock — remove
function mockAiUsage(projectId: string): {
  used: number;
  limit: number | null;
} {
  const seed = [...projectId].reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0,
  );
  const used = (seed % 90) * 100 + 400;
  const limit = seed % 3 === 0 ? null : Math.ceil(used / 1000) * 1000 + 2000;
  return { used, limit };
}
