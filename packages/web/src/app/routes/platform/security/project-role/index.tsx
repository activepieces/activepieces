import { t } from 'i18next';

import { CenteredPage } from '@/app/components/centered-page';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { PlusIcon } from '@/components/icons/plus';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { projectRoleQueries } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';

import { ProjectRoleDialog } from './project-role-dialog';
import { ProjectRolesTable } from './project-roles-table';

const ProjectRolePage = () => {
  const { platform } = platformHooks.useCurrentPlatform();

  const { data, isLoading, refetch } = projectRoleQueries.useProjectRoles(platform.plan.projectRolesEnabled);

  const newRoleButton = !platform.plan.customRolesEnabled ? (
    <Tooltip>
      <TooltipTrigger>
        <AnimatedIconButton icon={PlusIcon} iconSize={16} size="sm" disabled>
          {t('New Role')}
        </AnimatedIconButton>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {t('Contact sales to unlock custom roles')}
      </TooltipContent>
    </Tooltip>
  ) : (
    <ProjectRoleDialog
      mode="create"
      onSave={() => refetch()}
      platformId={platform.id}
    >
      <AnimatedIconButton icon={PlusIcon} iconSize={16} size="sm">
        {t('New Role')}
      </AnimatedIconButton>
    </ProjectRoleDialog>
  );

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
      <CenteredPage
        title={t('Project Role Management')}
        description={t(
          'Define custom roles and permissions that can be assigned to your team members',
        )}
        actions={newRoleButton}
      >
        <ProjectRolesTable
          projectRoles={data}
          isLoading={isLoading}
          refetch={refetch}
        />
      </CenteredPage>
    </LockedFeatureGuard>
  );
};

ProjectRolePage.displayName = 'ProjectRolePage';
export { ProjectRolePage };
