import confetti from 'canvas-confetti';
import { Trophy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useSocket } from '@/components/socket-provider';
import { flagsHooks } from '@/hooks/flags-hooks';
import { userHooks } from '@/hooks/user-hooks';
import {
  BadgeAwarded,
  BADGES,
  ApFlagId,
  WebsocketClientEvent,
} from '@activepieces/shared';

import { AccountSettingsDialog } from './account-settings';

export const BadgeCelebrate = () => {
  const socket = useSocket();
  const { refetch } = userHooks.useCurrentUser();
  const cleanupRef = useRef<() => void>();
  const { data: showBadges } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_BADGES,
  );
  const isCelebrating = useRef(false);
  const celebrationTimeout = useRef<number | null>(null);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const openAccountSettingsRef = useRef(() => setShowAccountSettings(true));

  useEffect(() => {
    if (!socket || !showBadges) return;
    if (cleanupRef.current) {
      cleanupRef.current();
    }

    const handleBadgeAwarded = (data: BadgeAwarded) => {
      const badge = BADGES[data.badge as keyof typeof BADGES];
      if (!badge) {
        return;
      }

      const badgeTitle = badge?.title;
      const badgeDescription = badge?.description;
      const badgeImageUrl = badge?.imageUrl;

      toast.custom(
        () => (
          <BadgeToast
            imageUrl={badgeImageUrl}
            title={badgeTitle}
            description={badgeDescription}
            onClick={openAccountSettingsRef.current}
          />
        ),
        {
          duration: 10000,
          className:
            'bg-background border border-border rounded-xl shadow-lg p-3',
        },
      );

      refetch();
      if (isCelebrating.current) {
        return;
      }
      isCelebrating.current = true;

      const duration = 6000;
      const animationEnd = Date.now() + duration;
      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }
        const defaults = {
          startVelocity: 30,
          spread: 360,
          ticks: 60,
          zIndex: 9999,
        };
        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      // Set a timeout to reset the celebrating flag when finished
      if (celebrationTimeout.current) {
        clearTimeout(celebrationTimeout.current);
      }
      celebrationTimeout.current = window.setTimeout(() => {
        isCelebrating.current = false;
        celebrationTimeout.current = null;
      }, duration);
    };

    socket.on(WebsocketClientEvent.BADGE_AWARDED, handleBadgeAwarded);

    cleanupRef.current = () => {
      socket.off(WebsocketClientEvent.BADGE_AWARDED, handleBadgeAwarded);
      isCelebrating.current = false;
      if (celebrationTimeout.current) {
        clearTimeout(celebrationTimeout.current);
        celebrationTimeout.current = null;
      }
    };

    return cleanupRef.current;
  }, [socket, showBadges]);

  return (
    <AccountSettingsDialog
      open={showAccountSettings}
      onClose={() => setShowAccountSettings(false)}
    />
  );
};

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

const BadgeToast = ({
  imageUrl,
  title,
  description,
  onClick,
}: {
  imageUrl: string;
  title: string;
  description: string;
  onClick: () => void;
}) => (
  <div
    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
    onClick={onClick}
  >
    <img
      src={imageUrl}
      alt={title}
      className="w-12 h-12 rounded-lg object-cover shadow-md flex-shrink-0"
    />
    <div className="flex flex-col gap-0.5 min-w-0">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-foreground text-sm">{title}</span>
        <span className="text-[10px] font-medium text-primary uppercase tracking-wide flex items-center gap-1">
          <Trophy className="w-3 h-3" />
          Badge Earned!
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-snug">
        {description}
      </p>
    </div>
  </div>
);
