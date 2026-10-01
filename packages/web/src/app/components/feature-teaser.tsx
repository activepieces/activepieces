import { Page } from '@/components/custom/page';
import { FeatureKey, LockedFeatureCallout } from '@/features/billing';
import { FeatureTier } from '@/features/billing/utils/feature-tier';

export function FeatureTeaser({
  title,
  description,
  tier,
  documentationUrl,
  featureKey,
  showContactSales = true,
}: FeatureTeaserProps) {
  return (
    <Page>
      <LockedFeatureCallout
        feature={{ featureKey, title, description, tier, documentationUrl }}
        showContactSales={showContactSales}
      />
    </Page>
  );
}

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
