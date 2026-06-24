import { useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check, TrendingUp, TrendingDown } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { LoadingSpinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { platformHooks } from '@/hooks/platform-hooks';

import { platformBillingApi } from '../api/billing-plans-api';
import { billingKeys } from '../hooks/billing-hooks';

const FINALIZE_POLLS = 3;
const FINALIZE_INTERVAL_MS = 2500;
const REDIRECT_DELAY_MS = 5000;

export const Success = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { platform } = platformHooks.useCurrentPlatform();
  const [searchParams] = useSearchParams();

  const action = searchParams.get('action') || '';

  // No webhooks: the Stripe→Autumn sync is async, so let React Query poll the subscription a few times after
  // the redirect until the new entitlements land. `dataUpdateCount` lives on the query object, so the
  // stop-after-N condition needs no counter state or effect.
  const { isPending: finalizing } = useQuery({
    queryKey: billingKeys.platformSubscription(platform.id),
    queryFn: platformBillingApi.getSubscriptionInfo,
    refetchInterval: (query) =>
      query.state.dataUpdateCount >= FINALIZE_POLLS
        ? false
        : FINALIZE_INTERVAL_MS,
  });

  // The plan/flag caches only need to be fresh when the user leaves this page, so invalidate them in the
  // navigation handler rather than on a poll timer.
  const leave = useCallback(
    (path: string) => {
      queryClient.invalidateQueries({ queryKey: ['platform'] });
      queryClient.invalidateQueries({ queryKey: ['flags'] });
      navigate(path);
    },
    [queryClient, navigate],
  );

  // Auto-redirect is a timer (an external system), the one case the React docs sanction an effect for: once
  // the confirmed state is shown, a single timeout sends the user to billing.
  useEffect(() => {
    if (finalizing) {
      return;
    }
    const timer = setTimeout(
      () => leave('/platform/setup/billing'),
      REDIRECT_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [finalizing, leave]);

  const getActionConfig = () => {
    switch (action) {
      case 'upgrade':
        return {
          icon: TrendingUp,
          iconBg: 'bg-success-50 dark:bg-success-950',
          iconColor: 'text-success-600 dark:text-success-400',
          title: t('Successfully Upgraded!'),
          description: t('Subscription updated successfully'),
        };
      case 'downgrade':
        return {
          icon: TrendingDown,
          iconBg: 'bg-orange-50 dark:bg-orange-950',
          iconColor: 'text-orange-600 dark:text-orange-400',
          title: t('Plan Downgraded'),
          description: t('Subscription updated successfully'),
        };
      case 'create':
        return {
          icon: Check,
          iconBg: 'bg-primary/10',
          iconColor: 'text-primary',
          title: t('Success!'),
          description: t('Subscription created successfully'),
        };
      default:
        return {
          icon: Check,
          iconBg: 'bg-primary/10',
          iconColor: 'text-primary',
          title: t('Success!'),
          description: t('Subscription updated successfully'),
        };
    }
  };

  const config = getActionConfig();
  const IconComponent = config.icon;

  if (finalizing) {
    return (
      <div className="h-full bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <CardContent className="pt-8 pb-6 px-6">
            <div className="flex flex-col items-center gap-4">
              <LoadingSpinner />
              <p className="text-lg text-muted-foreground">
                {t('Finalizing your payment…')}
              </p>
            </div>
          </CardContent>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <CardContent className="pt-8 pb-6 px-6">
          <div className="text-center space-y-6">
            <div
              className={`mx-auto w-20 h-20 ${config.iconBg} rounded-full flex items-center justify-center`}
            >
              <IconComponent className={`w-10 h-10 ${config.iconColor}`} />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-foreground">
                {config.title}
              </h1>
              <p className="text-lg text-muted-foreground">
                {config.description}
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button onClick={() => leave('/')} className="w-full">
                {t('Go to Dashboard')}
              </Button>

              <Button
                onClick={() => leave('/platform/setup/billing')}
                variant="outline"
                className="w-full"
              >
                {t('View Billing Details')}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              {t('Redirecting to billing shortly...')}
            </p>
          </div>
        </CardContent>
      </div>
    </div>
  );
};
