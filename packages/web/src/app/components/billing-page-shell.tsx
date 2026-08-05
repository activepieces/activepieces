import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  PlatformBillingInformation,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ReactNode } from 'react';

import { LoadingSpinner } from '@/components/custom/spinner';
import { billingQueries } from '@/features/billing';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import LockedFeatureGuard from './locked-feature-guard';

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
      locked={edition === ApEdition.COMMUNITY}
      lockTitle={lockTitle}
      lockDescription={t(
        'Switch to the Enterprise edition to access billing and usage management.',
      )}
      lockDocumentationUrl={LOCK_DOCUMENTATION_URL}
      showContactSales={false}
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
  } = billingQueries.usePlatformSubscription(platform.id);

  if (isLoading || isNil(info)) {
    return (
      <div className="h-full flex items-center justify-center w-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full flex items-center justify-center w-full">
        {errorMessage}
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
