import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Shield, Zap, AlertTriangle, Check } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatUtils } from '@/lib/utils';
import { isNil, PlatformWithoutSensitiveData } from '@activepieces/shared';

import { ActivateLicenseDialog } from './activate-license-dialog';
import { FeatureStatus } from './features-status';

const LicenseKeySchema = Type.Object({
  tempLicenseKey: Type.String({
    errorMessage: t('License key is invalid'),
  }),
});

type LicenseKeySchema = Static<typeof LicenseKeySchema>;

export const LicenseKey = ({
  platform,
}: {
  platform: PlatformWithoutSensitiveData;
}) => {
  const form = useForm<LicenseKeySchema>({
    resolver: typeboxResolver(LicenseKeySchema),
    defaultValues: {
      tempLicenseKey: '',
    },
    mode: 'onChange',
  });
  const [isOpenDialog, setIsOpenDialog] = useState(false);

  const handleOpenDialog = () => {
    form.clearErrors();
    form.reset({ tempLicenseKey: '' });
    setIsOpenDialog(true);
  };

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
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          {t('Expired')}
        </Badge>
      );
    }
    if (expiresSoon) {
      return (
        <Badge variant="accent">
          <AlertTriangle className="w-3 h-3" />
          {t('Expires soon')}
        </Badge>
      );
    }
    return (
      <Badge variant="success">
        <Check className="w-3 h-3" />
        {t('Active')}
      </Badge>
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
          <Button size="sm" variant="accent" onClick={handleOpenDialog}>
            <Zap className="w-4 h-4" />
            {platform.plan.licenseKey
              ? t('Update License')
              : t('Activate License')}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {platform.plan.licenseKey && (
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
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

        <ActivateLicenseDialog
          isOpen={isOpenDialog}
          onOpenChange={setIsOpenDialog}
        />
      </CardContent>
    </Card>
  );
};

LicenseKey.displayName = 'LicenseKeys';
