import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { platformHooks } from '@/hooks/platform-hooks';

export default function TemplatesPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const isEnabled = platform.manageTemplatesEnabled;
  return (
    <LockedFeatureGuard
      locked={!isEnabled}
      lockTitle="Unlock Templates"
      lockDescription="Convert the most common automations into reusable templates 1 click away from your users"
      lockVideoUrl="https://cdn.activepieces.com/videos/showcase/templates.mp4"
    >
      {null}
    </LockedFeatureGuard>
  );
}
