import { FeatureBanner } from '@/app/components/feature-banner';
import { platformHooks } from '@/hooks/platform-hooks';

export function PiecesLockedBanner({ message }: PiecesLockedBannerProps) {
  const { platform } = platformHooks.useCurrentPlatform();

  if (platform.plan.managePiecesEnabled) {
    return null;
  }

  return <FeatureBanner message={message} />;
}

export type PiecesLockedBannerProps = {
  message: string;
};
