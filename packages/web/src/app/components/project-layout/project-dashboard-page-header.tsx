import { isNil, Permission } from '@activepieces/core-utils';
import {
  ApFlagId,
  PlatformRole,
  ProjectType,
  UserStatus,
} from '@activepieces/shared';
import { t } from 'i18next';
import { UsersRound, Lock } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { PageHeader } from '@/components/custom/page';
import { SettingsIcon } from '@/components/icons/settings';
import { UserRoundPlusIcon } from '@/components/icons/user-round-plus';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { InviteUserDialog, projectMembersHooks } from '@/features/members';
import { getProjectName, projectCollectionUtils } from '@/features/projects';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';

import { ProjectSettingsDialog } from '../project-settings';

import {
  ProjectHeaderActionsSlot,
  ProjectHeaderMetaSlot,
} from './project-header-slots';

export const ProjectDashboardPageHeader = ({
  children,
  description,
}: {
  children?: React.ReactNode;
  description?: React.ReactNode;
}) => {
  const { project } = projectCollectionUtils.useCurrentProject();
  const { platform } = platformHooks.useCurrentPlatform();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<
    'general' | 'members' | 'alerts' | 'pieces' | 'environment'
  >('general');
  const location = useLocation();
  const { projectMembers } = projectMembersHooks.useProjectMembers();
  const activeProjectMembers = projectMembers?.filter(
    (member) => member.user.status === UserStatus.ACTIVE,
  );
  const { checkAccess } = useAuthorization();
  const { data: user } = userHooks.useCurrentUser();
  const userHasPermissionToReadProjectMembers = checkAccess(
    Permission.READ_PROJECT_MEMBER,
  );

  const { data: showProjectMembersFlag } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_PROJECT_MEMBERS,
  );

  const userHasPermissionToInviteUser = checkAccess(
    Permission.WRITE_INVITATION,
  );

  const showProjectMembersIcons =
    showProjectMembersFlag &&
    userHasPermissionToReadProjectMembers &&
    !isNil(activeProjectMembers) &&
    project.type === ProjectType.TEAM;

  const userCanInviteToProject =
    userHasPermissionToInviteUser &&
    project.type === ProjectType.TEAM &&
    platform.plan.projectRolesEnabled;
  const userCanInviteToPlatform = user?.platformRole === PlatformRole.ADMIN;
  const showInviteUserButton =
    userCanInviteToProject || userCanInviteToPlatform;
  const isProjectPage = location.pathname.includes('/projects/');

  const hasGeneralSettings =
    project.type === ProjectType.TEAM ||
    (platform.plan.embeddingEnabled &&
      user?.platformRole === PlatformRole.ADMIN);

  const getFirstAvailableTab = ():
    | 'general'
    | 'members'
    | 'alerts'
    | 'pieces'
    | 'environment' => {
    if (hasGeneralSettings) return 'general';
    if (
      project.type === ProjectType.TEAM &&
      showProjectMembersFlag &&
      userHasPermissionToReadProjectMembers
    )
      return 'members';
    return 'pieces';
  };

  const titleContent = (
    <span className="flex min-w-0 items-center gap-3">
      <span className="truncate">{getProjectName(project)}</span>
      {project.type === ProjectType.PERSONAL && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Lock
              aria-label={t(
                'This is your private project. Only you can see and access it.',
              )}
              className="size-5 shrink-0 text-gray-11"
            />
          </TooltipTrigger>
          <TooltipContent>
            {t('This is your private project. Only you can see and access it.')}
          </TooltipContent>
        </Tooltip>
      )}
    </span>
  );

  const rightContent = isProjectPage ? (
    <>
      {showProjectMembersIcons && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              aria-label={t('Members')}
              onClick={() => {
                setSettingsInitialTab('members');
                setSettingsOpen(true);
              }}
            >
              <UsersRound />
              <span className="tabular-nums">
                {activeProjectMembers?.length}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('Members')}</TooltipContent>
        </Tooltip>
      )}
      {showInviteUserButton && (
        <Tooltip>
          <TooltipTrigger asChild>
            <AnimatedIconButton
              icon={UserRoundPlusIcon}
              iconSize={16}
              variant="outline"
              size="icon"
              aria-label={t('Add members')}
              onClick={() => setInviteOpen(true)}
            />
          </TooltipTrigger>
          <TooltipContent>{t('Add members')}</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <AnimatedIconButton
            icon={SettingsIcon}
            iconSize={16}
            variant="outline"
            size="icon"
            aria-label={t('Project settings')}
            onClick={() => {
              setSettingsInitialTab(getFirstAvailableTab());
              setSettingsOpen(true);
            }}
          />
        </TooltipTrigger>
        <TooltipContent>{t('Project settings')}</TooltipContent>
      </Tooltip>
      <ProjectHeaderActionsSlot />
    </>
  ) : (
    <>
      {children}
      <ProjectHeaderActionsSlot />
    </>
  );

  return (
    <>
      <PageHeader
        className="has-[[data-slot=project-header-meta]:empty]:gap-0"
        title={titleContent}
        description={description ?? <ProjectHeaderMetaSlot />}
      >
        {rightContent}
      </PageHeader>
      <InviteUserDialog open={inviteOpen} setOpen={setInviteOpen} />
      <ProjectSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialTab={settingsInitialTab}
        initialValues={{
          projectName: project?.displayName,
        }}
      />
    </>
  );
};
