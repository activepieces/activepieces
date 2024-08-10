import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { platformHooks } from '@/hooks/platform-hooks';

export default function AppearancePage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const isEnabled = platform.customAppearanceEnabled;
  return (
    <LockedFeatureGuard
      locked={!isEnabled}
      lockTitle="Brand Activepieces"
      lockDescription="Give your users an experience that looks like you by customizing the color, logo and more"
      lockVideoUrl="https://cdn.activepieces.com/videos/showcase/appearance.mp4"
    >
      {null}
    </LockedFeatureGuard>
  );
}
