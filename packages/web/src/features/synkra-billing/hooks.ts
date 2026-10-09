import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import {
  CheckoutResponse,
  SynkraAiBalance,
  SynkraSubscription,
  SynkraUsage,
  synkraAiApi,
  synkraSubscriptionApi,
} from '@/api/synkra-subscription-api';

const subQueryKey = ['synkra-subscription'];
const usageQueryKey = ['synkra-usage'];
const aiBalanceQueryKey = ['synkra-ai-balance'];

export const synkraBillingHooks = {
  useSubscription: () => {
    return useSuspenseQuery<SynkraSubscription, Error>({
      queryKey: subQueryKey,
      queryFn: () => synkraSubscriptionApi.get(),
    });
  },
  useUsage: () => {
    return useSuspenseQuery<SynkraUsage, Error>({
      queryKey: usageQueryKey,
      queryFn: () => synkraSubscriptionApi.getUsage(),
    });
  },
  useCheckout: () => {
    return useMutation<CheckoutResponse, Error, { tier: 'starter' | 'business' | 'pro'; callbackUrl: string }>({
      mutationFn: (params) => synkraSubscriptionApi.checkout(params),
    });
  },
  useAiBalance: () => {
    return useSuspenseQuery<SynkraAiBalance, Error>({
      queryKey: aiBalanceQueryKey,
      queryFn: () => synkraAiApi.getBalance(),
      refetchInterval: 30_000,
    });
  },
};
