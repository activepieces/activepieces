import { PlatformAdminSurface } from '@activepieces/shared';
import { t } from 'i18next';
import React from 'react';

import { PageHeader } from '@/components/custom/page-header';
import {
  EnterpriseLockedCard,
  FeatureKey,
  useEnterpriseGate,
} from '@/features/billing';

export const LockedFeatureGuard = ({
  children,
  locked,
  lockTitle,
  lockDescription,
  lockVideoUrl,
  lockBullets,
  featureKey,
  pageTitle,
  communityGuide,
}: LockedFeatureGuardProps) => {
  if (!locked) {
    return children;
  }

  const teaser = (
    <LockedFeatureTeaser
      featureKey={featureKey}
      title={lockTitle}
      description={lockDescription}
      bullets={lockBullets}
      videoUrl={lockVideoUrl}
      communityGuide={communityGuide}
    />
  );
  if (pageTitle === undefined) {
    return teaser;
  }
  return (
    <div className="flex w-full flex-col">
      <PageHeader title={pageTitle} />
      {teaser}
    </div>
  );
};

function LockedFeatureTeaser({
  featureKey,
  title,
  description,
  bullets,
  videoUrl,
  communityGuide,
}: LockedFeatureTeaserProps) {
  const gate = useEnterpriseGate({ unlocked: false, featureKey });

  return (
    <div className="flex w-full flex-1 flex-col gap-6 px-4 py-6 md:px-6 in-data-[slot=admin-page]:p-0 md:in-data-[slot=admin-page]:p-0">
      <EnterpriseLockedCard
        access={gate.access}
        featureKey={featureKey}
        fallbackHeadline={t(title)}
        fallbackDescription={t(description)}
        fallbackBenefits={(bullets ?? []).map((bullet) => t(bullet))}
        showBenefits
        surface={PlatformAdminSurface.TEASER}
      />
      {gate.access === 'community' && communityGuide && (
        <a
          href={communityGuide.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit text-sm font-medium text-accent-11 hover:underline"
        >
          {communityGuide.label}
        </a>
      )}
      {videoUrl && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full max-w-3xl rounded-xl border"
          controls={false}
          src={videoUrl}
        />
      )}
    </div>
  );
}

export default LockedFeatureGuard;

type LockedFeatureGuardProps = {
  children: React.ReactNode;
  featureKey: FeatureKey;
  locked: boolean;
  lockTitle: string;
  lockDescription: string;
  lockVideoUrl?: string;
  lockBullets?: string[];
  pageTitle?: React.ReactNode;
  communityGuide?: CommunityGuide;
};

type CommunityGuide = {
  url: string;
  label: string;
};

type LockedFeatureTeaserProps = {
  featureKey: FeatureKey;
  title: string;
  description: string;
  bullets?: string[];
  videoUrl?: string;
  communityGuide?: CommunityGuide;
};
