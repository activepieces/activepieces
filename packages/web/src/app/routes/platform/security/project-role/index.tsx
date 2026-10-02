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
      description={t('What new members get, and what each role can do.')}
      widthClassName="max-w-4xl"
      className="min-h-full shrink-0 bg-muted/50 pb-16 dark:bg-background"
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
