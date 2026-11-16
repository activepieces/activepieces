import { isNil } from '@activepieces/core-utils';
import { ProjectType, ProjectWithLimits } from '@activepieces/shared';

import { platformHooks } from '@/hooks/platform-hooks';

export const useTeamProjectLimitGuard = ({
  projects,
}: {
  projects: Pick<ProjectWithLimits, 'type'>[];
}) => {
  const { platform } = platformHooks.useCurrentPlatform();

  const limit = platform.plan.billedTeamProjectsLimit;
  const teamProjectsUsed = projects.filter(
    (project) => project.type === ProjectType.TEAM,
  ).length;
  const hasReachedLimit = !isNil(limit) && teamProjectsUsed >= limit;

  return {
    hasReachedLimit,
    used: teamProjectsUsed,
    limit,
  };
};
