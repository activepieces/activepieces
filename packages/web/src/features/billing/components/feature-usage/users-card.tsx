import { isNil } from '@activepieces/core-utils';
import {
  PlatformBillingInformation,
  BillableFeature,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { ManageSeatsDialog } from './manage-seats-dialog';

export const UsersCard = ({ info, feature }: UsersCardProps) => {
  const { plan, usage, includedSeats, additionalSeats } = info;
  const used = usage.users;
  const total = plan.usersLimit;
  const isUnlimited = isNil(total);
  const hasAdditionalSeats = !isNil(additionalSeats) && additionalSeats > 0;
  const hasInvitedSeats = usage.invitedSeats > 0;
  const included = includedSeats ?? 0;
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 rounded-xl border p-5">
      <span className="text-lg font-semibold text-foreground">
        {isUnlimited
          ? t('{used} seats', { used: used.toLocaleString() })
          : t('{used}/{total} seats', {
              used: used.toLocaleString(),
              total: total.toLocaleString(),
            })}
      </span>

      {hasInvitedSeats && (
        <div className="flex flex-col gap-1.5 text-sm">
          <SeatsBreakdownRow
            label={t('Active')}
            value={usage.activeUsers.toLocaleString()}
          />
          <SeatsBreakdownRow
            label={t('Invited')}
            value={usage.invitedSeats.toLocaleString()}
          />
        </div>
      )}

      {hasAdditionalSeats && (
        <div className="flex flex-col gap-1.5 text-sm">
          <SeatsBreakdownRow
            label={t('Plan seats')}
            value={included.toLocaleString()}
          />
          <SeatsBreakdownRow
            label={t('Additional seats')}
            value={additionalSeats.toLocaleString()}
          />
        </div>
      )}

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
    </div>
  );
};

const SeatsBreakdownRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground">{value}</span>
  </div>
);

type UsersCardProps = {
  info: PlatformBillingInformation;
  feature: BillableFeature;
};
