import { isNil } from '@activepieces/core-utils';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import {
  FlowActionType,
  FlowOperationType,
  PieceSelectorTabConfig,
  PieceSetConfig,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Pin, PinOff, PuzzleIcon, SearchIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';

import { AdminFetchErrorState } from '@/app/components/admin';
import { LogoPlate } from '@/components/custom/logo-plate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VirtualizedScrollArea } from '@/components/ui/virtualized-scroll-area';
import { pieceSetQueries } from '@/features/piece-sets';
import {
  PieceSelectorTabType,
  pieceSelectorContent,
  pieceSelectorCustomization,
  piecesHooks,
  stepsHooks,
  stepUtils,
} from '@/features/pieces';
import {
  CategorizedStepMetadataWithSuggestions,
  StepMetadataWithSuggestions,
} from '@/features/pieces/types';
import { ACTION_CLASSIFICATION_BADGES } from '@/features/pieces/utils/action-classification';
import { aiProviderQueries } from '@/features/platform-admin/hooks/ai-provider-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

export function PieceSelectorPreview({
  tabs,
  pins,
  selectedKey,
  onSelect,
  highlightedKeys,
  flashedPiece,
  onTogglePin,
}: PieceSelectorPreviewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const { steps, actionCounts, isLoading, isError, refetch } =
    usePieceMenuPreviewSteps();
  const aiAndAgentsAvailable = useAiAndAgentsAvailable();
  const resolved = pieceSelectorCustomization.buildResolvedTabs({
    availableBuiltinTabs: pieceSelectorCustomization.getBuiltinTabs({
      operationType: FlowOperationType.ADD_ACTION,
      aiAndAgentsAvailable,
    }),
    config: { tabs },
  });
  const selected =
    resolved.find((tab) => tab.key === selectedKey) ?? resolved[0] ?? null;
  const searching = searchQuery.trim() !== '';
  const serverQuery = searching ? debouncedQuery.trim() : '';
  const { metadata: searchMatches } = stepsHooks.useAllStepsMetadata({
    searchQuery: serverQuery,
    type: 'action',
    enabled: serverQuery !== '',
  });
  const selectedType = selected?.type ?? null;
  const selectedCustomTabId = selected?.customTabId ?? null;
  const categories = useMemo(
    () =>
      groupForPreview({
        steps: previewSteps({
          steps,
          query: serverQuery,
          searchMatches: serverQuery === '' ? undefined : searchMatches,
        }),
        pins,
        tabs,
        selectedTab: searching ? PieceSelectorTabType.NONE : selectedType,
        selectedCustomTabId,
      }),
    [
      steps,
      serverQuery,
      searchMatches,
      pins,
      tabs,
      searching,
      selectedType,
      selectedCustomTabId,
    ],
  );
  const rows = useMemo(() => toRows(categories), [categories]);
  const visibleSteps = rows.flatMap((row) =>
    row.kind === 'step' ? [row.step] : [],
  );
  const active =
    visibleSteps.find((step) => stepId(step) === activeId) ??
    visibleSteps[0] ??
    null;

  const emptyMessage = (() => {
    if (searching) {
      return t('No pieces match this search.');
    }
    if (selected === null) {
      return t('Every tab is hidden. Builders only see the search box.');
    }
    if (selected.type === PieceSelectorTabType.CUSTOM) {
      return t('This tab is empty. Add pieces to it in the panel beside.');
    }
    if (selected.type === PieceSelectorTabType.APPROVALS) {
      return t(
        'Approval steps, such as waiting for a person to approve, appear here.',
      );
    }
    return t('No pieces here yet.');
  })();

  const body = (() => {
    if (isError) {
      return (
        <div className="p-5">
          <AdminFetchErrorState entity={t('pieces')} onRetry={refetch} />
        </div>
      );
    }
    if (isLoading) {
      return <PreviewSkeleton />;
    }
    if (rows.length === 0) {
      return (
        <p className="min-h-48 p-5 text-sm text-gray-11">{emptyMessage}</p>
      );
    }
    return (
      <div className="grid max-h-96 min-h-48 grid-cols-1 grid-rows-[minmax(0,1fr)] sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        <VirtualizedScrollArea
          className="min-h-0 sm:border-r"
          items={rows}
          estimateSize={(index) =>
            rows[index].kind === 'header' ? HEADER_HEIGHT : ROW_HEIGHT
          }
          getItemKey={(index) => rows[index].key}
          overscan={8}
          renderItem={(row) =>
            row.kind === 'header' ? (
              <div className="flex h-8 items-end px-4 pb-1 text-xs font-medium text-gray-11">
                {row.title}
              </div>
            ) : (
              <div className="px-2">
                <PieceRow
                  step={row.step}
                  active={active !== null && stepId(active) === row.id}
                  pinned={isPinned({ step: row.step, pins })}
                  flashed={pieceNameOf(row.step) === flashedPiece}
                  takeFocus={focusId === row.id}
                  onSelect={() => setActiveId(row.id)}
                  onMove={(offset) => {
                    const ids = visibleSteps.map(stepId);
                    const next = ids[ids.indexOf(row.id) + offset];
                    if (next !== undefined) {
                      setActiveId(next);
                      setFocusId(next);
                    }
                  }}
                  onTogglePin={onTogglePin}
                />
              </div>
            )
          }
        />
        <div className="hidden min-h-0 overflow-y-auto sm:block">
          {active && (
            <StepDetails
              step={active}
              actionCount={actionCounts.get(pieceNameOf(active) ?? '') ?? 0}
            />
          )}
        </div>
      </div>
    );
  })();

  return (
    <Tabs
      value={searching ? '' : selected?.key ?? ''}
      onValueChange={(key) => {
        setSearchQuery('');
        setActiveId(null);
        onSelect(key);
      }}
      className="flex min-w-0 flex-col"
    >
      <div className="flex flex-col gap-3 border-b p-5">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-10" />
          <Input
            type="search"
            value={searchQuery}
            placeholder={t('Search')}
            aria-label={t('Search pieces in the preview')}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-9"
          />
        </div>
        {resolved.length > 0 && (
          <TabsList
            variant="outline"
            aria-label={t('Tabs builders see')}
            className="flex w-full justify-start gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {resolved.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                variant="outline"
                className={cn(
                  'h-9 shrink-0 gap-1.5 rounded-md border-0 px-2.5 text-gray-11 hover:bg-gray-3 hover:text-gray-12 focus-visible:outline-2 focus-visible:outline-accent-8 data-[state=active]:bg-gray-3 data-[state=active]:text-gray-12',
                  highlightedKeys.includes(tab.key) &&
                    'bg-accent-2 text-accent-11',
                )}
              >
                {tab.icon}
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>
        )}
      </div>
      {searching || selected === null ? (
        body
      ) : (
        <TabsContent value={selected.key} className="mt-0">
          {body}
        </TabsContent>
      )}
    </Tabs>
  );
}

function PreviewSkeleton() {
  return (
    <div className="grid max-h-96 min-h-48 grid-cols-1 overflow-hidden sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
      <div className="flex flex-col p-2 sm:border-r">
        <div className="flex h-8 items-end px-2 pb-1">
          <Skeleton className="h-3 w-16 rounded-sm" />
        </div>
        {Array.from({ length: 9 }, (_, index) => (
          <div key={index} className="flex h-9 items-center gap-2.5 px-2">
            <Skeleton className="size-6 rounded-md" />
            <Skeleton className="h-3.5 w-32 rounded-sm" />
          </div>
        ))}
      </div>
      <div className="hidden flex-col gap-3 p-5 sm:flex">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-md" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-28 rounded-sm" />
            <Skeleton className="h-3 w-16 rounded-sm" />
          </div>
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    </div>
  );
}

function PieceRow({
  step,
  active,
  pinned,
  flashed,
  takeFocus,
  onSelect,
  onMove,
  onTogglePin,
}: {
  step: StepMetadataWithSuggestions;
  active: boolean;
  pinned: boolean;
  flashed: boolean;
  takeFocus: boolean;
  onSelect: () => void;
  onMove: (offset: number) => void;
  onTogglePin: (pieceName: string) => void;
}) {
  const pieceName = pieceNameOf(step);
  return (
    <div
      className={cn(
        'group flex h-9 min-w-0 items-center gap-1 rounded-md pr-1 transition-colors duration-300',
        active ? 'bg-gray-3' : 'hover:bg-gray-2',
        flashed && 'bg-accent-2',
      )}
    >
      <button
        type="button"
        ref={(element) => {
          if (takeFocus && element && document.activeElement !== element) {
            element.focus();
            element.scrollIntoView({ block: 'nearest' });
          }
        }}
        onClick={onSelect}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            onMove(event.key === 'ArrowDown' ? 1 : -1);
          }
        }}
        aria-pressed={active}
        className="flex h-full min-w-0 flex-1 items-center gap-2.5 rounded-md px-2 text-left focus-visible:outline-1 focus-visible:outline-gray-8"
      >
        <LogoPlate
          src={step.logoUrl}
          alt=""
          size="xs"
          border
          fallback={<PuzzleIcon className="size-3.5 text-gray-11" />}
        />
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-sm text-gray-12',
            active && 'font-medium',
          )}
        >
          {step.displayName}
        </span>
      </button>
      {pieceName !== null && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={
            pinned
              ? t('Unpin {name}', { name: step.displayName })
              : t('Pin {name}', { name: step.displayName })
          }
          className={cn(
            'shrink-0 text-gray-11',
            !pinned &&
              'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100',
          )}
          onClick={() => onTogglePin(pieceName)}
        >
          {pinned ? <PinOff /> : <Pin />}
        </Button>
      )}
    </div>
  );
}

