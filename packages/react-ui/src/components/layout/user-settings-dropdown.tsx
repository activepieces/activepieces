import { CircleUser, LogOut } from 'lucide-react';

import { authenticationSession } from '@/lib/authentication-session';

import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuItem,
} from '../ui/dropdown-menu';
import { TextWithIcon } from '../ui/text-with-icon';

export function UserSettingsDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer">
          <AvatarFallback>
            <CircleUser />
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Settings</DropdownMenuLabel>
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
