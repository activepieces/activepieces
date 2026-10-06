import { ApFlagId, PieceSyncMode } from '@activepieces/shared';
import {
  Download04Icon,
  MoreHorizontalIcon,
  RefreshIcon,
} from '@hugeicons/core-free-icons';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { platformPiecesMutations } from '@/features/platform-admin';
import { flagsHooks } from '@/hooks/flags-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { api } from '@/lib/api';
import { mutationFeedback } from '@/lib/mutation-feedback';
import { cn } from '@/lib/utils';

export const PiecesHeaderMenu = () => {
  const { data: piecesSyncMode } = flagsHooks.useFlag<string>(
    ApFlagId.PIECES_SYNC_MODE,
  );
  const { mutate: syncPieces, isPending: syncing } =
    platformPiecesMutations.useSyncPieces();
  const { mutate: downloadReport, isPending: downloading } = useMutation({
    mutationFn: downloadPiecesReport,
    onError: (error) => {
      mutationFeedback.error({
        error,
        title: t("Couldn't download the pieces report"),
      });
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label={t('More actions')}>
          <HugeiconsIcon icon={MoreHorizontalIcon} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          {...adminControl(AdminControl.PIECES_REPORT_RUN)}
          disabled={downloading}
          onSelect={() => downloadReport()}
        >
          <HugeiconsIcon icon={Download04Icon} />
          {downloading ? t('Preparing report…') : t('Download report (CSV)')}
        </DropdownMenuItem>
        {piecesSyncMode === PieceSyncMode.OFFICIAL_AUTO && (
          <DropdownMenuItem
            {...adminControl(AdminControl.PIECES_SYNC_RUN)}
            disabled={syncing}
            onSelect={() => syncPieces()}
          >
            <HugeiconsIcon
              icon={RefreshIcon}
              className={cn(syncing && 'animate-spin')}
            />
            {syncing ? t('Syncing…') : t('Sync from cloud')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
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
