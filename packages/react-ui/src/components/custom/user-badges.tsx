import { t } from 'i18next';
import { Lock } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flagsHooks } from '@/hooks/flags-hooks';
import { ApFlagId, BADGES, UserWithBadges } from '@activepieces/shared';

interface UserBadgesProps {
  user: UserWithBadges | null | undefined;
  showLockedBadges?: boolean;
  showBorder?: boolean;
}

export const UserBadges = ({
  user,
  showLockedBadges = true,
  showBorder = false,
}: UserBadgesProps) => {
  const { data: showBadges } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_BADGES,
  );

  if (!showBadges) {
    return null;
  }

  const userBadges = user?.badges ?? [];

  if (!showLockedBadges && userBadges.length === 0) {
    return null;
  }

  const badgesToShow: [string, (typeof BADGES)[keyof typeof BADGES]][] =
    showLockedBadges
      ? Object.entries(BADGES)
      : userBadges
          .filter((b) => BADGES[b.name as keyof typeof BADGES])
          .map((b) => [b.name, BADGES[b.name as keyof typeof BADGES]!]);

  return (
    <div className={showBorder ? 'mt-3 pt-3 border-t' : 'space-y-3'}>
      <h5
        className={`text-xs text-foreground tracking-wide ${
          showBorder ? 'mb-2' : ''
        }`}
      >
        {t('Badges')}
      </h5>
      <div className="flex items-center gap-1 flex-wrap">
        {badgesToShow.map(([badgeName, badge]) => {
          const isUnlocked = userBadges.some(
            (userBadge: { name: string; created: string }) =>
              userBadge.name === badgeName,
          );

          return (
            <Tooltip key={badgeName}>
              <TooltipTrigger asChild>
                <div className="cursor-pointer relative">
                  <img
                    src={badge.imageUrl}
                    alt={badge.title}
                    className={`h-12 w-12 object-cover rounded-md ${
                      !isUnlocked && showLockedBadges
                        ? 'opacity-50 grayscale'
                        : ''
                    }`}
                  />
                  {!isUnlocked && showLockedBadges && (
                    <div className="absolute inset-0 flex items-center justify-center rounded">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-left">
                <div className="flex flex-col">
                  <p className="font-semibold">{badge.title}</p>
                  <p className="text-xs">{badge.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};
