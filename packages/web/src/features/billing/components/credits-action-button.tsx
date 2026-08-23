import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowUpCircle, Coins } from 'lucide-react';
import { useState } from 'react';

import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import { flagsHooks } from '@/hooks/flags-hooks';

import { billingQueries } from '../hooks/billing-hooks';
import { useCreditsUsage } from '../hooks/use-credits-usage';
import { useManagePlanDialogStore } from '../stores/manage-plan-dialog-state';
import { billingUtils } from '../utils/billing-utils';

import { AutoRechargeConfigDialog } from './feature-usage/auto-recharge-config-dialog';

export function CreditsActionButton({
  className,
  variant = 'basic',
}: CreditsActionButtonProps) {
  const { platformId, isPlatformAdmin, isPaid, isBillingEnforced } =
    useCreditsUsage();
  const { embedState } = useEmbedding();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { openDialog: openManagePlanDialog } = useManagePlanDialogStore();
  const [autoRechargeOpen, setAutoRechargeOpen] = useState(false);

  const canManageBilling =
    isPlatformAdmin &&
    isBillingEnforced &&
    !embedState.isEmbedded &&
    edition !== ApEdition.COMMUNITY;

  const { data: info } = billingQueries.usePlatformSubscription(
    platformId,
    canManageBilling && isPaid,
  );

  if (!canManageBilling) {
    return null;
  }

  const action = billingUtils.resolveCreditsAction({ isPaid, info });

  switch (action.kind) {
    case 'unknown':
      return null;
    case 'upgrade':
      return (
        <Button
          variant={variant}
          size="sm"
          className={className}
          onClick={openManagePlanDialog}
        >
          <ArrowUpCircle className="size-4" />
          {t('Upgrade plan')}
        </Button>
      );
    case 'auto-recharge':
      return (
        <>
          <Button
            variant={variant}
            size="sm"
            className={className}
            onClick={() => setAutoRechargeOpen(true)}
          >
            <Coins className="size-4" />
            {action.feature.autoTopUp?.enabled
              ? t('Edit auto recharge')
              : t('Enable auto recharge')}
          </Button>
          <AutoRechargeConfigDialog
            key={autoRechargeOpen ? 'auto-open' : 'auto-closed'}
            isOpen={autoRechargeOpen}
            onOpenChange={setAutoRechargeOpen}
            feature={action.feature}
          />
        </>
      );
  }
}

type CreditsActionButtonProps = {
  className?: string;
  variant?: CreditsActionButtonVariant;
};

type CreditsActionButtonVariant = 'basic' | 'accent';
