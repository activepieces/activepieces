import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  PlatformBillingInformation,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ReactNode } from 'react';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Spinner } from '@/components/ui/spinner';
import { billingQueries } from '@/features/billing';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { LockedFeatureGuard } from './locked-feature-guard';

const LOCK_DOCUMENTATION_URL =
  'https://www.activepieces.com/docs/install/configuration/overview#enterprise-edition-optional';

export function BillingPageShell({
  lockTitle,
  errorMessage,
  children,
}: BillingPageShellProps) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  return (
    <LockedFeatureGuard
      featureKey="BILLING"
      showContactSales={false}
      locked={edition === ApEdition.COMMUNITY}
      lockTitle={lockTitle}
      lockDescription={t(
        'See which projects spent what on runs and AI, manage seats and invoices, and top up before credits run out.',
      )}
      lockDocumentationUrl={LOCK_DOCUMENTATION_URL}
    >
      <BillingPageContent errorMessage={errorMessage}>
        {children}
      </BillingPageContent>
    </LockedFeatureGuard>
  );
}

function BillingPageContent({
  errorMessage,
  children,
}: BillingPageContentProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const {
    data: info,
    isLoading,
    isError,
    refetch,
  } = billingQueries.usePlatformSubscription(platform.id);

  if (isError && !isLoading) {
    return (
      <div
        role="alert"
        aria-label={errorMessage}
        className="flex h-full w-full items-center justify-center"
      >
        <DataFetchErrorState
          entity={t('billing information')}
          onRetry={refetch}
        />
      </div>
    );
  }

  if (isLoading || isNil(info)) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner />
      </div>
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
  errorMessage: string;
  children: (params: BillingPageShellRenderParams) => ReactNode;
};

type BillingPageShellProps = BillingPageContentProps & {
  lockTitle: string;
};
