import { isNil } from '@activepieces/core-utils';
import { ApEdition, ApFlagId, InviteReward } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';

import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { inviteRewardsApi } from '../api/invite-rewards-api';

export function useInviteRewards(): InviteRewardsState {
  const { platform } = platformHooks.useCurrentPlatform();
  const isPlatformAdmin = useIsPlatformAdmin();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  const { data: summary } = useQuery({
    queryKey: [INVITE_REWARDS_QUERY_KEY, platform.id],
    queryFn: inviteRewardsApi.getSummary,
    enabled: edition === ApEdition.CLOUD && isPlatformAdmin,
    staleTime: INVITE_REWARDS_STALE_MS,
  });

  if (isNil(summary)) {
    return HIDDEN;
  }

  const claimed = summary.rewards.length;
  const rewardsLeft = Math.max(0, summary.maxRewards - claimed);
  const seatsLeft = resolveSeatsLeft({
    usersLimit: platform.plan.usersLimit,
    usedSeats:
      (platform.usage?.activeUsers ?? 0) + (platform.usage?.invitedSeats ?? 0),
  });

  return {
    visible: summary.eligible && rewardsLeft > 0 && seatsLeft > 0,
    platformId: platform.id,
    creditsPerInvite: summary.creditsPerInvite,
    claimed,
    maxRewards: summary.maxRewards,
    rewardsLeft: Math.min(rewardsLeft, seatsLeft),
    rewards: summary.rewards,
    bonusCredits: summary.rewards.reduce(
      (total, reward) => total + reward.credits,
      0,
    ),
  };
}

function resolveSeatsLeft({
  usersLimit,
  usedSeats,
}: {
  usersLimit: number | null | undefined;
  usedSeats: number;
}): number {
  return isNil(usersLimit)
    ? Number.POSITIVE_INFINITY
    : Math.max(0, usersLimit - usedSeats);
}

const INVITE_REWARDS_QUERY_KEY = 'invite-rewards';
const INVITE_REWARDS_STALE_MS = 60_000;

const HIDDEN: InviteRewardsState = {
  visible: false,
  platformId: null,
  creditsPerInvite: 0,
  claimed: 0,
  maxRewards: 0,
  rewardsLeft: 0,
  rewards: [],
  bonusCredits: 0,
};

export type InviteRewardsState = {
  visible: boolean;
  platformId: string | null;
  creditsPerInvite: number;
  claimed: number;
  maxRewards: number;
  rewardsLeft: number;
  rewards: InviteReward[];
  bonusCredits: number;
};
