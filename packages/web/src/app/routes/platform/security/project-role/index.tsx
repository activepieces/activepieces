import { t } from 'i18next';

import {
  AdminPage,
  AdminPageHeader,
  adminPageResources,
} from '@/app/components/admin';
import { projectRoleQueries } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';

import { sampleData } from '../../sample-data';

import { DefaultProjectsSection } from './default-projects-section';
import { PersonalProjectsSection } from './personal-projects-section';
import { RolesCard } from './roles-card';

const ProjectRolePage = () => {
  const { platform } = platformHooks.useCurrentPlatform();

  const { data, isLoading, isError, refetch } =
    projectRoleQueries.useProjectRoles(platform.plan.projectRolesEnabled);
  const isSample = !platform.plan.projectRolesEnabled;
  const roles = isSample ? sampleData.projectRolesPage() : data;

  return (
    <AdminPage width="content">
      <AdminPageHeader
        title={t('Roles & Access')}
        description={t('Manage roles and where new members land')}
        resources={adminPageResources.roles}
      />
      <RolesCard
        projectRoles={roles}
        isLoading={isSample ? false : isLoading}
        isError={isSample ? false : isError}
        refetch={refetch}
      />
      <PersonalProjectsSection />
      <DefaultProjectsSection />
    </AdminPage>
  );
};

ProjectRolePage.displayName = 'ProjectRolePage';
export { ProjectRolePage };
