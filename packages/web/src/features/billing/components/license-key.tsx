import { PlatformWithoutSensitiveData } from '@activepieces/shared';
import { t } from 'i18next';
import { Shield } from 'lucide-react';
import { useState } from 'react';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from '@/components/custom/item';
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
      <Item variant="outline">
        <ItemMedia variant="icon">
          <Shield />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{t('License Key')}</ItemTitle>
          <ItemDescription>
            {platform.plan.licenseKey
              ? t('Update your license key.')
              : t('Activate your license to unlock enterprise features')}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <AnimatedIconButton
            icon={ArrowUpIcon}
            iconSize={16}
            variant="default"
            size="sm"
            onClick={() => setIsActivateLicenseKeyDialogOpen(true)}
          >
            {platform.plan.licenseKey
              ? t('Update License')
              : t('Activate License')}
          </AnimatedIconButton>
        </ItemActions>
      </Item>

      <ActivateLicenseDialog
        isOpen={isActivateLicenseKeyDialogOpen}
        onOpenChange={setIsActivateLicenseKeyDialogOpen}
      />
    </>
  );
};

LicenseKey.displayName = 'LicenseKeys';
