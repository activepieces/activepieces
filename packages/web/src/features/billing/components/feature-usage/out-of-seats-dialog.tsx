import {
  PlatformBillingInformation,
  BillableFeature,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { ManageSeatsDialog } from './manage-seats-dialog';

export const OutOfSeatsDialog = ({
  open,
  onOpenChange,
  info,
  feature,
}: OutOfSeatsDialogProps) => {
  const [isManageSeatsOpen, setIsManageSeatsOpen] = useState(false);
  const total = info.plan.usersLimit ?? info.usage.users;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
              <Users className="size-5 text-primary" />
            </div>
            <DialogTitle>{t("You're out of seats")}</DialogTitle>
            <DialogDescription>
              {t(
                'All {total} seats on your plan are in use ({active} active, {invited} invited). {invitedCount, plural, =0 {Add seats to invite more.} other {Add seats or revoke a pending invitation to invite more.}}',
                {
                  total: total.toLocaleString(),
                  active: info.usage.activeUsers.toLocaleString(),
                  invited: info.usage.invitedSeats.toLocaleString(),
                  invitedCount: info.usage.invitedSeats,
                },
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
            {info.usage.invitedSeats > 0 && (
              <Button type="button" variant="outline" asChild>
                <Link to="/platform/users" onClick={() => onOpenChange(false)}>
                  {t('Manage invitations')}
                </Link>
              </Button>
            )}
            <Button
              type="button"
              onClick={() => {
                onOpenChange(false);
                setIsManageSeatsOpen(true);
              }}
            >
              {t('Add seats')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ManageSeatsDialog
        open={isManageSeatsOpen}
        onOpenChange={setIsManageSeatsOpen}
        feature={feature}
        currentUsers={info.usage.users}
        includedSeats={info.includedSeats}
        additionalSeats={info.additionalSeats}
      />
    </>
  );
};

type OutOfSeatsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  info: PlatformBillingInformation;
  feature: BillableFeature;
};
