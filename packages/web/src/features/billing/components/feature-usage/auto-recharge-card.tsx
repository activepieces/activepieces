import {
  AiCreditsAutoTopUpState,
  isNil,
  ConsumableBillableFeature,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Pencil } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { SettingRow, SettingRows } from '@/components/custom/panel';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

import { billingMutations } from '../../hooks/billing-hooks';

import { AutoRechargeConfigDialog } from './auto-recharge-config-dialog';

export const AutoRechargeCard = ({
  feature,
  hasCard,
  note,
}: AutoRechargeCardProps) => {
  const autoTopUp = feature.autoTopUp;
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { mutate: updateAutoTopUp, isPending } =
    billingMutations.useUpdateAutoTopUp(queryClient);
  const { mutate: setupPayment, isPending: isSettingUpPayment } =
    billingMutations.useSetupPayment();

  const enabled = (autoTopUp?.enabled ?? false) && !isNil(autoTopUp);

  const toggle = (checked: boolean) => {
    if (checked) {
      setIsDialogOpen(true);
      return;
    }
    updateAutoTopUp({
      state: AiCreditsAutoTopUpState.DISABLED,
      featureId: feature.featureId,
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
            variant="outline"
            size="sm"
            loading={isSettingUpPayment}
            onClick={() => setupPayment()}
          >
            {t('Add a payment method')}
          </Button>
        ) : (
          <>
            {enabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDialogOpen(true)}
              >
                <Pencil />
                {t('Edit')}
              </Button>
            )}
            <Switch
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
