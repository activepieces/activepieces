import { isNil, SuggestionType } from '@activepieces/shared';
import { t } from 'i18next';
import { ExternalLink, Info, TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDebounce } from 'use-debounce';

import { RequestTrial } from '@/app/components/request-trial';
import { LockedAlert } from '@/components/custom/locked-alert';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { VirtualizedList } from '@/components/ui/virtualized-list';
import { pieceSetQueries } from '@/features/piece-sets';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { projectCollectionUtils } from '@/features/projects';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import {
  isProjectAccessError,
  ProjectAccessDeniedAlert,
} from '../project-access';

import { PieceRow } from './piece-row';
import { piecesUtils } from './pieces-utils';

const COLLAPSED_ROW_LIMIT = 6;
const COLLAPSED_ROW_HEIGHT = 50;
const PIECE_SETS_LIST_ROUTE = '/platform/setup/pieces?tab=piece-sets';
const SEARCH_DEBOUNCE_MS = 300;

export function PiecesPanel({
  projectId,
  searchQuery,
  isRunActionDisabled,
  isRunActionDisabledByPlatform,
  onShowBuiltIn,
}: PiecesPanelProps) {
  const [debouncedSearchQuery] = useDebounce(
    searchQuery.trim(),
    SEARCH_DEBOUNCE_MS,
  );
  const [showAll, setShowAll] = useState(false);

  const isSearching = debouncedSearchQuery !== '';
  const { pieces, isLoading, isError, error, refetch } = piecesHooks.usePieces({
    projectId: projectId ?? undefined,
    searchQuery: isSearching ? debouncedSearchQuery : undefined,
    suggestionType: SuggestionType.ACTION,
    enabled: !isNil(projectId),
    keepPreviousResults: true,
  });
  const rows = useMemo(
    () =>
      piecesUtils.toReachablePieces({
        pieces: pieces ?? [],
        isSearching,
      }),
    [pieces, isSearching],
  );
  const visibleRows = useMemo(
    () => (isSearching || showAll ? rows : rows.slice(0, COLLAPSED_ROW_LIMIT)),
    [rows, isSearching, showAll],
  );
  const hiddenCount = rows.length - visibleRows.length;

  return (
    <div className="flex flex-col gap-4">
      <PieceSetBanner projectId={projectId} />

      {(isRunActionDisabled || isRunActionDisabledByPlatform) && (
        <RunActionDisabledAlert
          isDisabledByPlatform={isRunActionDisabledByPlatform}
          onShowBuiltIn={onShowBuiltIn}
        />
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: COLLAPSED_ROW_LIMIT }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : isError ? (
        <PiecesUnavailableAlert error={error} onRetry={refetch} />
      ) : rows.length === 0 ? (
        <div className="rounded-lg border px-4 py-10 text-sm text-muted-foreground">
          {isSearching
            ? t('No piece or action matches your search.')
            : t('No pieces are reachable in this project.')}
        </div>
      ) : (
        <div className="rounded-lg border">
          <VirtualizedList
            items={visibleRows}
            estimateSize={COLLAPSED_ROW_HEIGHT}
            getItemKey={(index) => visibleRows[index].piece.name}
            renderItem={(row, index) => (
              <PieceRow
                row={row}
                isLastRow={index === visibleRows.length - 1}
              />
            )}
          />
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="w-full border-t px-4 py-3 text-sm font-medium hover:bg-muted/40"
            >
              {t('Show {count} more pieces', { count: hiddenCount })}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PiecesUnavailableAlert({
  error,
  onRetry,
}: PiecesUnavailableAlertProps) {
  if (isProjectAccessError(error)) {
    return <ProjectAccessDeniedAlert />;
  }

  return (
    <Alert variant="destructive">
      <TriangleAlert />
      <AlertTitle>{t('The pieces failed to load')}</AlertTitle>
      <AlertDescription>
        {t(
          'Nothing is listed below because the request failed, not because the project is empty.',
        )}
      </AlertDescription>
      <Button
        variant="outline"
        size="sm"
        className="col-start-2 mt-3 w-fit"
        onClick={() => onRetry()}
      >
        {t('Try again')}
      </Button>
    </Alert>
  );
}

function RunActionDisabledAlert({
  isDisabledByPlatform,
  onShowBuiltIn,
}: {
  isDisabledByPlatform: boolean;
  onShowBuiltIn: () => void;
}) {
  return (
    <Alert variant="warning">
      <TriangleAlert />
      <AlertTitle>{t('Nothing below can run right now')}</AlertTitle>
      <AlertDescription>
        {isDisabledByPlatform
          ? t(
              'A platform admin switched Run action off for the whole platform. Clients can still see the list, but every call fails.',
            )
          : t(
              'Running piece actions is switched off for this project. Clients can still see the list, but every call fails.',
            )}
      </AlertDescription>
      {!isDisabledByPlatform && (
        <Button
          variant="outline"
          size="sm"
          className="col-start-2 mt-3 w-fit"
          onClick={onShowBuiltIn}
        >
          {t('Turn on Run action')}
        </Button>
      )}
    </Alert>
  );
}

function PieceSetBanner({ projectId }: { projectId: string | null }) {
  const { platform } = platformHooks.useCurrentPlatform();
  const isPlatformAdmin = useIsPlatformAdmin();
  const { data: projects = [] } = projectCollectionUtils.useAll();
  const pieceSetId =
    projects.find((project) => project.id === projectId)?.pieceSetId ?? null;
  const { data: pieceSet } = pieceSetQueries.usePieceSet(pieceSetId ?? '');

  if (!platform.plan.managePiecesEnabled) {
    return (
      <LockedAlert
        title={t('Control Pieces')}
        description={t(
          'Every piece below is reachable by any connected client. Restricting the list to a chosen set is an enterprise feature.',
        )}
        button={
          <RequestTrial featureKey="ENTERPRISE_PIECES" buttonVariant="basic" />
        }
      />
    );
  }

  return (
    <Alert
      variant="primary"
      className="flex flex-wrap items-center gap-x-3 gap-y-2"
    >
      <Info />
      <AlertDescription className="min-w-60 flex-1">
        {isPlatformAdmin
          ? t("This project's pieces are controlled by a Piece Set.")
          : t(
              "This project's pieces are controlled by a Piece Set. Contact a platform admin to change it.",
            )}
      </AlertDescription>
      {isPlatformAdmin && (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="ml-auto shrink-0"
        >
          <Link
            to={
              pieceSetId
                ? `/platform/setup/pieces/piece-sets/${pieceSetId}`
                : PIECE_SETS_LIST_ROUTE
            }
          >
            {pieceSet?.name ?? t('Review piece set')}
            <ExternalLink className="size-3.5" />
          </Link>
        </Button>
      )}
    </Alert>
  );
}

type PiecesUnavailableAlertProps = {
  error: Error | null;
  onRetry: () => void;
};

type PiecesPanelProps = {
  projectId: string | null;
  searchQuery: string;
  isRunActionDisabled: boolean;
  isRunActionDisabledByPlatform: boolean;
  onShowBuiltIn: () => void;
};
