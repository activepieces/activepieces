import { QueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';

import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { ListAICreditsUsageRequest } from '@activepieces/common-ai';
import {
  ToggleAiCreditsOverageEnabledParams,
  SetAiCreditsOverageLimitParams,
} from '@activepieces/ee-shared';
import { ApErrorParams, ErrorCode } from '@activepieces/shared';

import { platformBillingApi } from './api';

export const billingKeys = {
  platformSubscription: (platformId: string) =>
    ['platform-billing-subscription', platformId] as const,
  aiCreditsUsage: (params: ListAICreditsUsageRequest) =>
    ['platform-billing-ai-credits-usage', params] as const,
};

export const billingMutations = {
  usePortalLink: () => {
    return useMutation({
      mutationFn: async () => {
        const portalLink = await platformBillingApi.getPortalLink();
        window.open(portalLink, '_blank');
      },
    });
  },
  useSetAiCreditOverageLimit: (queryClient: QueryClient) => {
    return useMutation({
      mutationFn: (params: SetAiCreditsOverageLimitParams) =>
        platformBillingApi.setAiCreditsOverageLimit(params),
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: billingKeys.platformSubscription(data.platformId),
        });
        toast({
          title: t('Success'),
          description: t('AI credit usage limit set successfully'),
        });
      },
      onError: (error) => {
        if (api.isError(error)) {
          const apError = error.response?.data as ApErrorParams;
          if (apError.code === ErrorCode.VALIDATION) {
            toast({
              title: t('Setting AI credit usage limit failed'),
              description: t(apError.params.message),
              variant: 'default',
              duration: 5000,
            });
            return;
          }
        }
        toast({
          title: t('Setting AI credit usage limit failed'),
          description: t(error.message),
          variant: 'default',
          duration: 5000,
        });
      },
    });
  },
  useToggleAiCreditOverageEnabled: (queryClient: QueryClient) => {
    return useMutation({
      mutationFn: (params: ToggleAiCreditsOverageEnabledParams) =>
        platformBillingApi.toggleAiCreditsOverageEnabled(params),
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: billingKeys.platformSubscription(data.platformId),
        });
        toast({
          title: t('Success'),
          description: t(`AI credits overage updated successfully`),
        });
      },
      onError: (error) => {
        if (api.isError(error)) {
          const apError = error.response?.data as ApErrorParams;
          if (apError.code === ErrorCode.VALIDATION) {
            toast({
              title: t('Setting AI credit usage limit failed'),
              description: t(apError.params.message),
              variant: 'default',
              duration: 5000,
            });
            return;
          }
        }
        toast({
          title: t('Setting AI credit usage limit failed'),
          description: t(error.message),
          variant: 'default',
          duration: 5000,
        });
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
  useAiCreditsUsage: (params: ListAICreditsUsageRequest) => {
    return useQuery({
      queryKey: billingKeys.aiCreditsUsage(params),
      queryFn: () => platformBillingApi.listAiCreditsUsage(params),
    });
  },
};
