import { t } from 'i18next';
import { ReactNode } from 'react';

import { FeatureTier } from '@/features/billing';

import { FeatureBanner } from './feature-banner';

export function FeatureSample({
  locked,
  label,
  tier,
  documentationUrl,
  children,
}: FeatureSampleProps) {
  if (!locked) {
    return children;
  }

  return (
    <div className="flex flex-1 min-h-0 min-w-0 flex-col">
      <div className="px-6 pt-4">
        <FeatureBanner
          message={
            tier === undefined
              ? t('Sample data. {feature} requires a paid plan.', {
                  feature: t(label),
                })
              : t('Sample data. {feature} requires the {tier} plan.', {
                  feature: t(label),
                  tier: TIER_LABELS[tier],
                })
          }
          documentationUrl={documentationUrl}
        />
      </div>
      <div
        aria-hidden
        className="flex flex-1 min-h-0 min-w-0 flex-col pointer-events-none select-none [&_*]:cursor-default!"
      >
        {children}
      </div>
    </div>
  );
}

const TIER_LABELS: Record<FeatureTier, string> = {
  team: 'Team',
  ultimate: 'Ultimate',
};

export type FeatureSampleProps = {
  locked: boolean;
  label: string;
  tier?: FeatureTier;
  documentationUrl?: string;
  children: ReactNode;
};
