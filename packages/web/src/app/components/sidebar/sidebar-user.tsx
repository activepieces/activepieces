import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { ChevronsUpDown, LogOut, UserCogIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { UserAvatar } from '@/components/custom/user-avatar';
import { useEmbedding } from '@/components/providers/embed-provider';
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
} from '@/components/ui/sidebar';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { AccountSettingsDialog } from '../account-settings';
import { HelpAndFeedback } from '../help-and-feedback';

export function SidebarUser() {
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const { embedState } = useEmbedding();
  const { data: user } = userHooks.useCurrentUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  if (!user || embedState.isEmbedded) {
    return null;
  }

  const fullName = `${user.firstName} ${user.lastName}`;

  const handleLogout = () => {
    userHooks.invalidateCurrentUser(queryClient);
    authenticationSession.logOut();
    navigate('/sign-in');
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu modal>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              tooltip={fullName}
              className="data-open:bg-gray-3"
              onClick={(event) => event.stopPropagation()}
            >
              <UserAvatar
                className="size-4 shrink-0 overflow-hidden rounded-full object-cover"
                name={fullName}
                email={user.email}
                imageUrl={user.imageUrl}
                size={20}
                disableTooltip={true}
              />
              <span>{fullName}</span>
              <ChevronsUpDown className="ml-auto text-gray-11" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64"
            side="top"
            align="start"
            sideOffset={8}
          >
            <DropdownMenuLabel className="flex items-center gap-2.5 px-2 py-1.5 font-normal">
              <UserAvatar
                className="size-7 shrink-0 overflow-hidden rounded-full object-cover"
                name={fullName}
                email={user.email}
                imageUrl={user.imageUrl}
                size={32}
                disableTooltip={true}
              />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-gray-12">
                  {fullName}
                </span>
                <span className="truncate text-xs text-gray-11">
                  {user.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setAccountSettingsOpen(true)}>
                <UserCogIcon />
                {t('Account Settings')}
              </DropdownMenuItem>
              <HelpAndFeedback />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              {t('Log out')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <AccountSettingsDialog
        open={accountSettingsOpen}
        onClose={() => setAccountSettingsOpen(false)}
      />
    </SidebarMenu>
  );
}
