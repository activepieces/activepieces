import { ApFlagId, PieceSyncMode } from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Download, LayoutGrid, MoreHorizontal, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PLATFORM_FEATURES, useFeatureGate } from '@/features/billing';
import { platformPiecesMutations } from '@/features/platform-admin';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { api } from '@/lib/api';

export const PiecesHeaderMenu = ({
  onCustomizeLayout,
}: {
  onCustomizeLayout: () => void;
}) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const gate = useFeatureGate({
    locked: !platform.plan.managePiecesEnabled,
    feature: PLATFORM_FEATURES.pieces,
  });
  const { data: piecesSyncMode } = flagsHooks.useFlag<string>(
    ApFlagId.PIECES_SYNC_MODE,
  );
  const { mutate: syncPieces } = platformPiecesMutations.useSyncPieces();
  const { mutate: downloadReport } = useMutation({
    mutationFn: downloadPiecesReport,
    onError: () => {
      toast.error(t('Failed to download pieces report'));
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label={t('More actions')}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={gate.locked ? gate.open : onCustomizeLayout}
          >
            <LayoutGrid />
            {t('Step picker layout')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => downloadReport()}>
            <Download />
            {t('Download report (CSV)')}
          </DropdownMenuItem>
          {piecesSyncMode === PieceSyncMode.OFFICIAL_AUTO && (
            <DropdownMenuItem onSelect={() => syncPieces()}>
              <RefreshCw />
              {t('Sync from cloud')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {gate.dialog}
    </>
  );
};

async function downloadPiecesReport() {
  const blob = await api.get<Blob>(
    '/v1/platform/pieces-report.csv',
    undefined,
    {
      responseType: 'blob',
    },
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `pieces-report-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
