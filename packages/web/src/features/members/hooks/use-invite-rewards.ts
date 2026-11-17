import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  EMPTY_INVITE_REWARD_SUMMARY,
  InviteReward,
} from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';

import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { inviteRewardsApi } from '../api/invite-rewards-api';

export function useInviteRewards(): InviteRewardsState {
  const { platform } = platformHooks.useCurrentPlatform();
  const isPlatformAdmin = useIsPlatformAdmin();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const hasPendingInvites = (platform.usage?.invitedSeats ?? 0) > 0;

  const { data } = useQuery({
    queryKey: [INVITE_REWARDS_QUERY_KEY, platform.id],
    queryFn: inviteRewardsApi.getSummary,
    enabled: edition === ApEdition.CLOUD && isPlatformAdmin,
    staleTime: INVITE_REWARDS_STALE_MS,
    refetchInterval: ({ state }) =>
      hasPendingInvites &&
      !isNil(state.data) &&
      state.data.eligible &&
      state.data.rewards.length < state.data.maxRewards
        ? INVITE_REWARDS_STALE_MS
        : false,
  });
  const summary = data ?? EMPTY_INVITE_REWARD_SUMMARY;

  const rewardsEarned = summary.rewards.length;
  const rewardsUnderCap = Math.max(0, summary.maxRewards - rewardsEarned);
  const usersLimit = platform.plan.usersLimit;
  const seatsLeft = isNil(usersLimit)
    ? Number.POSITIVE_INFINITY
    : Math.max(0, usersLimit - (platform.usage?.users ?? 0));

  return {
    visible: summary.eligible && rewardsUnderCap > 0 && seatsLeft > 0,
    platformId: platform.id,
    creditsPerInvite: summary.creditsPerInvite,
    rewardsEarned,
    maxRewards: summary.maxRewards,
    rewardsLeft: Math.min(rewardsUnderCap, seatsLeft),
    rewards: summary.rewards,
    bonusCredits: summary.rewards.reduce(
      (total, reward) => total + reward.credits,
      0,
    ),
  };
}

const INVITE_REWARDS_QUERY_KEY = 'invite-rewards';
const INVITE_REWARDS_STALE_MS = 60_000;

export type InviteRewardsState = {
  visible: boolean;
  platformId: string;
  creditsPerInvite: number;
  rewardsEarned: number;
  maxRewards: number;
  rewardsLeft: number;
  rewards: InviteReward[];
  bonusCredits: number;
};
