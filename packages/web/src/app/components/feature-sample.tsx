import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { ExternalLink } from 'lucide-react';
import { ReactNode } from 'react';

import {
  FeatureSampleProvider,
  FeatureSampleState,
  useFeatureSample,
} from '@/components/custom/feature-sample';
import { Button } from '@/components/ui/button';
import { useManagePlanDialogStore } from '@/features/billing';
import { flagsHooks } from '@/hooks/flags-hooks';
import { TIER_LABELS } from '@/lib/feature-tier';

export function FeatureSample({
  locked,
  tier,
  documentationUrl,
  children,
}: FeatureSampleProps) {
  if (!locked) {
    return children;
  }

  return (
    <FeatureSampleProvider value={{ locked, tier, documentationUrl }}>
      <div
        aria-hidden
        className="flex flex-1 min-h-0 min-w-0 flex-col pointer-events-none select-none"
      >
        {children}
      </div>
    </FeatureSampleProvider>
  );
}

export function SampleUpgradeButton() {
  const { locked, tier, documentationUrl } = useFeatureSample();
  const { openDialog: openManagePlanDialog } = useManagePlanDialogStore();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  if (!locked) {
    return null;
  }

  if (edition === ApEdition.COMMUNITY) {
    return (
      <a
        href={documentationUrl ?? ENTERPRISE_DOCUMENTATION_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        {t('Read the docs')}
        <ExternalLink className="size-3.5" />
      </a>
    );
  }

  return (
    <Button
      size="sm"
      className="pointer-events-auto shrink-0"
      onClick={() => openManagePlanDialog()}
    >
      {tier === undefined
        ? t('Upgrade plan')
        : t('Upgrade to {tier}', { tier: TIER_LABELS[tier] })}
    </Button>
  );
}

const ENTERPRISE_DOCUMENTATION_URL =
  'https://www.activepieces.com/docs/install/configuration/overview#enterprise-edition-optional';

export type FeatureSampleProps = FeatureSampleState & {
  children: ReactNode;
};
