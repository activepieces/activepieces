import { QueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { internalErrorToast } from '@/components/ui/sonner';
import {
  UpdateActiveFlowsAddonParams,
  CreateSubscriptionParams,
  CreateAICreditCheckoutSessionParamsSchema,
  UpdateAICreditsAutoTopUpParamsSchema,
} from '@activepieces/ee-shared';

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
  useUpdateAutoTopUp: (queryClient: QueryClient) => {
    return useMutation({
      mutationFn: async (params: UpdateAICreditsAutoTopUpParamsSchema) => {
        const { stripeCheckoutUrl } = await platformBillingApi.updateAutoTopUp(
          params,
        );
        if (stripeCheckoutUrl) {
          window.open(stripeCheckoutUrl, '_blank');
        }
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: ['platform-billing-subscription'],
        });
        toast.success(t('Auto top-up config saved'));
      },
      onError: (error) => {
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
};
