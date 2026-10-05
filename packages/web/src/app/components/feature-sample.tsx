import { PlatformAdminSurface } from '@activepieces/shared';
import { createContext, ReactNode, useContext } from 'react';

import { PageLock } from '@/components/custom/page';
import {
  FeatureKey,
  FeatureTier,
  LockedFeatureCallout,
} from '@/features/billing';

export function FeatureSample({
  locked,
  title,
  description = '',
  tier,
  documentationUrl,
  featureKey,
  showContactSales = true,
  children,
}: FeatureSampleProps) {
  if (!locked) {
    return children;
  }

  return (
    <PageLock
      callout={({ underPageTitle }) => (
        <LockedFeatureCallout
          feature={{ featureKey, title, description, tier, documentationUrl }}
          showContactSales={showContactSales}
          headline={underPageTitle ? 'plan' : 'feature'}
          surface={PlatformAdminSurface.SAMPLE}
        />
      )}
    >
      <InsideFeatureSampleContext.Provider value={true}>
        {children}
      </InsideFeatureSampleContext.Provider>
    </PageLock>
  );
}

export function useInsideFeatureSample(): boolean {
  return useContext(InsideFeatureSampleContext);
}

const InsideFeatureSampleContext = createContext(false);

export type FeatureSampleProps = {
  locked: boolean;
  featureKey?: FeatureKey;
  showContactSales?: boolean;
  title: string;
  description?: string;
  tier?: FeatureTier;
  documentationUrl?: string;
  children: ReactNode;
};
