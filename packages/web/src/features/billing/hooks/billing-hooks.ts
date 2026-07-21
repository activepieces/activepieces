import {
  AiCreditsAutoTopUpState,
  AutoTopUpConfig,
  ConsumableProductAutoTopupParams,
  CheckoutPlanParams,
  PlatformBillingInformation,
  AdjustUnconsumableFeatureQuantityParams,
} from '@activepieces/shared';
import {
  QueryClient,
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { internalErrorToast } from '@/components/ui/sonner';

import { platformBillingApi } from '../api/billing-plans-api';
import { usePlanSwitchSuccessDialogStore } from '../stores/plan-switch-success-dialog-state';

export const PLATFORM_BILLING_SUBSCRIPTION_KEY = [
  'platform-billing-subscription',
] as const;

export const billingKeys = {
  platformSubscription: (platformId: string) =>
    [...PLATFORM_BILLING_SUBSCRIPTION_KEY, platformId] as const,
  plans: (platformId: string) =>
    ['platform-billing-plans', platformId] as const,
  projectsUsage: (
    platformId: string,
    params: {
      startDate?: string;
      endDate?: string;
      cursor?: string;
      limit?: number;
    },
  ) => ['platform-billing-projects-usage', platformId, params] as const,
};

export const billingMutations = {
  useCheckout: (setIsOpen?: (isOpen: boolean) => void) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (params: CheckoutPlanParams) =>
        platformBillingApi.checkout(params),
      onSuccess: ({ checkoutUrl }, { planId }) => {
        if (checkoutUrl) {
          window.open(checkoutUrl, '_blank');
        } else {
          refreshBillingCaches(queryClient);
          usePlanSwitchSuccessDialogStore.getState().openDialog(planId);
        }
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
  useCancelSubscription: (setIsOpen?: (isOpen: boolean) => void) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: () => platformBillingApi.cancel(),
      onSuccess: () => {
        refreshBillingCaches(queryClient);
        toast.success(
          t('Your plan will be canceled at the end of the billing period'),
        );
        setIsOpen?.(false);
      },
      onError: () => {
        toast.error(t('Failed to cancel subscription'));
        internalErrorToast();
      },
    });
  },
  useReactivateSubscription: (setIsOpen?: (isOpen: boolean) => void) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: () => platformBillingApi.reactivate(),
      onSuccess: () => {
        refreshBillingCaches(queryClient);
        toast.success(t("You'll stay on your current plan"));
        setIsOpen?.(false);
      },
      onError: () => {
        toast.error(t('Failed to update subscription'));
        internalErrorToast();
      },
    });
  },
  useRefreshSubscription: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: () => platformBillingApi.refreshSubscriptionInfo(),
      onSuccess: (info) => {
        queryClient.setQueriesData<PlatformBillingInformation>(
          { queryKey: PLATFORM_BILLING_SUBSCRIPTION_KEY },
          info,
        );
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
  useAdjustUnconsumableFeatureQuantity: (
    setIsOpen?: (isOpen: boolean) => void,
  ) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (params: AdjustUnconsumableFeatureQuantityParams) =>
        platformBillingApi.adjustUnconsumableFeatureQuantity(params),
      onSuccess: ({ paymentUrl }) => {
        if (paymentUrl) {
          window.open(paymentUrl, '_blank');
        }
        refreshBillingCaches(queryClient);
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
        await platformBillingApi.updateAutoTopUp(params);
      },
      onMutate: async (params) => {
        await queryClient.cancelQueries({
          queryKey: PLATFORM_BILLING_SUBSCRIPTION_KEY,
        });
        const previous = queryClient.getQueriesData<PlatformBillingInformation>(
          { queryKey: PLATFORM_BILLING_SUBSCRIPTION_KEY },
        );
        queryClient.setQueriesData<PlatformBillingInformation>(
          { queryKey: PLATFORM_BILLING_SUBSCRIPTION_KEY },
          (old) => old && applyOptimisticAutoTopUp(old, params),
        );
        return { previous };
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: PLATFORM_BILLING_SUBSCRIPTION_KEY,
        });
        toast.success(t('Auto top-up config saved'));
      },
      onError: (_error, _params, context) => {
        restoreBillingSubscription(queryClient, context?.previous);
        toast.error(t('Auto top-up config change failed'));
        internalErrorToast();
      },
    });
  },
  useSetupPayment: () => {
    return useMutation({
      mutationFn: async () => {
        const { url } = await platformBillingApi.setupPayment({
          redirectUrl: `${window.location.origin}/platform/setup/billing/success?action=setup`,
        });
        if (url) {
          window.open(url, '_blank');
        }
      },
      onError: () => {
        internalErrorToast();
      },
    });
  },
};

export const billingQueries = {
  usePlatformSubscription: (platformId: string, enabled = true) => {
    return useQuery({
      queryKey: billingKeys.platformSubscription(platformId),
      queryFn: platformBillingApi.getSubscriptionInfo,
      staleTime: 5 * 60 * 1000,
      refetchOnMount: 'always',
      refetchOnWindowFocus: false,
      enabled,
    });
  },
  useListPlans: (platformId: string, enabled = true) => {
    return useQuery({
      queryKey: billingKeys.plans(platformId),
      queryFn: platformBillingApi.listPlans,
      staleTime: 60 * 1000,
      enabled,
    });
  },
  useProjectsUsage: (
    platformId: string,
    params: {
      startDate?: string;
      endDate?: string;
      cursor?: string;
      limit?: number;
    },
    enabled = true,
  ) => {
    return useQuery({
      queryKey: billingKeys.projectsUsage(platformId, params),
      queryFn: () => platformBillingApi.getProjectsUsage(params),
      enabled,
    });
  },
};

function refreshBillingCaches(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['platform'] });
  queryClient.invalidateQueries({ queryKey: ['flags'] });
  queryClient.invalidateQueries({
    queryKey: PLATFORM_BILLING_SUBSCRIPTION_KEY,
  });
}

function applyOptimisticAutoTopUp(
  info: PlatformBillingInformation,
  params: ConsumableProductAutoTopupParams,
): PlatformBillingInformation {
  if (params.state === AiCreditsAutoTopUpState.DISABLED) {
    return {
      ...info,
      autoTopUps: info.autoTopUps.map((topUp) =>
        topUp.featureId === params.featureId
          ? { ...topUp, enabled: false }
          : topUp,
      ),
    };
  }
  const entry: AutoTopUpConfig = {
    featureId: params.featureId,
    enabled: true,
    threshold: params.minThreshold,
    quantity: params.creditsToAdd,
    maxMonthlyTopUps: params.maxMonthlyTopUps,
  };
  const exists = info.autoTopUps.some(
    (topUp) => topUp.featureId === params.featureId,
  );
  return {
    ...info,
    autoTopUps: exists
      ? info.autoTopUps.map((topUp) =>
          topUp.featureId === params.featureId ? entry : topUp,
        )
      : [...info.autoTopUps, entry],
  };
}

function restoreBillingSubscription(
  queryClient: QueryClient,
  previous: [QueryKey, PlatformBillingInformation | undefined][] | undefined,
): void {
  previous?.forEach(([key, data]) =>
    queryClient.setQueryData<PlatformBillingInformation>(key, data),
  );
}
