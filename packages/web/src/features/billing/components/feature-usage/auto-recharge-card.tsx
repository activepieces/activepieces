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

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

  const enabled = autoTopUp?.enabled ?? false;

  const dialog = (
    <AutoTopUpConfigDialog
      key={isDialogOpen ? 'auto-open' : 'auto-closed'}
      isOpen={isDialogOpen}
      onOpenChange={setIsDialogOpen}
      feature={feature}
      includedCredits={includedCredits}
      currentThreshold={enabled ? autoTopUp?.threshold : undefined}
      currentCreditsToAdd={enabled ? autoTopUp?.quantity : undefined}
      currentMaxMonthlyTopUps={
        enabled ? autoTopUp?.maxMonthlyTopUps : undefined
      }
    />
  );

  if (!enabled || isNil(autoTopUp)) {
    return (
      <>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsDialogOpen(true)}
        >
          {t('Enable auto recharge')}
        </Button>
        {dialog}
      </>
    );
  }

  const costPerRecharge =
    (autoTopUp.quantity / feature.billingUnits) * feature.pricePerUnit;
  const maxMonthlyCost = isNil(autoTopUp.maxMonthlyTopUps)
    ? null
    : costPerRecharge * autoTopUp.maxMonthlyTopUps;

  return (
    <div className="flex flex-col gap-4 rounded-xl border p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {t('Auto recharge')}
        </span>
        <Badge variant="success" className="rounded-sm">
          {t('Active')}
        </Badge>
      </div>
      <div className="flex flex-col gap-2 text-sm">
        <AutoRechargeRow
          label={t('When credits below')}
          value={autoTopUp.threshold.toLocaleString()}
        />
        <AutoRechargeRow
          label={t('Add')}
          value={t('{credits} credits (${cost})', {
            credits: autoTopUp.quantity.toLocaleString(),
            cost: costPerRecharge.toFixed(2),
          })}
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
        <AutoRechargeRow
          label={t('Max monthly cost')}
          value={
            isNil(maxMonthlyCost)
              ? t('No limit')
              : `$${maxMonthlyCost.toFixed(2)}`
          }
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDialogOpen(true)}
        >
          <Pencil className="size-4 mr-2" />
          {t('Edit')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          loading={isPending}
          onClick={() =>
            updateAutoTopUp({
              state: AiCreditsAutoTopUpState.DISABLED,
              featureId: feature.featureId,
            })
          }
        >
          {t('Turn off')}
        </Button>
      </div>
      {dialog}
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
