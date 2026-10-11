import { ProjectType, ProjectWithLimits } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { CheckIcon, Package, Pencil, Trash, UserCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { platformApi } from '@/api/platforms-api';
import {
  AdminDataTable,
  AdminPage,
  AdminPageHeader,
  ConfirmDialog,
  adminBulk,
  InstantSwitch,
  SettingsPanel,
  SettingsRow,
  adminActionCopy,
  adminPageResources,
  useAdminAction,
} from '@/app/components/admin';
import { RowDataWithActions, BulkAction } from '@/components/custom/data-table';
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
import { PlatformAdminProjectAlertSubscriptionBulkActions } from '@/features/projects/components/platform-admin-project-alert-subscription-bulk-actions';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { formatUtils } from '@/lib/format-utils';
import { mutationFeedback } from '@/lib/mutation-feedback';
import { validationUtils } from '@/lib/validation-utils';

import { projectsTableColumns } from './columns';

export default function ProjectsPage() {
  const { platform, setCurrentPlatform } = platformHooks.useCurrentPlatform();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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

  const setAutoCreatePersonalProjects = async (
    autoCreatePersonalProjects: boolean,
  ) => {
    const updatedPlatform = await platformApi.update(
      { autoCreatePersonalProjects },
      platform.id,
    );
    setCurrentPlatform(queryClient, updatedPlatform);
  };

  const deleteProjects = useAdminAction<ProjectWithLimits[]>({
    verb: 'delete',
    name: (projects) => projectsLabel(projects),
    run: async (projects) => {
      try {
        await adminBulk.runEach({
          items: projects,
          run: (project) => projectCollectionUtils.delete([project.id]),
          verb: 'delete',
          label: (count) =>
            t('{count, plural, =1 {# project} other {# projects}}', { count }),
          describe: deleteErrorMessage,
        });
      } finally {
        await projectCollectionUtils.refetchProjects();
      }
    },
    handleError: (error) => {
      const description = deleteErrorMessage(error);
      if (description === undefined) {
        return false;
      }
      mutationFeedback.error({
        error,
        title: adminActionCopy.failed({ verb: 'delete', name: t('projects') }),
        description,
      });
      return true;
    },
  });

  const [selectedRows, setSelectedRows] = useState<ProjectWithLimits[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDialogProjectId, setEditDialogProjectId] = useState<string>('');
  const editDialogProject = allProjects.find(
    (project) => project.id === editDialogProjectId,
  );
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
        const isDisabled = isCurrentProject;
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
                  : t(
                      "Personal projects cannot be deleted, and you can't subscribe to their alerts",
                    )}
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
        ) => (
          <PlatformAdminProjectAlertSubscriptionBulkActions
            selectedProjects={selectedRows}
            resetSelection={() => {
              resetSelection();
              setSelectedRows([]);
            }}
          />
        ),
      },
      {
        render: (
          _: RowDataWithActions<ProjectWithLimits>[],
          resetSelection: () => void,
        ) => {
          const deletableProjects = selectedRows.filter(
            (row) => row.id !== currentProject?.id,
          );
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <ConfirmDialog
                title={t('Delete {name}?', {
                  name: projectsLabel(deletableProjects),
                })}
                description={t(
                  'The selected projects and all their data will be permanently deleted.',
                )}
                consequence={
                  deletableProjects.length < selectedRows.length
                    ? t(
                        "The project you're in stays. Switch to another project to delete it.",
                      )
                    : undefined
                }
                confirmLabel={t('Delete')}
                typeToConfirm={projectsLabel(deletableProjects)}
                controlId={AdminControl.PROJECTS_DELETE_CONFIRM}
                onConfirm={async () => {
                  await deleteProjects
                    .mutateAsync(deletableProjects)
                    .catch((error: unknown) => {
                      setSelectedRows(
                        adminBulk.remainingAfter({
                          error,
                          items: selectedRows,
                        }),
                      );
                      throw error;
                    });
                  resetSelection();
                  setSelectedRows([]);
                }}
              >
                {selectedRows.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger-11 hover:text-danger-11"
                    disabled={deletableProjects.length === 0}
                    {...adminControl(AdminControl.PROJECTS_DELETE_OPEN)}
                  >
                    <Trash className="mr-1 w-4" />
                    {`${t('Delete')} (${selectedRows.length})`}
                  </Button>
                )}
              </ConfirmDialog>
            </div>
          );
        },
      },
    ],
    [selectedRows, currentProject, deleteProjects],
  );

  const actions = [
    (row: ProjectWithLimits) => {
      return (
        <div className="flex items-end justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                {...adminControl(AdminControl.PROJECTS_EDIT_OPEN)}
                onClick={async (e) => {
                  e.stopPropagation();
                  e.preventDefault();
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
    <AdminPage>
      <AdminPageHeader
        title={t('Projects')}
        description={t('Manage your automation projects')}
        resources={adminPageResources.projects}
      >
        <CreateProjectButton variant="full" projects={allProjects} />
      </AdminPageHeader>
      <SettingsPanel flush>
        <SettingsRow
          icon={<UserCircle />}
          title={t('Automatic personal project creation')}
          description={t(
            'Create a personal project for every new user on signup. Turn off if you provision users into team projects manually (e.g. via SSO or SCIM).',
          )}
        >
          <InstantSwitch
            aria-label={t('Automatic personal project creation')}
            checked={platform.autoCreatePersonalProjects}
            onCheckedChange={setAutoCreatePersonalProjects}
            undo
            successMessage={(on) =>
              on
                ? t('Automatic personal projects turned on')
                : t('Automatic personal projects turned off')
            }
            controlId={AdminControl.PROJECTS_AUTO_PERSONAL_TOGGLE}
          />
        </SettingsRow>
      </SettingsPanel>
      <AdminDataTable
        emptyStateTextTitle={t('No projects found')}
        emptyStateTextDescription={t(
          'Start by creating projects to manage your automation teams',
        )}
        emptyStateIcon={<Package />}
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
        isError={false}
        errorStateEntity={t('projects')}
        clientPagination={true}
        bulkActions={bulkActions}
        actions={actions}
      />
      <EditProjectDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
        }}
        initialValues={
          editDialogProject && {
            projectName: editDialogProject.displayName,
            externalId: editDialogProject.externalId ?? undefined,
            sensitive: editDialogProject.sensitive,
          }
        }
        projectId={editDialogProjectId}
      />
    </AdminPage>
  );
}

function projectsLabel(projects: ProjectWithLimits[]): string {
  return projects.length === 1
    ? projects[0].displayName
    : t('{count, plural, =1 {# project} other {# projects}}', {
        count: projects.length,
      });
}

function deleteErrorMessage(error: unknown): string | undefined {
  if (!validationUtils.isValidationError(error)) {
    return undefined;
  }
  switch (error.response?.data?.params?.message) {
    case 'PROJECT_HAS_ENABLED_FLOWS':
      return t('Project has enabled flows. Please disable them first.');
    case 'ACTIVE_PROJECT':
      return t(
        'This project is active. Please switch to another project first.',
      );
    default:
      return undefined;
  }
}
