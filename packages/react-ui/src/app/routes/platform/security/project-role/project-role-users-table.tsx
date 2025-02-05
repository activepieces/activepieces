import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { LockedFeatureGuard } from '@/app/components/locked-feature-guard';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { TableTitle } from '@/components/ui/table-title';
import { projectRoleApi } from '@/features/platform-admin-panel/lib/project-role-api';
import { platformProjectMembersApi } from '@/features/team/lib/platform-project-members-api';
import { platformHooks } from '@/hooks/platform-hooks';
import { ProjectMemberWithUser } from '@activepieces/ee-shared';
import { assertNotNullOrUndefined, isNil } from '@activepieces/shared';

export const ProjectRoleUsersTable = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { projectRoleId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { data: projectRole, isLoading: isProjectRoleLoading } = useQuery({
    queryKey: ['project-role', projectRoleId],
    queryFn: () => {
      assertNotNullOrUndefined(projectRoleId, 'projectRoleId is required');
      return projectRoleApi.get(projectRoleId);
    },
    enabled: platform.projectRolesEnabled && !isNil(projectRoleId),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['users-with-project-roles', projectRoleId],
    queryFn: () => {
      const cursor = searchParams.get('cursor');
      const limit = searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : 10;
      return platformProjectMembersApi.list({
        projectRoleId: projectRoleId,
        cursor: cursor ?? undefined,
        limit: limit,
      });
    },
    enabled: platform.projectRolesEnabled,
  });

  const columns: ColumnDef<RowDataWithActions<ProjectMemberWithUser>>[] = [
    {
      accessorKey: 'email',
      accessorFn: (row) => row.user.email,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Email')} />
      ),
      cell: ({ row }) => (
        <div className="text-left">{row.original.user.email}</div>
      ),
    },
    {
      accessorKey: 'project',
      accessorFn: (row) => row.project.displayName,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Project')} />
      ),
      cell: ({ row }) => (
        <div
          className="text-left cursor-pointer hover:underline hover:text-primary"
          onClick={() => {
            navigate(`/projects/${row.original.project.id}/settings/team`);
          }}
        >
          {row.original.project.displayName}
        </div>
      ),
    },
    {
      accessorKey: 'projectRole',
      accessorFn: (row) => row.projectRole.name,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('First Name')}
          className="text-center"
        />
      ),
      cell: ({ row }) => (
        <div className="text-left">{row.original.projectRole.name}</div>
      ),
    },
    {
      accessorKey: 'lastName',
      accessorFn: (row) => row.user.lastName,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Last Name')} />
      ),
      cell: ({ row }) => (
        <div className="text-left">{row.original.user.lastName}</div>
      ),
    },
  ];

  return (
    <LockedFeatureGuard
      featureKey="TEAM"
      locked={!platform.projectRolesEnabled}
      lockTitle={t('Project Role Management')}
      lockDescription={t(
        'Define custom roles and permissions to control what your team members can access and modify',
      )}
      lockVideoUrl="https://cdn.activepieces.com/videos/showcase/roles.mp4"
    >
      <div className="flex-col w-full">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() => navigate('/platform/security/project-roles')}
                    className="cursor-pointer hover:text-primary hover:underline"
                  >
                    {t('Roles')}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{projectRole?.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <TableTitle>{`${projectRole?.name} ${t('Role')} ${t(
              'Users',
            )}`}</TableTitle>
            <div className="text-sm text-muted-foreground">
              {t('View the users assigned to this role')}
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          page={data}
          isLoading={isLoading || isProjectRoleLoading}
        />
      </div>
    </LockedFeatureGuard>
  );
};
