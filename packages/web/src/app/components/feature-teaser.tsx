import { Page } from '@/components/custom/page';
import { FeatureKey, LockedFeatureCallout } from '@/features/billing';
import { FeatureTier } from '@/features/billing/utils/feature-tier';

export function FeatureTeaser({
  title,
  description,
  tier,
  documentationUrl,
  videoUrl,
  featureKey,
  showContactSales = true,
}: FeatureTeaserProps) {
  return (
    <Page>
      <LockedFeatureCallout
        feature={{ featureKey, title, description, tier, documentationUrl }}
        showContactSales={showContactSales}
      />
      {videoUrl !== undefined && (
        <video
          autoPlay
          loop
          muted
          playsInline
          controls={false}
          src={videoUrl}
          className="w-full max-w-3xl rounded-2xl shadow-edge"
        />
      )}
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
