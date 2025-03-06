import { t } from 'i18next';
import { LogOut, SunMoon } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useEmbedding } from '@/components/embed-provider';
import { useTelemetry } from '@/components/telemetry-provider';
import { authenticationSession } from '@/lib/authentication-session';

import { Avatar, AvatarFallback } from './avatar';
import { AvatarLetter } from './avatar-letter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuItem,
} from './dropdown-menu';
import { TextWithIcon } from './text-with-icon';

export function UserAvatar() {
  const { reset } = useTelemetry();
  const { embedState } = useEmbedding();
  const user = authenticationSession.getCurrentUser();
  if (!user || embedState.isEmbedded) {
    return null;
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer">
          <AvatarFallback>
            <AvatarLetter
              name={user.firstName + ' ' + user.lastName}
              email={user.email}
              disablePopup={true}
            ></AvatarLetter>
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px]">
        <DropdownMenuLabel>
          <div className="flex">
            <div className="flex-grow flex-shrink truncate">{user.email}</div>
          </div>
        </DropdownMenuLabel>
        <Link to="/settings/appearance">
          <DropdownMenuItem className="cursor-pointer">
            <TextWithIcon
              icon={<SunMoon size={18} />}
              text={t('Appearance')}
              className="cursor-pointer"
            />
          </DropdownMenuItem>
        </Link>

        {/* <DropdownMenuItem
          onClick={() => {
            authenticationSession.logOut();
            reset();
          }}
          className="cursor-pointer"
        >
          <TextWithIcon
            icon={<LogOut size={18} className="text-destructive" />}
            text={<span className="text-destructive">{t('Logout')}</span>}
            className="cursor-pointer"
          />
        </DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
