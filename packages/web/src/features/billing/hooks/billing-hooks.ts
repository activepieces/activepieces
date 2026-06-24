import {
  ConsumableProductTopupParams,
  ConsumableProductAutoTopupParams,
  CheckoutPlanParams,
} from '@activepieces/shared';
import { QueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { internalErrorToast } from '@/components/ui/sonner';

import { platformBillingApi } from '../api/billing-plans-api';

export const billingKeys = {
  platformSubscription: (platformId: string) =>
    ['platform-billing-subscription', platformId] as const,
  plans: (platformId: string) =>
    ['platform-billing-plans', platformId] as const,
};

export const billingMutations = {
  useCheckout: (setIsOpen?: (isOpen: boolean) => void) => {
    return useMutation({
      mutationFn: async (params: CheckoutPlanParams) => {
        const { checkoutUrl } = await platformBillingApi.checkout(params);
        if (checkoutUrl) {
          window.open(checkoutUrl, '_blank');
        }
      },
      onSuccess: () => {
        setIsOpen?.(false);
      },
      onError: (error) => {
        toast.error(t('Starting checkout failed'), {
          description: t(error.message),
          duration: 3000,
        });
      },
    });
  },
  usePortalLink: () => {
    return useMutation({
      mutationFn: async () => {
        const portalLink = await platformBillingApi.getPortalLink();
        window.open(portalLink, '_blank');
      },
    });
  },
  useConsumableProductTopup: (setIsOpen?: (isOpen: boolean) => void) => {
    return useMutation({
      mutationFn: async (params: ConsumableProductTopupParams) => {
        const { paymentUrl } =
          await platformBillingApi.createConsumableProductTopup(params);
        window.open(paymentUrl, '_blank');
      },
      onSuccess: () => {
        setIsOpen?.(false);
      },
      onError: (error) => {
        toast.error(t('Starting Checkout Session failed'), {
          description: t(error.message),
          duration: 3000,
        });
      },
    });
  },
  useUpdateAutoTopUp: (queryClient: QueryClient) => {
    return useMutation({
      mutationFn: async (params: ConsumableProductAutoTopupParams) => {
        const { paymentUrl } = await platformBillingApi.updateAutoTopUp(params);
        if (paymentUrl) {
          window.open(paymentUrl, '_blank');
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['platform-billing-subscription'],
        });
        toast.success(t('Auto top-up config saved'));
      },
      onError: () => {
        toast.error(t('Auto top-up config change failed'));
        internalErrorToast();
      },
    });
  },
};

export const billingQueries = {
  usePlatformSubscription: (platformId: string) => {
    return useQuery({
      queryKey: billingKeys.platformSubscription(platformId),
      queryFn: platformBillingApi.getSubscriptionInfo,
    });
  },
  useListPlans: (platformId: string, enabled = true) => {
    return useQuery({
      queryKey: billingKeys.plans(platformId),
      queryFn: platformBillingApi.listPlans,
      enabled,
    });
  },
};
