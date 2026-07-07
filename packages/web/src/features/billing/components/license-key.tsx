import { PlatformWithoutSensitiveData } from '@activepieces/shared';
import { t } from 'i18next';
import { useState } from 'react';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { ArrowUpIcon } from '@/components/icons/arrow-up';

import { ActivateLicenseDialog } from './activate-license-dialog';

export const LicenseKey = ({
  platform,
  isSelfHosted = false,
}: {
  platform: PlatformWithoutSensitiveData;
  isSelfHosted?: boolean;
}) => {
  const [isActivateLicenseKeyDialogOpen, setIsActivateLicenseKeyDialogOpen] =
    useState(false);

  return (
    <>
      {isSelfHosted && platform.plan.licenseKey && (
        <CopyToClipboardInput
          textToCopy={platform.plan.licenseKey}
          useInput={true}
        />
      )}
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
