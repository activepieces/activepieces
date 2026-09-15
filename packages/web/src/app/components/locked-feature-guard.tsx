import React from 'react';

import { FeatureTeaser, FeatureTier } from './feature-teaser';

export const LockedFeatureGuard = ({
  children,
  locked,
  lockTitle,
  lockDescription,
  lockVideoUrl,
  lockDocumentationUrl,
  lockBullets,
  lockTier,
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
    />
  );
};

export default LockedFeatureGuard;

type LockedFeatureGuardProps = {
  children: React.ReactNode;
  locked: boolean;
  lockTitle: string;
  lockDescription: string;
  lockVideoUrl?: string;
  lockDocumentationUrl?: string;
  lockBullets?: string[];
  lockTier?: FeatureTier;
  featureKey?: string;
  showContactSales?: boolean;
};
