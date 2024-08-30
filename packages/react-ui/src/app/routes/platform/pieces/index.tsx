import { t } from 'i18next';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import PiecesTable from '@/features/pieces/components/piece-table';
import { platformHooks } from '@/hooks/platform-hooks';

export default function PlatformPiecesPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const isEnabled = platform.managePiecesEnabled;
  return (
    <LockedFeatureGuard
      featureKey="PIECES"
      locked={!isEnabled}
      lockTitle={t('Control Pieces')}
      lockDescription={t(
        "Show the pieces that matter most to your users and hide the ones that you don't like",
      )}
      lockVideoUrl="https://cdn.activepieces.com/videos/showcase/pieces.mp4"
    >
      <PiecesTable />
    </LockedFeatureGuard>
  );
}
