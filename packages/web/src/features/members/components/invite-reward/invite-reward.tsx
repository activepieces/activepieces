import { isNil, tryCatchSync } from '@activepieces/core-utils';
import { InviteRewardSurface, TelemetryEventName } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Gift, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTelemetry } from '@/components/providers/telemetry-provider';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { billingUtils } from '@/features/billing/utils/billing-utils';
import { timedDismissal } from '@/lib/timed-dismissal';

import { useInviteRewards } from '../../hooks/use-invite-rewards';
import { InviteUserDialog } from '../invite-user/invite-user-dialog';

export function InviteRewardCard() {
  const rewards = useInviteRewards();
  const [inviteOpen, setInviteOpen] = useState(false);
  const openInvite = useOpenInviteWithTracking({
    surface: InviteRewardSurface.SIDEBAR_CARD,
    rewardsEarned: rewards.claimed,
    open: () => setInviteOpen(true),
  });
  const [dismissedAt, setDismissedAt] = useState(() =>
    cardDismissal.read({ platformId: rewards.platformId }),
  );

  if (!rewards.visible || cardDismissal.isActive({ dismissedAt })) {
    return null;
  }

  const dismissCard = () => {
    const timestamp = dayjs().toISOString();
    setDismissedAt(timestamp);
    cardDismissal.write({
      platformId: rewards.platformId,
      dismissedAt: timestamp,
    });
  };

  return (
    <div className="flex flex-col w-full gap-2 p-2.5 bg-gray-1 rounded-md border">
      <div className="flex items-start gap-2">
        <Gift className="size-4 shrink-0 mt-0.5 text-accent-11" />
        <span className="text-sm font-medium">
          {t('Invite teammates, get {credits} credits each', {
            credits: billingUtils.formatCredits(rewards.creditsPerInvite),
          })}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={t('Dismiss')}
          className="ms-auto shrink-0 text-gray-11"
          onClick={dismissCard}
        >
          <X className="size-3.5" />
        </Button>
      </div>
      <Progress
        aria-label={t('Invite rewards earned')}
        value={(rewards.claimed / rewards.maxRewards) * 100}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-gray-11">
          {t('{claimed} of {max} rewards earned', {
            claimed: rewards.claimed,
            max: rewards.maxRewards,
          })}
        </span>
        <Button size="xs" onClick={openInvite}>
          {t('Invite')}
        </Button>
      </div>
      <InviteUserDialog open={inviteOpen} setOpen={setInviteOpen} />
    </div>
  );
}

export function InviteRewardButton() {
  const rewards = useInviteRewards();
  const [inviteOpen, setInviteOpen] = useState(false);
  const openInvite = useOpenInviteWithTracking({
    surface: InviteRewardSurface.CREDITS_ALERT,
    rewardsEarned: rewards.claimed,
    open: () => setInviteOpen(true),
  });

  if (!rewards.visible) {
    return null;
  }

  return (
    <>
      <Button size="sm" variant="basic" onClick={openInvite}>
        <Gift className="size-4" />
        {t('Invite a teammate for +{credits}', {
          credits: billingUtils.formatCredits(rewards.creditsPerInvite),
        })}
      </Button>
      <InviteUserDialog open={inviteOpen} setOpen={setInviteOpen} />
    </>
  );
}

export function BonusCreditsLine() {
  const rewards = useInviteRewards();

  if (rewards.bonusCredits <= 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 border-t px-5 py-4 text-sm text-gray-11">
      <Gift className="size-4 shrink-0" />
      <span>
        {t('Bonus credits from invites')}{' '}
        <span className="font-semibold text-gray-12">
          {billingUtils.formatCredits(rewards.bonusCredits)}
        </span>
      </span>
    </div>
  );
}

export function InviteRewardNotifier() {
  const { platformId, rewards } = useInviteRewards();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (rewards.length === 0) {
      return;
    }
    const seen = readSeenRewardIds(platformId);
    const unseen = rewards.filter(
      (reward) =>
        !seen.includes(reward.id) &&
        dayjs().diff(reward.created, 'day') < TOAST_RECENT_DAYS,
    );
    if (unseen.length === 0) {
      return;
    }
    unseen.forEach((reward) =>
      toast.success(
        t('Congrats 🎉 You got {credits} extra credits', {
          credits: billingUtils.formatCredits(reward.credits),
        }),
        {
          description: t('{email} joined your team.', { email: reward.email }),
        },
      ),
    );
    writeSeenRewardIds({
      platformId,
      ids: [...seen, ...unseen.map((reward) => reward.id)],
    });
    queryClient
      .invalidateQueries({ queryKey: ['platform', platformId] })
      .catch(() => undefined);
  }, [platformId, rewards, queryClient]);

  return null;
}

function useOpenInviteWithTracking({
  surface,
  rewardsEarned,
  open,
}: {
  surface: InviteRewardSurface;
  rewardsEarned: number;
  open: () => void;
}): () => void {
  const { capture } = useTelemetry();
  return () => {
    capture({
      name: TelemetryEventName.INVITE_REWARD_OFFER_CLICKED,
      payload: { surface, rewardsEarned },
    });
    open();
  };
}

function seenStorageKey(platformId: string): string {
  return `${SEEN_STORAGE_PREFIX}${platformId}`;
}

function readSeenRewardIds(platformId: string): string[] {
  const { data } = tryCatchSync((): unknown => {
    const raw = localStorage.getItem(seenStorageKey(platformId));
    return isNil(raw) ? [] : JSON.parse(raw);
  });
  return Array.isArray(data)
    ? data.filter((id): id is string => typeof id === 'string')
    : [];
}

function writeSeenRewardIds({
  platformId,
  ids,
}: {
  platformId: string;
  ids: string[];
}): void {
  tryCatchSync(() =>
    localStorage.setItem(seenStorageKey(platformId), JSON.stringify(ids)),
  );
}

const SEEN_STORAGE_PREFIX = 'ap_invite_reward_seen_';
const CARD_DISMISSAL_DAYS = 7;
const TOAST_RECENT_DAYS = 7;
const cardDismissal = timedDismissal.create({
  storageKeyPrefix: 'ap-invite-reward-card-dismissed',
  durationHours: CARD_DISMISSAL_DAYS * 24,
});
