import {
  AiCreditsAutoTopUpState,
  AutoTopUpConfig,
  AutumnFeatureId,
  isNil,
  PlatformBillingInformation,
  ToppableFeature,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Settings, Sparkles } from 'lucide-react';
import { useState } from 'react';

import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from '@/components/custom/item';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

import { billingMutations } from '../../hooks/billing-hooks';

import { AutoTopUpConfigDialog } from './auto-topup-config-dialog';
import { ConsumableProductTopupsDialog } from './consumable-product-topups-dialog';

interface AiCreditUsageProps {
  platformSubscription: PlatformBillingInformation;
}

export function AICreditUsage({ platformSubscription }: AiCreditUsageProps) {
  const { usage, autoTopUps, topUpFeatures } = platformSubscription;

  const totalCreditsUsed = usage.totalAiCreditsUsed;
  const creditsRemaining = usage.aiCreditsRemaining;

  // Top-up availability is plan-driven: a control shows only when the current plan offers a top-up for that
  // feature (i.e. carries a prepaid item for it), and the item carries the pricing the dialogs use.
  const apCreditsFeature = topUpFeatures.find(
    (feature) => feature.featureId === AutumnFeatureId.AP_CREDITS,
  );
  const appSumoFeature = topUpFeatures.find(
    (feature) => feature.featureId === AutumnFeatureId.APP_SUMO_AI_CREDITS,
  );
  const apCreditsConfig = autoTopUps.find(
    (config) => config.featureId === AutumnFeatureId.AP_CREDITS,
  );
  const appSumoConfig = autoTopUps.find(
    (config) => config.featureId === AutumnFeatureId.APP_SUMO_AI_CREDITS,
  );

  return (
    <div className="flex flex-col gap-4">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <Sparkles />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{t('AI Credits')}</ItemTitle>
          <ItemDescription>
            {Math.round(creditsRemaining).toLocaleString()}{' '}
            {t('credits available')}
            <span className="ml-2 text-xs">
              ({t('Total used')}:{' '}
              {Math.round(totalCreditsUsed).toLocaleString()})
            </span>
          </ItemDescription>
        </ItemContent>
        {apCreditsFeature && (
          <ItemActions>
            <ConsumableTopupButton
              feature={apCreditsFeature}
              title={t('Purchase AI Credits')}
            />
          </ItemActions>
        )}
      </Item>

      {apCreditsFeature && (
        <AutoTopUpRow
          feature={apCreditsFeature}
          config={apCreditsConfig}
          title={t('Auto Top-up')}
        />
      )}

      {usage.appSumoAiCredits && (
        <Item variant="outline">
          <ItemMedia variant="icon">
            <Sparkles />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{t('AppSumo AI Credits')}</ItemTitle>
            <ItemDescription>
              {Math.round(
                Math.max(
                  0,
                  usage.appSumoAiCredits.limit - usage.appSumoAiCredits.usage,
                ),
              ).toLocaleString()}{' '}
              {t('credits available')}
              <span className="ml-2 text-xs">
                ({t('Total used')}:{' '}
                {Math.round(usage.appSumoAiCredits.usage).toLocaleString()} /{' '}
                {Math.round(usage.appSumoAiCredits.limit).toLocaleString()})
              </span>
            </ItemDescription>
          </ItemContent>
          {appSumoFeature && (
            <ItemActions>
              <ConsumableTopupButton
                feature={appSumoFeature}
                title={t('Purchase AppSumo AI Credits')}
              />
            </ItemActions>
          )}
        </Item>
      )}

      {appSumoFeature && (
        <AutoTopUpRow
          feature={appSumoFeature}
          config={appSumoConfig}
          title={t('AppSumo Auto Top-up')}
        />
      )}
    </div>
  );
}

function ConsumableTopupButton({
  feature,
  title,
}: {
  feature: ToppableFeature;
  title: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        {t('Purchase')}
      </Button>
      <ConsumableProductTopupsDialog
        key={isOpen ? 'open' : 'closed'}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        feature={feature}
        title={title}
      />
    </>
  );
}

interface AutoTopUpRowProps {
  feature: ToppableFeature;
  config?: AutoTopUpConfig;
  title: string;
}

function AutoTopUpRow({ feature, config, title }: AutoTopUpRowProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { mutate: updateAutoTopUp, isPending } =
    billingMutations.useUpdateAutoTopUp(queryClient);

  const enabled = config?.enabled ?? false;
  const maxMonthlyLimit =
    config && !isNil(config.maxMonthlyTopUps) && config.quantity
      ? config.maxMonthlyTopUps * config.quantity
      : null;

  return (
    <Item variant="outline">
      <ItemMedia variant="icon">
        <Settings />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{title}</ItemTitle>
        <ItemDescription>
          {enabled && !isNil(config)
            ? t('Adds {credits} credits when below {threshold}', {
                credits: config.quantity.toLocaleString(),
                threshold: config.threshold.toLocaleString(),
              })
            : t('Automatically purchase credits when balance is low.')}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        {enabled && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setIsEditing(true);
              setIsDialogOpen(true);
            }}
          >
            <Settings className="size-4" />
          </Button>
        )}
        <Switch
          checked={enabled}
          disabled={isPending}
          onCheckedChange={(checked) => {
            if (checked) {
              setIsEditing(false);
              setIsDialogOpen(true);
            } else {
              updateAutoTopUp({
                state: AiCreditsAutoTopUpState.DISABLED,
                featureId: feature.featureId,
              });
            }
          }}
        />
      </ItemActions>
      <AutoTopUpConfigDialog
        key={isDialogOpen ? 'open' : 'closed'}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        feature={feature}
        isEditing={isEditing}
        currentThreshold={config?.threshold}
        currentCreditsToAdd={config?.quantity}
        currentMaxMonthlyLimit={maxMonthlyLimit}
      />
    </Item>
  );
}
