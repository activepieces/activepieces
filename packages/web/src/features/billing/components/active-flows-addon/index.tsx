import {
  PRICE_PER_EXTRA_ACTIVE_FLOWS,
  ApEdition,
  ApFlagId,
  isNil,
  PlanName,
  PlatformBillingInformation,
} from '@activepieces/shared';
import { t } from 'i18next';
import { CircleHelp, Zap } from 'lucide-react';

import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from '@/components/custom/item';
import { Button } from '@/components/ui/button';
import {
  TooltipContent,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flagsHooks } from '@/hooks/flags-hooks';

import { useManagePlanDialogStore } from '../../stores/active-flows-addon-dialog-state';

type BusinessActiveFlowsProps = {
  platformSubscription: PlatformBillingInformation;
};

export function ActiveFlowAddon({
  platformSubscription,
}: BusinessActiveFlowsProps) {
  const { openDialog } = useManagePlanDialogStore();

  const { plan, usage } = platformSubscription;
  const currentActiveFlows = usage.activeFlows || 0;

  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const canManageActiveFlowsLimit =
    edition !== ApEdition.COMMUNITY && plan.plan === PlanName.STANDARD;

  const activeFlowsLimit = plan.activeFlowsLimit;
  const approachingLimit =
    !isNil(activeFlowsLimit) &&
    activeFlowsLimit > 0 &&
    currentActiveFlows / activeFlowsLimit > 0.8;

  const limitLabel = isNil(activeFlowsLimit)
    ? t('Unlimited')
    : activeFlowsLimit.toLocaleString();

  return (
    <Item variant="outline">
      <ItemMedia variant="icon">
        <Zap />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          {t('Active Flows')}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <CircleHelp className="size-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {t(
                  `Count of active flows, $${PRICE_PER_EXTRA_ACTIVE_FLOWS} for extra 5 active flows`,
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </ItemTitle>
        <ItemDescription>
          <span className="font-medium text-foreground">
            {currentActiveFlows.toLocaleString()} / {limitLabel}
          </span>{' '}
          {t('flows used')}
          {approachingLimit && (
            <span className="ml-2 text-destructive font-medium">
              {t('Approaching limit')}
            </span>
          )}
        </ItemDescription>
      </ItemContent>
      {canManageActiveFlowsLimit && (
        <ItemActions>
          <Button variant="outline" size="sm" onClick={() => openDialog()}>
            {t('Manage')}
          </Button>
        </ItemActions>
      )}
    </Item>
  );
}
