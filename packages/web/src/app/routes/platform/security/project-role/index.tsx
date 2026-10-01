import { t } from 'i18next';

import { Page, PageHeader } from '@/components/custom/page';
import { projectRoleQueries } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';

import { sampleData } from '../../sample-data';

import { NewRoleButton, RolesCard } from './roles-card';

const ProjectRolePage = () => {
  const { platform } = platformHooks.useCurrentPlatform();

  const { data, isLoading, isError, refetch } =
    projectRoleQueries.useProjectRoles(platform.plan.projectRolesEnabled);
  const isSample = !platform.plan.projectRolesEnabled;
  const roles = isSample ? sampleData.projectRolesPage() : data;

  return (
    <Page>
      <PageHeader
        title={t('Roles')}
        description={t(
          'What each role may do inside a project. Custom roles are for when a built-in one does not fit.',
        )}
      >
        <NewRoleButton refetch={refetch} />
      </PageHeader>
      <RolesCard
        projectRoles={roles}
        isLoading={isSample ? false : isLoading}
        isError={isSample ? false : isError}
        refetch={refetch}
      />
    </Page>
  );
};

ProjectRolePage.displayName = 'ProjectRolePage';
export { ProjectRolePage };
