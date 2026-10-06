import { isNil } from '@activepieces/core-utils';
import { Mail } from 'lucide-react';

import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components/ui/hover-card';
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';

import { UserAvatar } from './user-avatar';

interface ApAvatarProps {
  id: string | null;
  size: 'small' | 'medium' | 'xsmall';
  includeAvatar?: boolean;
  includeName?: boolean;
  hideHover?: boolean;
}

export const ApAvatar = ({
  id,
  includeAvatar = true,
  includeName = false,
  size = 'medium',
  hideHover = false,
}: ApAvatarProps) => {
  const avatarSize = getAvatarSize(size);

  const { data: user } = userHooks.useUserById(id);
  if (!user || isNil(id)) {
    return <span className="text-gray-11">—</span>;
  }

  const content = (
    <div className="flex items-center gap-2">
      {includeAvatar && (
        <div className="shrink-0">
          <UserAvatar
            name={`${user.firstName} ${user.lastName}`}
            email={user.email}
            imageUrl={user.imageUrl}
            size={avatarSize}
            disableTooltip={true}
          />
        </div>
      )}
      {includeName && (
        <span
          className={cn('truncate text-sm', {
            'text-xs text-gray-11': size === 'xsmall',
          })}
        >
          {`${user.firstName} ${user.lastName}`.trim()}
        </span>
      )}
    </div>
  );

  if (hideHover) {
    return content;
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="cursor-pointer">{content}</div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" align="start">
        <div className="flex items-center gap-3">
          <UserAvatar
            name={`${user.firstName} ${user.lastName}`}
            email={user.email}
            imageUrl={user.imageUrl}
            size={32}
            disableTooltip={true}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h4 className="truncate text-sm font-semibold">
              {user.firstName} {user.lastName}
            </h4>
            <div className="flex items-center gap-2">
              <Mail className="size-3.5 shrink-0 text-gray-11" />
              <span className="truncate text-xs text-gray-11">
                {user.email}
              </span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

function getAvatarSize(size: 'small' | 'medium' | 'xsmall') {
  switch (size) {
    case 'small':
      return 24;
    case 'medium':
      return 32;
    case 'xsmall':
      return 16;
  }
}
