import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import {
  Breadcrumb,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbItem,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { TableTitle } from '@/components/ui/table-title';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { projectRoleApi } from '@/features/platform-admin-panel/lib/project-role-api';
import { platformHooks } from '@/hooks/platform-hooks';
import { platformUserApi } from '@/lib/platform-user-api';
import { isNil, ProjectRole } from '@activepieces/shared';

import { ProjectRoleDialog } from './project-role-dialog';
import { ProjectRoleUsersTable } from './project-role-users-table';
import { ProjectRolesTable } from './project-roles-table';

const ProjectRolePage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const [selectedProjectRole, setSelectedProjectRole] =
    useState<ProjectRole | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['project-roles'],
    queryFn: () => projectRoleApi.list(),
    enabled: platform.projectRolesEnabled,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => platformUserApi.list(),
    enabled: platform.projectRolesEnabled,
  });

  const { data: usersWithProjectRoles } = useQuery({
    queryKey: ['users-with-project-roles'],
    queryFn: () =>
      projectRoleApi.listUsersWithProjectRoles({
        user:
          users?.data.map((user) => ({ id: user.id, email: user.email })) ?? [],
      }),
    enabled: platform.projectRolesEnabled && !isNil(users),
  });

  const filterUsersByProjectRole = () => {
    if (isNil(selectedProjectRole)) {
      return [];
    }
    return (
      usersWithProjectRoles?.filter(
        (userWithProjectRole) =>
          userWithProjectRole.projectRole.id === selectedProjectRole?.id,
      ) ?? []
    );
  };

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
            {isNil(selectedProjectRole) && (
              <>
                <TableTitle>{t('Project Role Management')}</TableTitle>
                <div className="text-sm text-muted-foreground">
                  {t(
                    'Define custom roles and permissions that can be assigned to your team members',
                  )}
                </div>
              </>
            )}
            {!isNil(selectedProjectRole) && (
              <>
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        onClick={() => setSelectedProjectRole(null)}
                        className="cursor-pointer hover:text-primary hover:underline"
                      >
                        {t('Roles')}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>
                        {selectedProjectRole?.name}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <TableTitle>{`${selectedProjectRole?.name} ${t('Role')} ${t(
                  'Users',
                )}`}</TableTitle>
                <div className="text-sm text-muted-foreground">
                  {t('View the users assigned to this role')}
                </div>
              </>
            )}
          </div>
          {!platform.customRolesEnabled && (
            <Tooltip>
              <TooltipTrigger>
                <Button size="sm" className="flex items-center gap-2" disabled>
                  <Plus className="size-4" />
                  {t('New Role')}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {t('Contact sales to unlock custom roles')}
              </TooltipContent>
            </Tooltip>
          )}
          {platform.customRolesEnabled && isNil(selectedProjectRole) && (
            <ProjectRoleDialog
              mode="create"
              onSave={() => refetch()}
              platformId={platform.id}
            >
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="size-4" />
                {t('New Role')}
              </Button>
            </ProjectRoleDialog>
          )}
        </div>

        {isNil(selectedProjectRole) && (
          <ProjectRolesTable
            projectRoles={data}
            isLoading={isLoading}
            setSelectedProjectRole={setSelectedProjectRole}
            refetch={refetch}
          />
        )}
        {!isNil(selectedProjectRole) && (
          <ProjectRoleUsersTable users={filterUsersByProjectRole()} />
        )}
      </div>
    </LockedFeatureGuard>
  );
};

ProjectRolePage.displayName = 'ProjectRolePage';
export { ProjectRolePage };
