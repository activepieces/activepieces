import { t } from 'i18next';
import { Check, TrendingUp, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';

export const Success = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  const action = searchParams.get('action') || '';

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate('/platform/setup/billing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  const getActionConfig = () => {
    switch (action) {
      case 'upgrade':
        return {
          icon: TrendingUp,
          iconBg: 'bg-emerald-50 dark:bg-emerald-950',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
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
              <Button onClick={() => navigate('/')} className="w-full">
                {t('Go to Dashboard')}
              </Button>

              <Button
                onClick={() => navigate('/platform/setup/billing')}
                variant="outline"
                className="w-full"
              >
                {t('View Billing Details')}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              {t('Redirecting to billing in {countdown} seconds...', {
                countdown,
              })}
            </p>
          </div>
        </CardContent>
      </div>
    </div>
  );
};
