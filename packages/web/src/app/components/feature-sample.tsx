import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { Crown, ExternalLink } from 'lucide-react';
import { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { useManagePlanDialogStore } from '@/features/billing';
import { flagsHooks } from '@/hooks/flags-hooks';
import { FeatureTier, TIER_LABELS } from '@/lib/feature-tier';

export function FeatureSample({
  locked,
  label,
  description,
  tier,
  documentationUrl,
  children,
}: FeatureSampleProps) {
  const { openDialog: openManagePlanDialog } = useManagePlanDialogStore();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  if (!locked) {
    return children;
  }

  const isCommunity = edition === ApEdition.COMMUNITY;

  return (
    <div className="flex flex-1 min-h-0 min-w-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-3 border-b bg-primary/6 px-6 py-4">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          <Crown className="size-3.5" />
          {t(label)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold">
            {t("What you're seeing is sample data")}
          </span>
          {description !== undefined && description !== '' && (
            <span className="text-sm text-muted-foreground">
              {t(description)}
            </span>
          )}
        </div>
        {isCommunity ? (
          <a
            href={documentationUrl ?? ENTERPRISE_DOCUMENTATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {t('Read the docs')}
            <ExternalLink className="size-3.5" />
          </a>
        ) : (
          <Button
            size="sm"
            className="pointer-events-auto shrink-0"
            onClick={() => openManagePlanDialog()}
          >
            {tier === undefined
              ? t('Upgrade to unlock')
              : t('Upgrade to {tier}', { tier: TIER_LABELS[tier] })}
          </Button>
        )}
      </div>
      <div
        aria-hidden
        className="flex flex-1 min-h-0 min-w-0 flex-col pointer-events-none select-none"
      >
        {children}
      </div>
    </div>
  );
}

const ENTERPRISE_DOCUMENTATION_URL =
  'https://www.activepieces.com/docs/install/configuration/overview#enterprise-edition-optional';

export type FeatureSampleProps = {
  locked: boolean;
  label: string;
  description?: string;
  tier?: FeatureTier;
  documentationUrl?: string;
  children: ReactNode;
};
