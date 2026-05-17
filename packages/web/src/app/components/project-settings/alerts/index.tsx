import { ProjectType } from '@activepieces/shared';

import { projectCollectionUtils } from '@/features/projects';

import { PersonalProjectAlerts } from './personal-project-alerts';
import { TeamProjectAlerts } from './team-project-alerts';

export const AlertsSettings = () => {
  const { project: currentProject } =
    projectCollectionUtils.useCurrentProject();

  if (currentProject?.type === ProjectType.PERSONAL) {
    return <PersonalProjectAlerts />;
  }

  return <TeamProjectAlerts />;
};
