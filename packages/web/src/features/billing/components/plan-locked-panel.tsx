import {
  ApEdition,
  ApFlagId,
  PlatformAdminSurface,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Crown } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';

import { Panel } from '@/components/custom/panel';
import { Button } from '@/components/ui/button';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';

import type { PlatformFeature } from '../hooks/use-feature-gate';
import { FeatureTier, TIER_LABELS } from '../utils/feature-tier';

import { PlanBadge } from './plan-badge';
import { UpgradeDialog, upgradeTarget } from './upgrade-dialog';

export function PlanLockedPanel({
  feature,
  locked,
  whenLocked,
  title,
  description,
  action,
  flush,
  className,
  children,
}: PlanLockedPanelProps) {
  const tier = usePlanTarget(feature);
  if (!locked) {
    return (
      <Panel
        title={title}
        description={description}
        action={action}
        flush={flush}
        className={className}
      >
        {children}
      </Panel>
    );
  }
  return (
    <Panel
      tone="accent"
      title={title}
      description={description}
      action={
        <span className="flex items-center gap-2">
          {action}
          <PlanBadge tier={tier} variant="info" />
        </span>
      }
      flush={flush || whenLocked === 'preview'}
      className={className}
    >
      {whenLocked === 'preview' ? (
        <>
          <PlanLockedBanner feature={feature} tier={tier} />
          <div
            inert
            aria-hidden
            className={cn(
              'pointer-events-none flex flex-col opacity-60 saturate-50 select-none',
              !flush && 'gap-3 p-5',
            )}
          >
            {children}
          </div>
        </>
      ) : (
        children
      )}
    </Panel>
  );
}

function PlanLockedBanner({
  feature,
  tier,
}: {
  feature: PlatformFeature;
  tier: FeatureTier;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-accent-6 px-5 py-3">
      <Crown aria-hidden className="size-4 shrink-0 text-accent-11" />
      <p className="min-w-0 flex-1 text-sm text-gray-12">
        {t('{feature} is part of the {tier} plan', {
          feature: t(feature.title),
          tier: TIER_LABELS[tier],
        })}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        {t('See plans')}
      </Button>
      <UpgradeDialog
        open={open}
        onOpenChange={setOpen}
        feature={feature}
        surface={PlatformAdminSurface.SAMPLE}
      />
    </div>
  );
}

export function usePlanTarget(feature: Pick<PlatformFeature, 'tier'>) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  return upgradeTarget({ edition, tier: feature.tier });
}

export type PlanLockedPanelProps = {
  feature: PlatformFeature;
  locked: boolean;
  whenLocked: 'try' | 'preview';
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  flush?: boolean;
  className?: string;
  children: React.ReactNode;
};
