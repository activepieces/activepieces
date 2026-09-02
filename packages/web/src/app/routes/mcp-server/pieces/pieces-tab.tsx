import { ErrorCode } from '@activepieces/core-utils';
import { isNil, SuggestionType } from '@activepieces/shared';
import { t } from 'i18next';
import { ExternalLink, Info, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDebounce } from 'use-debounce';

import { ProjectSettingsDialog } from '@/app/components/project-settings';
import { mcpHooks } from '@/app/components/project-settings/mcp-server/utils/mcp-hooks';
import { RequestTrial } from '@/app/components/request-trial';
import { LockedAlert } from '@/components/custom/locked-alert';
import { SearchInput } from '@/components/custom/search-input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { pieceSetQueries } from '@/features/piece-sets';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { projectCollectionUtils } from '@/features/projects';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

import { PageBand } from '../page-band';

import { PieceRow } from './piece-row';
import { piecesUtils } from './pieces-utils';
import { ProjectPicker } from './project-picker';

const RUN_ACTION_TOOL_NAME = 'ap_run_action';
const COLLAPSED_ROW_LIMIT = 6;
const PIECE_SETS_LIST_ROUTE = '/platform/setup/pieces?tab=piece-sets';
const SEARCH_DEBOUNCE_MS = 300;

export function PiecesTab({ projectId, onSelectProject }: PiecesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
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
  const { data: mcpServer } = mcpHooks.useMcpServer(projectId ?? '');

  const rows = piecesUtils.toReachablePieces({
    pieces: pieces ?? [],
    isSearching,
  });
  const visibleRows =
    isSearching || showAll ? rows : rows.slice(0, COLLAPSED_ROW_LIMIT);
  const hiddenCount = rows.length - visibleRows.length;

  return (
    <PageBand className="flex flex-col gap-6 py-8">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-bold leading-7 tracking-tight">
          {t(
            'Every piece a connected client can reach, and every action inside it.',
          )}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(
            'This page is a mirror — a platform admin decides what is on the list.',
          )}
        </p>
      </div>

      <PieceSetBanner projectId={projectId} />

      {projectId !== null &&
        mcpServer?.disabledTools?.includes(RUN_ACTION_TOOL_NAME) && (
          <RunActionDisabledAlert projectId={projectId} />
        )}

      <div className="flex flex-wrap items-center gap-3">
        <ProjectPicker projectId={projectId} onSelect={onSelectProject} />
        <div className="w-full max-w-[420px]">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('Search pieces and actions...')}
          />
        </div>
      </div>

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
          {visibleRows.map((row) => (
            <PieceRow key={row.piece.name} row={row} />
          ))}
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
    </PageBand>
  );
}

function PiecesUnavailableAlert({
  error,
  onRetry,
}: PiecesUnavailableAlertProps) {
  if (isProjectAccessError(error)) {
    return (
      <Alert variant="destructive">
        <TriangleAlert />
        <AlertTitle>{t('You cannot see this project')}</AlertTitle>
        <AlertDescription>
          {t(
            'Pick another project above, or ask a platform admin for access to this one.',
          )}
        </AlertDescription>
      </Alert>
    );
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
        className="mt-3 w-fit"
        onClick={() => onRetry()}
      >
        {t('Try again')}
      </Button>
    </Alert>
  );
}

function RunActionDisabledAlert({ projectId }: { projectId: string }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isCurrentProject = authenticationSession.getProjectId() === projectId;

  return (
    <>
      <Alert variant="warning">
        <TriangleAlert />
        <AlertTitle>{t('Nothing below can run right now')}</AlertTitle>
        <AlertDescription>
          {t(
            'Running piece actions is switched off for this project. Clients can still see the list, but every call fails.',
          )}
        </AlertDescription>
        {isCurrentProject && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-fit"
            onClick={() => setSettingsOpen(true)}
          >
            {t('Turn it on in project settings')}
          </Button>
        )}
      </Alert>
      <ProjectSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialTab="mcp"
      />
    </>
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
    <Alert variant="primary" className="flex items-center gap-3">
      <Info />
      <AlertDescription>
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

function isProjectAccessError(error: Error | null): boolean {
  return (
    api.isApError(error, ErrorCode.AUTHORIZATION) ||
    api.isApError(error, ErrorCode.PERMISSION_DENIED) ||
    api.isApError(error, ErrorCode.ENTITY_NOT_FOUND)
  );
}

type PiecesUnavailableAlertProps = {
  error: Error | null;
  onRetry: () => void;
};

type PiecesTabProps = {
  projectId: string | null;
  onSelectProject: (projectId: string) => void;
};
