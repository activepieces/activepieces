import {
  ApEdition,
  ApFlagId,
  PlatformAdminSurface,
} from '@activepieces/shared';
import { t } from 'i18next';
import * as React from 'react';
import { useState } from 'react';

import { useInsideFeatureSample } from '@/components/custom/feature-sample-context';
import { Panel } from '@/components/custom/panel';
import { Button } from '@/components/ui/button';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';

import type { PlatformFeature } from '../hooks/use-feature-gate';

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
  dimContent = true,
  children,
}: PlanLockedPanelProps) {
  const tier = usePlanTarget(feature);
  const insideFeatureSample = useInsideFeatureSample();
  if (!locked || insideFeatureSample) {
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
          {whenLocked === 'preview' && (
            <SeePlansButton feature={feature} tier={tier} />
          )}
        </span>
      }
      flush={flush || whenLocked === 'preview'}
      className={className}
    >
      {whenLocked === 'preview' ? (
        children && (
          <div
            inert
            aria-hidden
            className={cn(
              'pointer-events-none flex flex-col select-none',
              dimContent && 'opacity-50 grayscale',
              !flush && 'gap-3 p-5',
            )}
          >
            {children}
          </div>
        )
      ) : (
        children
      )}
    </Panel>
  );
}

function SeePlansButton({
  feature,
  tier,
}: {
  feature: PlatformFeature;
  tier: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        {tier === 'enterprise' ? t('Talk to sales') : t('See plans')}
      </Button>
      <UpgradeDialog
        open={open}
        onOpenChange={setOpen}
        feature={feature}
        surface={PlatformAdminSurface.SAMPLE}
      />
    </>
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
  dimContent?: boolean;
  children?: React.ReactNode;
};
