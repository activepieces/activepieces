import React from 'react';

import { FeatureTier } from '@/features/billing';

import { FeatureTeaser } from './feature-teaser';
import { FeatureKey } from './request-trial';

export const LockedFeatureGuard = ({
  children,
  locked,
  lockTitle,
  lockDescription,
  lockVideoUrl,
  lockDocumentationUrl,
  lockBullets,
  lockTier,
  featureKey,
  showContactSales = true,
}: LockedFeatureGuardProps) => {
  if (!locked) {
    return children;
  }

  return (
    <FeatureTeaser
      title={lockTitle}
      description={lockDescription}
      bullets={lockBullets}
      tier={lockTier}
      documentationUrl={lockDocumentationUrl}
      videoUrl={lockVideoUrl}
      featureKey={featureKey}
      showContactSales={showContactSales}
    />
  );
};

export default LockedFeatureGuard;

type LockedFeatureGuardProps = {
  children: React.ReactNode;
  featureKey: FeatureKey;
  showContactSales?: boolean;
  locked: boolean;
  lockTitle: string;
  lockDescription: string;
  lockVideoUrl?: string;
  lockDocumentationUrl?: string;
  lockBullets?: string[];
  lockTier?: FeatureTier;
};
