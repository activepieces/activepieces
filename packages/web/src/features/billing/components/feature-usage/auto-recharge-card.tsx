import {
  AiCreditsAutoTopUpState,
  AutoTopUpConfig,
  isNil,
  ToppableFeature,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Pencil } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

import { billingMutations } from '../../hooks/billing-hooks';

import { AutoTopUpConfigDialog } from './auto-topup-config-dialog';

export const AutoRechargeCard = ({
  feature,
  autoTopUp,
  includedCredits,
}: AutoRechargeCardProps) => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { mutate: updateAutoTopUp, isPending } =
    billingMutations.useUpdateAutoTopUp(queryClient);

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
      <AutoTopUpConfigDialog
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
  feature: ToppableFeature;
  autoTopUp?: AutoTopUpConfig;
  includedCredits: number;
};
