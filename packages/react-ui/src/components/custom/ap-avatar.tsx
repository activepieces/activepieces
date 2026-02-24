import { Mail } from 'lucide-react';

import { UserBadges } from '@/components/custom/user-badges';
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components/ui/hover-card';
import { userHooks } from '@/hooks/user-hooks';
import { isNil } from '@activepieces/shared';

import { UserAvatar } from '../ui/user-avatar';

interface ApAvatarProps {
  id: string | null;
  size: 'small' | 'medium';
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
  const avatarSize = size === 'small' ? 24 : 32;

  const { data: user } = userHooks.useUserById(id);
  if (!user || isNil(id)) {
    return <span className="text-muted-foreground">—</span>;
  }

  const content = (
    <div className="flex items-center gap-2">
      {includeAvatar && (
        <div className="shrink-0">
          <UserAvatar
            name={`${user.firstName} ${user.lastName}`}
            email={user.email}
            size={avatarSize}
            disableTooltip={true}
          />
        </div>
      )}
      {includeName && (
        <span className="text-xs truncate">{`${user.firstName}`}</span>
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
        className="w-80 rounded-md border bg-background p-4 shadow-md"
        align="start"
      >
        <div className="flex items-center gap-3">
          <UserAvatar
            name={`${user.firstName} ${user.lastName}`}
            email={user.email}
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
              <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground truncate">
                {user.email}
              </span>
            </div>
          </div>
        </div>

        <UserBadges user={user} showLockedBadges={false} showBorder={true} />
      </HoverCardContent>
    </HoverCard>
  );
};
