import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Ellipsis, User } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { LockedFeatureGuard } from '@/app/components/locked-feature-guard';
import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
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
import { projectRoleApi } from '@/features/platform-admin/lib/project-role-api';
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
    enabled: platform.plan.projectRolesEnabled && !isNil(projectRoleId),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['users-with-project-roles', projectRoleId],
    queryFn: () => {
      const cursor = searchParams.get('cursor');
      const limit = searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : 10;
      return projectRoleApi.listProjectMembers(projectRoleId!, {
        cursor: cursor ?? undefined,
        limit: limit,
      });
    },
    enabled: platform.plan.projectRolesEnabled,
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
      locked={!platform.plan.projectRolesEnabled}
      lockTitle={t('Project Role Management')}
      lockDescription={t(
        'Define custom roles and permissions to control what your team members can access and modify',
      )}
      lockVideoUrl="https://cdn.activepieces.com/videos/showcase/roles.mp4"
    >
      <div className="flex-colw-full">
        <DashboardPageHeader
          title={`${projectRole?.name} ${t('Role')} ${t('Users')}`}
          description={t('View the users assigned to this role')}
        />
        <Breadcrumb className="mb-4">
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
              {!isNil(projectRole?.name) ? (
                <BreadcrumbPage>{projectRole?.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbPage>
                  <Ellipsis className="text-muted-foreground" />
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <DataTable
          emptyStateTextTitle={t('No users found')}
          emptyStateTextDescription={t(
            'Starting by assigning users to this role',
          )}
          emptyStateIcon={<User className="size-14" />}
          columns={columns}
          page={data}
          isLoading={isLoading || isProjectRoleLoading}
        />
      </div>
    </LockedFeatureGuard>
  );
};
