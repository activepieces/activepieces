import { isNil } from '@activepieces/core-utils';
import {
  PROJECT_COLOR_PALETTE,
  ProjectType,
  ProjectWithLimits,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';

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
    size: 104,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('Members')}
        className="justify-end"
      />
    ),
    cell: ({ row }) => <NumberCell value={row.original.analytics.totalUsers} />,
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
};
