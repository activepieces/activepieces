import { isNil } from '@activepieces/core-utils';
import { PlatformRole } from '@activepieces/shared';
import { t } from 'i18next';
import { Link } from 'react-router-dom';

import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';

export function DefaultProjectsNote({
  invitedProjectId,
  includesPersonalProject,
  invitesSomeoneNew,
}: DefaultProjectsNoteProps) {
  const platformRole = userHooks.getCurrentUserPlatformRole();
  const { activeDefaultProjectIds, personalProjectsActive } =
    platformHooks.useNewMemberSettings();

  const joinsDefaultProjects =
    invitesSomeoneNew &&
    platformRole === PlatformRole.ADMIN &&
    activeDefaultProjectIds.some(
      (projectId) => isNil(invitedProjectId) || projectId !== invitedProjectId,
    );
  const getsPersonalProject = includesPersonalProject && personalProjectsActive;

  if (!joinsDefaultProjects) {
    return getsPersonalProject ? (
      <p className="text-xs text-gray-11">
        {t("They'll get a personal project to start in.")}
      </p>
    ) : null;
  }

  const [before, after] = t(
    getsPersonalProject
      ? 'inviteJoinsDefaultsAndPersonal'
      : 'inviteJoinsDefaults',
    { defaultProjects: LINK_PLACEHOLDER },
  ).split(LINK_PLACEHOLDER);

  return (
    <p className="text-xs text-gray-11">
      {before}
      <Link
        to={ROLES_AND_ACCESS_PATH}
        className="text-accent-11 underline-offset-4 hover:underline"
      >
        {t('default projects')}
      </Link>
      {after}
    </p>
  );
}

const LINK_PLACEHOLDER = '\u0000';
const ROLES_AND_ACCESS_PATH = '/platform/users/roles';

type DefaultProjectsNoteProps = {
  invitedProjectId?: string;
  includesPersonalProject: boolean;
  invitesSomeoneNew: boolean;
};
