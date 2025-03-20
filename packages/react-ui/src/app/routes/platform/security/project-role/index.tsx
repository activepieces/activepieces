import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Plus } from 'lucide-react';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { Button } from '@/components/ui/button';
import { TableTitle } from '@/components/ui/table-title';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { projectRoleApi } from '@/features/platform-admin-panel/lib/project-role-api';
import { platformHooks } from '@/hooks/platform-hooks';

import { ProjectRoleDialog } from './project-role-dialog';
import { ProjectRolesTable } from './project-roles-table';

const ProjectRolePage = () => {
  const { platform } = platformHooks.useCurrentPlatform();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['project-roles'],
    queryFn: () => projectRoleApi.list(),
    enabled: platform.projectRolesEnabled,
  });

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
        <div className="flex items-center justify-between mb-4">
          <TableTitle
            description={t(
              'Define custom roles and permissions that can be assigned to your team members',
            )}
          >
            {t('Project Role Management')}
          </TableTitle>

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
          {platform.customRolesEnabled && (
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

        <ProjectRolesTable
          projectRoles={data}
          isLoading={isLoading}
          refetch={refetch}
        />
      </div>
    </LockedFeatureGuard>
  );
};

ProjectRolePage.displayName = 'ProjectRolePage';
export { ProjectRolePage };
