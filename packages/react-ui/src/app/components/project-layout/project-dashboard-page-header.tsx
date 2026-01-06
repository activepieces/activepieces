import { t } from 'i18next';
import { UserPlus, UsersRound, Settings, Lock } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { PageHeader } from '@/components/custom/page-header';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { InviteUserDialog } from '@/features/members/component/invite-user-dialog';
import { projectMembersHooks } from '@/features/members/lib/project-members-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import {
  getProjectName,
  projectCollectionUtils,
} from '@/hooks/project-collection';
import { userHooks } from '@/hooks/user-hooks';
import {
  ApFlagId,
  isNil,
  Permission,
  PlatformRole,
  ProjectType,
} from '@activepieces/shared';

import { ApProjectDisplay } from '../ap-project-display';
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
    !isNil(projectMembers) &&
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
    <div className="flex items-center gap-2">
      <ApProjectDisplay
        title={getProjectName(project)}
        maxLengthToNotShowTooltip={30}
        titleClassName="text-base"
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
          aria-label={`View ${projectMembers?.length} team member${
            projectMembers?.length !== 1 ? 's' : ''
          }`}
          onClick={() => {
            setSettingsInitialTab('members');
            setSettingsOpen(true);
          }}
        >
          <UsersRound className="w-4 h-4" />
          <span className="text-sm font-medium">{projectMembers?.length}</span>
        </Button>
      )}
      {showInviteUserButton && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => setInviteOpen(true)}
        >
          <UserPlus className="w-4 h-4" />
          <span className="text-sm font-medium">Invite</span>
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => {
          setSettingsInitialTab(getFirstAvailableTab());
          setSettingsOpen(true);
        }}
      >
        <Settings className="w-4 h-4" />
      </Button>
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
