import { ErrorCode, isNil, tryCatch } from '@activepieces/core-utils';
import {
  AiCreditsAutoTopUpState,
  AutoTopUpConfig,
  ConsumableFeatureId,
  ConsumableProductAutoTopupParams,
  CheckoutPlanParams,
  PlatformBillingInformation,
  PurchasablePlan,
  AdjustUnconsumableFeatureQuantityParams,
  CancelSubscriptionRequest,
} from '@activepieces/shared';
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { platformHooks } from '@/hooks/platform-hooks';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { api } from '@/lib/api';
import {
  mutationFeedback,
  UNDO_TOAST_DURATION_MS,
} from '@/lib/mutation-feedback';

import { platformBillingApi } from '../api/billing-plans-api';
import { planSelectorUtils } from '../components/plan-selector-utils';
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
  useCheckout: ({ onDone, onSeatLimitExceeded }: CheckoutOptions = {}) => {
    const queryClient = useQueryClient();
    const { platform } = platformHooks.useCurrentPlatform();
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
        onDone?.();
      },
      onError: async (error, params) => {
        if (
          !isNil(onSeatLimitExceeded) &&
          api.isApError(error, ErrorCode.QUOTA_EXCEEDED)
        ) {
          const { data: plans } = await tryCatch(() =>
            queryClient.ensureQueryData<PurchasablePlan[]>({
              queryKey: billingKeys.plans(platform.id),
              queryFn: platformBillingApi.listPlans,
            }),
          );
          const targetPlan = plans?.find((plan) => plan.id === params.planId);
          if (!isNil(targetPlan?.includedSeats)) {
            queryClient.invalidateQueries({
              queryKey: PLATFORM_BILLING_SUBSCRIPTION_KEY,
            });
            onSeatLimitExceeded({
              params,
              targetSeats: targetPlan.includedSeats,
              planName: planSelectorUtils.stripPlanInterval(targetPlan.name),
            });
            return;
          }
        }
        mutationFeedback.error({
          error,
          title: t("Couldn't start checkout"),
        });
      },
    });
  },
  useCancelSubscription: ({
    onDone,
    onSeatLimitExceeded,
  }: CancelSubscriptionOptions = {}) => {
    const queryClient = useQueryClient();
    const { mutateAsync: reactivate } = useReactivate();
    return useMutation({
      mutationFn: (request: CancelSubscriptionRequest) =>
        platformBillingApi.cancel(request),
      onSuccess: () => {
        refreshBillingCaches(queryClient);
        toast.success(
          t('Your plan will be canceled at the end of the billing period'),
          {
            duration: UNDO_TOAST_DURATION_MS,
            action: {
              label: t('Keep plan'),
              onClick: () => {
                reactivate().catch(() => undefined);
              },
            },
          },
        );
        onDone?.();
      },
      onError: (error, request) => {
        if (
          !isNil(onSeatLimitExceeded) &&
          api.isApError(error, ErrorCode.QUOTA_EXCEEDED)
        ) {
          queryClient.invalidateQueries({
            queryKey: PLATFORM_BILLING_SUBSCRIPTION_KEY,
          });
          mutationFeedback.markShown(error);
          onSeatLimitExceeded(request);
          return;
        }
        mutationFeedback.error({
          error,
          title: t("Couldn't cancel the subscription"),
        });
      },
    });
  },
  useReactivateSubscription: (setIsOpen?: (isOpen: boolean) => void) =>
    useReactivate(() => setIsOpen?.(false)),
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
          toast.success(t('Finish paying in the new tab to add the seats'));
        } else {
          toast.success(t('Seats updated'));
        }
        refreshBillingCaches(queryClient);
        setIsOpen?.(false);
      },
      onError: (error) => {
        mutationFeedback.error({
          error,
          title: t("Couldn't update seats"),
        });
      },
    });
  },
  useUpdateAutoTopUp: () =>
    useOptimisticMutation<AutoTopUpChange, PlatformBillingInformation>({
      mutationFn: ({ params }) => platformBillingApi.updateAutoTopUp(params),
      queryKey: PLATFORM_BILLING_SUBSCRIPTION_KEY,
      apply: ({ current, vars }) =>
        applyOptimisticAutoTopUp(current, vars.params),
      scope: AUTO_TOP_UP_SCOPE,
      errorTitle: t("Couldn't save auto recharge"),
      success: ({ vars }) =>
        vars.params.state === AiCreditsAutoTopUpState.DISABLED
          ? t('Auto recharge turned off')
          : t('Auto recharge saved'),
      undo: ({ vars }) => ({
        params: autoTopUpParams({
          featureId: vars.params.featureId,
          config: vars.previous,
        }),
        previous: autoTopUpConfig(vars.params),
      }),
    }),
  useSetupPayment: () => {
    return useMutation({
      mutationFn: async () => {
        const { url } = await platformBillingApi.setupPayment({
          redirectUrl: `${window.location.origin}/platform/billing/success?action=setup`,
        });
        if (url) {
          window.open(url, '_blank');
        }
      },
      onError: (error) => {
        mutationFeedback.error({
          error,
          title: t("Couldn't open the payment page"),
        });
      },
    });
  },
};

