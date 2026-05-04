import { AppConnectionStatus } from '@activepieces/shared';
import { t } from 'i18next';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { appConnectionsQueries } from '@/features/connections';
import { piecesHooks } from '@/features/pieces';
import { authenticationSession } from '@/lib/authentication-session';

export function ConnectedAppsList() {
  const navigate = useNavigate();
  const projectId = authenticationSession.getProjectId() ?? '';

  const goToConnections = () => {
    navigate(authenticationSession.appendProjectRoutePrefix('/connections'));
  };

  const { data, isLoading } = appConnectionsQueries.useAppConnections({
    request: { projectId, limit: 100, cursor: undefined },
    extraKeys: [projectId],
    enabled: Boolean(projectId),
  });

  const { pieces } = piecesHooks.usePieces({});
  const pieceMeta = new Map<string, { displayName: string; logoUrl: string }>(
    (pieces ?? []).map((p) => [
      p.name,
      { displayName: p.displayName, logoUrl: p.logoUrl },
    ]),
  );

  if (isLoading) {
    return (
      <div className="relative z-0 -translate-y-3 flex items-center justify-between gap-2 rounded-b-2xl bg-muted/70 px-3 pt-5 pb-2">
        <Skeleton className="h-3 w-24" />
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[18px] w-[18px] rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  const activeConnections = (data?.data ?? [])
    .filter((c) => c.status === AppConnectionStatus.ACTIVE)
    .slice()
    .sort((a, b) => (a.created < b.created ? 1 : -1));
  const orderedPieceNames: string[] = [];
  for (const connection of activeConnections) {
    if (
      connection.pieceName &&
      !orderedPieceNames.includes(connection.pieceName)
    ) {
      orderedPieceNames.push(connection.pieceName);
    }
  }
  const uniquePieceNames = dedupePieceNames({
    pieceNames: orderedPieceNames,
    pieceMeta,
  });
  if (uniquePieceNames.length === 0) return null;

  const visiblePieceNames = uniquePieceNames.slice(0, MAX_VISIBLE);
  const overflowCount = uniquePieceNames.length - visiblePieceNames.length;

  return (
    <button
      type="button"
      onClick={goToConnections}
      aria-label={t('Connected apps')}
      className="relative z-0 mx-auto -translate-y-3 flex w-[calc(100%-0.75rem)] items-center justify-between gap-2 rounded-b-2xl bg-muted/70 px-3 pt-5 pb-2 text-left transition-colors cursor-pointer hover:bg-muted-foreground/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="text-xs text-muted-foreground shrink-0">
        {t('Connected apps')}
      </span>
      <div className="flex items-center gap-0.5 flex-wrap justify-end">
        {visiblePieceNames.map((pieceName, i) => {
          const meta = pieceMeta.get(pieceName);
          return (
            <motion.div
              key={pieceName}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.15 + i * 0.04 }}
            >
              <PieceLogo
                displayName={meta?.displayName ?? pieceName}
                logoUrl={meta?.logoUrl}
              />
            </motion.div>
          );
        })}
        {overflowCount > 0 && (
          <motion.div
            className="flex h-[18px] min-w-[18px] items-center justify-center rounded-md bg-background px-1 text-[10px] font-medium text-muted-foreground tabular-nums"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.15 + MAX_VISIBLE * 0.04 }}
          >
            +{overflowCount}
          </motion.div>
        )}
      </div>
    </button>
  );
}

function dedupePieceNames({
  pieceNames,
  pieceMeta,
}: {
  pieceNames: string[];
  pieceMeta: Map<string, { displayName: string; logoUrl: string }>;
}): string[] {
  const seenDisplayNames = new Set<string>();
  const seenLogoUrls = new Set<string>();
  const result: string[] = [];
  for (const pieceName of pieceNames) {
    const meta = pieceMeta.get(pieceName);
    const displayName = meta?.displayName ?? pieceName;
    const logoUrl = meta?.logoUrl ?? '';
    if (seenDisplayNames.has(displayName)) continue;
    if (logoUrl && seenLogoUrls.has(logoUrl)) continue;
    seenDisplayNames.add(displayName);
    if (logoUrl) seenLogoUrls.add(logoUrl);
    result.push(pieceName);
  }
  return result;
}

function PieceLogo({
  displayName,
  logoUrl,
}: {
  displayName: string;
  logoUrl?: string;
}) {
  if (!logoUrl) {
    return <Skeleton className="h-[18px] w-[18px] rounded-md" />;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex h-[18px] w-[18px] items-center justify-center rounded-md bg-background p-0.5">
          <img
            src={logoUrl}
            alt={displayName}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">{displayName}</TooltipContent>
    </Tooltip>
  );
}

const MAX_VISIBLE = 10;
