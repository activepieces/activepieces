import { QueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { internalErrorToast } from '@/components/ui/sonner';
import { api } from '@/lib/api';
import {
  ToggleAiCreditsOverageEnabledParams,
  SetAiCreditsOverageLimitParams,
  UpdateActiveFlowsAddonParams,
  CreateSubscriptionParams,
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
        const portalLink = await platformBillingApi.getPortalLink();
        window.open(portalLink, '_blank');
      },
    });
  },
  useUpdateActiveFlowsLimit: (setIsOpen?: (isOpen: boolean) => void) => {
    const navigate = useNavigate();
    return useMutation({
      mutationFn: (params: UpdateActiveFlowsAddonParams) =>
        platformBillingApi.updateActiveFlowsLimits(params),
      onSuccess: (url) => {
        setIsOpen?.(false);
        navigate(url);
        toast.success(t('Plan updated successfully'), {
          duration: 3000,
        });
      },
      onError: () => {
        navigate(`/platform/setup/billing/error`);
      },
    });
  },
  useCreateSubscription: (setIsOpen?: (isOpen: boolean) => void) => {
    return useMutation({
      mutationFn: async (params: CreateSubscriptionParams) => {
        const checkoutSessionURl = await platformBillingApi.createSubscription(
          params,
        );
        window.open(checkoutSessionURl, '_blank');
      },
      onSuccess: () => {
        setIsOpen?.(false);
      },
      onError: (error) => {
        toast.error(t('Starting Subscription failed'), {
          description: t(error.message),
          duration: 3000,
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
        toast.success(t('AI credit usage limit updated successfully'), {
          duration: 3000,
        });
      },
      onError: (error) => {
        if (api.isError(error)) {
          const apError = error.response?.data as ApErrorParams;
          if (apError.code === ErrorCode.VALIDATION) {
            toast.error(t('Setting AI credit usage limit failed'), {
              description: t(apError.params.message),
              duration: 3000,
            });
            return;
          }
        }
        internalErrorToast();
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
        toast.success(t('AI credits overage updated successfully'), {});
      },
      onError: (error) => {
        if (api.isError(error)) {
          const apError = error.response?.data as ApErrorParams;
          if (apError.code === ErrorCode.VALIDATION) {
            toast.error(t('Setting AI credit usage limit failed'), {
              description: t(apError.params.message),
              duration: 3000,
            });
            return;
          }
        }
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
};
