import { isNil } from '@activepieces/core-utils';
import { PlatformRole } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { ChevronsUpDown, LogOut, UserCogIcon } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { UserAvatar } from '@/components/custom/user-avatar';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Badge } from '@/components/ui/badge';
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
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import { AccountSettingsDialog } from '../account-settings';
import { HelpAndFeedback } from '../help-and-feedback';

import { sidebarStyles } from './sidebar-styles';

export function SidebarUser() {
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const { embedState } = useEmbedding();
  const { data: user } = userHooks.useCurrentUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === 'collapsed' && !isMobile;

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
              className="h-10 p-1 pr-2 data-[state=open]:bg-gray-4"
              onClick={(event) => event.stopPropagation()}
            >
              <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full">
                <UserAvatar
                  className={cn('size-full object-cover', {
                    'scale-150': isNil(user.imageUrl),
                  })}
                  name={fullName}
                  email={user.email}
                  imageUrl={user.imageUrl}
                  size={24}
                  disableTooltip={true}
                />
              </span>
              <span
                className={cn(
                  'flex min-w-0 flex-1 flex-col',
                  sidebarStyles.labelFade,
                )}
              >
                <SidebarRowText
                  text={fullName}
                  className="font-medium text-gray-12"
                  plain={isCollapsed}
                />
                <SidebarRowText
                  text={user.email}
                  className="text-xs text-gray-11"
                  plain={isCollapsed}
                />
              </span>
              <ChevronsUpDown
                className={cn('ml-auto text-gray-9', sidebarStyles.labelFade)}
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className={cn(
              'w-(--radix-dropdown-menu-trigger-width) min-w-60',
              sidebarStyles.menuSurface,
            )}
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
                  <SidebarRowText
                    text={fullName}
                    className="text-sm font-medium text-gray-12"
                  />
                  <SidebarRowText
                    text={user.email}
                    className="text-xs text-gray-11"
                  />
                </span>
              </span>
              <Badge variant="secondary">
                {platformRoleLabel(user.platformRole)}
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setAccountSettingsOpen(true)}>
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

      <AccountSettingsDialog
        open={accountSettingsOpen}
        onClose={() => setAccountSettingsOpen(false)}
      />
    </SidebarMenu>
  );
}

function SidebarRowText({
  text,
  className,
  plain = false,
}: {
  text: string;
  className: string;
  plain?: boolean;
}) {
  if (plain) {
    return <span className={cn('truncate', className)}>{text}</span>;
  }
  return (
    <TextWithTooltip tooltipMessage={text}>
      <span className={className}>{text}</span>
    </TextWithTooltip>
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
