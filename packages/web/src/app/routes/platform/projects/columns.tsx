import { isNil } from '@activepieces/core-utils';
import {
  PlatformWithoutSensitiveData,
  PROJECT_COLOR_PALETTE,
  ProjectType,
  ProjectWithLimits,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';

import { RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { cn } from '@/lib/utils';

import {
  InitialsTile,
  listFormat,
  MutedCell,
  NameCell,
  NumberCell,
} from '../components/list-cell';

export const projectsTableColumns = ({
  platform,
}: ProjectsTableColumnsProps): ColumnDef<RowDataWithActions<ProjectRow>>[] => {
  const columns: ColumnDef<RowDataWithActions<ProjectRow>>[] = [
    {
      accessorKey: 'displayName',
      size: 400,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Project')} />
      ),
      cell: ({ row }) => (
        <NameCell
          media={<ProjectTile project={row.original} />}
          title={row.original.displayName}
          sub={projectSubline({ project: row.original })}
        />
      ),
    },
    {
      accessorKey: 'members',
      size: 110,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Members')}
          className="justify-end"
        />
      ),
      cell: ({ row }) => (
        <NumberCell>{row.original.analytics.totalUsers}</NumberCell>
      ),
    },
    {
      accessorKey: 'activeFlows',
      size: 120,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Active flows')}
          className="justify-end"
        />
      ),
      cell: ({ row }) => {
        const active = row.original.analytics.activeFlows;
        const limit = row.original.plan.activeFlowsLimit;
        const atLimit = !isNil(limit) && active >= limit;
        return (
          <NumberCell>
            <span className={cn(atLimit && 'font-medium text-danger-11')}>
              {active}
            </span>
            {!isNil(limit) && <span>{` / ${limit}`}</span>}
          </NumberCell>
        );
      },
    },
  ];

  if (platform.plan.globalConnectionsEnabled) {
    columns.push({
      accessorKey: 'globalConnectionsCount',
      size: 160,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Global connections')}
          className="justify-end"
        />
      ),
      cell: ({ row }) => (
        <NumberCell>{row.original.globalConnectionsCount}</NumberCell>
      ),
    });
  }

  columns.push(
    {
      accessorKey: 'lastActivity',
      size: 150,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Last flow edit')} />
      ),
      cell: ({ row }) => (
        <MutedCell>
          {listFormat.relativeDate(row.original.analytics.lastFlowUpdated)}
        </MutedCell>
      ),
    },
    {
      accessorKey: 'created',
      size: 110,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Created')} />
      ),
      cell: ({ row }) => (
        <MutedCell>{listFormat.shortDate(row.original.created)}</MutedCell>
      ),
    },
  );

  return columns;
};

function ProjectTile({ project }: { project: ProjectRow }) {
  const isPersonal = project.type === ProjectType.PERSONAL;
  const swatch = PROJECT_COLOR_PALETTE[project.icon.color];
  return (
    <span className="relative shrink-0">
      <InitialsTile
        name={project.displayName.charAt(0)}
        style={
          isPersonal
            ? undefined
            : { backgroundColor: swatch.color, color: swatch.textColor }
        }
      />
      {project.plan.locked && (
        <span
          aria-label={t('Locked')}
          className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-warning-9 ring-2 ring-panel"
        />
      )}
    </span>
  );
}

function projectSubline({ project }: { project: ProjectRow }): string {
  if (project.type === ProjectType.PERSONAL) {
    return [t('Personal project'), project.ownerName]
      .filter((part) => !isNil(part) && part.length > 0)
      .join(' · ');
  }
  return [
    project.ownerName,
    project.sensitive ? t('sensitive') : undefined,
    project.externalId,
  ]
    .filter((part): part is string => !isNil(part) && part.length > 0)
    .join(' · ');
}

export type ProjectRow = ProjectWithLimits & {
  globalConnectionsCount: number;
  ownerName?: string;
};

type ProjectsTableColumnsProps = {
  platform: PlatformWithoutSensitiveData;
};
