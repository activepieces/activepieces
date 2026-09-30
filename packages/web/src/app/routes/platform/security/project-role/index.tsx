import { t } from 'i18next';

import { CenteredPage } from '@/app/components/centered-page';
import { projectRoleQueries } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';

import { sampleData } from '../../sample-data';

import { DefaultProjectsSection } from './default-projects-section';
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
      description={t('Manage roles and where new members land')}
      widthClassName="max-w-4xl"
      className="min-h-full shrink-0 bg-gray-1 pb-16"
    >
      <div className="flex flex-col gap-10">
        <RolesCard
          projectRoles={roles}
          isLoading={isSample ? false : isLoading}
          isError={isSample ? false : isError}
          refetch={refetch}
        />
        <DefaultProjectsSection />
      </div>
    </CenteredPage>
  );
};

ProjectRolePage.displayName = 'ProjectRolePage';
export { ProjectRolePage };
