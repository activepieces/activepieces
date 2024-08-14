import { CircleUser, LogOut } from 'lucide-react';

import { authenticationSession } from '@/lib/authentication-session';

import { Avatar, AvatarFallback } from './avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuItem,
} from './dropdown-menu';
import { TextWithIcon } from './text-with-icon';
import { AvatarLetter } from './avatar-letter';

export function UserAvatar() {

  const user = authenticationSession.getCurrentUser();
  if (!user) {
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
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => authenticationSession.LogOut()}>
          <TextWithIcon
            icon={<LogOut size={18} className="text-destructive" />}
            text={<span className="text-destructive">Logout</span>}
            className="cursor-pointer"
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
