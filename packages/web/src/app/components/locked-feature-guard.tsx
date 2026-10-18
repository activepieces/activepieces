import { PlatformAdminSurface } from '@activepieces/shared';
import { t } from 'i18next';
import React from 'react';

import { PageHeader } from '@/components/custom/page-header';
import { EnterpriseLockedCard, FeatureKey } from '@/features/billing';

export const LockedFeatureGuard = ({
  children,
  locked,
  lockTitle,
  lockDescription,
  featureKey,
  pageTitle,
  guide,
  showContactSales = true,
}: LockedFeatureGuardProps) => {
  if (!locked) {
    return children;
  }

  const teaser = (
    <div className="flex w-full flex-1 flex-col gap-6 px-4 py-6 md:px-6 in-data-[slot=admin-page]:p-0 md:in-data-[slot=admin-page]:p-0">
      <EnterpriseLockedCard
        featureKey={featureKey}
        fallbackHeadline={t(lockTitle)}
        fallbackDescription={t(lockDescription)}
        showBenefits
        showContactSales={showContactSales}
        surface={PlatformAdminSurface.TEASER}
      />
      {guide && (
        <a
          href={guide.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit text-sm font-medium text-accent-11 hover:underline"
        >
          {guide.label}
        </a>
      )}
    </div>
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

export default LockedFeatureGuard;

type LockedFeatureGuardProps = {
  children: React.ReactNode;
  featureKey: FeatureKey;
  locked: boolean;
  lockTitle: string;
  lockDescription: string;
  pageTitle?: React.ReactNode;
  guide?: LockedFeatureGuide;
  showContactSales?: boolean;
};

type LockedFeatureGuide = {
  url: string;
  label: string;
};
