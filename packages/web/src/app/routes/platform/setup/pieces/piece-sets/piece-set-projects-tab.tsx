import { isNil } from '@activepieces/core-utils';
import { PieceSet, ProjectWithLimits } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  CheckIcon,
  Layers,
  LayoutGrid,
  Loader2,
  ToggleLeft,
  Users,
} from 'lucide-react';
import { useCallback, useMemo } from 'react';

import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { pieceSetMutations, pieceSetQueries } from '@/features/piece-sets';
import { projectHooks } from '@/features/projects';

type PieceSetProjectsTabProps = {
  pieceSet: PieceSet;
};

const BulkProjectActions = ({
  pieceSet,
  selectedProjects,
  resetSelection,
}: {
  pieceSet: PieceSet;
  selectedProjects: ProjectWithLimits[];
  resetSelection: () => void;
}) => {
  const { mutate: assignProjects, isPending: isAssigning } =
    pieceSetMutations.useAssignProjects();
  const { mutate: bulkRemoveProjects, isPending: isRemoving } =
    pieceSetMutations.useBulkRemoveProjects();

  const isAssignedToThisSet = useCallback(
    (project: ProjectWithLimits) => {
      if (pieceSet.isDefault) {
        return project.pieceSetId === pieceSet.id || isNil(project.pieceSetId);
      }
      return project.pieceSetId === pieceSet.id;
    },
    [pieceSet.id, pieceSet.isDefault],
  );

  const allAssigned = selectedProjects.every(isAssignedToThisSet);
  const allUnassigned = selectedProjects.every((p) => !isAssignedToThisSet(p));

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        loading={isAssigning}
        disabled={allAssigned}
        onClick={() =>
          assignProjects(
            {
              id: pieceSet.id,
              projectIds: selectedProjects.map((p) => p.id),
            },
            { onSuccess: resetSelection },
          )
        }
      >
        {t('Assign')}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        loading={isRemoving}
        disabled={pieceSet.isDefault || allUnassigned}
        onClick={() =>
          bulkRemoveProjects(
            {
              id: pieceSet.id,
              projectIds: selectedProjects.map((p) => p.id),
            },
            { onSuccess: resetSelection },
          )
        }
      >
        {t('Unassign')}
      </Button>
    </>
  );
};

export const PieceSetProjectsTab = ({ pieceSet }: PieceSetProjectsTabProps) => {
  const { data: platformsData, isLoading } =
    projectHooks.useProjectsForPlatforms();
  const { data: pieceSetsPage } = pieceSetQueries.usePieceSets();
  const { mutate: assignProjects, isPending: isAssigning } =
    pieceSetMutations.useAssignProjects();
  const { mutate: removeProject, isPending: isRemoving } =
    pieceSetMutations.useRemoveProject();

  const allProjects = useMemo<ProjectWithLimits[]>(() => {
    if (!platformsData) return [];
    return platformsData.flatMap((p) => p.projects);
  }, [platformsData]);

  const pieceSets = useMemo(() => pieceSetsPage?.data ?? [], [pieceSetsPage]);

  const isAssignedToThisSet = useCallback(
    (project: ProjectWithLimits) => {
      if (pieceSet.isDefault) {
        return project.pieceSetId === pieceSet.id || isNil(project.pieceSetId);
      }
      return project.pieceSetId === pieceSet.id;
    },
    [pieceSet.id, pieceSet.isDefault],
  );

  const getPieceSetName = useCallback(
    (project: ProjectWithLimits): string => {
      if (isNil(project.pieceSetId)) {
        return pieceSets.find((s) => s.isDefault)?.name ?? t('Default');
      }
      return pieceSets.find((s) => s.id === project.pieceSetId)?.name ?? '-';
    },
    [pieceSets],
  );

  const columns: ColumnDef<RowDataWithActions<ProjectWithLimits>>[] = useMemo(
    () => [
      {
        accessorKey: 'displayName',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Project')}
            icon={LayoutGrid}
          />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{row.original.displayName}</span>
            <span className="text-xs text-muted-foreground">
              {t('Active Flows')}: {row.original.analytics.activeFlows} &middot;{' '}
              {t('Active Users')}: {row.original.analytics.activeUsers}
            </span>
          </div>
        ),
      },
      {
        id: 'assignedPieceSet',
        accessorFn: (row) => getPieceSetName(row),
        size: 160,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Piece Set')}
            icon={Layers}
          />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {getPieceSetName(row.original)}
          </span>
        ),
      },
      {
        id: 'status',
        accessorFn: (row) =>
          isAssignedToThisSet(row) ? 'assigned' : 'unassigned',
        filterFn: (row, columnId, filterValue: string[]) =>
          filterValue.length === 0 ||
          filterValue.includes(row.getValue(columnId) as string),
        size: 120,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t('Status')}
            icon={ToggleLeft}
          />
        ),
        cell: ({ row }) => {
          const assigned = isAssignedToThisSet(row.original);
          return assigned ? (
            <Badge variant="success">{t('Assigned')}</Badge>
          ) : (
            <Badge variant="outline">{t('Not assigned')}</Badge>
          );
        },
      },
      {
        id: 'actions',
        size: 80,
        cell: ({ row }) => {
          const assigned = isAssignedToThisSet(row.original);
          return (
            <div className="flex justify-end">
              <Switch
                checked={assigned}
                disabled={
                  (pieceSet.isDefault && assigned) || isAssigning || isRemoving
                }
                onCheckedChange={(checked) => {
                  if (checked) {
                    assignProjects({
                      id: pieceSet.id,
                      projectIds: [row.original.id],
                    });
                  } else {
                    removeProject({
                      id: pieceSet.id,
                      projectId: row.original.id,
                    });
                  }
                }}
              />
            </div>
          );
        },
      },
    ],
    [
      pieceSet,
      isAssigning,
      isRemoving,
      assignProjects,
      removeProject,
      isAssignedToThisSet,
      getPieceSetName,
    ],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <DataTable
      emptyStateTextTitle={t('No projects found')}
      emptyStateTextDescription={t('No projects exist on this platform yet')}
      emptyStateIcon={<Users className="size-14" />}
      columns={columns}
      filters={[
        {
          type: 'input',
          title: t('Project Name'),
          accessorKey: 'displayName',
          icon: CheckIcon,
        },
        {
          type: 'select',
          title: t('Status'),
          accessorKey: 'status',
          options: [
            { label: t('Assigned'), value: 'assigned' },
            { label: t('Not assigned'), value: 'unassigned' },
          ],
        },
      ]}
      page={{
        data: allProjects,
        next: null,
        previous: null,
      }}
      isLoading={isLoading}
      hidePagination={true}
      clientFiltering={true}
      selectColumn={true}
      bulkActions={[
        {
          render: (selectedRows, resetSelection) => (
            <BulkProjectActions
              pieceSet={pieceSet}
              selectedProjects={selectedRows}
              resetSelection={resetSelection}
            />
          ),
        },
      ]}
    />
  );
};
