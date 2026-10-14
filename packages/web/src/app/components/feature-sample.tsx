import { t } from 'i18next';
import { ReactNode } from 'react';

import { FeatureKey } from '@/features/billing';

import { EnterpriseGate } from './enterprise-gate';

export { useInsideFeatureSample } from './enterprise-gate';

export function FeatureSample({
  locked,
  title,
  featureKey,
  children,
}: FeatureSampleProps) {
  return (
    <EnterpriseGate
      mode="preview"
      unlocked={!locked}
      featureKey={featureKey}
      title={t(title)}
    >
      {children}
    </EnterpriseGate>
  );
}

export type FeatureSampleProps = {
  locked: boolean;
  featureKey: FeatureKey;
  title: string;
  children: ReactNode;
};
