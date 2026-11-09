import { t } from 'i18next';
import { Gift } from 'lucide-react';

import { billingUtils } from '@/features/billing';

import { useInviteRewards } from '../../hooks/use-invite-rewards';

export function InviteRewardHint() {
  const rewards = useInviteRewards();

  if (!rewards.visible) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 rounded-md bg-accent-3 px-3 py-2 text-sm">
      <Gift className="size-4 shrink-0 text-accent-11" />
      <span>
        {t(
          'Each new teammate who joins earns you {credits} credits ({left} rewards left).',
          {
            credits: billingUtils.formatCredits(rewards.creditsPerInvite),
            left: rewards.rewardsLeft,
          },
        )}
      </span>
    </div>
  );
}
