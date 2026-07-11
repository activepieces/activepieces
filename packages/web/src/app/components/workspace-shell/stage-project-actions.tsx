import { Permission } from '@activepieces/core-utils';
import { ApFlagId, PlatformRole, ProjectType } from '@activepieces/shared';
import { t } from 'i18next';
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
import { InviteUserDialog } from '@/features/members';
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
  const [inviteOpen, setInviteOpen] = useState(false);

  if (!project) {
    return null;
  }

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
              onClick={() => setSettingsOpen(true)}
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
        initialTab={initialSettingsTab}
        initialValues={{ projectName: project.displayName }}
      />
    </>
  );
}
