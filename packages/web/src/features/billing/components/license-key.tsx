import { PlatformWithoutSensitiveData } from '@activepieces/shared';
import { t } from 'i18next';
import { useState } from 'react';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { Button } from '@/components/ui/button';

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
      <Button
        variant={platform.plan.licenseKey ? 'outline' : 'default'}
        className="w-fit"
        onClick={() => setIsActivateLicenseKeyDialogOpen(true)}
      >
        {platform.plan.licenseKey ? t('Update license key') : activateLabel}
      </Button>

      <ActivateLicenseDialog
        isOpen={isActivateLicenseKeyDialogOpen}
        onOpenChange={setIsActivateLicenseKeyDialogOpen}
        isTrialKey={isTrialKey}
        title={platform.plan.licenseKey ? t('Update license key') : undefined}
      />
    </>
  );
};

LicenseKey.displayName = 'LicenseKeys';
