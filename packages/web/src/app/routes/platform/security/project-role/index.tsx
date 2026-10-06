import { t } from 'i18next';

import { CenteredPage } from '@/app/components/centered-page';
import { projectRoleQueries } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';

import { sampleData } from '../../sample-data';

import { RolesCard } from './roles-card';

const ProjectRolePage = () => {
  const { platform } = platformHooks.useCurrentPlatform();

  const { data, isLoading, isError, refetch } =
    projectRoleQueries.useProjectRoles(platform.plan.projectRolesEnabled);
  const isSample = !platform.plan.projectRolesEnabled;
  const roles = isSample ? sampleData.projectRolesPage() : data;

  return (
    <CenteredPage
      title={t('Roles & Access')}
      description={t(
        'Create roles and control what members can do in each project',
      )}
      widthClassName="max-w-4xl"
      className="min-h-full bg-gray-1"
    >
      <RolesCard
        projectRoles={roles}
        isLoading={isSample ? false : isLoading}
        isError={isSample ? false : isError}
        refetch={refetch}
      />
    </CenteredPage>
  );
};

ProjectRolePage.displayName = 'ProjectRolePage';
export { ProjectRolePage };
