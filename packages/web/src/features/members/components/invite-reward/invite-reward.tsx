import { isNil, tryCatchSync } from '@activepieces/core-utils';
import { InviteRewardSurface, TelemetryEventName } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { ArrowRight, Gift, UserPlus, X } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTelemetry } from '@/components/providers/telemetry-provider';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { refreshBillingCaches } from '@/features/billing/hooks/billing-hooks';
import { billingUtils } from '@/features/billing/utils/billing-utils';
import { timedDismissal } from '@/lib/timed-dismissal';

import {
  InviteRewardsState,
  useInviteRewards,
} from '../../hooks/use-invite-rewards';
import { InviteUserDialog } from '../invite-user/invite-user-dialog';

export function InviteRewardCard() {
  const { rewards, openInvite, dialog } = useInviteOffer(
    InviteRewardSurface.SIDEBAR_CARD,
  );
  const dismissal = cardDismissal.useDismissal({
    platformId: rewards.platformId,
  });
  const showCard = rewards.visible && !dismissal.isDismissed;

  return (
    <>
      {showCard && (
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
              onClick={dismissal.dismiss}
            >
              <X className="size-3.5" />
            </Button>
          </div>
          <Progress
            aria-label={t('Invite rewards earned')}
            value={billingUtils.percentUsed({
              used: rewards.rewardsEarned,
              total: rewards.maxRewards,
            })}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-11">
              {t('{claimed} of {max} rewards earned', {
                claimed: rewards.rewardsEarned,
                max: rewards.maxRewards,
              })}
            </span>
            <Button size="xs" onClick={openInvite}>
              {t('Invite')}
            </Button>
          </div>
        </div>
      )}
      {dialog}
    </>
  );
}

export function InviteRewardButton({ offer }: { offer: InviteOffer }) {
  if (!offer.rewards.visible) {
    return null;
  }
  return (
    <Button size="sm" variant="basic" onClick={offer.openInvite}>
      <Gift className="size-4" />
      {t('Invite a teammate for +{credits}', {
        credits: billingUtils.formatCredits(offer.rewards.creditsPerInvite),
      })}
    </Button>
  );
}

export function InviteRewardBillingLink() {
  const { rewards, openInvite, dialog } = useInviteOffer(
    InviteRewardSurface.BILLING_CREDITS,
  );
  const credits = billingUtils.formatCredits(
    rewards.rewardsLeft * rewards.creditsPerInvite,
  );

  return (
    <>
      {rewards.visible && (
        <div className="border-t px-5 py-4">
          <Button
            variant="link"
            size="sm"
            className="h-auto w-full justify-start"
            onClick={openInvite}
          >
            <UserPlus />
            {rewards.rewardsEarned > 0
              ? t('Invite teammates, earn {credits} more', { credits })
              : t('Invite teammates, earn {credits} credits', { credits })}
            <ArrowRight className="ms-auto" />
          </Button>
        </div>
      )}
      {dialog}
    </>
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
    refreshBillingCaches(queryClient);
  }, [platformId, rewards, queryClient]);

  return null;
}

export function useInviteOffer(surface: InviteRewardSurface): InviteOffer {
  const rewards = useInviteRewards();
  const { capture } = useTelemetry();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [dialogMounted, setDialogMounted] = useState(false);
  const openInvite = () => {
    capture({
      name: TelemetryEventName.INVITE_REWARD_OFFER_CLICKED,
      payload: { surface, rewardsEarned: rewards.rewardsEarned },
    });
    setDialogMounted(true);
    setInviteOpen(true);
  };
  const dialog = dialogMounted ? (
    <InviteUserDialog open={inviteOpen} setOpen={setInviteOpen} />
  ) : null;
  return { rewards, openInvite, dialog };
}

function seenStorageKey(platformId: string): string {
  return `${SEEN_STORAGE_PREFIX}:${platformId}`;
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

const SEEN_STORAGE_PREFIX = 'ap-invite-reward-seen';
const CARD_DISMISSAL_DAYS = 7;
const TOAST_RECENT_DAYS = 7;
const cardDismissal = timedDismissal.create({
  storageKeyPrefix: 'ap-invite-reward-card-dismissed',
  durationHours: CARD_DISMISSAL_DAYS * 24,
});

export type InviteOffer = {
  rewards: InviteRewardsState;
  openInvite: () => void;
  dialog: ReactNode;
};
