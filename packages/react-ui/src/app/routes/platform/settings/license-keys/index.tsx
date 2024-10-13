import { ApEdition, ApFlagId, isNil, ErrorCode } from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { CircleCheckBig } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { LoadingSpinner } from '@/components/ui/spinner';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { platformApi } from '@/lib/platforms-api';

const LICENSE_PROPS_MAP = {
  cloudAuthEnabled: 'Cloud Authentication',
  gitSyncEnabled: 'Git Sync',
  analyticsEnabled: 'Analytics',
  auditLogEnabled: 'Audit Log',
  embeddingEnabled: 'Embedding',
  managePiecesEnabled: 'Manage Pieces',
  manageTemplatesEnabled: 'Manage Templates',
  customAppearanceEnabled: 'Custom Appearance',
  manageProjectsEnabled: 'Manage Projects',
  projectRolesEnabled: 'Project Roles',
  customDomainsEnabled: 'Custom Domains',
  apiKeysEnabled: 'API Keys',
  flowIssuesEnabled: 'Flow Issues',
  alertsEnabled: 'Alerts',
  ssoEnabled: 'SSO',
  emailAuthEnabled: 'Email Authentication',
};

const LicenseKeysPage = () => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();
  const [licenseKey, setLicenseKey] = useState(platform.licenseKey || '');
  const [isActivated, setIsActivated] = useState(false);
  const [tempLicenseKey, setTempLicenseKey] = useState(
    platform.licenseKey || '',
  );
  const [keyData, setKeyData] = useState(null);
  const [isOpenDialog, setIsOpenDialog] = useState(false);

  const { mutate: activateLicenseKey, isPending } = useMutation({
    mutationFn: async () => {
      if (tempLicenseKey.trim() === '') return;
      const response = await platformApi.verifyLicenseKey(
        tempLicenseKey.trim(),
      );
      if (!isNil(response)) {
        setIsActivated(true);
        setKeyData(response);
        setLicenseKey(tempLicenseKey.trim());
        setIsOpenDialog(false);
        await refetch();
      } else {
        setIsActivated(false);
      }
    },
    onSuccess: () => {
      toast({
        title: isActivated ? t('Success') : t('Error'),
        description: isActivated
          ? t('License key activated')
          : t('Invalid license key'),
        duration: 3000,
      });
    },
    onError: () => {
      toast({
        title: t('Error'),
        description: t('Invalid license key'),
        duration: 3000,
      });
    },
  });

  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  if (edition !== ApEdition.ENTERPRISE) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold w-full">{t('License Keys')}</h1>
        <p className="text-md text-gray-500 w-full">
          {t('This feature is not available in your edition. ')}
          <Link
            className="text-blue-500"
            target="_blank"
            to="https://www.activepieces.com/docs/install/configuration/overview"
          >
            {t('Upgrade to Enterprise')}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex-col w-full">
      <div className="mb-4 flex">
        <div className="flex justify-between flex-row w-full">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold w-full">{t('License Keys')}</h1>
            <p className="text-md text-gray-500 w-full">
              {t(
                'The license key is used to activate the platform and enable enterprise features. ',
              )}
              {!isNil(keyData?.expiresAt) && (
                <>
                  {t('Expires on ')}
                  {dayjs(keyData.expiresAt).format('MMM D, YYYY')}
                </>
              )}
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 mb-5">
        <div className="flex flex-row gap-2">
          <Input
            value={licenseKey}
            disabled
            onChange={(e) => setLicenseKey(e.target.value)}
            placeholder="Enter your license key"
          />
          <Dialog open={isOpenDialog} onOpenChange={setIsOpenDialog}>
            <DialogTrigger className="flex items-center justify-center gap-2">
              <PermissionNeededTooltip hasPermission={true}>
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => setTempLicenseKey(licenseKey)}
                >
                  {t('Activate')}
                </Button>
              </PermissionNeededTooltip>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('License Key Activation')}</DialogTitle>
                <DialogDescription>
                  {t('Enter your license key to activate it.')}
                </DialogDescription>
              </DialogHeader>
              <Input
                value={tempLicenseKey}
                onChange={(e) => setTempLicenseKey(e.target.value)}
                placeholder="Enter your license key"
              />
              <DialogFooter className="justify-end">
                <DialogClose asChild>
                  <Button
                    variant={'outline'}
                    onClick={() => setTempLicenseKey(licenseKey)}
                  >
                    {t('Cancel')}
                  </Button>
                </DialogClose>
                <Button
                  disabled={tempLicenseKey.trim() === ''}
                  onClick={() => activateLicenseKey()}
                >
                  {isPending ? (
                    <LoadingSpinner className="w-4 h-4" />
                  ) : (
                    t('Confirm')
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div>
        {Object.entries(LICENSE_PROPS_MAP).map(
          ([key, label]) =>
            platform?.[key as keyof typeof platform] && (
              <div className="flex flex-row items-center" key={key}>
                <CircleCheckBig className="w-4 h-4 text-green-500 mr-2" />
                <h3 className="text-lg">{t(label)}</h3>
              </div>
            ),
        )}
      </div>
    </div>
  );
};

LicenseKeysPage.displayName = 'LicenseKeysPage';
export { LicenseKeysPage };
