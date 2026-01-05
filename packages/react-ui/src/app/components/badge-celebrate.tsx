import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

import { useSocket } from '@/components/socket-provider';
import { BADGES, WebsocketClientEvent } from '@activepieces/shared';

type BadgeAwardedEvent = {
  badgeName: string;
};

export const BadgeCelebrate = () => {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleBadgeAwarded = (data: BadgeAwardedEvent) => {
      const { badgeName } = data;
      const badge = BADGES[badgeName as keyof typeof BADGES];

      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

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

      const badgeTitle = badge?.title || badgeName;
      const badgeDescription = badge?.description || `You earned the ${badgeName} badge!`;

      toast.success(`${badgeTitle}`, {
        description: badgeDescription,
        duration: 5000,
      });
    };

    socket.on(WebsocketClientEvent.BADGE_AWARDED, handleBadgeAwarded);

    return () => {
      socket.off(WebsocketClientEvent.BADGE_AWARDED, handleBadgeAwarded);
    };
  }, [socket]);

  return null;
};
