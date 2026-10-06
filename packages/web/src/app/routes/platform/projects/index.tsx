import { ProjectType, UserWithMetaInformation } from '@activepieces/shared';
import {
  ArrowUpRight01Icon,
  Delete02Icon,
  Folder01Icon,
  Notification01Icon,
  PencilEdit01Icon,
} from '@hugeicons/core-free-icons';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { AdminPageHeader } from '@/app/routes/platform/admin-page-header';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { BulkAction, DataTable } from '@/components/custom/data-table';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import {
  CountTabs,
  ListSearch,
  ListToolbar,
} from '@/components/custom/list/list-toolbar';
import { RowMenuItem } from '@/components/custom/list/row-menu';
import { useUrlParam } from '@/components/custom/list/use-url-param';
import { Page } from '@/components/custom/page';
import { Button } from '@/components/ui/button';
import { globalConnectionsQueries } from '@/features/connections';
import { platformUserHooks } from '@/features/platform-admin/hooks/platform-user-hooks';
import {
  CreateProjectButton,
  EditProjectDialog,
  projectCollectionUtils,
} from '@/features/projects';
import { PlatformAdminProjectAlertSubscriptionBulkActions } from '@/features/projects/components/platform-admin-project-alert-subscription-bulk-actions';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import {
  MUTATION_ERROR_TOAST_ID,
  mutationFeedback,
} from '@/lib/mutation-feedback';
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
  const { data: globalConnectionsPage } =
    globalConnectionsQueries.useGlobalConnections({
      request: { limit: GLOBAL_CONNECTIONS_LIMIT },
      extraKeys: ['projects-page'],
    });

  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ProjectRow | null>(null);
  const [deleting, setDeleting] = useState<ProjectRow[] | null>(null);
  const [skippedName, setSkippedName] = useState<string | null>(null);

  const ownerNames = useMemo(
    () => namesById({ users: usersPage?.data ?? [] }),
    [usersPage?.data],
  );
  const rows: ProjectRow[] = useMemo(
    () =>
      (data?.data ?? []).map((project) => ({
        ...project,
        ownerName: ownerNames.get(project.ownerId),
        globalConnectionsCount: (globalConnectionsPage?.data ?? []).filter(
          (connection) => connection.projectIds.includes(project.id),
        ).length,
      })),
    [data?.data, ownerNames, globalConnectionsPage?.data],
  );
  const openProject = rows.find((row) => row.id === openId) ?? null;

  const refresh = async () => {
    await refreshPlatformProjects(queryClient);
    await projectCollectionUtils.refetchProjects();
  };

  const switchInto = useCallback(
    async (project: ProjectRow) => {
      await projectCollectionUtils.setCurrentProject(project.id);
      navigate('/');
    },
    [navigate],
  );

  const menuItems = useCallback(
    (project: ProjectRow): RowMenuItem[] => [
      {
        label: t('Open project'),
        icon: ArrowUpRight01Icon,
        onSelect: () => switchInto(project),
      },
      {
        label: t('Edit'),
        icon: PencilEdit01Icon,
        control: AdminControl.PROJECTS_EDIT_OPEN,
        onSelect: () => setEditing(project),
      },
      {
        label: t('Alerts'),
        icon: Notification01Icon,
        onSelect: () => setOpenId(project.id),
      },
      {
        label: t('Delete'),
        icon: Delete02Icon,
        destructive: true,
        disabled: project.id === currentProjectId,
        disabledReason: t('You are in this project. Switch to another first.'),
        control: AdminControl.PROJECTS_DELETE_OPEN,
        onSelect: () => setDeleting([project]),
      },
    ],
    [currentProjectId, switchInto],
  );

  const columns = useMemo(
    () => projectsTableColumns({ menuItems }),
    [menuItems],
  );

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
      render: (selected) => {
        if (selected.length === 0) {
          return null;
        }
        const current = selected.find(
          (project) => project.id === currentProjectId,
        );
        const deletable = selected.filter(
          (project) => project.id !== currentProjectId,
        );
        return (
          <Button
            variant="ghost"
            size="sm"
            className="text-danger-11 hover:text-danger-11"
            disabled={deletable.length === 0}
            title={
              deletable.length === 0
                ? t('You are in this project. Switch to another first.')
                : undefined
            }
            {...adminControl(AdminControl.PROJECTS_DELETE_OPEN)}
            onClick={() => {
              setSkippedName(current?.displayName ?? null);
              setDeleting(deletable);
            }}
          >
            <HugeiconsIcon icon={Delete02Icon} />
            {t('Delete {count}', { count: deletable.length })}
          </Button>
        );
      },
    },
  ];

  const filtered = search.trim().length > 0;
  const deleteName =
    deleting && deleting.length === 1 ? deleting[0].displayName : null;

  return (
    <Page>
      <AdminPageHeader page="projects">
        <CreateProjectButton
          variant="full"
          projects={allProjects}
          onCreate={() => refresh()}
        />
      </AdminPageHeader>
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
        emptyStateIcon={<HugeiconsIcon icon={Folder01Icon} />}
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
        onClose={() => setEditing(null)}
        onSaved={() => refresh()}
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
          onOpenChange={(open) => {
            if (!open) {
              setDeleting(null);
              setSkippedName(null);
            }
          }}
          title={
            deleteName
              ? t('Delete {name}?', { name: deleteName })
              : t('deleteProjectsTitle', { count: deleting.length })
          }
          description={
            <>
              {deleting.length === 1
                ? t(
                    'Its flows, runs, connections and tables are deleted for good.',
                  )
                : t(
                    'Their flows, runs, connections and tables are deleted for good.',
                  )}
              {skippedName &&
                ` ${t("{name} is skipped because you're in it.", {
                  name: skippedName,
                })}`}
            </>
          }
          confirmLabel={t('Delete')}
          typeToConfirm={deleteName ?? t('delete')}
          onConfirm={async () => {
            const { deleted, failures } = await deleteProjects({
              projects: deleting,
            });
            if (deleted.some((project) => project.id === openId)) {
              setOpenId(null);
            }
            await refresh();
            reportDeleted({ deleted, failures });
          }}
          onError={(error) => {
            void refresh();
            showDeleteError({ error });
          }}
          controlId={AdminControl.PROJECTS_DELETE_CONFIRM}
        />
      )}
    </Page>
  );
}

