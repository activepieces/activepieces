import { t } from 'i18next';

import { usePresence } from '@/hooks/use-presence';

import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

import { ApAvatar } from './ap-avatar';

const MAX_VISIBLE_AVATARS = 5;
const AVATAR_SIZE = 28;
const BORDER_COLORS = [
  'hsl(var(--destructive-500))',
  'hsl(var(--chart-1))',
  'hsl(var(--warning-500))',
  'hsl(var(--success-500))',
  'hsl(var(--chart-2))',
  'hsl(var(--primary))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-4))',
];

function getBorderColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return BORDER_COLORS[Math.abs(hash) % BORDER_COLORS.length];
}

export function ActiveUsersWidget({ resourceId }: ActiveUsersWidgetProps) {
  const activeUsers = usePresence({ resourceId });

  if (activeUsers.length === 0) {
    return null;
  }

  const visibleUsers = activeUsers.slice(0, MAX_VISIBLE_AVATARS);
  const overflowCount = activeUsers.length - MAX_VISIBLE_AVATARS;

  return (
    <div className="flex items-center gap-1">
      {visibleUsers.map((user) => (
        <div
          key={user.userId}
          className="rounded-full border-2"
          style={{ borderColor: getBorderColor(user.userId) }}
        >
          <ApAvatar id={user.userId} size="small" />
        </div>
      ))}
      {overflowCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="flex items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground border"
              style={{ width: `${AVATAR_SIZE}px`, height: `${AVATAR_SIZE}px` }}
            >
              +{overflowCount}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {t('+{count} more', { count: overflowCount })}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

type ActiveUsersWidgetProps = {
  resourceId: string;
};
