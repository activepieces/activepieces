import { ApEdition, ApFlagId, TelemetryEventName } from '@activepieces/shared';
import React, { Suspense, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

import { FeatureSample } from '@/app/components/feature-sample';
import { PageTitle } from '@/app/components/page-title';
import { RouteLoadingBar } from '@/components/custom/route-loading-bar';
import { useTelemetry } from '@/components/providers/telemetry-provider';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { PlatformLayout } from '../components/platform-layout';

import {
  ADMIN_PAGES,
  ADMIN_REDIRECTS,
  AdminPage as AdminPageSpec,
  adminPagesUtils,
} from './platform/admin-pages';

function useAdminPageViewed({
  page,
  surface,
}: {
  page: string;
  surface: { tab: string | null; locked: boolean } | null;
}) {
  const { capture } = useTelemetry();
  const tab = surface?.tab ?? null;
  const locked = surface?.locked ?? false;
  const viewed = surface !== null;
  useEffect(() => {
    if (!viewed) {
      return;
    }
    capture({
      name: TelemetryEventName.PLATFORM_ADMIN_PAGE_VIEWED,
      payload: { page, tab, locked },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, tab, locked, viewed]);
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteLoadingBar />}>{children}</Suspense>;
}

export function AdminRoute({ page }: { page: AdminPageSpec }) {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const [searchParams] = useSearchParams();
  const context = { plan: platform.plan, edition };

  const requested = searchParams.get('tab');
  const tabs = adminPagesUtils.visibleTabs({ page, context });
  const requestedTab = tabs.find((tab) => tab.id === requested);
  const activeTab = requestedTab ?? tabs[0];
  const rendersOwnBody =
    page.component !== undefined ||
    (page.overview !== undefined && requested === null);
  const redirects =
    !rendersOwnBody && requested !== null && requestedTab === undefined;
  const surface =
    redirects || (!rendersOwnBody && activeTab === undefined)
      ? null
      : rendersOwnBody
      ? {
          tab: null,
          locked:
            page.sample === true && page.nav?.isLocked?.(context) === true,
        }
      : {
          tab: activeTab.id,
          locked:
            activeTab.sample === true && activeTab.isLocked?.(context) === true,
        };
  useAdminPageViewed({ page: page.id, surface });

  const Page = page.component;
  if (Page !== undefined) {
    return (
      <FeatureSample
        locked={page.sample === true && page.nav?.isLocked?.(context) === true}
        title={page.teaser?.title ?? page.nav?.label ?? page.title}
        description={page.teaser?.description}
        tier={page.teaser?.tier}
        documentationUrl={page.teaser?.documentationUrl}
        featureKey={page.teaser?.featureKey}
        showContactSales={page.teaser?.showContactSales}
      >
        <SuspenseWrapper>
          <Page />
        </SuspenseWrapper>
      </FeatureSample>
    );
  }

  const Overview = page.overview;
  if (Overview !== undefined && requested === null) {
    return (
      <FeatureSample
        locked={page.sample === true && page.nav?.isLocked?.(context) === true}
        title={page.teaser?.title ?? page.nav?.label ?? page.title}
        description={page.teaser?.description}
        tier={page.teaser?.tier}
        documentationUrl={page.teaser?.documentationUrl}
        featureKey={page.teaser?.featureKey}
        showContactSales={page.teaser?.showContactSales}
      >
        <SuspenseWrapper>
          <Overview />
        </SuspenseWrapper>
      </FeatureSample>
    );
  }

  if (requested !== null && requestedTab === undefined) {
    return <Navigate to={page.path} replace />;
  }
  if (activeTab === undefined) {
    return null;
  }

  const TabContent = activeTab.component;
  return (
    <FeatureSample
      locked={
        activeTab.sample === true && activeTab.isLocked?.(context) === true
      }
      title={activeTab.teaser?.title ?? activeTab.label}
      description={activeTab.teaser?.description}
      tier={activeTab.teaser?.tier}
      documentationUrl={activeTab.teaser?.documentationUrl}
      featureKey={activeTab.teaser?.featureKey}
      showContactSales={activeTab.teaser?.showContactSales}
    >
      <SuspenseWrapper>
        <TabContent />
      </SuspenseWrapper>
    </FeatureSample>
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
