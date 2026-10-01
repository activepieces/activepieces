import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, ExternalLink } from 'lucide-react';

import { Page } from '@/components/custom/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FeatureKey,
  RequestTrial,
  useManagePlanDialogStore,
} from '@/features/billing';
import {
  FeatureTier,
  TIER_LABELS,
} from '@/features/billing/utils/feature-tier';
import { flagsHooks } from '@/hooks/flags-hooks';

export function FeatureTeaserContent({
  title,
  description,
  bullets,
  tier,
  documentationUrl,
  videoUrl,
  featureKey,
  showContactSales = true,
}: FeatureTeaserProps) {
  const { openDialog: openManagePlanDialog } = useManagePlanDialogStore();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  const showcase =
    videoUrl === undefined ? null : (
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full rounded-xl"
        controls={false}
        src={videoUrl}
      />
    );

  if (edition === ApEdition.COMMUNITY) {
    const docsUrl = documentationUrl ?? ENTERPRISE_DOCUMENTATION_URL;
    return (
      <div className="flex max-w-md flex-col gap-2">
        <h2 className="text-base font-semibold text-gray-12">{t(title)}</h2>
        <p className="text-sm text-gray-11">
          {t('This is an Enterprise feature, available on our paid plans.')}
        </p>
        <a
          href={docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-accent-11 hover:underline"
        >
          {t('Read the docs')}
          <ExternalLink className="size-3.5" />
        </a>
        {showContactSales && (
          <div className="w-fit pt-2">
            <RequestTrial featureKey={featureKey} />
          </div>
        )}
        {showcase}
      </div>
    );
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-12">{t(title)}</h2>
          {tier !== undefined && (
            <Badge variant="outline">{TIER_LABELS[tier]}</Badge>
          )}
        </div>
        <p className="text-sm text-gray-11">{t(description)}</p>
      </div>

      {bullets !== undefined && bullets.length > 0 && (
        <ul className="flex flex-col gap-2">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2 text-sm">
              <Check className="h-lh w-4 shrink-0 text-accent-11" />
              <span>{t(bullet)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={() => openManagePlanDialog()}>
          {t('Upgrade plan')}
        </Button>
        {documentationUrl !== undefined && (
          <a
            href={documentationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent-11 hover:underline"
          >
            {t('Read the docs')}
            <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>

      {showcase}
    </div>
  );
}

export function FeatureTeaser(props: FeatureTeaserProps) {
  return (
    <Page>
      <div className="pt-8 md:pt-12 xl:pt-16">
        <FeatureTeaserContent {...props} />
      </div>
    </Page>
  );
}

const ENTERPRISE_DOCUMENTATION_URL =
  'https://www.activepieces.com/docs/install/configuration/overview#enterprise-edition-optional';

export type FeatureTeaserProps = {
  featureKey: FeatureKey;
  showContactSales?: boolean;
  title: string;
  description: string;
  bullets?: string[];
  tier?: FeatureTier;
  documentationUrl?: string;
  videoUrl?: string;
};
