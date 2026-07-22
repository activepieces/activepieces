import { ErrorCode, isNil } from '@activepieces/core-utils';
import { AutumnFeatureId } from '@activepieces/shared';
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
import { platformHooks } from '@/hooks/platform-hooks';
import { api } from '@/lib/api';

import { OutOfSeatsDialog } from '../components/feature-usage/out-of-seats-dialog';
import { useManagePlanDialogStore } from '../stores/manage-plan-dialog-state';

import { billingQueries } from './billing-hooks';

export const useSeatLimitGuard = () => {
  const [isOutOfSeatsOpen, setIsOutOfSeatsOpen] = useState(false);
  const [isContactAdminOpen, setIsContactAdminOpen] = useState(false);
  const isPlatformAdmin = useIsPlatformAdmin();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: info } = billingQueries.usePlatformSubscription(
    platform.id,
    isPlatformAdmin,
  );
  const { openDialog } = useManagePlanDialogStore();
  const seatFeature = info?.nonConsumableFeatures.find(
    (feature) => feature.featureId === AutumnFeatureId.USERS_LIMIT,
  );

  const openSeatLimit = () => {
    if (!isPlatformAdmin) {
      setIsContactAdminOpen(true);
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

  const ensureSeatsAvailable = (additionalSeats: number): boolean => {
    if (isNil(info) || !info.billingEnforced || isNil(info.plan.usersLimit)) {
      return true;
    }
    if (additionalSeats > info.plan.usersLimit - info.usage.users) {
      openSeatLimit();
      return false;
    }
    return true;
  };

  const seatLimitDialog = isPlatformAdmin ? (
    info && seatFeature ? (
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

  return { handleSeatLimitError, ensureSeatsAvailable, seatLimitDialog };
};

function ContactAdminSeatsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px]">
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
