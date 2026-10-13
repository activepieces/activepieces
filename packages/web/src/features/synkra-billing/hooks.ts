import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import {
  AddonPack,
  CheckoutResponse,
  CreditBalance,
  PurchaseResponse,
  SynkraAiBalance,
  SynkraSubscription,
  SynkraUsage,
  synkraAiApi,
  synkraCreditsApi,
  synkraSubscriptionApi,
} from '@/api/synkra-subscription-api';

const subQueryKey = ['synkra-subscription'];
const usageQueryKey = ['synkra-usage'];
const aiBalanceQueryKey = ['synkra-ai-balance'];
const creditBalanceKey = ['synkra-credit-balance'];
const creditPacksKey = ['synkra-credit-packs'];

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
  useCreditBalance: () =>
    useSuspenseQuery<CreditBalance, Error>({
      queryKey: creditBalanceKey,
      queryFn: () => synkraCreditsApi.getBalance(),
      refetchInterval: 60_000,
    }),
  useCreditPacks: () =>
    useSuspenseQuery<{ packs: AddonPack[] }, Error>({
      queryKey: creditPacksKey,
      queryFn: () => synkraCreditsApi.listPacks(),
    }),
  usePurchaseCredits: () =>
    useMutation<PurchaseResponse, Error, { packId: string; callbackUrl: string }>({
      mutationFn: (params) => synkraCreditsApi.purchase(params),
    }),
};
