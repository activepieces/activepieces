import { ProjectType, UserWithMetaInformation } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { ArrowUpRight, Bell, Folder, Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { BulkAction, DataTable } from '@/components/custom/data-table';
import {
  CountTabs,
  ListSearch,
  ListToolbar,
} from '@/components/custom/list/list-toolbar';
import { RowMenuItem } from '@/components/custom/list/row-menu';
import { useUrlParam } from '@/components/custom/list/use-url-param';
import { Page, PageHeader } from '@/components/custom/page';
import { Button } from '@/components/ui/button';
import { platformUserHooks } from '@/features/platform-admin/hooks/platform-user-hooks';
import {
  CreateProjectButton,
  EditProjectDialog,
  projectCollectionUtils,
} from '@/features/projects';
import { PlatformAdminProjectAlertSubscriptionBulkActions } from '@/features/projects/components/platform-admin-project-alert-subscription-bulk-actions';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { validationUtils } from '@/lib/validation-utils';

import { ProjectRow, projectsTableColumns } from './columns';
import { ProjectSheet } from './project-sheet';
import {
  refreshPlatformProjects,
  usePlatformProjects,
} from './use-platform-projects';

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const cursor = searchParams.get('cursor') ?? undefined;
  const limit = Number(searchParams.get('limit')) || DEFAULT_LIMIT;
  const [type, setType] = useUrlParam<ProjectType>({
    key: 'type',
    fallback: ProjectType.TEAM,
    allowed: PROJECT_TYPES,
  });
  const currentProjectId = authenticationSession.getProjectId();

  const { data, isLoading, isError, refetch } = usePlatformProjects({
    search,
    type,
    cursor,
    limit,
  });
  const { data: allProjects } = projectCollectionUtils.useAllPlatformProjects();
  const { data: usersPage } = platformUserHooks.useUsers();

  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ProjectRow | null>(null);
  const [deleting, setDeleting] = useState<ProjectRow[] | null>(null);

  const ownerNames = useMemo(
    () => namesById({ users: usersPage?.data ?? [] }),
    [usersPage?.data],
  );
  const rows: ProjectRow[] = useMemo(
    () =>
      (data?.data ?? []).map((project) => ({
        ...project,
        ownerName: ownerNames.get(project.ownerId),
      })),
    [data?.data, ownerNames],
  );
  const openProject = rows.find((row) => row.id === openId) ?? null;

  const refresh = async () => {
    await refreshPlatformProjects(queryClient);
    await projectCollectionUtils.refetchProjects();
  };

  const switchInto = async (project: ProjectRow) => {
    await projectCollectionUtils.setCurrentProject(project.id);
    navigate('/');
  };

  const menuItems = (project: ProjectRow): RowMenuItem[] => [
    {
      label: t('Open project'),
      icon: ArrowUpRight,
      onSelect: () => switchInto(project),
    },
    { label: t('Edit'), icon: Pencil, onSelect: () => setEditing(project) },
    { label: t('Alerts'), icon: Bell, onSelect: () => setOpenId(project.id) },
    {
      label: t('Delete'),
      icon: Trash2,
      destructive: true,
      disabled: project.id === currentProjectId,
      disabledReason: t('You are in this project. Switch to another first.'),
      onSelect: () => setDeleting([project]),
    },
  ];

  const columns = projectsTableColumns({ menuItems });

  const bulkActions: BulkAction<ProjectRow>[] = [
    {
      render: (selected, resetSelection) => (
        <PlatformAdminProjectAlertSubscriptionBulkActions
          selectedProjects={selected}
          resetSelection={resetSelection}
        />
      ),
    },
    {
      render: (selected) =>
        selected.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-danger-11 hover:text-danger-11"
            onClick={() => setDeleting(selected)}
          >
            <Trash2 />
            {t('Delete {count}', { count: selected.length })}
          </Button>
        ),
    },
  ];

  const filtered = search.trim().length > 0;
  const deleteName =
    deleting && deleting.length === 1 ? deleting[0].displayName : null;

  return (
    <Page>
      <PageHeader
        title={t('Projects')}
        description={t(
          "Every team's workspace on the platform, with its own flows, connections and members.",
        )}
      >
        <CreateProjectButton
          variant="full"
          projects={allProjects}
          onCreate={() => refresh()}
        />
      </PageHeader>
      <ListToolbar
        search={<ListSearch placeholder={t('Search by name')} />}
        tabs={
          <CountTabs
            value={type}
            onValueChange={setType}
            options={[
              { value: ProjectType.TEAM, label: t('Team') },
              { value: ProjectType.PERSONAL, label: t('Personal') },
            ]}
          />
        }
      />
      <DataTable
        emptyStateTextTitle={
          filtered ? t('No projects match') : t('No projects yet')
        }
        emptyStateTextDescription={
          filtered
            ? t('Try a different name or the other tab.')
            : t(
                "A project is one team's workspace. Everything a team builds stays inside it.",
              )
        }
        emptyStateIcon={<Folder />}
        emptyStateAction={
          filtered || type === ProjectType.PERSONAL ? undefined : (
            <CreateProjectButton
              variant="full"
              projects={allProjects}
              onCreate={() => refresh()}
            />
          )
        }
        columns={columns}
        page={data ? { ...data, data: rows } : undefined}
        onRowClick={(row) => setOpenId(row.id)}
        isLoading={isLoading}
        isError={isError}
        errorStateEntity={t('projects')}
        onRetry={refetch}
        selectColumn
        isRowSelectionDisabled={(row) => row.id === currentProjectId}
        bulkActions={bulkActions}
      />
      <ProjectSheet
        project={openProject}
        onOpenChange={(open) => !open && setOpenId(null)}
        onOpenProject={switchInto}
        onEdit={setEditing}
        onDelete={(project) => setDeleting([project])}
        onChanged={() => refresh()}
      />
      <EditProjectDialog
        open={editing !== null}
        onClose={() => {
          setEditing(null);
          refresh();
        }}
        initialValues={
          editing
            ? {
                projectName: editing.displayName,
                externalId: editing.externalId ?? undefined,
                sensitive: editing.sensitive,
              }
            : undefined
        }
        projectId={editing?.id ?? ''}
      />
      {deleting && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDeleting(null)}
          title={
            deleteName
              ? t('Delete {name}?', { name: deleteName })
              : t('deleteProjectsTitle', { count: deleting.length })
          }
          description={t(
            'Its flows, runs, connections and tables are deleted for good.',
          )}
          confirmLabel={t('Delete')}
          typeToConfirm={deleteName ?? t('delete')}
          onConfirm={async () => {
            for (const project of deleting) {
              await api.delete<void>(`/v1/projects/${project.id}`);
            }
            setOpenId(null);
            await refresh();
          }}
          onError={(error) => {
            refresh();
            toast.error(deleteErrorMessage({ error }));
          }}
        />
      )}
    </Page>
  );
}

function deleteErrorMessage({ error }: { error: unknown }): string {
  if (validationUtils.isValidationError(error)) {
    switch (error.response?.data?.params?.message) {
      case 'PROJECT_HAS_ENABLED_FLOWS':
        return t('Turn off the flows in this project before deleting it.');
      case 'ACTIVE_PROJECT':
        return t('You are in this project. Switch to another first.');
    }
  }
  return t('Could not delete the project. Try again.');
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

const DEFAULT_LIMIT = 10;
const PROJECT_TYPES = [ProjectType.TEAM, ProjectType.PERSONAL] as const;
