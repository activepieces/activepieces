import { isNil } from '@activepieces/core-utils';
import { PlatformRole, ProjectType } from '@activepieces/shared';
import { t } from 'i18next';
import { FolderOpen } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { projectCollectionUtils } from '@/features/projects/stores/project-collection';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';

export function DefaultProjectsNote({
  invitedProjectId,
}: DefaultProjectsNoteProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const platformRole = userHooks.getCurrentUserPlatformRole();
  const { activeDefaultProjectIds } = platformHooks.useNewMemberSettings();
  const { data: teamProjects } = projectCollectionUtils.useAllPlatformProjects({
    type: [ProjectType.TEAM],
  });

  const defaultProjects = teamProjects.filter(
    (project) =>
      activeDefaultProjectIds.includes(project.id) &&
      (isNil(invitedProjectId) || project.id !== invitedProjectId),
  );

  if (
    !platform.plan.projectRolesEnabled ||
    platformRole !== PlatformRole.ADMIN ||
    defaultProjects.length === 0
  ) {
    return null;
  }

  const shownNames = defaultProjects
    .slice(0, MAX_SHOWN_PROJECTS)
    .map((project) => project.displayName)
    .join(', ');
  const hiddenCount = defaultProjects.length - MAX_SHOWN_PROJECTS;
  const hiddenNames = defaultProjects
    .slice(MAX_SHOWN_PROJECTS)
    .map((project) => project.displayName)
    .join(', ');

  return (
    <div className="flex min-w-0 items-start gap-2 rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
      <FolderOpen className="mt-px size-3.5 shrink-0" />
      <p className="min-w-0 line-clamp-2">
        {t('All new members also join these default projects as Editors:')}{' '}
        <span className="font-medium text-foreground">{shownNames}</span>
        {hiddenCount > 0 && (
          <>
            {' '}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-default underline decoration-dotted underline-offset-4">
                  {t('moreProjectsCount', { count: hiddenCount })}
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-64">
                {hiddenNames}
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </p>
    </div>
  );
}

const MAX_SHOWN_PROJECTS = 3;

type DefaultProjectsNoteProps = {
  invitedProjectId?: string;
};
