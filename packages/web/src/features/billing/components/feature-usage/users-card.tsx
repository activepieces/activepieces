import { isNil } from '@activepieces/core-utils';
import {
  PlatformBillingInformation,
  SeatsBillableFeature,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';

import { Panel } from '@/components/custom/panel';
import { Meter } from '@/components/custom/stats';
import { Button } from '@/components/ui/button';

import { billingUtils } from '../../utils/billing-utils';

import { ManageSeatsDialog } from './manage-seats-dialog';

export const UsersCard = ({ info, feature }: UsersCardProps) => {
  const { usage, includedSeats, additionalSeats } = info;
  const used = usage.users;
  const hasAdditionalSeats = !isNil(additionalSeats) && additionalSeats > 0;
  const included = includedSeats ?? 0;
  const hasScheduledChange =
    !isNil(info.cancelAt) || !isNil(info.scheduledPlanName);
  const { capBinds, effectiveLimit } = billingUtils.resolveSeatCap(info);
  const canManage = !capBinds && !hasScheduledChange;
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const details = [
    usage.invitedSeats > 0
      ? t('{active} active · {invited} invited', {
          active: usage.activeUsers.toLocaleString(),
          invited: usage.invitedSeats.toLocaleString(),
        })
      : null,
    hasAdditionalSeats && !capBinds
      ? t('{included} on the plan · {additional} additional', {
          included: included.toLocaleString(),
          additional: additionalSeats.toLocaleString(),
        })
      : null,
  ].filter((line): line is string => !isNil(line));

  return (
    <Panel
      title={t('Seats')}
      description={t(
        'How many members can join your platform. New seats are available immediately.',
      )}
      action={
        canManage ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsDialogOpen(true)}
          >
            {hasAdditionalSeats ? <Pencil /> : <Plus />}
            {hasAdditionalSeats ? t('Manage seats') : t('Add seats')}
          </Button>
        ) : null
      }
    >
      <Meter
        value={isNil(effectiveLimit) ? 0 : used}
        max={effectiveLimit ?? 1}
        label={t('{count, plural, =1 {1 seat in use} other {# seats in use}}', {
          count: used,
        })}
        limit={
          isNil(effectiveLimit)
            ? t('No seat limit on this plan')
            : t('of {total}', { total: effectiveLimit.toLocaleString() })
        }
      />
      {details.length > 0 && (
        <span className="text-xs text-gray-11">{details.join(' · ')}</span>
      )}
      {capBinds ? (
        <span className="text-xs text-gray-11">
          {billingUtils.scheduledCapNotice(info)}
        </span>
      ) : hasScheduledChange ? (
        <span className="text-xs text-gray-11">
          {t('Seat changes are unavailable while a plan change is scheduled.')}
        </span>
      ) : null}
      {canManage && (
        <ManageSeatsDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          feature={feature}
          currentUsers={used}
          includedSeats={includedSeats}
          additionalSeats={additionalSeats}
        />
      )}
    </Panel>
  );
};

type UsersCardProps = {
  info: PlatformBillingInformation;
  feature: SeatsBillableFeature;
};
