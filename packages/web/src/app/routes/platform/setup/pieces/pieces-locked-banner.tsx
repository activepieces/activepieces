import { FeatureBanner } from '@/app/components/feature-banner';
import { platformHooks } from '@/hooks/platform-hooks';

export function PiecesLockedBanner({ message }: PiecesLockedBannerProps) {
  const { platform } = platformHooks.useCurrentPlatform();

  if (platform.plan.managePiecesEnabled) {
    return null;
  }

  return (
    <div className="px-6 shrink-0 pb-4">
      <FeatureBanner message={message} />
    </div>
  );
}

export type PiecesLockedBannerProps = {
  message: string;
};
