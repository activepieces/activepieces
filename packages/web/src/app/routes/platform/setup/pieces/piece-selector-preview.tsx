import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { FlowActionType, PieceSelectorTabConfig } from '@activepieces/shared';
import { t } from 'i18next';
import {
  CheckCircle2Icon,
  LayoutGridIcon,
  Pin,
  PinOff,
  PuzzleIcon,
  SearchIcon,
  SparklesIcon,
  WrenchIcon,
} from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';

import { LogoPlate } from '@/components/custom/logo-plate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { VirtualizedScrollArea } from '@/components/ui/virtualized-scroll-area';
import { pieceSetQueries } from '@/features/piece-sets';
import {
  PieceSelectorTabType,
  pieceSelectorContent,
  pieceSelectorCustomization,
  piecesHooks,
  stepUtils,
} from '@/features/pieces';
import {
  CategorizedStepMetadataWithSuggestions,
  StepMetadataWithSuggestions,
} from '@/features/pieces/types';
import { aiProviderQueries } from '@/features/platform-admin/hooks/ai-provider-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

export function PieceSelectorPreview({
  tabs,
  focus,
  ...rest
}: PieceSelectorPreviewProps) {
  return (
    <PreviewBody
      key={focus.version}
      tabs={tabs}
      initialKey={focus.key}
      {...rest}
    />
  );
}

