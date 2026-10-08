import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import {
  CheckoutResponse,
  SynkraSubscription,
  SynkraUsage,
  synkraSubscriptionApi,
} from '@/api/synkra-subscription-api';

const subQueryKey = ['synkra-subscription'];
const usageQueryKey = ['synkra-usage'];

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
};