function StepDetails({
  step,
  actionCount,
}: {
  step: StepMetadataWithSuggestions;
  actionCount: number;
}) {
  const pieceName = pieceNameOf(step);
  const [debouncedName] = useDebounce(pieceName, 150);
  const { pieceModel, isLoading } = piecesHooks.usePiece({
    name: debouncedName ?? '',
    projectId: authenticationSession.getProjectId() ?? undefined,
    enabled: debouncedName !== null && debouncedName === pieceName,
  });
  const actions =
    pieceName !== null && pieceModel?.name === pieceName
      ? Object.values(pieceModel.actions)
      : [];
  const loadingActions =
    pieceName !== null &&
    actions.length === 0 &&
    (isLoading || debouncedName !== pieceName);
  return (
    <div className="flex flex-col gap-3 p-5">
      <div className="flex min-w-0 items-center gap-3">
        <LogoPlate
          src={step.logoUrl}
          alt=""
          size="sm"
          border
          fallback={<PuzzleIcon className="size-4 text-gray-11" />}
        />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-gray-12">
            {step.displayName}
          </span>
          <span className="text-xs text-gray-11">
            {pieceName !== null
              ? t(
                  '{count, plural, =0 {No actions} =1 {1 action} other {# actions}}',
                  { count: actionCount },
                )
              : t('Built-in step')}
          </span>
        </div>
      </div>
      {pieceName === null ? (
        <p className="text-sm text-gray-11">{step.description}</p>
      ) : loadingActions ? (
        <div className="flex flex-col divide-y rounded-lg border">
          {Array.from(
            { length: Math.min(Math.max(actionCount, 1), 5) },
            (_, index) => (
              <div key={index} className="flex flex-col gap-1.5 px-3 py-2">
                <Skeleton className="h-3.5 w-40 rounded-sm" />
                <Skeleton className="h-3 w-56 rounded-sm" />
              </div>
            ),
          )}
        </div>
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border">
          {actions.map((action) => (
            <li key={action.name} className="flex flex-col gap-0.5 px-3 py-2">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-sm text-gray-12">
                  {action.displayName}
                </span>
                {action.classification && (
                  <Badge variant="secondary" className="shrink-0 font-normal">
                    {ACTION_CLASSIFICATION_BADGES[
                      action.classification
                    ].label()}
                  </Badge>
                )}
              </span>
              {action.description && (
                <span className="line-clamp-1 text-xs text-gray-11">
                  {action.description}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function useAiAndAgentsAvailable(): boolean {
  const { data: aiProviders } = aiProviderQueries.useProjectAiProviders();
  const {
    pieceModel,
    isError,
    isSuccess: isLoaded,
  } = piecesHooks.usePiece({
    name: AI_PIECE_NAME,
    projectId: authenticationSession.getProjectId() ?? undefined,
  });
  const unavailable =
    isError ||
    (isLoaded && Object.keys(pieceModel?.actions ?? {}).length === 0);
  return !isNil(aiProviders) && aiProviders.length > 0 && !unavailable;
}

export function usePieceMenuPreviewSteps() {
  const {
    pieces,
    isLoading,
    isError: isPiecesError,
    refetch,
  } = piecesHooks.usePieces({});
  const {
    data: pieceSet,
    isLoading: isLoadingPieceSet,
    isError: isPieceSetError,
    refetch: refetchPieceSet,
  } = pieceSetQueries.useProjectPieceSet(authenticationSession.getProjectId());
  const { data: aiProviders } = aiProviderQueries.useProjectAiProviders();
  const aiRouterEnabled = stepUtils.hasAiRouterProvider(aiProviders);
  const selectedActions = pieceSet?.config.selectedActions;
  const actionCounts = useMemo(
    () => countActions({ pieces: pieces ?? [], selectedActions }),
    [pieces, selectedActions],
  );
  const steps = useMemo(
    () =>
      toPreviewSteps({
        pieces: pieces ?? [],
        selectedActions,
        aiRouterEnabled,
      }),
    [pieces, selectedActions, aiRouterEnabled],
  );
  return {
    steps,
    actionCounts,
    isLoading: isLoading || isLoadingPieceSet,
    isError:
      (isPiecesError && pieces === undefined) ||
      (isPieceSetError && pieceSet === undefined),
    refetch: () => Promise.all([refetch(), refetchPieceSet()]),
  };
}

function countActions({
  pieces,
  selectedActions,
}: {
  pieces: PieceMetadataModelSummary[];
  selectedActions: PieceSetConfig['selectedActions'] | undefined;
}): Map<string, number> {
  return new Map(
    pieces.map((piece) => [
      piece.name,
      selectedActions?.[piece.name]?.length ?? piece.actions,
    ]),
  );
}

function toPreviewSteps({
  pieces,
  selectedActions,
  aiRouterEnabled,
}: {
  pieces: PieceMetadataModelSummary[];
  selectedActions: PieceSetConfig['selectedActions'] | undefined;
  aiRouterEnabled: boolean;
}): StepMetadataWithSuggestions[] {
  const counts = countActions({ pieces, selectedActions });
  const coreSteps = stepUtils
    .coreActionsMetadata()
    .filter(
      (step) => aiRouterEnabled || step.type !== FlowActionType.AI_ROUTER,
    );
  const pieceSteps = pieces
    .filter((piece) => (counts.get(piece.name) ?? 0) > 0)
    .map((piece) => stepUtils.mapPieceToMetadata({ piece, type: 'action' }));
  return [...coreSteps, ...pieceSteps];
}

function groupForPreview({
  steps,
  pins,
  tabs,
  selectedTab,
  selectedCustomTabId,
}: {
  steps: StepMetadataWithSuggestions[];
  pins: string[];
  tabs: PieceSelectorTabConfig[];
  selectedTab: PieceSelectorTabType | null;
  selectedCustomTabId: string | null;
}): CategorizedStepMetadataWithSuggestions[] {
  if (selectedTab === null) {
    return [];
  }
  return pieceSelectorContent
    .group({
      metadata: steps,
      platform: { pinnedPieces: pins, pieceSelectorConfig: { tabs } },
      selectedTab,
      selectedCustomTabId,
      type: 'action',
      environment: null,
    })
    .filter((category) => category.metadata.length > 0);
}

function previewSteps({
  steps,
  query,
  searchMatches,
}: {
  steps: StepMetadataWithSuggestions[];
  query: string;
  searchMatches: StepMetadataWithSuggestions[] | undefined;
}): StepMetadataWithSuggestions[] {
  if (query === '') {
    return steps;
  }
  return searchMatches ?? filterBySearch({ steps, query });
}

function filterBySearch({
  steps,
  query,
}: {
  steps: StepMetadataWithSuggestions[];
  query: string;
}): StepMetadataWithSuggestions[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') {
    return steps;
  }
  return steps.filter(
    (step) =>
      step.displayName.toLowerCase().includes(needle) ||
      step.description.toLowerCase().includes(needle),
  );
}

function toRows(
  categories: CategorizedStepMetadataWithSuggestions[],
): PreviewRow[] {
  return categories.flatMap((category, categoryIndex) => [
    {
      kind: 'header' as const,
      key: `header-${categoryIndex}`,
      title: category.title,
    },
    ...category.metadata.map((step, index) => ({
      kind: 'step' as const,
      key: `step-${categoryIndex}-${index}`,
      id: stepId(step),
      step,
    })),
  ]);
}

function stepId(step: StepMetadataWithSuggestions): string {
  return pieceNameOf(step) ?? step.type;
}

function pieceNameOf(step: StepMetadataWithSuggestions): string | null {
  return step.type === FlowActionType.PIECE ? step.pieceName : null;
}

function isPinned({
  step,
  pins,
}: {
  step: StepMetadataWithSuggestions;
  pins: string[];
}): boolean {
  const pieceName = pieceNameOf(step);
  return pieceName !== null && pins.includes(pieceName);
}

function tabKey(tab: PieceSelectorTabConfig): string {
  return tab.kind === 'BUILTIN' ? tab.builtinTab ?? tab.id : tab.id;
}

const AI_PIECE_NAME = '@activepieces/piece-ai';
const HEADER_HEIGHT = 32;
const ROW_HEIGHT = 36;

export const pieceSelectorPreviewUtils = {
  tabKey,
  toPreviewSteps,
  groupForPreview,
  previewSteps,
};

type PreviewRow =
  | { kind: 'header'; key: string; title: string }
  | {
      kind: 'step';
      key: string;
      id: string;
      step: StepMetadataWithSuggestions;
    };

type PieceSelectorPreviewProps = {
  tabs: PieceSelectorTabConfig[];
  pins: string[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  highlightedKeys: string[];
  flashedPiece: string | null;
  onTogglePin: (pieceName: string) => void;
};
