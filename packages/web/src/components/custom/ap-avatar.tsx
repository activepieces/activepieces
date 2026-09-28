import { isNil } from '@activepieces/core-utils';
import { Mail01Icon } from '@hugeicons/core-free-icons';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
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
          className={cn('text-xs truncate', {
            'text-xss opacity-75': size === 'xsmall',
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
      <HoverCardContent
        className="w-80 rounded-md border bg-panel p-4 shadow-md"
        align="start"
      >
        <div className="flex items-center gap-3">
          <UserAvatar
            name={`${user.firstName} ${user.lastName}`}
            email={user.email}
            imageUrl={user.imageUrl}
            size={36}
            disableTooltip={true}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold leading-none truncate">
                {user.firstName} {user.lastName}
              </h4>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <HugeiconsIcon
                icon={Mail01Icon}
                className="h-3.5 w-3.5 text-gray-11 shrink-0"
              />
              <span className="text-xs text-gray-11 truncate">
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
