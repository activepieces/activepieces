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
import { useLocation, useNavigate } from 'react-router-dom';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { PageHeader } from '@/components/custom/page-header';
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
  const location = useLocation();
  const navigate = useNavigate();
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
          onClick={() => navigate('/user-settings/workspace/members')}
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
    </>
  );
};
