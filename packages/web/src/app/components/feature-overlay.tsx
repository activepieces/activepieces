import { ReactNode } from 'react';

import { FeatureTeaserContent, FeatureTeaserProps } from './feature-teaser';

export function FeatureOverlay({
  locked,
  feature,
  children,
}: FeatureOverlayProps) {
  if (!locked) {
    return children;
  }

  return (
    <div className="relative flex flex-1 min-h-0 min-w-0 flex-col">
      <div
        aria-hidden
        className="flex flex-1 min-h-0 min-w-0 flex-col blur-[5px] opacity-50 pointer-events-none select-none"
      >
        {children}
      </div>
      <div className="absolute inset-0 flex items-start justify-center overflow-auto px-6 py-16">
        <div className="h-fit rounded-lg border bg-background p-6 shadow-lg">
          <FeatureTeaserContent {...feature} />
        </div>
      </div>
    </div>
  );
}

export type FeatureOverlayProps = {
  locked: boolean;
  feature: FeatureTeaserProps;
  children: ReactNode;
};
