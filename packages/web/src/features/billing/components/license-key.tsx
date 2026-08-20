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
      <AnimatedIconButton
        icon={ArrowUpIcon}
        iconSize={16}
        variant="default"
        className="w-full"
        onClick={() => setIsActivateLicenseKeyDialogOpen(true)}
      >
        {platform.plan.licenseKey ? t('Update license key') : activateLabel}
      </AnimatedIconButton>

      <ActivateLicenseDialog
        isOpen={isActivateLicenseKeyDialogOpen}
        onOpenChange={setIsActivateLicenseKeyDialogOpen}
        isTrialKey={isTrialKey}
      />
    </>
  );
};

LicenseKey.displayName = 'LicenseKeys';
