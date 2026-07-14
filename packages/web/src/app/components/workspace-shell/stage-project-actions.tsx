import { isNil, Permission } from '@activepieces/core-utils';
import {
  ApFlagId,
  PlatformRole,
  ProjectType,
  UserStatus,
} from '@activepieces/shared';
import { t } from 'i18next';
import { UsersRound } from 'lucide-react';
import { useState } from 'react';

import { Settings2Icon } from '@/components/icons/settings2';
import { UserRoundPlusIcon } from '@/components/icons/user-round-plus';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { InviteUserDialog, projectMembersHooks } from '@/features/members';
import { projectCollectionUtils } from '@/features/projects';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';

import { ProjectSettingsDialog } from '../project-settings';

import { useStage } from './stage-context';

type SettingsTab = 'general' | 'members' | 'alerts' | 'pieces' | 'environment';

// Single-resource detail views (a specific flow, table, run, or release) are focused
// on that resource and carry their own toolbar — project-admin actions don't belong
// there. StageProjectActions only shows on the project section pages.
const RESOURCE_DETAIL_TYPES = new Set(['flow', 'table', 'run', 'release']);

// Project-level actions shown as icon buttons in the Stage header's right corner
// (Add Members, Settings) — reachable from every project section page rather than
// hidden in a menu. Gating mirrors ProjectDashboardPageHeader.
export function StageProjectActions() {
  const { current } = useStage();
  if (current.type === 'none' || RESOURCE_DETAIL_TYPES.has(current.type)) {
    return null;
  }
  return <StageProjectActionsInner />;
}

function StageProjectActionsInner() {
  const { activeProjectId } = useStage();
  const project = projectCollectionUtils.useProjectById(activeProjectId);
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: user } = userHooks.useCurrentUser();
  const { checkAccess } = useAuthorization();
  const { data: showProjectMembersFlag } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_PROJECT_MEMBERS,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const { projectMembers } = projectMembersHooks.useProjectMembers();

  if (!project) {
    return null;
  }

  const activeProjectMembers = projectMembers?.filter(
    (member) => member.user.status === UserStatus.ACTIVE,
  );
  const showMembersCount =
    showProjectMembersFlag &&
    checkAccess(Permission.READ_PROJECT_MEMBER) &&
    !isNil(activeProjectMembers) &&
    project.type === ProjectType.TEAM;

  const canInvite =
    (checkAccess(Permission.WRITE_INVITATION) &&
      project.type === ProjectType.TEAM &&
      platform.plan.projectRolesEnabled) ||
    user?.platformRole === PlatformRole.ADMIN;

  const hasGeneralSettings =
    project.type === ProjectType.TEAM ||
    (platform.plan.embeddingEnabled &&
      user?.platformRole === PlatformRole.ADMIN);

  const initialSettingsTab: SettingsTab = hasGeneralSettings
    ? 'general'
    : project.type === ProjectType.TEAM &&
      showProjectMembersFlag &&
      checkAccess(Permission.READ_PROJECT_MEMBER)
    ? 'members'
    : 'pieces';

  return (
    <>
      <TooltipProvider delayDuration={400}>
        {showMembersCount && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2"
            aria-label={t('View team members')}
            onClick={() => {
              setSettingsTab('members');
              setSettingsOpen(true);
            }}
          >
            <UsersRound className="size-4" />
            <span className="text-sm font-medium">
              {activeProjectMembers?.length}
            </span>
          </Button>
        )}
        {canInvite && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label={t('Add Members')}
                onClick={() => setInviteOpen(true)}
              >
                <UserRoundPlusIcon size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('Add Members')}</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label={t('Settings')}
              onClick={() => {
                setSettingsTab(null);
                setSettingsOpen(true);
              }}
            >
              <Settings2Icon size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('Settings')}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <InviteUserDialog open={inviteOpen} setOpen={setInviteOpen} />
      <ProjectSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialTab={settingsTab ?? initialSettingsTab}
        initialValues={{ projectName: project.displayName }}
      />
    </>
  );
}
