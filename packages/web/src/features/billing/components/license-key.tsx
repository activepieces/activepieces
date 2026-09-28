import { PlatformWithoutSensitiveData } from '@activepieces/shared';
import { ArrowUp02Icon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import { useState } from 'react';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { IconButton } from '@/components/custom/icon-button';

import { ActivateLicenseDialog } from './activate-license-dialog';

export const LicenseKey = ({
  platform,
  isSelfHosted = false,
  isTrialKey = false,
}: {
  platform: PlatformWithoutSensitiveData;
  isSelfHosted?: boolean;
  isTrialKey?: boolean;
}) => {
  const [isActivateLicenseKeyDialogOpen, setIsActivateLicenseKeyDialogOpen] =
    useState(false);
  const activateLabel = isTrialKey
    ? t('Activate trial key')
    : t('Activate license key');

  return (
    <>
      {isSelfHosted && platform.plan.licenseKey && (
        <CopyToClipboardInput
          textToCopy={platform.plan.licenseKey}
          useInput={true}
        />
      )}
      <IconButton
        icon={ArrowUp02Icon}
        variant="default"
        className="w-full"
        onClick={() => setIsActivateLicenseKeyDialogOpen(true)}
      >
        {platform.plan.licenseKey ? t('Update license key') : activateLabel}
      </IconButton>

      <ActivateLicenseDialog
        isOpen={isActivateLicenseKeyDialogOpen}
        onOpenChange={setIsActivateLicenseKeyDialogOpen}
        isTrialKey={isTrialKey}
      />
    </>
  );
};

LicenseKey.displayName = 'LicenseKeys';
