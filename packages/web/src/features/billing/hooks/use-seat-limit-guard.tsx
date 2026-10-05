import { ErrorCode, isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  PlatformAdminSurface,
} from '@activepieces/shared';
import { t } from 'i18next';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { api } from '@/lib/api';

import { OutOfSeatsDialog } from '../components/feature-usage/out-of-seats-dialog';
import { RequestTrial } from '../components/request-trial';
import { useManagePlanDialogStore } from '../stores/manage-plan-dialog-state';

import { billingQueries } from './billing-hooks';

export const useSeatLimitGuard = () => {
  const [isOutOfSeatsOpen, setIsOutOfSeatsOpen] = useState(false);
  const [isContactAdminOpen, setIsContactAdminOpen] = useState(false);
  const [isLicenseSeatsOpen, setIsLicenseSeatsOpen] = useState(false);
  const isPlatformAdmin = useIsPlatformAdmin();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isCloud = edition === ApEdition.CLOUD;
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: info } = billingQueries.usePlatformSubscription(
    platform.id,
    isPlatformAdmin,
  );
  const { openDialog } = useManagePlanDialogStore();
  const seatFeature = info?.seatsFeature;

  const openSeatLimit = () => {
    if (!isPlatformAdmin) {
      setIsContactAdminOpen(true);
      return;
    }
    if (!isCloud) {
      setIsLicenseSeatsOpen(true);
      return;
    }
    if (info && seatFeature) {
      setIsOutOfSeatsOpen(true);
    } else {
      openDialog();
    }
  };

  const handleSeatLimitError = (error: Error): boolean => {
    if (!api.isApError(error, ErrorCode.QUOTA_EXCEEDED)) {
      return false;
    }
    openSeatLimit();
    return true;
  };

  const hasSeatsFor = (additionalSeats: number): boolean => {
    if (isNil(info) || !info.billingEnforced || isNil(info.plan.usersLimit)) {
      return true;
    }
    return additionalSeats <= info.plan.usersLimit - info.usage.users;
  };

  const isOutOfSeats = !hasSeatsFor(1);

  const ensureSeatsAvailable = (additionalSeats: number): boolean => {
    if (hasSeatsFor(additionalSeats)) {
      return true;
    }
    openSeatLimit();
    return false;
  };

  const seatLimitDialog = isPlatformAdmin ? (
    !isCloud ? (
      <LicenseSeatsDialog
        open={isLicenseSeatsOpen}
        onOpenChange={setIsLicenseSeatsOpen}
        total={info?.plan.usersLimit ?? undefined}
      />
    ) : info && seatFeature ? (
      <OutOfSeatsDialog
        open={isOutOfSeatsOpen}
        onOpenChange={setIsOutOfSeatsOpen}
        info={info}
        feature={seatFeature}
      />
    ) : null
  ) : (
    <ContactAdminSeatsDialog
      open={isContactAdminOpen}
      onOpenChange={setIsContactAdminOpen}
    />
  );

  return {
    isOutOfSeats,
    handleSeatLimitError,
    ensureSeatsAvailable,
    seatLimitDialog,
  };
};

function LicenseSeatsDialog({
  open,
  onOpenChange,
  total,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number | undefined;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{t("You're out of seats")}</DialogTitle>
          <DialogDescription>
            {isNil(total)
              ? t(
                  'All seats in your license are in use. Deactivate people who no longer need access, or talk to sales to add seats.',
                )
              : t(
                  'All {total} seats in your license are in use. Deactivate people who no longer need access, or talk to sales to add seats.',
                  { total: total.toLocaleString() },
                )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <RequestTrial
            featureKey="USERS"
            surface={PlatformAdminSurface.LIMIT}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContactAdminSeatsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{t("You're out of seats")}</DialogTitle>
          <DialogDescription>
            {t(
              'All seats on your plan are in use. Contact a platform admin to add seats or free up seats by deactivating users.',
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            {t('Got it')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