function PreviewBody({
  tabs,
  pins,
  initialKey,
  highlightedKeys,
  flashedPiece,
  onTogglePin,
}: Omit<PieceSelectorPreviewProps, 'focus'> & { initialKey: string | null }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const resolved = resolveTabs(tabs);
  const [selectedKey, setSelectedKey] = useState(initialKey);
  const selected =
    resolved.find((tab) => tab.key === selectedKey) ?? resolved[0] ?? null;
  const [activeName, setActiveName] = useState<string | null>(null);
  const searching = searchQuery.trim() !== '';
  const { steps: allSteps, actionCounts, isLoading } = usePreviewSteps();
  const selectedTab = searching
    ? PieceSelectorTabType.NONE
    : selected?.type ?? PieceSelectorTabType.NONE;
  const customTabId = selected?.customTabId ?? null;
  const visible = useMemo(
    () => filterBySearch({ steps: allSteps, query: debouncedQuery }),
    [allSteps, debouncedQuery],
  );
  const categories = useMemo(
    () =>
      searching || selected !== null
        ? pieceSelectorContent
            .group({
              metadata: visible,
              platform: { pinnedPieces: pins, pieceSelectorConfig: { tabs } },
              selectedTab,
              selectedCustomTabId: customTabId,
              type: 'action',
              environment: null,
            })
            .filter((category) => category.metadata.length > 0)
        : [],
    [visible, pins, tabs, selectedTab, customTabId, searching, selected],
  );
  const rows = useMemo(() => toRows(categories), [categories]);
  const steps = categories.flatMap((category) => category.metadata);
  const active =
    steps.find((step) => step.displayName === activeName) ?? steps[0] ?? null;

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

  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex flex-col gap-3 border-b p-4">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-10" />
          <Input
            value={searchQuery}
            placeholder={t('Search')}
            aria-label={t('Search pieces in the preview')}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-9"
          />
        </div>
        {resolved.length > 0 && (
          <div
            role="tablist"
            aria-label={t('Tabs builders see')}
            className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {resolved.map((tab) => {
              const isSelected = !searching && tab.key === selected?.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedKey(tab.key);
                    setActiveName(null);
                  }}
                  className={cn(
                    'flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-sm text-gray-11 transition-colors hover:bg-gray-3 hover:text-gray-12 focus-visible:outline-2 focus-visible:outline-accent-8 [&_svg]:size-4',
                    isSelected && 'bg-gray-3 font-medium text-gray-12',
                    highlightedKeys.includes(tab.key) &&
                      'bg-accent-3 text-accent-11 ring-2 ring-accent-8 ring-inset',
                  )}
                >
                  {tab.icon}
                  {tab.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="grid h-96 min-h-0 grid-cols-1 grid-rows-[minmax(0,1fr)] sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        {isLoading ? (
          <>
            <div className="flex flex-col p-2 sm:border-r">
              <div className="flex h-8 items-end px-2 pb-1">
                <Skeleton className="h-3 w-16 rounded-sm" />
              </div>
              {Array.from({ length: 9 }, (_, index) => (
                <div key={index} className="flex h-9 items-center gap-2.5 px-2">
                  <Skeleton className="size-6.25 rounded-md" />
                  <Skeleton className="h-3.5 w-32 rounded-sm" />
                </div>
              ))}
            </div>
            <div className="hidden flex-col gap-3 p-4 sm:flex">
              <div className="flex items-center gap-3">
                <Skeleton className="size-7.5 rounded-md" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-28 rounded-sm" />
                  <Skeleton className="h-3 w-16 rounded-sm" />
                </div>
              </div>
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          </>
        ) : categories.length === 0 ? (
          <p className="p-5 text-sm text-gray-11 sm:col-span-2">
            {emptyMessage}
          </p>
        ) : (
          <>
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
                      active={active?.displayName === row.step.displayName}
                      pinned={isPinned({ step: row.step, pins })}
                      flashed={pieceNameOf(row.step) === flashedPiece}
                      onActivate={() => setActiveName(row.step.displayName)}
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
          </>
        )}
      </div>
    </div>
  );
}

function PieceRow({
  step,
  active,
  pinned,
  flashed,
  onActivate,
  onTogglePin,
}: {
  step: StepMetadataWithSuggestions;
  active: boolean;
  pinned: boolean;
  flashed: boolean;
  onActivate: () => void;
  onTogglePin: (pieceName: string) => void;
}) {
  const pieceName = pieceNameOf(step);
  return (
    <div
      onMouseEnter={onActivate}
      onFocus={onActivate}
      className={cn(
        'group flex h-9 min-w-0 items-center gap-2.5 rounded-md px-2 transition-colors',
        active && 'bg-gray-3',
        flashed && 'bg-accent-3 ring-2 ring-accent-8 ring-inset',
      )}
    >
      <LogoPlate
        src={step.logoUrl}
        alt=""
        size="xs"
        border
        fallback={<PuzzleIcon className="size-3.5 text-gray-11" />}
      />
      <span className="min-w-0 flex-1 truncate text-sm text-gray-12">
        {step.displayName}
      </span>
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
              'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
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
  const loadingActions = pieceName !== null && actions.length === 0;
  return (
    <div className="flex flex-col gap-3 p-4">
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
      ) : loadingActions && (isLoading || debouncedName !== pieceName) ? (
        <div className="flex flex-col divide-y rounded-lg border">
          {Array.from(
            { length: Math.min(Math.max(actionCount, 1), 5) },
            (_, index) => (
              <div key={index} className="flex flex-col gap-1.5 px-3 py-2.5">
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
              <span className="truncate text-sm text-gray-12">
                {action.displayName}
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

function usePreviewSteps(): {
  steps: StepMetadataWithSuggestions[];
  actionCounts: Map<string, number>;
  isLoading: boolean;
} {
  const { pieces, isLoading } = piecesHooks.usePieces({});
  const { data: pieceSet, isLoading: isLoadingPieceSet } =
    pieceSetQueries.useProjectPieceSet(authenticationSession.getProjectId());
  const { data: aiProviders } = aiProviderQueries.useProjectAiProviders();
  const aiRouterEnabled = stepUtils.hasAiRouterProvider(aiProviders);
  const selectedActions = pieceSet?.config.selectedActions;
  const actionCounts = useMemo(
    () =>
      new Map(
        (pieces ?? []).map((piece) => [
          piece.name,
          selectedActions?.[piece.name]?.length ?? piece.actions,
        ]),
      ),
    [pieces, selectedActions],
  );
  const steps = useMemo(
    () =>
      toPreviewSteps({
        pieces: pieces ?? [],
        actionCounts,
        aiRouterEnabled,
      }),
    [pieces, actionCounts, aiRouterEnabled],
  );
  return {
    steps,
    actionCounts,
    isLoading: isLoading || isLoadingPieceSet,
  };
}

function toPreviewSteps({
  pieces,
  actionCounts,
  aiRouterEnabled,
}: {
  pieces: PieceMetadataModelSummary[];
  actionCounts: Map<string, number>;
  aiRouterEnabled: boolean;
}): StepMetadataWithSuggestions[] {
  const coreSteps = stepUtils
    .coreActionsMetadata()
    .filter(
      (step) => aiRouterEnabled || step.type !== FlowActionType.AI_ROUTER,
    );
  const pieceSteps = pieces
    .filter((piece) => (actionCounts.get(piece.name) ?? 0) > 0)
    .map((piece) => stepUtils.mapPieceToMetadata({ piece, type: 'action' }));
  return [...coreSteps, ...pieceSteps];
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
      step,
    })),
  ]);
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

function resolveTabs(tabs: PieceSelectorTabConfig[]) {
  return pieceSelectorCustomization.buildResolvedTabs({
    availableBuiltinTabs: builtinTabs(),
    config: { tabs },
  });
}

function builtinTabs(): {
  value: PieceSelectorTabType;
  name: string;
  icon: ReactNode;
}[] {
  return [
    {
      value: PieceSelectorTabType.EXPLORE,
      name: t('Explore'),
      icon: <LayoutGridIcon />,
    },
    {
      value: PieceSelectorTabType.AI_AND_AGENTS,
      name: t('AI & Agents'),
      icon: <SparklesIcon />,
    },
    {
      value: PieceSelectorTabType.APPS,
      name: t('Apps'),
      icon: <PuzzleIcon />,
    },
    {
      value: PieceSelectorTabType.UTILITY,
      name: t('Utility'),
      icon: <WrenchIcon />,
    },
    {
      value: PieceSelectorTabType.APPROVALS,
      name: t('Approvals'),
      icon: <CheckCircle2Icon />,
    },
  ];
}

function tabKey(tab: PieceSelectorTabConfig): string {
  return tab.kind === 'BUILTIN' ? tab.builtinTab ?? tab.id : tab.id;
}

const HEADER_HEIGHT = 32;
const ROW_HEIGHT = 36;

export const pieceSelectorPreviewUtils = { tabKey };

type PreviewRow =
  | { kind: 'header'; key: string; title: string }
  | { kind: 'step'; key: string; step: StepMetadataWithSuggestions };

type PieceSelectorPreviewProps = {
  tabs: PieceSelectorTabConfig[];
  pins: string[];
  focus: { key: string | null; version: number };
  highlightedKeys: string[];
  flashedPiece: string | null;
  onTogglePin: (pieceName: string) => void;
};
