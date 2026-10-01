import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { ExternalLink, Lock } from 'lucide-react';
import { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  FeatureKey,
  FeatureTier,
  RequestTrial,
  TIER_LABELS,
  useManagePlanDialogStore,
} from '@/features/billing';
import { flagsHooks } from '@/hooks/flags-hooks';

export function FeatureSample({
  locked,
  title,
  description,
  tier,
  documentationUrl,
  featureKey,
  showContactSales = true,
  children,
}: FeatureSampleProps) {
  const { openDialog: openManagePlanDialog } = useManagePlanDialogStore();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  if (!locked) {
    return children;
  }

  const isCommunity = edition === ApEdition.COMMUNITY;

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div
        inert
        aria-hidden
        className="pointer-events-none flex min-h-0 min-w-0 flex-1 flex-col opacity-25 select-none"
      >
        {children}
      </div>

      <div className="absolute inset-0 grid place-items-center overflow-auto p-6">
        <div className="pointer-events-auto flex w-full max-w-md flex-col items-center gap-4 rounded-2xl bg-panel p-8 text-center shadow-over">
          <div className="grid size-12 place-items-center rounded-xl bg-accent-3">
            <Lock className="size-5 text-accent-11" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-semibold">{t(title)}</h2>
            {description !== undefined && description !== '' && (
              <p className="text-sm text-gray-11">{t(description)}</p>
            )}
          </div>
          {isCommunity ? (
            <div className="flex flex-col items-center gap-2">
              {showContactSales && featureKey !== undefined && (
                <RequestTrial featureKey={featureKey} />
              )}
              <a
                href={documentationUrl ?? ENTERPRISE_DOCUMENTATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-accent-11 hover:underline"
              >
                {t('Read the docs')}
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          ) : (
            <Button className="w-full" onClick={() => openManagePlanDialog()}>
              {tier === undefined
                ? t('Upgrade to unlock')
                : t('Upgrade to {tier}', { tier: TIER_LABELS[tier] })}
            </Button>
          )}
          {tier !== undefined && !isCommunity && (
            <>
              <div className="h-px w-full bg-gray-6" />
              <span className="text-xs text-gray-11">
                {t('Included with the {tier} plan and above.', {
                  tier: TIER_LABELS[tier],
                })}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const ENTERPRISE_DOCUMENTATION_URL =
  'https://www.activepieces.com/docs/install/configuration/overview#enterprise-edition-optional';

export type FeatureSampleProps = {
  locked: boolean;
  featureKey?: FeatureKey;
  showContactSales?: boolean;
  title: string;
  description?: string;
  tier?: FeatureTier;
  documentationUrl?: string;
  children: ReactNode;
};
