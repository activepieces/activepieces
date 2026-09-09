import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { ExternalLink, Lock } from 'lucide-react';
import { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { useManagePlanDialogStore } from '@/features/billing';
import { flagsHooks } from '@/hooks/flags-hooks';
import { FeatureTier, TIER_LABELS } from '@/lib/feature-tier';

export function FeatureSample({
  locked,
  title,
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
    <div className="relative flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden">
      <div
        aria-hidden
        className="flex flex-1 min-h-0 min-w-0 flex-col pointer-events-none select-none [mask-image:linear-gradient(to_bottom,black_0,black_24%,transparent_44%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0,black_24%,transparent_44%)]"
      >
        {children}
      </div>

      <div className="absolute inset-x-0 bottom-0 top-[44%] flex flex-col items-center gap-3 px-6 pt-4 text-center">
        <div className="grid size-11 place-items-center rounded-xl bg-primary/10">
          <Lock className="size-5 text-primary" />
        </div>
        <div className="flex max-w-md flex-col gap-1.5">
          <span className="font-semibold">{t(title)}</span>
          {description !== undefined && description !== '' && (
            <span className="text-sm text-muted-foreground">
              {tier === undefined
                ? t(description)
                : `${sentence(t(description))} ${t('Included with {tier}.', {
                    tier: TIER_LABELS[tier],
                  })}`}
            </span>
          )}
        </div>
        {isCommunity ? (
          <a
            href={documentationUrl ?? ENTERPRISE_DOCUMENTATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {t('Read the docs')}
            <ExternalLink className="size-3.5" />
          </a>
        ) : (
          <Button
            className="pointer-events-auto mt-1"
            onClick={() => openManagePlanDialog()}
          >
            {tier === undefined
              ? t('Upgrade to unlock')
              : t('Upgrade to {tier}', { tier: TIER_LABELS[tier] })}
          </Button>
        )}
      </div>
    </div>
  );
}

function sentence(text: string) {
  return /[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`;
}

const ENTERPRISE_DOCUMENTATION_URL =
  'https://www.activepieces.com/docs/install/configuration/overview#enterprise-edition-optional';

export type FeatureSampleProps = {
  locked: boolean;
  title: string;
  description?: string;
  tier?: FeatureTier;
  documentationUrl?: string;
  children: ReactNode;
};
