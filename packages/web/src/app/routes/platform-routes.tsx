import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import React, { Suspense } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

import { FeatureOverlay } from '@/app/components/feature-overlay';
import { FeatureTeaserProps } from '@/app/components/feature-teaser';
import { PageTitle } from '@/app/components/page-title';
import { RouteLoadingBar } from '@/components/custom/route-loading-bar';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { PlatformLayout } from '../components/platform-layout';

import {
  ADMIN_PAGES,
  ADMIN_REDIRECTS,
  AdminPage as AdminPageSpec,
  adminPagesUtils,
} from './platform/admin-pages';

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteLoadingBar />}>{children}</Suspense>;
}

function translateFeature(feature: FeatureTeaserProps | undefined) {
  if (feature === undefined) {
    return { title: '', description: '' };
  }
  return {
    ...feature,
    title: t(feature.title),
    description: t(feature.description),
    bullets: feature.bullets?.map((bullet) => t(bullet)),
  };
}

function AdminRoute({ page }: { page: AdminPageSpec }) {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const [searchParams] = useSearchParams();
  const context = { plan: platform.plan, edition };

  const Page = page.component;
  if (Page !== undefined) {
    return (
      <SuspenseWrapper>
        <Page />
      </SuspenseWrapper>
    );
  }

  const tabs = adminPagesUtils.visibleTabs(page, context);
  const requested = searchParams.get('tab');
  const Overview = page.overview;
  if (Overview !== undefined && requested === null) {
    return (
      <SuspenseWrapper>
        <Overview />
      </SuspenseWrapper>
    );
  }

  const activeTab = tabs.find((tab) => tab.id === requested) ?? tabs[0];
  if (activeTab === undefined) {
    return null;
  }

  const TabContent = activeTab.component;
  return (
    <FeatureOverlay
      locked={
        activeTab.overlay === true && activeTab.isLocked?.(context) === true
      }
      feature={translateFeature(activeTab.teaser)}
    >
      <SuspenseWrapper>
        <TabContent />
      </SuspenseWrapper>
    </FeatureOverlay>
  );
}

export const platformRoutes = [
  ...ADMIN_PAGES.map((page) => ({
    path: page.path,
    element: (
      <PlatformLayout>
        <PageTitle title={page.title}>
          <AdminRoute page={page} />
        </PageTitle>
      </PlatformLayout>
    ),
  })),
  ...ADMIN_REDIRECTS.map(({ from, to, title, replace = true }) => ({
    path: from,
    element:
      title === undefined ? (
        <Navigate to={to} replace={replace} />
      ) : (
        <PlatformLayout>
          <PageTitle title={title}>
            <Navigate to={to} replace={replace} />
          </PageTitle>
        </PlatformLayout>
      ),
  })),
];
