import confetti from 'canvas-confetti';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { useSocket } from '@/components/socket-provider';
import {
  BadgeAwarded,
  BADGES,
  ApFlagId,
  WebsocketClientEvent,
} from '@activepieces/shared';
import { flagsHooks } from '@/hooks/flags-hooks';

export const BadgeCelebrate = () => {
  const socket = useSocket();
  const cleanupRef = useRef<() => void>();
  const { data: showBadges } = flagsHooks.useFlag<boolean>(ApFlagId.SHOW_BADGES);
  const isCelebrating = useRef(false);
  const celebrationTimeout = useRef<number | null>(null);

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
          />
        ),
        {
          duration: 5000,
          className:
            'bg-background border border-border rounded-xl shadow-lg p-3',
        },
      );

      if (isCelebrating.current) {
        return;
      }
      isCelebrating.current = true;

      const duration = 4000;
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
  }, [socket]);

  return null;
};

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

const BadgeToast = ({
  imageUrl,
  title,
  description,
}: {
  imageUrl: string;
  title: string;
  description: string;
}) => (
  <div className="flex items-center gap-4 p-1">
    <div className="flex-shrink-0">
      <img
        src={imageUrl}
        alt={title}
        className="w-16 h-16 rounded-lg object-cover shadow-md"
      />
    </div>
    <div className="flex flex-col gap-1 min-w-0">
      <div className="font-semibold text-foreground text-base">🎉 {title}</div>
      <p className="text-sm text-muted-foreground leading-snug">
        {description}
      </p>
    </div>
  </div>
);
