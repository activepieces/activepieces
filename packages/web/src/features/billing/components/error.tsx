import { t } from 'i18next';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const Error = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate('/platform/billing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="flex h-full items-center justify-center p-4">
      <Card className="w-full max-w-md px-6 py-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-danger-3">
            <AlertCircle className="size-6 text-danger-11" />
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="text-base font-semibold text-gray-12">
              {t('Something went wrong')}
            </h1>
            <p className="text-sm text-gray-11">
              {t('Subscription update failed')}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 rounded-xl bg-gray-2 p-3 text-left">
            <h3 className="text-sm font-medium text-gray-12">
              {t('What you can do:')}
            </h3>
            <ul className="flex flex-col gap-1 text-sm text-gray-11">
              <li>{t('Verify your payment method')}</li>
              <li>{t('Try again in a few moments')}</li>
              <li>{t('Contact support if issues persist')}</li>
            </ul>
          </div>

          <div className="flex w-full flex-col gap-2">
            <Button
              onClick={() => navigate('/platform/billing')}
              className="w-full"
            >
              <RefreshCw />
              {t('Try Again')}
            </Button>

            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="w-full"
            >
              <Home />
              {t('Go to Dashboard')}
            </Button>
          </div>

          <p className="text-xs text-gray-11">
            {t('Redirecting to billing in {countdown} seconds...', {
              countdown,
            })}
          </p>
        </div>
      </Card>
    </div>
  );
};
