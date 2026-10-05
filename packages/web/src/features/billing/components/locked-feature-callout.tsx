import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { Crown } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { flagsHooks } from '@/hooks/flags-hooks';

import type { PlatformFeature } from '../hooks/use-feature-gate';
import { FeatureTier, TIER_LABELS } from '../utils/feature-tier';

import { PlanBadge } from './plan-badge';
import { UpgradeDialog, upgradeTarget } from './upgrade-dialog';

export function LockedFeatureCallout({
  feature,
  showContactSales = true,
  headline = 'feature',
}: LockedFeatureCalloutProps) {
  const [open, setOpen] = useState(false);
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const target = upgradeTarget({ edition, tier: feature.tier });
  const selfServe = edition === ApEdition.CLOUD && target === 'team';
  const offersSales = showContactSales && feature.featureKey !== undefined;

  return (
    <>
      <Card
        data-slot="locked-feature-callout"
        className="flex-row flex-wrap items-center gap-x-8 gap-y-4 px-5 py-5"
      >
        <div className="flex min-w-0 flex-1 basis-80 flex-col gap-1.5">
          {headline === 'plan' ? (
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-12">
              <Crown className="size-4 shrink-0 text-accent-11" />
              {t('Available on the {tier} plan', {
                tier: TIER_LABELS[target],
              })}
            </h2>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-gray-12">
                {t(feature.title)}
              </h2>
              <PlanBadge tier={target} />
            </div>
          )}
          <p className="max-w-3xl text-sm text-pretty text-gray-11">
            {t(feature.description)}
          </p>
        </div>
        <Button className="shrink-0" onClick={() => setOpen(true)}>
          {ctaLabel({ selfServe, target, offersSales })}
        </Button>
      </Card>
      <UpgradeDialog
        open={open}
        onOpenChange={setOpen}
        feature={feature}
        showContactSales={showContactSales}
      />
    </>
  );
}

function ctaLabel({
  selfServe,
  target,
  offersSales,
}: {
  selfServe: boolean;
  target: FeatureTier;
  offersSales: boolean;
}) {
  if (selfServe) {
    return t('Upgrade to {tier}', { tier: TIER_LABELS[target] });
  }
  return offersSales ? t('Talk to sales') : t('Learn more');
}

type LockedFeatureCalloutProps = {
  feature: Omit<PlatformFeature, 'featureKey'> & {
    featureKey?: PlatformFeature['featureKey'];
  };
  showContactSales?: boolean;
  headline?: 'feature' | 'plan';
};
