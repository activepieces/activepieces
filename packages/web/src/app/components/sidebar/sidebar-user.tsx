import { isNil } from '@activepieces/shared';
import { useClerk, useUser } from '@clerk/clerk-react';
import { t } from 'i18next';
import { ChevronsUpDown, LogOut, UserCogIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { UserAvatar } from '@/components/custom/user-avatar';
import { useEmbedding } from '@/components/providers/embed-provider';
import { useTelemetry } from '@/components/providers/telemetry-provider';
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
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';

import { HelpAndFeedback } from '../help-and-feedback';

export function SidebarUser() {
  const { embedState } = useEmbedding();
  const { data: user } = userHooks.useCurrentUser();
  const { reset } = useTelemetry();
  const { state } = useSidebar();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const navigate = useNavigate();
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? '';
  const isCollapsed = state === 'collapsed';
  if (!user || embedState.isEmbedded) {
    return null;
  }

  const handleLogout = () => {
    reset();
    // Pass redirectUrl explicitly — without it, Clerk v5 may complete signOut
    // but skip the navigation if the internal instance state is inconsistent.
    // The AP session is cleared cleanly on /login mount (LoginPage useEffect).
    signOut({ redirectUrl: '/login' });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu modal>
          <DropdownMenuTrigger asChild className="w-full">
            <SidebarMenuButton className="h-10! pl-2! group-data-[collapsible=icon]:h-10! group-data-[collapsible=icon]:pl-2!">
              <div className="size-[18px] shrink-0 overflow-hidden flex items-center justify-center rounded-full">
                <UserAvatar
                  className={cn('size-full object-cover', {
                    'scale-150': isNil(user.imageUrl),
                  })}
                  name={user.firstName + ' ' + user.lastName}
                  email={email}
                  imageUrl={user.imageUrl}
                  size={18}
                  disableTooltip={true}
                />
              </div>

              {!isCollapsed && (
                <>
                  <span className="truncate">
                    {user.firstName + ' ' + user.lastName}
                  </span>
                  <ChevronsUpDown className="ml-auto size-4" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg z-999"
            side="top"
            align="start"
            sideOffset={10}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <div className="size-8 shrink-0 overflow-hidden rounded-full">
                  <UserAvatar
                    className="size-full object-cover"
                    name={user.firstName + ' ' + user.lastName}
                    email={email}
                    imageUrl={user.imageUrl}
                    size={32}
                    disableTooltip={true}
                  />
                </div>

                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user.firstName + ' ' + user.lastName}
                  </span>
                  <span className="truncate text-xs">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => navigate('/user-settings/profile')}
              >
                <UserCogIcon className="w-4 h-4 mr-2" />
                {t('Account Settings')}
              </DropdownMenuItem>

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
    </SidebarMenu>
  );
}
