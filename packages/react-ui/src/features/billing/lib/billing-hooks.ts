import { QueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';

import { toast, INTERNAL_ERROR_TOAST } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import {
  CreateSubscriptionParams,
  EnableAiCreditUsageParams,
  UpdateSubscriptionParams,
} from '@activepieces/ee-shared';
import { ApErrorParams, ErrorCode } from '@activepieces/shared';

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
      onSuccess: () => {
        setIsOpen(false);
        toast({
          title: t('Success'),
          description: t('Plan updated successfully'),
        });
      },
      onError: (error) => {
        if (api.isError(error)) {
          const apError = error.response?.data as ApErrorParams;
          if (apError.code === ErrorCode.QUOTA_EXCEEDED_DOWNGRADE) {
            toast({
              title: t('Plan Change Not Possible'),
              description: t(
                `Cannot downgrade because you exceed the limits for: ${apError.params.metrics.join(
                  ', ',
                )}`,
              ),
              variant: 'default',
              duration: 5000,
            });
            return;
          }
        }
        toast(INTERNAL_ERROR_TOAST);
      },
    });
  },
  useCreateSubscription: (setIsOpen: (isOpen: boolean) => void) => {
    return useMutation({
      mutationFn: async (params: CreateSubscriptionParams) => {
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
  useSetAiCreditUsageLimit: (queryClient: QueryClient) => {
    return useMutation({
      mutationFn: (params: EnableAiCreditUsageParams) =>
        platformBillingApi.setAiCreditUsageLimit(params),
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: billingKeys.platformSubscription(data.platformId),
        });
        toast({
          title: t('Success'),
          description: t('AI credit usage limit set successfully'),
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
      queryKey: billingKeys.platformSubscription(platformId),
      queryFn: platformBillingApi.getSubscriptionInfo,
    });
  },
};
