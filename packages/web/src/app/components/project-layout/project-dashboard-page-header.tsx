import {
  ApFlagId,
  isNil,
  Permission,
  PlatformRole,
  ProjectType,
  UserStatus,
} from '@activepieces/shared';
import { t } from 'i18next';
import { UsersRound, Lock } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { PageHeader } from '@/components/custom/page-header';
import { SettingsIcon } from '@/components/icons/settings';
import { UserRoundPlusIcon } from '@/components/icons/user-round-plus';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { InviteUserDialog, projectMembersHooks } from '@/features/members';
import { getProjectName, projectCollectionUtils } from '@/features/projects';
import { ApProjectDisplay } from '@/features/projects/components/ap-project-display';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';

import { ProjectSettingsDialog } from '../project-settings';

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

  const showInviteUserButton =
    userHasPermissionToInviteUser && project.type === ProjectType.TEAM;

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
    <div className="flex items-center gap-1">
      <ApProjectDisplay
        title={getProjectName(project)}
        maxLengthToNotShowTooltip={30}
        titleClassName="text-sm font-medium"
        projectType={project.type}
      />
      {project.type === ProjectType.PERSONAL && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Lock className="w-4 h-4" />
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {t(
                  'This is your private project. Only you can see and access it.',
                )}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );

  const rightContent = isProjectPage ? (
    <div className="flex items-center gap-3">
      {showProjectMembersIcons && (
        <Button
          variant="ghost"
          className="gap-2"
          aria-label={`View ${activeProjectMembers?.length} team member${
            activeProjectMembers?.length !== 1 ? 's' : ''
          }`}
          onClick={() => {
            setSettingsInitialTab('members');
            setSettingsOpen(true);
          }}
        >
          <UsersRound className="w-4 h-4" />
          <span className="text-sm font-medium">
            {activeProjectMembers?.length}
          </span>
        </Button>
      )}
      {showInviteUserButton && (
        <AnimatedIconButton
          icon={UserRoundPlusIcon}
          iconSize={16}
          variant="ghost"
          size="sm"
          onClick={() => setInviteOpen(true)}
        >
          <span className="text-sm font-medium">{t('Add Members')}</span>
        </AnimatedIconButton>
      )}
      <AnimatedIconButton
        icon={SettingsIcon}
        iconSize={16}
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => {
          setSettingsInitialTab(getFirstAvailableTab());
          setSettingsOpen(true);
        }}
      />
    </div>
  ) : (
    children
  );

  return (
    <>
      <PageHeader
        title={titleContent}
        description={description}
        rightContent={rightContent}
        showSidebarToggle={true}
        className="min-w-full"
      />
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
