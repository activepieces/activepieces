import { isNil } from '@activepieces/core-utils';
import { ApEdition, ApFlagId } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';

import { platformBillingApi } from '@/features/billing/api/billing-plans-api';
import { billingKeys } from '@/features/billing/hooks/billing-hooks';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

export function useInviteRewards(): InviteRewardsState {
  const { platform } = platformHooks.useCurrentPlatform();
  const isPlatformAdmin = useIsPlatformAdmin();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const hasPendingInvites = (platform.usage?.invitedSeats ?? 0) > 0;

  const { data } = useQuery({
    queryKey: billingKeys.platformSubscription(platform.id),
    queryFn: platformBillingApi.getSubscriptionInfo,
    enabled: edition === ApEdition.CLOUD && isPlatformAdmin,
    staleTime: INVITE_REWARDS_STALE_MS,
    refetchInterval: ({ state }) => {
      const rewards = state.data?.inviteRewards;
      return hasPendingInvites &&
        !isNil(rewards) &&
        rewards.rewardsEarned < rewards.maxRewards
        ? INVITE_REWARDS_STALE_MS
        : false;
    },
  });
  const inviteRewards = data?.inviteRewards ?? null;
  const maxRewards = inviteRewards?.maxRewards ?? 0;
  const rewardsEarned = inviteRewards?.rewardsEarned ?? 0;
  const rewardsLeft = Math.max(0, maxRewards - rewardsEarned);

  const seatLimits = [
    platform.plan.usersLimit,
    platform.plan.scheduledUsersLimit,
  ].filter((limit): limit is number => !isNil(limit));
  const usersLimit = seatLimits.length === 0 ? null : Math.min(...seatLimits);
  const seatsLeft = isNil(usersLimit)
    ? Number.POSITIVE_INFINITY
    : Math.max(0, usersLimit - (platform.usage?.users ?? 0));

  return {
    visible: !isNil(inviteRewards) && rewardsLeft > 0 && seatsLeft > 0,
    platformId: platform.id,
    creditsPerInvite: inviteRewards?.creditsPerInvite ?? 0,
    rewardsEarned,
    maxRewards,
    rewardsLeft,
  };
}

const INVITE_REWARDS_STALE_MS = 60_000;

export type InviteRewardsState = {
  visible: boolean;
  platformId: string;
  creditsPerInvite: number;
  rewardsEarned: number;
  maxRewards: number;
  rewardsLeft: number;
};
