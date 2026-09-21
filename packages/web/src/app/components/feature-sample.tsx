import { ApEdition, ApFlagId, TelemetryEventName } from '@activepieces/shared';
import { t } from 'i18next';
import { ExternalLink, Lock } from 'lucide-react';
import { ReactNode } from 'react';

import { useTelemetry } from '@/components/providers/telemetry-provider';
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
  const { capture } = useTelemetry();

  if (!locked) {
    return children;
  }

  const isCommunity = edition === ApEdition.COMMUNITY;

  return (
    <div className="relative flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden">
      <div
        inert
        aria-hidden
        className="flex flex-1 min-h-0 min-w-0 flex-col pointer-events-none select-none opacity-25"
      >
        {children}
      </div>

      <div className="absolute inset-0 grid place-items-center overflow-auto p-6">
        <div className="pointer-events-auto flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border bg-background px-8 py-9 text-center shadow-xl">
          <div className="grid size-12 place-items-center rounded-xl bg-primary/10">
            <Lock className="size-5.5 text-primary" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">{t(title)}</h2>
            {description !== undefined && description !== '' && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(description)}
              </p>
            )}
          </div>
          {isCommunity ? (
            <div className="flex flex-col items-center gap-3">
              {showContactSales && featureKey !== undefined && (
                <span
                  onClickCapture={() =>
                    capture({
                      name: TelemetryEventName.PLATFORM_ADMIN_SALES_CONTACTED,
                      payload: { feature: featureKey, surface: 'sample' },
                    })
                  }
                >
                  <RequestTrial featureKey={featureKey} />
                </span>
              )}
              <a
                href={documentationUrl ?? ENTERPRISE_DOCUMENTATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {t('Read the docs')}
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          ) : (
            <Button
              className="w-full"
              onClick={() => {
                capture({
                  name: TelemetryEventName.PLATFORM_ADMIN_UPGRADE_CLICKED,
                  payload: {
                    feature: featureKey ?? null,
                    tier: tier ?? null,
                    surface: 'sample',
                  },
                });
                openManagePlanDialog();
              }}
            >
              {tier === undefined
                ? t('Upgrade to unlock')
                : t('Upgrade to {tier}', { tier: TIER_LABELS[tier] })}
            </Button>
          )}
          {tier !== undefined && !isCommunity && (
            <>
              <div className="h-px w-full bg-border" />
              <span className="text-xs text-muted-foreground">
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
