import {
  AlertCircleIcon,
  Home03Icon,
  RefreshIcon,
} from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';

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
    <div className="h-full bg-gray-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md border-danger-6">
        <CardContent className="pt-8 pb-6 px-6">
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-danger-3 rounded-full flex items-center justify-center">
              <HugeiconsIcon
                icon={AlertCircleIcon}
                className="w-10 h-10 text-danger-11"
              />
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl font-semibold text-gray-12">
                {t('Something went wrong')}
              </h1>
              <p className="text-lg text-gray-11">
                {t('Subscription update failed')}
              </p>
            </div>

            <div className="bg-gray-3/30 rounded-lg p-4 text-left">
              <h3 className="text-sm font-medium text-gray-12 mb-2">
                {t('What you can do:')}
              </h3>
              <ul className="text-sm text-gray-11 space-y-1">
                <li>{t('Verify your payment method')}</li>
                <li>{t('Try again in a few moments')}</li>
                <li>{t('Contact support if issues persist')}</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button
                onClick={() => navigate('/platform/billing')}
                className="w-full"
              >
                <HugeiconsIcon icon={RefreshIcon} className="w-4 h-4 mr-2" />
                {t('Try Again')}
              </Button>

              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="w-full"
              >
                <HugeiconsIcon icon={Home03Icon} className="w-4 h-4 mr-2" />
                {t('Go to Dashboard')}
              </Button>
            </div>

            <p className="text-xs text-gray-11">
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
