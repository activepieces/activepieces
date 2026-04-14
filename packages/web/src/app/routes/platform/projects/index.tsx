import {
  ProjectType,
  ProjectWithLimits,
  TeamProjectsLimit,
} from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { CheckIcon, Package, Pencil, Trash } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import {
  DataTable,
  RowDataWithActions,
  BulkAction,
} from '@/components/custom/data-table';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { globalConnectionsQueries } from '@/features/connections';
import {
  CreateProjectButton,
  EditProjectDialog,
  projectCollectionUtils,
} from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/format-utils';
import { validationUtils } from '@/lib/validation-utils';

import { projectsTableColumns } from './columns';

export default function ProjectsPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isEnabled = platform.plan.teamProjectsLimit !== TeamProjectsLimit.NONE;
  const { project: currentProject } =
    projectCollectionUtils.useCurrentProject();

  useEffect(() => {
    if (!searchParams.has('type')) {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.set('type', ProjectType.TEAM);
          return newParams;
        },
        { replace: true },
      );
    }
  }, []);

  const displayNameFilter = searchParams.get('displayName') || undefined;
  const typeFilter = searchParams.getAll('type');

  const filters = useMemo(
    () => ({
      displayName: displayNameFilter,
      type:
        typeFilter.length > 0
          ? typeFilter.map((t) => t as ProjectType)
          : undefined,
    }),
    [displayNameFilter, typeFilter.join(',')],
  );

  const { data: allProjects } =
    projectCollectionUtils.useAllPlatformProjects(filters);

  const [selectedRows, setSelectedRows] = useState<ProjectWithLimits[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDialogInitialValues, setEditDialogInitialValues] =
    useState<any>(null);
  const [editDialogProjectId, setEditDialogProjectId] = useState<string>('');
  const { data: allGlobalConnectionsPage } =
    globalConnectionsQueries.useGlobalConnections({
      request: { limit: 9999 },
      extraKeys: [],
    });
  const allProjectsWithGlobalConnectionsCount = useMemo(() => {
    return allProjects.map((project) => ({
      ...project,
      globalConnectionsCount:
        allGlobalConnectionsPage?.data?.filter((connection) =>
          connection.projectIds.includes(project.id),
        ).length ?? 0,
    }));
  }, [allProjects, allGlobalConnectionsPage?.data]);
  const columns = useMemo(
    () =>
      projectsTableColumns({
        platform,
      }),
    [platform],
  );

  const columnsWithCheckbox: ColumnDef<
    RowDataWithActions<ProjectWithLimits & { globalConnectionsCount: number }>
  >[] = [
    {
      id: 'select',
      accessorKey: 'select',
      size: 40,
      minSize: 40,
      maxSize: 40,
      header: ({ table }) => {
        const selectableRows = table
          .getRowModel()
          .rows.filter(
            (row) =>
              row.original.id !== currentProject?.id &&
              row.original.type !== ProjectType.PERSONAL,
          );
        const allSelectableSelected =
          selectableRows.length > 0 &&
          selectableRows.every((row) => row.getIsSelected());
        const someSelectableSelected = selectableRows.some((row) =>
          row.getIsSelected(),
        );

        return (
          <Checkbox
            checked={allSelectableSelected || someSelectableSelected}
            onCheckedChange={(value) => {
              const isChecked = !!value;
              selectableRows.forEach((row) => row.toggleSelected(isChecked));

              if (isChecked) {
                const selectableProjects = selectableRows.map(
                  (row) => row.original,
                );
                const newSelectedRows = [
                  ...selectableProjects,
                  ...selectedRows,
                ];
                const uniqueRows = Array.from(
                  new Map(
                    newSelectedRows.map((item) => [item.id, item]),
                  ).values(),
                );
                setSelectedRows(uniqueRows);
              } else {
                const filteredRows = selectedRows.filter(
                  (row) =>
                    !selectableRows.some((r) => r.original.id === row.id),
                );
                setSelectedRows(filteredRows);
              }
            }}
          />
        );
      },
      cell: ({ row }) => {
        const isCurrentProject = row.original.id === currentProject?.id;
        const isPersonalProject = row.original.type === ProjectType.PERSONAL;
        const isDisabled = isCurrentProject || isPersonalProject;
        const isChecked = selectedRows.some(
          (selectedRow) => selectedRow.id === row.original.id,
        );

        return (
          <Tooltip>
            <TooltipTrigger>
              <div className={isDisabled ? 'cursor-not-allowed' : ''}>
                <Checkbox
                  checked={isChecked}
                  disabled={isDisabled}
                  onCheckedChange={(value) => {
                    if (isDisabled) return;

                    const isChecked = !!value;
                    let newSelectedRows = [...selectedRows];
                    if (isChecked) {
                      const exists = newSelectedRows.some(
                        (selectedRow) => selectedRow.id === row.original.id,
                      );
                      if (!exists) {
                        newSelectedRows.push(row.original);
                      }
                    } else {
                      newSelectedRows = newSelectedRows.filter(
                        (selectedRow) => selectedRow.id !== row.original.id,
                      );
                    }
                    setSelectedRows(newSelectedRows);
                    row.toggleSelected(!!value);
                  }}
                />
              </div>
            </TooltipTrigger>
            {isDisabled && (
              <TooltipContent side="right">
                {isCurrentProject
                  ? t(
                      'Cannot delete active project, switch to another project first',
                    )
                  : t('Personal projects cannot be deleted')}
              </TooltipContent>
            )}
          </Tooltip>
        );
      },
    },
    ...columns,
  ];

  const bulkActions: BulkAction<ProjectWithLimits>[] = useMemo(
    () => [
      {
        render: (
          _: RowDataWithActions<ProjectWithLimits>[],
          resetSelection: () => void,
        ) => {
          const canDeleteAny = selectedRows.some(
            (row) =>
              row.id !== currentProject?.id &&
              row.type !== ProjectType.PERSONAL,
          );
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <ConfirmationDeleteDialog
                title={t('Delete Projects')}
                message={t(
                  'The selected projects and all their data will be permanently deleted.',
                )}
                entityName={t('Projects')}
                buttonText={t('Delete')}
                mutationFn={async () => {
                  const deletableProjects = selectedRows.filter(
                    (row) =>
                      row.id !== currentProject?.id &&
                      row.type !== ProjectType.PERSONAL,
                  );
                  projectCollectionUtils.delete(
                    deletableProjects.map((row) => row.id),
                  );
                  resetSelection();
                  setSelectedRows([]);
                }}
                onError={(error) => {
                  toast.error(t('Error'), {
                    description: errorToastMessage(error),
                    duration: 3000,
                  });
                }}
              >
                {selectedRows.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={!canDeleteAny}
                  >
                    <Trash className="mr-1 w-4" />
                    {`${t('Delete')} (${selectedRows.length})`}
                  </Button>
                )}
              </ConfirmationDeleteDialog>
            </div>
          );
        },
      },
    ],
    [selectedRows, currentProject],
  );

  const toolbarButtons = useMemo(
    () => [
      <CreateProjectButton
        key="new-project"
        variant="full"
        projects={allProjects}
      />,
    ],
    [allProjects],
  );

  const errorToastMessage = (error: unknown): string | undefined => {
    if (validationUtils.isValidationError(error)) {
      console.error(t('Validation error'), error);
      switch (error.response?.data?.params?.message) {
        case 'PROJECT_HAS_ENABLED_FLOWS':
          return t('Project has enabled flows. Please disable them first.');
        case 'ACTIVE_PROJECT':
          return t(
            'This project is active. Please switch to another project first.',
          );
      }
      return undefined;
    }
  };

  const actions = [
    (row: ProjectWithLimits) => {
      return (
        <div className="flex items-end justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="size-8 p-0"
                onClick={async (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setEditDialogInitialValues({
                    projectName: row.displayName,
                  });
                  setEditDialogProjectId(row.id);
                  setEditDialogOpen(true);
                }}
              >
                <Pencil className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('Edit project')}</TooltipContent>
          </Tooltip>
        </div>
      );
    },
  ];

  return (
    <LockedFeatureGuard
      featureKey="PROJECTS"
      locked={!isEnabled}
      lockTitle={t('Unlock Projects')}
      lockDescription={t(
        'Orchestrate your automation teams across projects with their own flows, connections and usage quotas',
      )}
      lockVideoUrl="https://cdn.activepieces.com/videos/showcase/projects.mp4"
    >
      <div className="flex flex-col w-full">
        <DashboardPageHeader
          title={t('Projects')}
          description={t('Manage your automation projects')}
        />
        <DataTable
          emptyStateTextTitle={t('No projects found')}
          emptyStateTextDescription={t(
            'Start by creating projects to manage your automation teams',
          )}
          emptyStateIcon={<Package className="size-14" />}
          onRowClick={async (project) => {
            await projectCollectionUtils.setCurrentProject(project.id);
            navigate('/');
          }}
          filters={[
            {
              type: 'input',
              title: t('Name'),
              accessorKey: 'displayName',
              icon: CheckIcon,
            },
            {
              type: 'select',
              title: t('Type'),
              accessorKey: 'type',
              options: Object.values(ProjectType).map((type) => {
                return {
                  label:
                    formatUtils.convertEnumToHumanReadable(type) + ' Project',
                  value: type,
                };
              }),
              icon: CheckIcon,
            },
          ]}
          columns={columnsWithCheckbox}
          page={{
            data: allProjectsWithGlobalConnectionsCount,
            next: null,
            previous: null,
          }}
          isLoading={false}
          clientPagination={true}
          bulkActions={bulkActions}
          toolbarButtons={toolbarButtons}
          actions={actions}
        />
        <EditProjectDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
          }}
          initialValues={editDialogInitialValues}
          projectId={editDialogProjectId}
        />
      </div>
    </LockedFeatureGuard>
  );
}
