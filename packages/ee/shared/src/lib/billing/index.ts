import { PiecesFilterType } from '@activepieces/shared';


export type FlowPlanLimits = {
  nickname: string;
  tasks: number;
  pieces: string[];
  aiTokens: number;
  piecesFilterType: PiecesFilterType;
};

export const MAXIMUM_ALLOWED_TASKS = 1000000;

export const DEFAULT_FREE_PLAN_LIMIT = {
  nickname: 'free-pay-as-you-go',
  tasks: 1000,
  pieces: [],
  aiTokens: 200,
  piecesFilterType: PiecesFilterType.NONE,
};

export const DEFAULT_PLATFORM_LIMIT = {
  nickname: 'platform',
  tasks: 50000,
  pieces: [],
  aiTokens: undefined,
  piecesFilterType: PiecesFilterType.NONE,
};

export function getTasksPriceId(stripeKey: string | undefined) {
  const testMode = stripeKey?.startsWith('sk_test');
  return testMode
    ? 'price_1OnWqKKZ0dZRqLEKkcYBso8K'
    : 'price_1Qf7RiKZ0dZRqLEKAgP38l7w';
}

export const PRICE_PER_1000_TASKS = 1;

export enum ApSubscriptionStatus {
  ACTIVE = 'active',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNAPID = 'unpaid',
}
