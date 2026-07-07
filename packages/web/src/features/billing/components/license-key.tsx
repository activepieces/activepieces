import { PlatformWithoutSensitiveData } from '@activepieces/shared';
import { t } from 'i18next';
import { useState } from 'react';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { ArrowUpIcon } from '@/components/icons/arrow-up';

import { ActivateLicenseDialog } from './activate-license-dialog';

export const LicenseKey = ({
  platform,
}: {
  platform: PlatformWithoutSensitiveData;
}) => {
  const [isActivateLicenseKeyDialogOpen, setIsActivateLicenseKeyDialogOpen] =
    useState(false);

  return (
    <>
      <AnimatedIconButton
        icon={ArrowUpIcon}
        iconSize={16}
        variant="default"
        className="w-full"
        onClick={() => setIsActivateLicenseKeyDialogOpen(true)}
      >
        {platform.plan.licenseKey
          ? t('Update license key')
          : t('Activate license key')}
      </AnimatedIconButton>

      <ActivateLicenseDialog
        isOpen={isActivateLicenseKeyDialogOpen}
        onOpenChange={setIsActivateLicenseKeyDialogOpen}
      />
    </>
  );
};

LicenseKey.displayName = 'LicenseKeys';