async function deleteProjects({
  projects,
}: {
  projects: ProjectRow[];
}): Promise<DeleteOutcome> {
  const results = await Promise.allSettled(
    projects.map((project) => api.delete<void>(`/v1/projects/${project.id}`)),
  );
  const deleted = projects.filter(
    (_, index) => results[index].status === 'fulfilled',
  );
  const failures: unknown[] = results.flatMap((result) =>
    result.status === 'rejected' ? [result.reason] : [],
  );
  if (deleted.length === 0 && failures.length > 0) {
    throw failures[0];
  }
  return { deleted, failures };
}

function reportDeleted({ deleted, failures }: DeleteOutcome) {
  if (failures.length > 0) {
    toast.error(
      t('projectsDeletedWithFailures', {
        deleted: deleted.length,
        failed: failures.length,
      }),
      {
        id: MUTATION_ERROR_TOAST_ID,
        description: knownDeleteError({ error: failures[0] }),
      },
    );
    return;
  }
  toast.success(
    deleted.length === 1
      ? t('{name} deleted', { name: deleted[0].displayName })
      : t('projectsDeletedCount', { count: deleted.length }),
  );
}

function showDeleteError({ error }: { error: unknown }) {
  const known = knownDeleteError({ error });
  if (known === undefined) {
    mutationFeedback.error({ error, title: t("Couldn't delete project") });
    return;
  }
  mutationFeedback.markShown(error);
  toast.error(t("Couldn't delete project"), {
    id: MUTATION_ERROR_TOAST_ID,
    description: known,
  });
}

function knownDeleteError({ error }: { error: unknown }): string | undefined {
  if (validationUtils.isValidationError(error)) {
    switch (error.response?.data?.params?.message) {
      case 'PROJECT_HAS_ENABLED_FLOWS':
        return t('Turn off the flows in this project before deleting it.');
      case 'ACTIVE_PROJECT':
        return t('You are in this project. Switch to another first.');
    }
  }
  return undefined;
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
const GLOBAL_CONNECTIONS_LIMIT = 1000;
const PROJECT_TYPES = [ProjectType.TEAM, ProjectType.PERSONAL] as const;

type DeleteOutcome = {
  deleted: ProjectRow[];
  failures: unknown[];
};
