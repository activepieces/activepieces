import {
  AiCreditsAutoTopUpState,
  AutoTopUpConfig,
  isNil,
  BillableFeature,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Pencil } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

import { billingMutations } from '../../hooks/billing-hooks';

import { AutoRechargeConfigDialog } from './auto-recharge-config-dialog';

export const AutoRechargeCard = ({
  feature,
  autoTopUp,
  includedCredits,
  hasCard,
  note,
}: AutoRechargeCardProps) => {
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

  // Auto-recharge can only charge with a card on file, so collect one first: a cardless customer sees an
  // "add payment method" CTA instead of the toggle. Once the card is saved, the toggle appears.
  if (!hasCard) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border p-5">
        <span className="text-sm font-medium text-foreground">
          {t('Enable auto recharge')}
        </span>
        {note && <span className="text-sm text-muted-foreground">{note}</span>}
        <span className="text-sm text-muted-foreground">
          {t(
            'Add a payment method to set up auto recharge. You can configure it once your card is on file.',
          )}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          loading={isSettingUpPayment}
          onClick={() => setupPayment()}
        >
          {t('Add a payment method')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border p-5">
      <div className="flex items-center gap-3">
        <Switch
          checked={enabled}
          disabled={isPending}
          onCheckedChange={toggle}
        />
        <span className="text-sm font-medium text-foreground">
          {t('Enable auto recharge')}
        </span>
      </div>
      {note && <span className="text-sm text-muted-foreground">{note}</span>}
      {enabled && (
        <>
          <div className="flex flex-col gap-2 text-sm">
            <AutoRechargeRow
              label={t('When credits below')}
              value={autoTopUp.threshold.toLocaleString()}
            />
            <AutoRechargeRow
              label={t('Add')}
              value={autoTopUp.quantity.toLocaleString()}
            />
            <AutoRechargeRow
              label={t('Monthly limit')}
              value={
                isNil(autoTopUp.maxMonthlyTopUps)
                  ? t('No limit')
                  : t(
                      '{count, plural, =1 {1 auto recharge} other {# auto recharges}}',
                      { count: autoTopUp.maxMonthlyTopUps },
                    )
              }
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => setIsDialogOpen(true)}
          >
            <Pencil className="mr-2 size-4" />
            {t('Edit')}
          </Button>
        </>
      )}
      <AutoRechargeConfigDialog
        key={isDialogOpen ? 'auto-open' : 'auto-closed'}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        feature={feature}
        includedCredits={includedCredits}
        currentThreshold={enabled ? autoTopUp.threshold : undefined}
        currentCreditsToAdd={enabled ? autoTopUp.quantity : undefined}
        currentMaxMonthlyTopUps={
          enabled ? autoTopUp.maxMonthlyTopUps : undefined
        }
      />
    </div>
  );
};

const AutoRechargeRow = ({
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

type AutoRechargeCardProps = {
  feature: BillableFeature;
  autoTopUp?: AutoTopUpConfig;
  includedCredits: number;
  hasCard: boolean;
  note?: ReactNode;
};
