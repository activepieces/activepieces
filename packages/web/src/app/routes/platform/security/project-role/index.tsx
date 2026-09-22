import { t } from 'i18next';

import { CenteredPage } from '@/app/components/centered-page';
import { LockedFeatureGuard } from '@/app/components/locked-feature-guard';
import { projectRoleQueries } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';

import { RolesCard } from './roles-card';

const ProjectRolePage = () => {
  const { platform } = platformHooks.useCurrentPlatform();

  const { data, isLoading, isError, refetch } =
    projectRoleQueries.useProjectRoles(platform.plan.projectRolesEnabled);

  return (
    <LockedFeatureGuard
      featureKey="TEAM"
      locked={!platform.plan.projectRolesEnabled}
      lockTitle={t('Roles & Access')}
      lockDescription={t(
        'Define custom roles and permissions to control what your team members can access and modify',
      )}
      lockVideoUrl="https://cdn.activepieces.com/videos/showcase/roles.mp4"
    >
      <CenteredPage
        title={t('Roles & Access')}
        description={t('What new members get, and what each role can do.')}
        widthClassName="max-w-[70rem]"
      >
        <RolesCard
          projectRoles={data}
          isLoading={isLoading}
          isError={isError}
          refetch={refetch}
        />
      </CenteredPage>
    </LockedFeatureGuard>
  );
};

ProjectRolePage.displayName = 'ProjectRolePage';
export { ProjectRolePage };
