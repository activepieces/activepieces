import { isNil, tryCatchSync } from '@activepieces/core-utils';
import { InviteRewardSurface, TelemetryEventName } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { ArrowRight, Gift, UserPlus, X } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTelemetry } from '@/components/providers/telemetry-provider';
import { Button } from '@/components/ui/button';
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
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-11">
              {t('{left, plural, =1 {1 reward left} other {# rewards left}}', {
                left: rewards.rewardedInvitesLeft,
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
    (rewards.rewardedInvitesLeft ?? 0) * rewards.creditsPerInvite,
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
            {t('Invite teammates, earn {credits} credits', { credits })}
            <ArrowRight className="ms-auto" />
          </Button>
        </div>
      )}
      {dialog}
    </>
  );
}

export function InviteRewardNotifier() {
  const { platformId, rewardedInvitesLeft, creditsPerInvite } =
    useInviteRewards();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isNil(rewardedInvitesLeft)) {
      return;
    }
    const seen = readSeenRewardedInvitesLeft(platformId);
    if (seen === rewardedInvitesLeft) {
      return;
    }
    writeSeenRewardedInvitesLeft({ platformId, left: rewardedInvitesLeft });
    if (isNil(seen) || rewardedInvitesLeft > seen) {
      return;
    }
    const newRewards = seen - rewardedInvitesLeft;
    toast.success(
      t('Congrats 🎉 You got {credits} extra credits', {
        credits: billingUtils.formatCredits(newRewards * creditsPerInvite),
      }),
      {
        description: t(
          '{count, plural, =1 {A teammate} other {# teammates}} joined your team.',
          { count: newRewards },
        ),
      },
    );
    refreshBillingCaches(queryClient);
  }, [platformId, rewardedInvitesLeft, creditsPerInvite, queryClient]);

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
      payload: {
        surface,
        rewardedInvitesLeft: rewards.rewardedInvitesLeft ?? 0,
      },
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

function readSeenRewardedInvitesLeft(platformId: string): number | null {
  const { data } = tryCatchSync((): unknown =>
    localStorage.getItem(seenStorageKey(platformId)),
  );
  const count = typeof data === 'string' ? Number(data) : Number.NaN;
  return Number.isInteger(count) ? count : null;
}

function writeSeenRewardedInvitesLeft({
  platformId,
  left,
}: {
  platformId: string;
  left: number;
}): void {
  tryCatchSync(() =>
    localStorage.setItem(seenStorageKey(platformId), String(left)),
  );
}

const SEEN_STORAGE_PREFIX = 'ap-invite-rewards-seen-left';
const CARD_DISMISSAL_DAYS = 7;
const cardDismissal = timedDismissal.create({
  storageKeyPrefix: 'ap-invite-reward-card-dismissed',
  durationHours: CARD_DISMISSAL_DAYS * 24,
});

export type InviteOffer = {
  rewards: InviteRewardsState;
  openInvite: () => void;
  dialog: ReactNode;
};
