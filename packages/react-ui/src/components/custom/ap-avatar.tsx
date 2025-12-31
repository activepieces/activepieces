import { UserAvatar } from '../ui/user-avatar';
import { userHooks } from '@/hooks/user-hooks';

import { Skeleton } from '@/components/ui/skeleton';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Mail, Calendar } from 'lucide-react';

interface ApAvatarProps {
  type: "user"
  id: string;
  size: 'small' | 'medium';
  includeAvatar?: boolean;
  includeName?: boolean;
  hideHover?: boolean;
}

export const ApAvatar = ({
  type,
  id,
  includeAvatar = true,
  includeName = false,
  size = 'medium',
  hideHover = false,
}: ApAvatarProps) => {

  const avatarSize = size === 'small' ? 24 : 32;

  const { data: user } = userHooks.useUserById(id);
  if (!user) {
    return <span className="text-muted-foreground">—</span>;
  }

  const content = (
    <div className="flex items-center gap-2">
      {includeAvatar && (
        <UserAvatar
          name={`${user.firstName} ${user.lastName}`}
          email={user.email}
          size={avatarSize}
          disableTooltip={true}
        />
      )}
      {includeName && (
        <span className="text-sm">{`${user.firstName} ${user.lastName}`}</span>
      )}
    </div>
  );

  if (hideHover) {
    return content;
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="cursor-pointer">
          {content}
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 rounded-md border bg-background p-4 shadow-md" align="start">
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
              {user.lastActiveDate && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(user.lastActiveDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground truncate">
                {user.email}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t">
          <h5 className="text-xs text-foreground mb-2 tracking-wide">
            Badges
          </h5>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-pointer">
                  <img
                    src="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3ZoZ3d1dWlzcnNuY2RwbTdpZGV1em9xeGQweHpma3B0Zm0xczdvZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/BPJmthQ3YRwD6QqcVD/giphy.gif"
                    alt="Welcome Badge"
                    className="h-12 w-12 object-cover rounded"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-left">
                <div className="flex flex-col">
                  <p className="font-semibold">Welcome</p>
                  <p className="text-xs">Welcome to Activepieces!</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};