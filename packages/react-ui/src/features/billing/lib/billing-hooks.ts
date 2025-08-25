import { QueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useNavigate } from 'react-router-dom';

import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { ListAICreditsUsageRequest } from '@activepieces/common-ai';
import {
  CreateSubscriptionParams,
  ToggleAiCreditsOverageEnabledParams,
  SetAiCreditsOverageLimitParams,
  UpdateSubscriptionParams,
  StartTrialParams,
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
  useUpdateSubscription: (setIsOpen: (isOpen: boolean) => void) => {
    const navigate = useNavigate();
    return useMutation({
      mutationFn: (params: UpdateSubscriptionParams) =>
        platformBillingApi.updateSubscription(params),
      onSuccess: (url) => {
        setIsOpen(false);
        navigate(url);
        toast({
          title: t('Success'),
          description: t('Plan updated successfully'),
        });
      },
      onError: () => {
        navigate(`/platform/setup/billing/error`);
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
      onError: (error) => {
        toast({
          title: t('Creating Subscription failed'),
          description: t(error.message),
          variant: 'default',
          duration: 5000,
        });
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
  useStartTrial: () => {
    return useMutation({
      mutationFn: (params: StartTrialParams) =>
        platformBillingApi.startTrial(params),
      onError: (error) => {
        if (api.isError(error)) {
          const apError = error.response?.data as ApErrorParams;
          if (apError.code === ErrorCode.VALIDATION) {
            toast({
              title: t('Starting trial failed'),
              description: t(apError.params.message),
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
