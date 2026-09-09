import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { Crown, ExternalLink } from 'lucide-react';
import { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FeatureTier, useManagePlanDialogStore } from '@/features/billing';
import { flagsHooks } from '@/hooks/flags-hooks';

export function FeatureSample({
  locked,
  label,
  title,
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
  const docsUrl = documentationUrl ?? ENTERPRISE_DOCUMENTATION_URL;

  return (
    <div className="flex flex-1 min-h-0 min-w-0 flex-col overflow-auto p-6">
      <div className="mx-auto flex h-fit w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-primary/25 bg-primary/[0.02] shadow-sm">
        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-3 border-b border-primary/20 bg-primary/[0.06] px-5 py-4">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10">
            <Crown className="size-4.5 text-primary" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">
                {title === undefined ? t(label) : t(title)}
              </span>
              {tier !== undefined && (
                <Badge variant="outline" className="bg-background">
                  {TIER_LABELS[tier]}
                </Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {t(
                'Everything below is sample data, shown so you can see how it works.',
              )}
            </span>
          </div>
          {isCommunity ? (
            <a
              href={docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {t('Read the docs')}
              <ExternalLink className="size-3.5" />
            </a>
          ) : (
            <Button
              size="sm"
              className="shrink-0"
              onClick={() => openManagePlanDialog()}
            >
              {t('Upgrade plan')}
            </Button>
          )}
        </div>
        <div
          aria-hidden
          className="flex min-w-0 flex-col pointer-events-none select-none"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

const ENTERPRISE_DOCUMENTATION_URL =
  'https://www.activepieces.com/docs/install/configuration/overview#enterprise-edition-optional';

const TIER_LABELS: Record<FeatureTier, string> = {
  team: 'Team',
  ultimate: 'Ultimate',
};

export type FeatureSampleProps = {
  locked: boolean;
  label: string;
  title?: string;
  tier?: FeatureTier;
  documentationUrl?: string;
  children: ReactNode;
};
