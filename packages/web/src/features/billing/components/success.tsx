import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check, TrendingUp, TrendingDown } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

import { billingMutations, refreshBillingCaches } from '../hooks/billing-hooks';

const REDIRECT_DELAY_MS = 5000;

export const Success = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const action = searchParams.get('action') || '';

  const {
    mutate: finalize,
    isPending,
    isIdle,
  } = billingMutations.useRefreshSubscription();
  const finalizing = isIdle || isPending;

  useEffect(() => {
    finalize();
  }, []);

  function leave(path: string) {
    refreshBillingCaches(queryClient);
    navigate(path);
  }

  useEffect(() => {
    if (finalizing) {
      return;
    }
    const timer = setTimeout(
      () => leave('/platform/billing'),
      REDIRECT_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [finalizing]);

  const getActionConfig = () => {
    switch (action) {
      case 'upgrade':
        return {
          icon: TrendingUp,
          iconBg: 'bg-success-3',
          iconColor: 'text-success-11',
          title: t('Successfully Upgraded!'),
          description: t('Subscription updated successfully'),
        };
      case 'downgrade':
        return {
          icon: TrendingDown,
          iconBg: 'bg-warning-3',
          iconColor: 'text-warning-11',
          title: t('Plan Downgraded'),
          description: t('Subscription updated successfully'),
        };
      case 'create':
        return {
          icon: Check,
          iconBg: 'bg-accent-3',
          iconColor: 'text-accent-11',
          title: t('Success!'),
          description: t('Subscription created successfully'),
        };
      default:
        return {
          icon: Check,
          iconBg: 'bg-accent-3',
          iconColor: 'text-accent-11',
          title: t('Success!'),
          description: t('Subscription updated successfully'),
        };
    }
  };

  const config = getActionConfig();
  const IconComponent = config.icon;

  if (finalizing) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="w-full max-w-md px-6 py-8">
          <div className="flex flex-col items-center gap-4">
            <Spinner className="size-6 text-gray-11" />
            <p className="text-sm text-gray-11">
              {t('Finalizing your payment…')}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center p-4">
      <Card className="w-full max-w-md px-6 py-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className={cn(
              'flex size-12 items-center justify-center rounded-full',
              config.iconBg,
            )}
          >
            <IconComponent className={cn('size-6', config.iconColor)} />
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="text-base font-semibold text-gray-12">
              {config.title}
            </h1>
            <p className="text-sm text-gray-11">{config.description}</p>
          </div>

          <div className="flex w-full flex-col gap-2">
            <Button onClick={() => leave('/')} className="w-full">
              {t('Go to Dashboard')}
            </Button>

            <Button
              onClick={() => leave('/platform/billing')}
              variant="outline"
              className="w-full"
            >
              {t('View Billing Details')}
            </Button>
          </div>

          <p className="text-xs text-gray-11">
            {t('Redirecting to billing shortly...')}
          </p>
        </div>
      </Card>
    </div>
  );
};
