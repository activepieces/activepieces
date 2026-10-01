import {
  ProjectType,
  ProjectWithLimits,
  UserWithMetaInformation,
} from '@activepieces/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { ArrowRightLeft, Folder, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { platformApi } from '@/api/platforms-api';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import {
  BulkAction,
  DataTable,
  RowDataWithActions,
} from '@/components/custom/data-table';
import { Page, PageHeader, Toolbar } from '@/components/custom/page';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { SearchInput } from '@/components/custom/search-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyMedia } from '@/components/ui/empty';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { platformUserHooks } from '@/features/platform-admin/hooks/platform-user-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { validationUtils } from '@/lib/validation-utils';

import { ProjectRow, projectsTableColumns } from './columns';

export default function ProjectsPage() {
  const { platform, setCurrentPlatform } = platformHooks.useCurrentPlatform();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { project: currentProject } =
    projectCollectionUtils.useCurrentProject();

  const search = searchParams.get('displayName') ?? '';
  const typeFilter = toTypeFilter(searchParams.get('type'));

  const { data: allProjects } = projectCollectionUtils.useAllPlatformProjects();
  const { data: usersPage } = platformUserHooks.useUsers();

  const {
    mutate: toggleAutoCreatePersonalProjects,
    isPending: isAutoCreatePersonalProjectsPending,
  } = useMutation({
    mutationFn: (autoCreatePersonalProjects: boolean) =>
      platformApi.update({ autoCreatePersonalProjects }, platform.id),
    onSuccess: (updatedPlatform) => {
      setCurrentPlatform(queryClient, updatedPlatform);
      toast.success(t('Automatic personal project creation updated'), {
        duration: 3000,
      });
    },
    onError: () => {
      toast.error(t('Failed to save changes. Please try again.'));
    },
  });

  const [selectedRows, setSelectedRows] = useState<ProjectWithLimits[]>([]);
  const [editing, setEditing] = useState<ProjectWithLimits | null>(null);
  const { data: allGlobalConnectionsPage } =
    globalConnectionsQueries.useGlobalConnections({
      request: { limit: 9999 },
      extraKeys: [],
    });

  const ownerNames = useMemo(
    () => namesById({ users: usersPage?.data ?? [] }),
    [usersPage?.data],
  );

  const counts = useMemo(
    () => ({
      team: allProjects.filter((p) => p.type === ProjectType.TEAM).length,
      personal: allProjects.filter((p) => p.type === ProjectType.PERSONAL)
        .length,
    }),
    [allProjects],
  );

  const rows: ProjectRow[] = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allProjects
      .filter((project) => typeFilter === 'ALL' || project.type === typeFilter)
      .map((project) => ({
        ...project,
        ownerName: ownerNames.get(project.ownerId),
        globalConnectionsCount:
          allGlobalConnectionsPage?.data?.filter((connection) =>
            connection.projectIds.includes(project.id),
          ).length ?? 0,
      }))
      .filter(
        (project) =>
          query.length === 0 ||
          project.displayName.toLowerCase().includes(query) ||
          (project.ownerName ?? '').toLowerCase().includes(query) ||
          (project.externalId ?? '').toLowerCase().includes(query),
      );
  }, [allProjects, typeFilter, search, ownerNames, allGlobalConnectionsPage]);

  const setParam = ({ key, value }: { key: string; value: string | null }) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === null || value.length === 0) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
        next.delete('cursor');
        return next;
      },
      { replace: true },
    );
  };

  const columns = useMemo(() => projectsTableColumns({ platform }), [platform]);

  const columnsWithCheckbox: ColumnDef<RowDataWithActions<ProjectRow>>[] = [
    {
      id: 'select',
      accessorKey: 'select',
      size: 44,
      minSize: 44,
      maxSize: 44,
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
            aria-label={t('Select all projects')}
            checked={
              allSelectableSelected
                ? true
                : someSelectableSelected
                ? 'indeterminate'
                : false
            }
            onCheckedChange={(value) => {
              const isChecked = !!value;
              selectableRows.forEach((row) => row.toggleSelected(isChecked));
              if (isChecked) {
                const uniqueRows = Array.from(
                  new Map(
                    [
                      ...selectableRows.map((row) => row.original),
                      ...selectedRows,
                    ].map((item) => [item.id, item]),
                  ).values(),
                );
                setSelectedRows(uniqueRows);
              } else {
                setSelectedRows(
                  selectedRows.filter(
                    (row) =>
                      !selectableRows.some((r) => r.original.id === row.id),
                  ),
                );
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
        const checkbox = (
          <Checkbox
            aria-label={t('Select {name}', { name: row.original.displayName })}
            checked={isChecked}
            disabled={isCurrentProject}
            onCheckedChange={(value) => {
              if (isCurrentProject) return;
              const nextChecked = !!value;
              setSelectedRows(
                nextChecked
                  ? [
                      ...selectedRows.filter((r) => r.id !== row.original.id),
                      row.original,
                    ]
                  : selectedRows.filter((r) => r.id !== row.original.id),
              );
              row.toggleSelected(nextChecked);
            }}
          />
        );
        if (!isCurrentProject) {
          return <div className="flex items-center">{checkbox}</div>;
        }
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex cursor-not-allowed items-center">
                {checkbox}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              {t('You are in this project. Switch to another first.')}
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    ...columns,
  ];

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

  const bulkActions: BulkAction<ProjectRow>[] = [
    {
      render: (_, resetSelection) => (
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
      render: (_, resetSelection) => {
        const canDeleteAny = selectedRows.some(
          (row) => row.id !== currentProject?.id,
        );
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <ConfirmDialog
              title={t('deleteProjectsTitle', {
                count: selectedRows.length,
              })}
              description={t(
                'The selected projects and all their data will be permanently deleted.',
              )}
              confirmLabel={t('Delete')}
              typeToConfirm={
                selectedRows.length === 1
                  ? selectedRows[0].displayName
                  : t('delete')
              }
              onConfirm={async () => {
                const deletableProjects = selectedRows.filter(
                  (row) => row.id !== currentProject?.id,
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
                  className="text-danger-11 hover:text-danger-11"
                  disabled={!canDeleteAny}
                >
                  <Trash2 />
                  {`${t('Delete')} (${selectedRows.length})`}
                </Button>
              )}
            </ConfirmDialog>
          </div>
        );
      },
    },
  ];

  const switchInto = async (project: ProjectWithLimits) => {
    await projectCollectionUtils.setCurrentProject(project.id);
    navigate('/');
  };

  const actions = [
    (row: ProjectWithLimits) => (
      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t('Project actions')}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => switchInto(row)}>
              <ArrowRightLeft />
              {t('Switch into project')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setEditing(row)}>
              <Pencil />
              {t('Edit project')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  ];

  const noMatches = rows.length === 0 && allProjects.length > 0;

  return (
    <Page>
      <PageHeader
        title={t('Projects')}
        description={t(
          "Every team's workspace on the platform, with its own flows, connections and members.",
        )}
      >
        <CreateProjectButton variant="full" projects={allProjects} />
      </PageHeader>
      <Toolbar>
        <div className="min-w-64 flex-1">
          <SearchInput
            value={search}
            onChange={(value) => setParam({ key: 'displayName', value })}
            placeholder={t('Search by name, owner or external ID')}
          />
        </div>
        <Tabs
          value={typeFilter}
          onValueChange={(value) =>
            setParam({
              key: 'type',
              value: value === ProjectType.TEAM ? null : value,
            })
          }
        >
          <TabsList>
            <TabsTrigger value={ProjectType.TEAM}>
              {t('Team')}
              <span className="text-gray-11 tabular-nums">{counts.team}</span>
            </TabsTrigger>
            <TabsTrigger value={ProjectType.PERSONAL}>
              {t('Personal')}
              <span className="text-gray-11 tabular-nums">
                {counts.personal}
              </span>
            </TabsTrigger>
            <TabsTrigger value="ALL">{t('All')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </Toolbar>
      <DataTable
        emptyStateTextTitle={noMatches ? t('No projects match') : t('No projects yet')}
        emptyStateTextDescription={
          noMatches
            ? t('Try a different name or another project type.')
            : t(
                "A project is one team's workspace. Everything a team builds stays inside it.",
              )
        }
        emptyStateIcon={
          <EmptyMedia variant="icon">
            <Folder />
          </EmptyMedia>
        }
        onRowClick={(project) => switchInto(project)}
        columns={columnsWithCheckbox}
        page={{ data: rows, next: null, previous: null }}
        isLoading={false}
        isError={false}
        errorStateEntity={t('projects')}
        clientPagination={true}
        hidePagination={rows.length <= 10}
        bulkActions={bulkActions}
        actions={actions}
      />
      <Panel flush>
        <SettingRows>
          <SettingRow
            title={t('Automatic personal project creation')}
            description={t(
              'Give every new user a personal project when they sign up. Turn off if you add people to team projects yourself, for example through SSO.',
            )}
          >
            <Switch
              checked={platform.autoCreatePersonalProjects}
              onCheckedChange={(checked) =>
                toggleAutoCreatePersonalProjects(checked)
              }
              disabled={isAutoCreatePersonalProjectsPending}
            />
          </SettingRow>
        </SettingRows>
      </Panel>
      <EditProjectDialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        initialValues={
          editing
            ? { projectName: editing.displayName, sensitive: editing.sensitive }
            : undefined
        }
        projectId={editing?.id ?? ''}
      />
    </Page>
  );
}

function toTypeFilter(value: string | null): TypeFilter {
  if (value === ProjectType.PERSONAL || value === 'ALL') {
    return value;
  }
  return ProjectType.TEAM;
}

function namesById({
  users,
}: {
  users: UserWithMetaInformation[];
}): Map<string, string> {
  return new Map(
    users.map((user) => [
      user.id,
      `${user.firstName} ${user.lastName}`.trim() || user.email,
    ]),
  );
}

type TypeFilter = ProjectType | 'ALL';
