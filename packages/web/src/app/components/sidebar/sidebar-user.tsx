import { PlatformRole } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  ChevronsUpDown,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Sun,
  UserCogIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { UserAvatar } from '@/components/custom/user-avatar';
import { useEmbedding } from '@/components/providers/embed-provider';
import { useTheme } from '@/components/providers/theme-provider';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
  const { preference, setPreference } = useTheme();
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
              size="lg"
              tooltip={fullName}
              className="data-open:bg-gray-3"
              onClick={(event) => event.stopPropagation()}
            >
              <UserAvatar
                className="size-8! shrink-0 overflow-hidden rounded-full object-cover"
                name={fullName}
                email={user.email}
                imageUrl={user.imageUrl}
                size={32}
                disableTooltip={true}
              />
              <span className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium text-gray-12">
                  {fullName}
                </span>
                <span className="truncate text-xs text-gray-11">
                  {user.email}
                </span>
              </span>
              <ChevronsUpDown className="ml-auto text-gray-11 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-60"
            side="top"
            align="start"
            sideOffset={8}
          >
            <DropdownMenuLabel className="flex flex-col items-start gap-2 px-2 py-1.5 font-normal">
              <span className="flex w-full min-w-0 items-center gap-2.5">
                <UserAvatar
                  className="size-8 shrink-0 overflow-hidden rounded-full object-cover"
                  name={fullName}
                  email={user.email}
                  imageUrl={user.imageUrl}
                  size={32}
                  disableTooltip={true}
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-gray-12">
                    {fullName}
                  </span>
                  <span className="truncate text-xs text-gray-11">
                    {user.email}
                  </span>
                </span>
              </span>
              <Badge variant="secondary">
                {platformRoleLabel(user.platformRole)}
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setAccountSettingsOpen(true)}>
                <UserCogIcon />
                {t('Account Settings')}
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette />
                  {t('Theme')}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-44">
                  <DropdownMenuRadioGroup
                    value={preference}
                    onValueChange={(value) =>
                      setPreference(readThemePreference(value))
                    }
                  >
                    <DropdownMenuRadioItem value="light">
                      <Sun />
                      {t('Light')}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark">
                      <Moon />
                      {t('Dark')}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system">
                      <Monitor />
                      {t('System')}
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
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

function platformRoleLabel(role: PlatformRole): string {
  if (role === PlatformRole.ADMIN) {
    return t('Platform Admin');
  }
  if (role === PlatformRole.OPERATOR) {
    return t('Operator');
  }
  return t('Member');
}

function readThemePreference(value: string): 'light' | 'dark' | 'system' {
  return (
    THEME_PREFERENCES.find((preference) => preference === value) ?? 'system'
  );
}

const THEME_PREFERENCES = ['light', 'dark', 'system'] as const;
