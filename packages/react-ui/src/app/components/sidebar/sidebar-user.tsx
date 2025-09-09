import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { ChevronsUpDown, LogOut, Settings, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { useTelemetry } from '@/components/telemetry-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar-shadcn';
import { UserAvatar } from '@/components/ui/user-avatar';
import { InviteUserDialog } from '@/features/team/component/invite-user-dialog';
import { projectHooks } from '@/hooks/project-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { ProjectSettingsDialog } from '../project-settings-dialog';

import { SidebarPlatformAdminButton } from './sidebar-platform-admin';

export function SidebarUser() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { embedState } = useEmbedding();
  const location = useLocation();
  const { project } = projectHooks.useCurrentProject();
  const { data: user } = userHooks.useCurrentUser();
  const queryClient = useQueryClient();
  const { reset } = useTelemetry();

  const isInPlatformAdmin = location.pathname.startsWith('/platform');

  if (!user || embedState.isEmbedded) {
    return null;
  }

  const handleLogout = () => {
    userHooks.invalidateCurrentUser(queryClient);
    authenticationSession.logOut();
    reset();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu modal>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent px-2 data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex items-center gap-2 w-full text-left text-sm">
                <UserAvatar
                  name={user.firstName + ' ' + user.lastName}
                  email={user.email}
                  size={32}
                  disableTooltip={true}
                />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user.firstName}
                  </span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side="right"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <UserAvatar
                  name={user.firstName + ' ' + user.lastName}
                  email={user.email}
                  size={32}
                  disableTooltip={true}
                />

                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user.firstName}
                  </span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {!isInPlatformAdmin && (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <SidebarPlatformAdminButton />
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuGroup>
              {(!embedState.hideProjectSettings && !isInPlatformAdmin) && (
                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  {t('Project Settings')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setInviteOpen(true)}>
                <UserPlus className="size-4 mr-2" />
                <span>{t('Invite User')}</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              {t('Log out')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <InviteUserDialog open={inviteOpen} setOpen={setInviteOpen} />
      <ProjectSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        projectId={project?.id}
        initialValues={{
          projectName: project?.displayName,
          tasks: project?.plan?.tasks?.toString() ?? '',
          aiCredits: project?.plan?.aiCredits?.toString() ?? '',
        }}
      />
    </SidebarMenu>
  );
}
