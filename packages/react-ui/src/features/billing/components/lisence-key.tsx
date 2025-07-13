import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Shield, Zap, AlertTriangle, Check } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/utils';
import {
  ApEdition,
  ApFlagId,
  isNil,
  PlatformPlanLimits,
} from '@activepieces/shared';

import { ActivateLicenseDialog } from './activate-license-dialog';

const LICENSE_PROPS_MAP = {
  agentsEnabled: 'Agents Enabled',
  environmentEnabled: 'Team Collaboration via Git',
  analyticsEnabled: 'Analytics',
  auditLogEnabled: 'Audit Log',
  embeddingEnabled: 'Embedding',
  managePiecesEnabled: 'Manage Pieces',
  manageTemplatesEnabled: 'Manage Templates',
  customAppearanceEnabled: 'Brand Activepieces',
  manageProjectsEnabled: 'Manage Projects',
  projectRolesEnabled: 'Project Roles',
  customDomainsEnabled: 'Custom Domains',
  apiKeysEnabled: 'API Keys',
  flowIssuesEnabled: 'Flow Issues',
  alertsEnabled: 'Alerts',
  ssoEnabled: 'Single Sign On',
};

const LicenseKeySchema = Type.Object({
  tempLicenseKey: Type.String({
    errorMessage: t('License key is invalid'),
  }),
});

type LicenseKeySchema = Static<typeof LicenseKeySchema>;

export const LicenseKey = () => {
  const form = useForm<LicenseKeySchema>({
    resolver: typeboxResolver(LicenseKeySchema),
    defaultValues: {
      tempLicenseKey: '',
    },
    mode: 'onChange',
  });
  const { platform } = platformHooks.useCurrentPlatform();
  const [isOpenDialog, setIsOpenDialog] = useState(false);
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { data: showPlatformDemo } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_PLATFORM_DEMO,
  );

  if (edition === ApEdition.COMMUNITY || showPlatformDemo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {t('License Key')}
          </CardTitle>
          <CardDescription>
            {showPlatformDemo &&
              t(
                'This feature is not self serve in the cloud yet, please contact sales@activepieces.com. ',
              )}
            {edition === ApEdition.COMMUNITY && (
              <>
                {t('This feature is not available in your current edition. ')}
                <Link
                  className="text-primary hover:underline"
                  target="_blank"
                  to="https://www.activepieces.com/docs/install/configuration/overview"
                >
                  {t('Learn how to upgrade')}
                </Link>
              </>
            )}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

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
        <Badge
          variant="outline"
          className="gap-1 border-yellow-500 text-yellow-600"
        >
          <AlertTriangle className="w-3 h-3" />
          {t('Expires soon')}
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="gap-1 border-green-500 text-green-600"
      >
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
              <h3 className="text-lg font-semibold">{t('Lisence Key')}</h3>
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
            {t('Enterprise Features')}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(LICENSE_PROPS_MAP).map(([key, label]) => {
              const featureEnabled =
                platform?.plan?.[key as keyof PlatformPlanLimits];
              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
                >
                  <span className="text-sm font-medium">{t(label)}</span>
                  {featureEnabled ? (
                    <Badge variant="default">{t('Enabled')}</Badge>
                  ) : (
                    <Badge variant="destructive">{t('Disabled')}</Badge>
                  )}
                </div>
              );
            })}
          </div>
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
