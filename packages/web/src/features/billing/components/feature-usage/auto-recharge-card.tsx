import {
  AiCreditsAutoTopUpState,
  isNil,
  ConsumableBillableFeature,
} from '@activepieces/shared';
import { PencilEdit01Icon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import { type ReactNode, useState } from 'react';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { SettingRow, SettingRows } from '@/components/custom/panel';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AdminControl, adminControl } from '@/lib/admin-control';

import { billingMutations } from '../../hooks/billing-hooks';

import { AutoRechargeConfigDialog } from './auto-recharge-config-dialog';

export const AutoRechargeCard = ({
  feature,
  hasCard,
  note,
}: AutoRechargeCardProps) => {
  const autoTopUp = feature.autoTopUp;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { mutate: updateAutoTopUp, isPending } =
    billingMutations.useUpdateAutoTopUp();
  const { open: setupPayment, isPending: isSettingUpPayment } =
    billingMutations.useSetupPayment();

  const enabled = (autoTopUp?.enabled ?? false) && !isNil(autoTopUp);

  const toggle = (checked: boolean) => {
    if (checked) {
      setIsDialogOpen(true);
      return;
    }
    updateAutoTopUp({
      params: {
        state: AiCreditsAutoTopUpState.DISABLED,
        featureId: feature.featureId,
      },
      previous: autoTopUp,
    });
  };

  const description = !hasCard
    ? t('Add a payment method first. Auto recharge charges the card on file.')
    : enabled
    ? t('When below {threshold}, add {quantity} · {limit}', {
        threshold: autoTopUp.threshold.toLocaleString(),
        quantity: autoTopUp.quantity.toLocaleString(),
        limit: isNil(autoTopUp.maxMonthlyTopUps)
          ? t('No monthly limit')
          : t(
              '{count, plural, =1 {at most once a month} other {at most # times a month}}',
              { count: autoTopUp.maxMonthlyTopUps },
            ),
      })
    : t('Buy credits automatically before you run out.');

  return (
    <SettingRows className="border-t border-gray-6">
      <SettingRow
        title={t('Auto recharge')}
        description={
          note ? (
            <>
              {description}
              <br />
              {note}
            </>
          ) : (
            description
          )
        }
      >
        {!hasCard ? (
          <Button
            {...adminControl(AdminControl.BILLING_PAYMENT_METHOD_OPEN)}
            variant="outline"
            size="sm"
            loading={isSettingUpPayment}
            onClick={setupPayment}
          >
            {t('Add a payment method')}
          </Button>
        ) : (
          <>
            {enabled && (
              <Button
                {...adminControl(AdminControl.BILLING_AUTO_RECHARGE_OPEN)}
                variant="ghost"
                size="sm"
                onClick={() => setIsDialogOpen(true)}
              >
                <HugeiconsIcon icon={PencilEdit01Icon} />
                {t('Edit')}
              </Button>
            )}
            <Switch
              {...adminControl(AdminControl.BILLING_AUTO_RECHARGE_TOGGLE)}
              aria-label={t('Auto recharge')}
              checked={enabled}
              disabled={isPending}
              onCheckedChange={toggle}
            />
          </>
        )}
      </SettingRow>
      {hasCard && (
        <AutoRechargeConfigDialog
          key={isDialogOpen ? 'auto-open' : 'auto-closed'}
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          feature={feature}
        />
      )}
    </SettingRows>
  );
};

type AutoRechargeCardProps = {
  feature: ConsumableBillableFeature;
  hasCard: boolean;
  note?: ReactNode;
};
