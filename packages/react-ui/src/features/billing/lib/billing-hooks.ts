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
  CreateAICreditCheckoutSessionParamsSchema,
  EnableAICreditsAutoTopUpParamsSchema,
  ListAICreditsPaymentsRequestParams,
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
  useCreateAICreditCheckoutSession: (setIsOpen?: (isOpen: boolean) => void) => {
    return useMutation({
      mutationFn: async (params: CreateAICreditCheckoutSessionParamsSchema) => {
        const { stripeCheckoutUrl } =
          await platformBillingApi.createAICreditCheckoutSession(params);
        window.open(stripeCheckoutUrl, '_blank');
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
  useEnableAutoTopUp: (queryClient: QueryClient) => {
    return useMutation({
      mutationFn: async (params: EnableAICreditsAutoTopUpParamsSchema) => {
        const { stripeCheckoutUrl } =
          await platformBillingApi.enableAutoTopUp(params);
        if (stripeCheckoutUrl) {
          window.open(stripeCheckoutUrl, '_blank');
        }
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: ['platform-billing-subscription'],
        });
        toast.success(t('Auto top-up enabled successfully'));
      },
      onError: (error) => {
        toast.error(t('Enabling auto top-up failed'));
        internalErrorToast();
      },
    });
  },
  useUpdateAutoTopUpConfig: (queryClient: QueryClient) => {
    return useMutation({
      mutationFn: async (params: EnableAICreditsAutoTopUpParamsSchema) => {
        const { stripeCheckoutUrl } =
          await platformBillingApi.updateAutoTopUpConfig(params);
         if (stripeCheckoutUrl) {
          window.open(stripeCheckoutUrl, '_blank');
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
           queryKey: ['platform-billing-subscription'],
        });
        toast.success(t('Auto top-up configuration updated successfully'));
      },
      onError: () => {
         toast.error(t('Updating auto top-up configuration failed'));
         internalErrorToast();
      },
    });
  },
  useDisableAutoTopUp: (queryClient: QueryClient) => {
    return useMutation({
      mutationFn: () => platformBillingApi.disableAutoTopUp(),
      onSuccess: () => {
        queryClient.invalidateQueries({
           queryKey: ['platform-billing-subscription'],
        });
        toast.success(t('Auto top-up disabled successfully'));
      },
      onError: () => {
        toast.error(t('Disabling auto top-up failed'));
        internalErrorToast();
      },
    });
  },
  useAICreditPayments: (params: ListAICreditsPaymentsRequestParams) => {
    return useQuery({
      queryKey: ['ai-credits-payments', params],
      queryFn: () => platformBillingApi.listAICreditPayments(params),
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