function useReactivate(onDone?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => platformBillingApi.reactivate(),
    onSuccess: () => {
      refreshBillingCaches(queryClient);
      toast.success(t("You'll stay on your current plan"));
      onDone?.();
    },
    onError: (error) => {
      mutationFeedback.error({
        error,
        title: t("Couldn't keep your plan"),
      });
    },
  });
}

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

export function refreshBillingCaches(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['platform'] });
  queryClient.invalidateQueries({ queryKey: ['flags'] });
  queryClient.invalidateQueries({
    queryKey: PLATFORM_BILLING_SUBSCRIPTION_KEY,
  });
}

function autoTopUpConfig(
  params: ConsumableProductAutoTopupParams,
): AutoTopUpConfig {
  return params.state === AiCreditsAutoTopUpState.DISABLED
    ? {
        featureId: params.featureId,
        enabled: false,
        threshold: 0,
        quantity: 0,
        maxMonthlyTopUps: null,
      }
    : {
        featureId: params.featureId,
        enabled: true,
        threshold: params.minThreshold,
        quantity: params.creditsToAdd,
        maxMonthlyTopUps: params.maxMonthlyTopUps,
      };
}

function autoTopUpParams({
  featureId,
  config,
}: {
  featureId: ConsumableProductAutoTopupParams['featureId'];
  config: AutoTopUpConfig | null | undefined;
}): ConsumableProductAutoTopupParams {
  if (isNil(config) || !config.enabled) {
    return { featureId, state: AiCreditsAutoTopUpState.DISABLED };
  }
  return {
    featureId,
    state: AiCreditsAutoTopUpState.ENABLED,
    minThreshold: config.threshold,
    creditsToAdd: config.quantity,
    maxMonthlyTopUps: config.maxMonthlyTopUps,
  };
}

function applyOptimisticAutoTopUp(
  info: PlatformBillingInformation,
  params: ConsumableProductAutoTopupParams,
): PlatformBillingInformation {
  const autoTopUp = autoTopUpConfig(params);
  return params.featureId === ConsumableFeatureId.AP_CREDITS
    ? {
        ...info,
        creditsFeature: isNil(info.creditsFeature)
          ? info.creditsFeature
          : { ...info.creditsFeature, autoTopUp },
      }
    : {
        ...info,
        appSumoCreditsFeature: isNil(info.appSumoCreditsFeature)
          ? info.appSumoCreditsFeature
          : { ...info.appSumoCreditsFeature, autoTopUp },
      };
}

const AUTO_TOP_UP_SCOPE = 'billing-auto-top-up';

type SeatLimitExceededCheckout = {
  params: CheckoutPlanParams;
  targetSeats: number;
  planName: string;
};

type CheckoutOptions = {
  onDone?: () => void;
  onSeatLimitExceeded?: (request: SeatLimitExceededCheckout) => void;
};

export type AutoTopUpChange = {
  params: ConsumableProductAutoTopupParams;
  previous: AutoTopUpConfig | null | undefined;
};

type CancelSubscriptionOptions = {
  onDone?: () => void;
  onSeatLimitExceeded?: (request: CancelSubscriptionRequest) => void;
};
