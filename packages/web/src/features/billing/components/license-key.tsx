import { isNil, PlatformWithoutSensitiveData } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Shield, AlertTriangle, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';

import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemFooter,
} from '@/components/custom/item';
import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { StatusIconWithText } from '@/components/custom/status-icon-with-text';
import { Button } from '@/components/ui/button';
import { ArrowUpIcon } from '@/components/icons/arrow-up';
import { formatUtils } from '@/lib/format-utils';

import { ActivateLicenseDialog } from './activate-license-dialog';
import { FeatureStatus } from './features-status';

export const LicenseKey = ({
  platform,
}: {
  platform: PlatformWithoutSensitiveData;
}) => {
  const [isActivateLicenseKeyDialogOpen, setIsActivateLicenseKeyDialogOpen] =
    useState(false);

  const expired =
    !isNil(platform?.plan?.licenseExpiresAt) &&
    dayjs(platform.plan.licenseExpiresAt).isBefore(dayjs());
  const expiresSoon =
    !expired &&
    !isNil(platform?.plan?.licenseExpiresAt) &&
    dayjs(platform.plan.licenseExpiresAt).isBefore(dayjs().add(7, 'day'));

  const description = platform.plan.licenseKey
    ? buildLicenseDescription(platform, expired)
    : t('Activate your license to unlock enterprise features');

  return (
    <>
      <Item variant="outline">
        <ItemMedia variant="icon">
          <Shield />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>
            {t('License Key')}
            {platform.plan.licenseKey && getStatusBadge(expired, expiresSoon)}
          </ItemTitle>
          {description && <ItemDescription>{description}</ItemDescription>}
        </ItemContent>
        <ItemActions className="gap-4">
          <Button variant="ghost" size="sm" asChild>
            <a
              href="https://www.activepieces.com/pricing"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('View Plans')}
              <ExternalLink className="size-3" />
            </a>
          </Button>
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
        <ItemFooter>
          <div className="flex flex-col gap-2 w-full pt-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              {t('Enabled Features')}
            </h4>
            <FeatureStatus platform={platform} />
          </div>
        </ItemFooter>
      </Item>

      <ActivateLicenseDialog
        isOpen={isActivateLicenseKeyDialogOpen}
        onOpenChange={setIsActivateLicenseKeyDialogOpen}
      />
    </>
  );
};

function buildLicenseDescription(
  platform: PlatformWithoutSensitiveData,
  expired: boolean,
) {
  if (expired) {
    return t('License expired');
  }
  if (!isNil(platform.plan.licenseExpiresAt)) {
    return t('Valid until {date}', {
      date: formatUtils.formatDateOnly(
        dayjs(platform.plan.licenseExpiresAt).toDate(),
      ),
    });
  }
  return null;
}

function getStatusBadge(expired: boolean, expiresSoon: boolean) {
  if (expired) {
    return (
      <StatusIconWithText
        text={t('Expired')}
        icon={AlertTriangle}
        variant="error"
      />
    );
  }
  if (expiresSoon) {
    return (
      <StatusIconWithText
        text={t('Expires soon')}
        icon={AlertTriangle}
        variant="default"
      />
    );
  }
  return (
    <StatusIconWithText text={t('Active')} icon={Check} variant="success" />
  );
}

LicenseKey.displayName = 'LicenseKeys';
