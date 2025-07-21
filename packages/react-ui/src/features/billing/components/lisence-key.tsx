import dayjs from 'dayjs';
import { t } from 'i18next';
import { Shield, AlertTriangle, Check } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import { formatUtils } from '@/lib/utils';
import { isNil, PlatformWithoutSensitiveData } from '@activepieces/shared';

import { FeatureStatus } from './features-status';

export const LicenseKey = ({
  platform,
}: {
  platform: PlatformWithoutSensitiveData;
}) => {
  const expired =
    !isNil(platform?.plan?.licenseExpiresAt) &&
    dayjs(platform.plan.licenseExpiresAt).isBefore(dayjs());
  const expiresSoon =
    !expired &&
    !isNil(platform?.plan?.licenseExpiresAt) &&
    dayjs(platform.plan.licenseExpiresAt).isBefore(dayjs().add(7, 'day'));

  const getStatusBadge = () => {
    if (expired) {
      return (
        <StatusIconWithText
          text={t('Expired')}
          icon={AlertTriangle}
          variant="error"
        />
      );
    }
    if (expiresSoon) {
      return (
        <StatusIconWithText
          text={t('Expires soon')}
          icon={AlertTriangle}
          variant="default"
        />
      );
    }
    return (
      <StatusIconWithText text={t('Active')} icon={Check} variant="success" />
    );
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg border">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t('License Key')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('Activate your platform and unlock enterprise features')}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {platform.plan.licenseKey && (
          <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <div>
                <p className="text-sm font-medium">{t('License Active')}</p>
                {!isNil(platform.plan.licenseExpiresAt) && (
                  <p className="text-xs text-muted-foreground">
                    {t('Valid until')}{' '}
                    {formatUtils.formatDateOnly(
                      dayjs(platform.plan.licenseExpiresAt).toDate(),
                    )}
                  </p>
                )}
              </div>
            </div>
            {getStatusBadge()}
          </div>
        )}
        <div>
          <h3 className="text-base font-semibold mb-4">
            {t('Enabled Features')}
          </h3>
          <FeatureStatus platform={platform} />
        </div>
      </CardContent>
    </Card>
  );
};

LicenseKey.displayName = 'LicenseKeys';
