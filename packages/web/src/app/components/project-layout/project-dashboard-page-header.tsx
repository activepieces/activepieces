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
import { useLocation, useSearchParams } from 'react-router-dom';

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
  const [settingsOpenByUser, setSettingsOpenByUser] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] =
    useState<SettingsTab>('general');
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const linkedTab = settingsTabOf(searchParams.get(SETTINGS_PARAM));
  const settingsOpen = settingsOpenByUser || linkedTab !== null;
  const setSettingsOpen = (open: boolean) => {
    setSettingsOpenByUser(open);
    if (open || linkedTab === null) return;
    setSearchParams(
      (params) => {
        const next = new URLSearchParams(params);
        next.delete(SETTINGS_PARAM);
        return next;
      },
      { replace: true, state: location.state },
    );
  };
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

  const getFirstAvailableTab = (): SettingsTab => {
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
    <div className="flex items-center gap-1 min-w-0">
      <ApProjectDisplay
        title={getProjectName(project)}
        containerClassName="min-w-0"
        maxLengthToNotShowTooltip={30}
        titleClassName="text-sm font-medium"
        projectType={project.type}
      />
      {project.type === ProjectType.PERSONAL && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Lock className="w-4 h-4 shrink-0" />
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
    <div className="flex items-center gap-3 shrink-0">
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
          aria-label={t('Add Members')}
        >
          <span className="hidden sm:inline text-sm font-medium">
            {t('Add Members')}
          </span>
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
        className="min-w-full"
      />
      <InviteUserDialog open={inviteOpen} setOpen={setInviteOpen} />
      <ProjectSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialTab={linkedTab ?? settingsInitialTab}
      />
    </>
  );
};

function settingsTabOf(value: string | null): SettingsTab | null {
  return SETTINGS_TABS.find((tab) => tab === value) ?? null;
}

const SETTINGS_PARAM = 'settings';

type SettingsTab = 'general' | 'members' | 'alerts' | 'pieces' | 'environment';

const SETTINGS_TABS: SettingsTab[] = [
  'general',
  'members',
  'alerts',
  'pieces',
  'environment',
];
