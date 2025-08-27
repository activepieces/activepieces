import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { CheckIcon, Lock, Package, Pencil, Plus, Trash } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CURSOR_QUERY_PARAM,
  DataTable,
  LIMIT_QUERY_PARAM,
  RowDataWithActions,
  BulkAction,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { EditProjectDialog } from '@/features/projects/components/edit-project-dialog';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { projectApi } from '@/lib/project-api';
import { formatUtils, validationUtils } from '@/lib/utils';
import { isNil, ProjectWithLimits } from '@activepieces/shared';

import { NewProjectDialog } from './new-project-dialog';

const columns: ColumnDef<RowDataWithActions<ProjectWithLimits>>[] = [
  {
    accessorKey: 'displayName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Name')} />
    ),
    cell: ({ row }) => {
      const locked = row.original.plan.locked;

      return (
        <div className="text-left flex items-center justify-start ">
          {locked && <Lock className="size-3 mr-1.5" strokeWidth={2.5} />}
          {row.original.displayName}
        </div>
      );
    },
  },
  {
    accessorKey: 'tasks',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Used Tasks')} />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-left">
          {formatUtils.formatNumber(row.original.usage.tasks)} /{' '}
          {!isNil(row.original.plan.tasks)
            ? formatUtils.formatNumber(row.original.plan.tasks)
            : t('Unlimited')}
        </div>
      );
    },
  },
  {
    accessorKey: 'ai-tokens',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Used AI Credits')} />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-left">
          {formatUtils.formatNumber(row.original.usage.aiCredits)} /{' '}
          {!isNil(row.original.plan.aiCredits)
            ? formatUtils.formatNumber(row.original.plan.aiCredits)
            : '-'}
        </div>
      );
    },
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
          {formatUtils.formatDate(new Date(row.original.created))}
        </div>
      );
    },
  },
  {
    accessorKey: 'externalId',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('External ID')} />
    ),
    cell: ({ row }) => {
      const displayValue =
        isNil(row.original.externalId) || row.original.externalId?.length === 0
          ? '-'
          : row.original.externalId;
      return <div className="text-left">{displayValue}</div>;
    },
  },
];

export default function ProjectsPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setCurrentProject } = projectHooks.useCurrentProject();
  const navigate = useNavigate();
  const isEnabled = platform.plan.manageProjectsEnabled;
  const { data: currentProject } = projectHooks.useCurrentProject();

  const [searchParams] = useSearchParams();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['projects', searchParams.toString()],
    staleTime: 0,
    queryFn: () => {
      const cursor = searchParams.get(CURSOR_QUERY_PARAM);
      const limit = searchParams.get(LIMIT_QUERY_PARAM);
      const displayName = searchParams.get('displayName') ?? undefined;
      return projectApi.list({
        cursor: cursor ?? undefined,
        limit: limit ? parseInt(limit) : undefined,
        displayName,
      });
    },
  });

  const [selectedRows, setSelectedRows] = useState<ProjectWithLimits[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDialogInitialValues, setEditDialogInitialValues] =
    useState<any>(null);
  const [editDialogProjectId, setEditDialogProjectId] = useState<string>('');

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => projectApi.delete(id)));
    },
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast({
        title: t('Error'),
        description: errorToastMessage(error),
        duration: 3000,
      });
    },
  });

  const columnsWithCheckbox: ColumnDef<
    RowDataWithActions<ProjectWithLimits>
  >[] = [
    {
      id: 'select',
      header: ({ table }) => {
        const selectableRows = table
          .getRowModel()
          .rows.filter((row) => row.original.id !== currentProject?.id);
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
        const isChecked = selectedRows.some(
          (selectedRow) => selectedRow.id === row.original.id,
        );

        return (
          <Tooltip>
            <TooltipTrigger>
              <div className={isCurrentProject ? 'cursor-not-allowed' : ''}>
                <Checkbox
                  checked={isChecked}
                  disabled={isCurrentProject}
                  onCheckedChange={(value) => {
                    if (isCurrentProject) return;

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
            {isCurrentProject && (
              <TooltipContent side="right">
                {t(
                  'Cannot delete active project, switch to another project first',
                )}
              </TooltipContent>
            )}
          </Tooltip>
        );
      },
      accessorKey: 'select',
    },
    ...columns,
  ];

  const bulkActions: BulkAction<ProjectWithLimits>[] = useMemo(
    () => [
      {
        render: (_, resetSelection) => {
          const canDeleteAny = selectedRows.some(
            (row) => row.id !== currentProject?.id,
          );
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <ConfirmationDeleteDialog
                title={t('Delete Projects')}
                message={t(
                  'Are you sure you want to delete the selected projects?',
                )}
                entityName={t('Projects')}
                mutationFn={async () => {
                  const deletableProjects = selectedRows.filter(
                    (row) => row.id !== currentProject?.id,
                  );
                  await bulkDeleteMutation.mutateAsync(
                    deletableProjects.map((row) => row.id),
                  );
                  resetSelection();
                  setSelectedRows([]);
                }}
                onError={(error) => {
                  toast({
                    title: t('Error'),
                    description: errorToastMessage(error),
                    duration: 3000,
                  });
                }}
              >
                {selectedRows.length > 0 && (
                  <Button
                    className="w-full mr-2"
                    size="sm"
                    variant="destructive"
                    disabled={!canDeleteAny}
                  >
                    <Trash className="mr-2 w-4" />
                    {`${t('Delete')} (${selectedRows.length})`}
                  </Button>
                )}
              </ConfirmationDeleteDialog>
            </div>
          );
        },
      },
    ],
    [selectedRows, currentProject, bulkDeleteMutation],
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
                    tasks: row.plan?.tasks?.toString() ?? '',
                    aiCredits: row.plan?.aiCredits?.toString() ?? '',
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
        >
          <NewProjectDialog onCreate={() => refetch()}>
            <Button
              size="sm"
              className="flex items-center justify-center gap-2"
            >
              <Plus className="size-4" />
              {t('New Project')}
            </Button>
          </NewProjectDialog>
        </DashboardPageHeader>
        <DataTable
          emptyStateTextTitle={t('No projects found')}
          emptyStateTextDescription={t(
            'Start by creating projects to manage your automation teams',
          )}
          emptyStateIcon={<Package className="size-14" />}
          onRowClick={async (project) => {
            await setCurrentProject(queryClient, project);
            navigate('/');
          }}
          filters={[
            {
              type: 'input',
              title: t('Name'),
              accessorKey: 'displayName',
              options: [],
              icon: CheckIcon,
            },
          ]}
          columns={columnsWithCheckbox}
          page={data}
          isLoading={isLoading}
          bulkActions={bulkActions}
          actions={actions}
        />
        <EditProjectDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            refetch();
          }}
          initialValues={editDialogInitialValues}
          projectId={editDialogProjectId}
        />
      </div>
    </LockedFeatureGuard>
  );
}
