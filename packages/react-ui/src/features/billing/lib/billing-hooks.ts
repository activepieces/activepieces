import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';

import { queryClient } from '@/app/app';
import { toast, INTERNAL_ERROR_TOAST } from '@/components/ui/use-toast';
import { UpdateSubscriptionParams } from '@activepieces/ee-shared';

import { platformBillingApi } from './api';

export const billingKeys = {
  platformSubscription: (platformId: string) =>
    ['platform-billing-subscription', platformId] as const,
};

export const billingMutations = {
  usePortalLink: () => {
    return useMutation({
      mutationFn: async () => {
        const { portalLink } = await platformBillingApi.getPortalLink();
        window.open(portalLink, '_blank');
      },
      onError: () => toast(INTERNAL_ERROR_TOAST),
    });
  },
  useUpdateSubscription: (setIsOpen: (isOpen: boolean) => void) => {
    return useMutation({
      mutationFn: (params: UpdateSubscriptionParams) =>
        platformBillingApi.updateSubscription(params),
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: billingKeys.platformSubscription(data.platformId),
        });
        setIsOpen(false);
        toast({
          title: t('Success'),
          description: t('Plan upgraded successfully'),
        });
      },
      onError: () => {
        toast(INTERNAL_ERROR_TOAST);
      },
    });
  },
  useCreateSubscription: (setIsOpen: (isOpen: boolean) => void) => {
    return useMutation({
      mutationFn: async (params: UpdateSubscriptionParams) => {
        const checkoutSessionURl = await platformBillingApi.createSubscription(
          params,
        );
        window.open(checkoutSessionURl, '_blank');
      },
      onSuccess: () => {
        setIsOpen(false);
        toast({
          title: t('Success'),
          description: t('Plan created successfully'),
        });
      },
      onError: () => {
        toast(INTERNAL_ERROR_TOAST);
      },
    });
  },
};

export const billingQueries = {
  usePlatformSubscription: (platformId: string) => {
    return useQuery({
      queryKey: ['platform-billing-subscription', platformId],
      queryFn: platformBillingApi.getSubscriptionInfo,
      enabled: !!platformId,
    });
  },
};
