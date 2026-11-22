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
      const left = state.data?.rewardedInvitesLeft;
      return hasPendingInvites && !isNil(left) && left > 0
        ? INVITE_REWARDS_STALE_MS
        : false;
    },
  });
  const rewardedInvitesLeft = data?.rewardedInvitesLeft ?? null;

  const seatLimits = [
    platform.plan.usersLimit,
    platform.plan.scheduledUsersLimit,
  ].filter((limit): limit is number => !isNil(limit));
  const usersLimit = seatLimits.length === 0 ? null : Math.min(...seatLimits);
  const seatsLeft = isNil(usersLimit)
    ? Number.POSITIVE_INFINITY
    : Math.max(0, usersLimit - (platform.usage?.users ?? 0));

  return {
    visible:
      !isNil(rewardedInvitesLeft) && rewardedInvitesLeft > 0 && seatsLeft > 0,
    platformId: platform.id,
    creditsPerInvite: INVITE_REWARD_CREDITS,
    rewardedInvitesLeft,
  };
}

const INVITE_REWARDS_STALE_MS = 60_000;
const INVITE_REWARD_CREDITS = 1000;

export type InviteRewardsState = {
  visible: boolean;
  platformId: string;
  creditsPerInvite: number;
  rewardedInvitesLeft: number | null;
};
