import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Lock, User, Tag, Users, Workflow, Clock, Hash } from 'lucide-react';

import { RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { FormattedDate } from '@/components/ui/formatted-date';
import {
  isNil,
  PlatformWithoutSensitiveData,
  ProjectWithLimits,
  ProjectType,
} from '@activepieces/shared';

type ProjectsTableColumnsProps = {
  platform: PlatformWithoutSensitiveData;
  currentUserId?: string;
};

export const projectsTableColumns = ({
  platform,
}: ProjectsTableColumnsProps): ColumnDef<
  RowDataWithActions<ProjectWithLimits>
>[] => {
  const columns: ColumnDef<RowDataWithActions<ProjectWithLimits>>[] = [
    {
      accessorKey: 'displayName',
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
            <span>{row.original.displayName}</span>
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
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Active Users')}
          icon={Users}
        />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">
            {row.original.analytics.activeUsers} /{' '}
            {row.original.analytics.totalUsers}
          </div>
        );
      },
    },
    {
      accessorKey: 'flows',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Active Flows')}
          icon={Workflow}
        />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">
            {row.original.analytics.activeFlows} /{' '}
            {row.original.analytics.totalFlows}
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
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
    },
  ];

  if (platform.plan.embeddingEnabled) {
    columns.push({
      accessorKey: 'externalId',
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

  return columns;
};
