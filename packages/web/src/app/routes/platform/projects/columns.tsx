import { isNil } from '@activepieces/core-utils';
import {
  PROJECT_COLOR_PALETTE,
  ProjectType,
  ProjectWithLimits,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Lock } from 'lucide-react';

import { RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import {
  DateCell,
  InitialsTile,
  MutedCell,
  NameCell,
  NumberCell,
} from '@/components/custom/list/list-cells';
import { RowMenu, RowMenuItem } from '@/components/custom/list/row-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const projectsTableColumns = ({
  menuItems,
}: {
  menuItems: (project: ProjectRow) => RowMenuItem[];
}): ColumnDef<RowDataWithActions<ProjectRow>>[] => [
  {
    accessorKey: 'displayName',
    size: 400,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Project')} />
    ),
    cell: ({ row }) => (
      <NameCell
        stacked
        media={<ProjectTile project={row.original} />}
        title={row.original.displayName}
        badge={
          row.original.plan.locked ? (
            <Badge variant="outline">
              <Lock />
              {t('Locked')}
            </Badge>
          ) : undefined
        }
        sub={row.original.externalId ?? undefined}
      />
    ),
  },
  {
    id: 'owner',
    size: 200,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Owner')} />
    ),
    cell: ({ row }) => <MutedCell>{row.original.ownerName}</MutedCell>,
  },
  {
    id: 'members',
    size: 120,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Members')}
        className="justify-end"
      />
    ),
    cell: ({ row }) => (
      <span
        className="block text-right text-gray-12 tabular-nums"
        title={t('{active} active of {total} members', {
          active: row.original.analytics.activeUsers,
          total: row.original.analytics.totalUsers,
        })}
      >
        {`${row.original.analytics.activeUsers} / ${row.original.analytics.totalUsers}`}
      </span>
    ),
  },
  {
    id: 'activeFlows',
    size: 120,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Active flows')}
        className="justify-end"
      />
    ),
    cell: ({ row }) => <ActiveFlowsCell project={row.original} />,
  },
  {
    id: 'lastActivity',
    size: 148,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Last activity')} />
    ),
    cell: ({ row }) => (
      <DateCell value={row.original.analytics.lastFlowUpdated} />
    ),
  },
  {
    id: 'created',
    size: 112,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Created')} />
    ),
    cell: ({ row }) => <DateCell value={row.original.created} mode="short" />,
  },
  {
    id: 'actions',
    size: 56,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <RowMenu items={menuItems(row.original)} />
      </div>
    ),
  },
];

export function ProjectTile({
  project,
  className,
}: {
  project: ProjectWithLimits;
  className?: string;
}) {
  const isPersonal = project.type === ProjectType.PERSONAL;
  const swatch = PROJECT_COLOR_PALETTE[project.icon.color];
  return (
    <InitialsTile
      name={project.displayName.charAt(0)}
      className={className}
      style={
        isPersonal
          ? undefined
          : { backgroundColor: swatch.color, color: swatch.textColor }
      }
    />
  );
}

export function ActiveFlowsCell({ project }: { project: ProjectWithLimits }) {
  const active = project.analytics.activeFlows;
  const limit = project.plan.activeFlowsLimit;
  const atLimit = !isNil(limit) && active >= limit;
  return (
    <NumberCell>
      <span className={cn(atLimit && 'font-medium text-danger-11')}>
        {active}
        {!isNil(limit) && ` / ${limit}`}
      </span>
    </NumberCell>
  );
}

export type ProjectRow = ProjectWithLimits & {
  ownerName?: string;
  globalConnectionsCount?: number;
};
