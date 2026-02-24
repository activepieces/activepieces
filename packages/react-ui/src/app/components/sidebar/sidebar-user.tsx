import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  ChevronsUpDown,
  LogOut,
  Shield,
  UserCogIcon,
  UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
  useSidebar,
} from '@/components/ui/sidebar-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserAvatar } from '@/components/ui/user-avatar';
import { InviteUserDialog } from '@/features/members/component/invite-user-dialog';
import {
  useIsPlatformAdmin,
  useAuthorization,
} from '@/hooks/authorization-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { Permission } from '@activepieces/shared';

import AccountSettingsDialog from '../account-settings';
import { HelpAndFeedback } from '../help-and-feedback';

export function SidebarUser() {
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [inviteUserOpen, setInviteUserOpen] = useState(false);
  const { embedState } = useEmbedding();
  const { state } = useSidebar();
  const location = useLocation();
  const { data: user } = userHooks.useCurrentUser();
  const queryClient = useQueryClient();
  const { reset } = useTelemetry();
  const { checkAccess } = useAuthorization();
  const canInviteUsers = checkAccess(Permission.WRITE_INVITATION);
  const isInPlatformAdmin = location.pathname.startsWith('/platform');
  const isCollapsed = state === 'collapsed';

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
          {isCollapsed ? (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger className="flex items-center justify-center size-9 rounded-md hover:bg-accent cursor-pointer">
                    <UserAvatar
                      name={user.firstName + ' ' + user.lastName}
                      email={user.email}
                      size={28}
                      disableTooltip={true}
                    />
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="right" align="center">
                  {user.firstName + ' ' + user.lastName}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
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
                    <span className="truncate">
                      {user.firstName + ' ' + user.lastName}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
          )}
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
                  <span className="truncate font-medium">
                    {user.firstName + ' ' + user.lastName}
                  </span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {!isInPlatformAdmin && <SidebarPlatformAdminButton />}

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setAccountSettingsOpen(true)}>
                <UserCogIcon className="w-4 h-4 mr-2" />
                {t('Account Settings')}
              </DropdownMenuItem>
              {canInviteUsers && (
                <DropdownMenuItem onClick={() => setInviteUserOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t('Invite User')}
                </DropdownMenuItem>
              )}
              <HelpAndFeedback />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              {t('Log out')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <AccountSettingsDialog
        open={accountSettingsOpen}
        onClose={() => setAccountSettingsOpen(false)}
      />
      <InviteUserDialog open={inviteUserOpen} setOpen={setInviteUserOpen} />
    </SidebarMenu>
  );
}

function SidebarPlatformAdminButton() {
  const showPlatformAdminDashboard = useIsPlatformAdmin();
  const { embedState } = useEmbedding();
  const navigate = useNavigate();

  if (embedState.isEmbedded || !showPlatformAdminDashboard) {
    return null;
  }

  return (
    <DropdownMenuGroup>
      <DropdownMenuItem
        onClick={() => navigate('/platform')}
        className="w-full flex items-center justify-center relative"
      >
        <div className={`w-full flex items-center gap-2`}>
          <Shield className="size-4" />
          <span className={`text-sm`}>{t('Platform Admin')}</span>
        </div>
      </DropdownMenuItem>
    </DropdownMenuGroup>
  );
}
