import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { CircleCheckBig, CalendarDays, Zap, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/utils';
import { ApEdition, ApFlagId } from '@activepieces/shared';

import { ActivateLicenseDialog } from './activate-license-dialog';

const LICENSE_PROPS_MAP = {
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

const LicenseKeyPage = () => {
  const form = useForm<LicenseKeySchema>({
    resolver: typeboxResolver(LicenseKeySchema),
    defaultValues: {
      tempLicenseKey: '',
    },
    mode: 'onChange',
  });
  const { platform, refetch } = platformHooks.useCurrentPlatform();
  const [isOpenDialog, setIsOpenDialog] = useState(false);
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { data: showPlatformDemo } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_PLATFORM_DEMO,
  );

  if (edition === ApEdition.COMMUNITY || showPlatformDemo) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold w-full">{t('License Key')}</h1>
        <p className="text-md text-gray-500 w-full">
          {showPlatformDemo &&
            t(
              'This feature is not self serve in the cloud yet, please contact sales@activepieces.com. ',
            )}
          {edition === ApEdition.COMMUNITY && (
            <>
              {t('This feature is not available in your current edition. ')}
              {
                <Link
                  className="text-primary"
                  target="_blank"
                  to="https://www.activepieces.com/docs/install/configuration/overview"
                >
                  {t('Learn how to upgrade')}
                </Link>
              }
            </>
          )}
        </p>
      </div>
    );
  }

  const handleOpenDialog = () => {
    form.clearErrors();
    form.reset({ tempLicenseKey: '' });
    setIsOpenDialog(true);
  };

  const handleActivateLicenseKey = () => {
    refetch();
  };

  const expired =
    platform?.licenseExpiresAt &&
    dayjs(platform.licenseExpiresAt).isBefore(dayjs());
  const expiresSoon =
    !expired &&
    platform?.licenseExpiresAt &&
    dayjs(platform.licenseExpiresAt).isBefore(dayjs().add(7, 'day'));

  return (
    <div className="flex-col w-full max-w-2xl">
      <div className="mb-6 flex items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('License Key')}</h1>
          <p className="text-sm text-gray-500">
            {t('Activate your platform and unlock enterprise features')}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {platform.hasLicenseKey && (
          <div className="relative">
            <Input
              value={'....................'}
              readOnly
              disabled={true}
              type={'password'}
              onChange={(e) => {}}
              placeholder={t('License Key')}
              className="pr-20 text-base"
            />
          </div>
        )}
        <Button size="sm" className="w-full" onClick={handleOpenDialog}>
          <Zap className="w-4 h-4 mr-2" />
          {t('Activate License')}
        </Button>
        <ActivateLicenseDialog
          isOpen={isOpenDialog}
          onOpenChange={setIsOpenDialog}
          onActivate={handleActivateLicenseKey}
        />
      </div>

      {platform.licenseExpiresAt && (
        <div className="rounded-lg p-3 mt-5">
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-5 h-5" />
            <div>
              <p className="font-semibold text-sm">{t('Expiration')}</p>
              <p className="text-xs">
                {t('Valid until')}{' '}
                {formatUtils.formatDateOnly(
                  dayjs(platform.licenseExpiresAt).toDate(),
                )}
                {(expiresSoon || expired) && (
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-warning-100 text-warning-300">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {expired ? t('Expired') : t('Expires soon')}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {platform.licenseExpiresAt && <Separator className="my-5" />}

      <div className="rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-5">{t('Features')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {Object.entries(LICENSE_PROPS_MAP).map(
            ([key, label]) =>
              platform?.[key as keyof typeof platform] && (
                <div className="flex items-center p-2 rounded-md" key={key}>
                  <CircleCheckBig className="w-4 h-4 text-green-500 mr-2" />
                  <span className={`text-sm`}>{t(label)}</span>
                </div>
              ),
          )}
        </div>
      </div>
    </div>
  );
};

LicenseKeyPage.displayName = 'LicenseKeyPage';
export { LicenseKeyPage };
