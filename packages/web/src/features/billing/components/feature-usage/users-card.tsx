import { isNil } from '@activepieces/core-utils';
import {
  PlatformBillingInformation,
  SeatsBillableFeature,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { billingUtils } from '../../utils/billing-utils';
import { DetailRow } from '../detail-row';

import { ManageSeatsDialog } from './manage-seats-dialog';

export const UsersCard = ({ info, feature }: UsersCardProps) => {
  const { usage, includedSeats, additionalSeats } = info;
  const used = usage.users;
  const hasAdditionalSeats = !isNil(additionalSeats) && additionalSeats > 0;
  const hasInvitedSeats = usage.invitedSeats > 0;
  const included = includedSeats ?? 0;
  const hasScheduledChange =
    !isNil(info.cancelAt) || !isNil(info.scheduledPlanName);
  const { capBinds, effectiveLimit: effectiveTotal } =
    billingUtils.resolveSeatCap(info);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 rounded-xl border p-5">
      <span className="text-lg font-semibold text-foreground">
        {isNil(effectiveTotal)
          ? t('{used} seats', { used: used.toLocaleString() })
          : t('{used}/{total} seats', {
              used: used.toLocaleString(),
              total: effectiveTotal.toLocaleString(),
            })}
      </span>

      {hasInvitedSeats && (
        <div className="flex flex-col gap-1.5 text-sm">
          <DetailRow
            label={t('Active')}
            value={usage.activeUsers.toLocaleString()}
          />
          <DetailRow
            label={t('Invited')}
            value={usage.invitedSeats.toLocaleString()}
          />
        </div>
      )}

      {hasAdditionalSeats && !capBinds && (
        <div className="flex flex-col gap-1.5 text-sm">
          <DetailRow
            label={t('Plan seats')}
            value={included.toLocaleString()}
          />
          <DetailRow
            label={t('Additional seats')}
            value={additionalSeats.toLocaleString()}
          />
        </div>
      )}

      {capBinds ? (
        <span className="text-sm text-muted-foreground">
          {billingUtils.scheduledCapNotice(info)}
        </span>
      ) : hasScheduledChange ? (
        <span className="text-sm text-muted-foreground">
          {t('Seat changes are unavailable while a plan change is scheduled.')}
        </span>
      ) : (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => setIsDialogOpen(true)}
          >
            {hasAdditionalSeats ? (
              <>
                <Pencil className="mr-2 size-4" />
                {t('Manage Seats')}
              </>
            ) : (
              <>
                <Plus className="mr-2 size-4" />
                {t('Add Seats')}
              </>
            )}
          </Button>

          <ManageSeatsDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            feature={feature}
            currentUsers={used}
            includedSeats={includedSeats}
            additionalSeats={additionalSeats}
          />
        </>
      )}
    </div>
  );
};

type UsersCardProps = {
  info: PlatformBillingInformation;
  feature: SeatsBillableFeature;
};
