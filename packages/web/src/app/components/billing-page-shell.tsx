import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  PlatformBillingInformation,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ReactNode } from 'react';

import { AdminFetchErrorState, AdminPage } from '@/app/components/admin';
import { SkeletonList } from '@/components/ui/skeleton';
import { billingQueries } from '@/features/billing';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { LockedFeatureGuard } from './locked-feature-guard';

export function BillingPageShell({
  lockTitle,
  header,
  children,
}: BillingPageShellProps) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  return (
    <LockedFeatureGuard
      featureKey="BILLING"
      locked={edition === ApEdition.COMMUNITY}
      lockTitle={lockTitle}
      lockDescription={t(
        'Switch to the Enterprise edition to access billing and usage management.',
      )}
      communityGuide={{
        url: EDITION_GUIDE_URL,
        label: t('How to switch to the Enterprise edition'),
      }}
    >
      <BillingPageContent header={header}>{children}</BillingPageContent>
    </LockedFeatureGuard>
  );
}

function BillingPageContent({ header, children }: BillingPageContentProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const {
    data: info,
    isLoading,
    isError,
    refetch,
  } = billingQueries.usePlatformSubscription(platform.id);

  if (isError && isNil(info)) {
    return (
      <AdminPage>
        {header}
        <AdminFetchErrorState
          entity={t('billing information')}
          onRetry={refetch}
        />
      </AdminPage>
    );
  }

  if (isLoading || isNil(info)) {
    return (
      <AdminPage>
        {header}
        <SkeletonList numberOfItems={3} className="h-18" />
      </AdminPage>
    );
  }

  return <>{children({ platform, info })}</>;
}

type CurrentPlatform = ReturnType<
  typeof platformHooks.useCurrentPlatform
>['platform'];

type BillingPageShellRenderParams = {
  platform: CurrentPlatform;
  info: PlatformBillingInformation;
};

type BillingPageContentProps = {
  header: ReactNode;
  children: (params: BillingPageShellRenderParams) => ReactNode;
};

type BillingPageShellProps = BillingPageContentProps & {
  lockTitle: string;
};

const EDITION_GUIDE_URL =
  'https://www.activepieces.com/docs/install/configuration/overview#enterprise-edition-optional';
