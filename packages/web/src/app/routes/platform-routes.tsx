import { ApEdition, ApFlagId } from '@activepieces/shared';
import React, { Suspense } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

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

  const requestedTab = tabs.find((tab) => tab.id === requested);
  if (requested !== null && requestedTab === undefined) {
    return <Navigate to={page.path} replace />;
  }
  const activeTab = requestedTab ?? tabs[0];
  if (activeTab === undefined) {
    return null;
  }

  const TabContent = activeTab.component;
  return (
    <SuspenseWrapper>
      <TabContent />
    </SuspenseWrapper>
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
