import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Lock, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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
  currentUserId,
}: ProjectsTableColumnsProps): ColumnDef<
  RowDataWithActions<ProjectWithLimits>
>[] => {
  const columns: ColumnDef<RowDataWithActions<ProjectWithLimits>>[] = [
    {
      accessorKey: 'displayName',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Name')} />
      ),
      cell: ({ row }) => {
        const locked = row.original.plan.locked;
        const isPersonal = row.original.type === ProjectType.PERSONAL;
        const isOwner = row.original.ownerId === currentUserId;

        return (
          <div className="text-left flex items-center justify-start ">
            {locked && <Lock className="size-3 mr-1.5" strokeWidth={2.5} />}
            {isPersonal && <User className="size-4 mr-1.5"></User>}
            <span>{row.original.displayName}</span>
            {isPersonal && isOwner && (
              <Badge variant={'outline'} className="text-xs font-medium ml-2">
                You
              </Badge>
            )}
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
        <DataTableColumnHeader column={column} title={t('Active Users')} />
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
        <DataTableColumnHeader column={column} title={t('Active Flows')} />
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
        <DataTableColumnHeader column={column} title={t('Created')} />
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
        <DataTableColumnHeader column={column} title={t('External ID')} />
      ),
      cell: ({ row }) => {
        const displayValue =
          isNil(row.original.externalId) ||
          row.original.externalId?.length === 0
            ? '-'
            : row.original.externalId;
        return <div className="text-left">{displayValue}</div>;
      },
    });
  }

  return columns;
};
