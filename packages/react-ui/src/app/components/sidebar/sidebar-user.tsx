import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserAvatar } from '@/components/ui/user-avatar';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';

export function SidebarUser() {
  const { data: user } = userHooks.useCurrentUser();
  const queryClient = useQueryClient();
  if (!user) {
    return null;
  }
  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex items-center justify-between w-full">
        <div className="flex items-center">
          <UserAvatar
            name={user.firstName + ' ' + user.lastName}
            email={user.email}
            size={32}
            disableTooltip={true}
          />
          <div className="grid flex-1 text-left text-sm leading-tight ml-2">
            <span className="truncate font-semibold">{user.firstName}</span>
            <span className="truncate text-xs">{user.email}</span>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="flex items-center ml-2"
              variant="ghost"
              size="icon"
              onClick={() => {
                userHooks.invalidateCurrentUser(queryClient);
                authenticationSession.logOut();
              }}
            >
              <LogOut className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>{t('Logout')}</span>
          </TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
