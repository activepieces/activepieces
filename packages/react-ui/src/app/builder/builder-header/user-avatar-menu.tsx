import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { LogOut } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuItem,
} from '../../../components/ui/dropdown-menu';
import { TextWithIcon } from '../../../components/ui/text-with-icon';

import { useEmbedding } from '@/components/embed-provider';
import { UserAvatar } from '@/components/ui/user-avatar';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';

export function UserAvatarMenu() {
  const { embedState } = useEmbedding();
  const { data: user } = userHooks.useCurrentUser();
  const queryClient = useQueryClient();
  if (!user || embedState.isEmbedded) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <UserAvatar
          disableTooltip={true}
          name={user.firstName + ' ' + user.lastName}
          email={user.email}
          size={32}
        ></UserAvatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px]">
        <DropdownMenuLabel>
          <div className="flex">
            <div className="flex-grow flex-shrink truncate">{user.email}</div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => {
            userHooks.invalidateCurrentUser(queryClient);
            authenticationSession.logOut();
          }}
          className="cursor-pointer"
        >
          <TextWithIcon
            icon={<LogOut size={18} className="text-destructive" />}
            text={<span className="text-destructive">{t('Logout')}</span>}
            className="cursor-pointer"
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
