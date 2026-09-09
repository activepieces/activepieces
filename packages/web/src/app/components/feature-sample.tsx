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
      <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-x-5 gap-y-3 bg-primary px-6 py-4 text-primary-foreground shadow-[0_12px_28px_-6px] shadow-primary/45">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary-foreground/15 px-2.5 py-1 text-xs font-medium">
          <Crown className="size-3.5" />
          {t(label)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold">
            {t("What you're seeing is sample data")}
          </span>
          {description !== undefined && description !== '' && (
            <span className="text-sm text-primary-foreground/80">
              {t(description)}
            </span>
          )}
        </div>
        {isCommunity ? (
          <a
            href={documentationUrl ?? ENTERPRISE_DOCUMENTATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto inline-flex shrink-0 items-center gap-1 rounded-md bg-primary-foreground px-3 py-2 text-sm font-medium text-primary hover:bg-primary-foreground/90"
          >
            {t('Read the docs')}
            <ExternalLink className="size-3.5" />
          </a>
        ) : (
          <Button
            size="sm"
            className="pointer-events-auto shrink-0 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
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
        className="h-4 shrink-0 bg-gradient-to-b from-primary/15 to-transparent"
      />
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
