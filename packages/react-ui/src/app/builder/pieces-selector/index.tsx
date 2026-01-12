import { t } from 'i18next';
import {
  LayoutGridIcon,
  PuzzleIcon,
  SparklesIcon,
  WrenchIcon,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef } from 'react';
import { useDebounce } from 'use-debounce';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { PiecesSearchInput } from '@/features/pieces/components/piece-selector-search';
import { PieceSelectorTabs } from '@/features/pieces/components/piece-selector-tabs';
import {
  PieceSelectorTabsProvider,
  PieceSelectorTabType,
} from '@/features/pieces/lib/piece-selector-tabs-provider';
import { pieceSelectorUtils } from '@/features/pieces/lib/piece-selector-utils';
import { platformHooks } from '@/hooks/platform-hooks';
import { useIsMobile } from '@/hooks/use-mobile';
import { PieceSelectorOperation } from '@/lib/types';
import { FlowOperationType, FlowTriggerType } from '@activepieces/shared';

import {
  PieceSearchProvider,
  usePieceSearchContext,
} from '../../../features/pieces/lib/piece-search-context';

import { AITabContent } from './ai-tab-content';
import { ExploreTabContent } from './explore-tab-content';
import { PiecesCardList } from './pieces-card-list';

const getTabsList = (
  operationType: FlowOperationType,
  isEmbeddingEnabled: boolean,
) => {
  const baseTabs = [
    {
      value: PieceSelectorTabType.EXPLORE,
      name: t('Explore'),
      icon: <LayoutGridIcon className="size-5" />,
    },
    {
      value: PieceSelectorTabType.APPS,
      name: t('Apps'),
      icon: <PuzzleIcon className="size-5" />,
    },
    {
      value: PieceSelectorTabType.UTILITY,
      name: t('Utility'),
      icon: <WrenchIcon className="size-5" />,
    },
  ];

  const replaceOrAddAction = [
    FlowOperationType.ADD_ACTION,
    FlowOperationType.UPDATE_ACTION,
  ].includes(operationType);

  if (replaceOrAddAction && !isEmbeddingEnabled) {
    baseTabs.splice(1, 0, {
      value: PieceSelectorTabType.AI_AND_AGENTS,
      name: t('AI & Agents'),
      icon: <SparklesIcon className="size-5" />,
    });
  }

  return baseTabs;
};

type PieceSelectorProps = {
  children: React.ReactNode;
  id: string;
  operation: PieceSelectorOperation;
  openSelectorOnClick?: boolean;
  stepToReplacePieceDisplayName?: string;
};

const PieceSelectorWrapper = (props: PieceSelectorProps) => {
  return (
    <PieceSearchProvider>
      <PieceSelectorContent {...props} />
    </PieceSearchProvider>
  );
};

const PieceSelectorContent = ({
  children,
  operation,
  id,
  openSelectorOnClick = true,
  stepToReplacePieceDisplayName,
}: PieceSelectorProps) => {
  const [
    openedPieceSelectorStepNameOrAddButtonId,
    setOpenedPieceSelectorStepNameOrAddButtonId,
    setSelectedPieceMetadataInPieceSelector,
    isForEmptyTrigger,
    deselectStep,
  ] = useBuilderStateContext((state) => [
    state.openedPieceSelectorStepNameOrAddButtonId,
    state.setOpenedPieceSelectorStepNameOrAddButtonId,
    state.setSelectedPieceMetadataInPieceSelector,
    state.flowVersion.trigger.type === FlowTriggerType.EMPTY &&
      id === 'trigger',
    state.deselectStep,
  ]);
  const { searchQuery, setSearchQuery } = usePieceSearchContext();
  const isForReplace =
    operation.type === FlowOperationType.UPDATE_ACTION ||
    (operation.type === FlowOperationType.UPDATE_TRIGGER && !isForEmptyTrigger);
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const isOpen = openedPieceSelectorStepNameOrAddButtonId === id;
  const isMobile = useIsMobile();
  const { listHeightRef, popoverTriggerRef } =
    pieceSelectorUtils.useAdjustPieceListHeightToAvailableSpace();
  const listHeight = Math.min(listHeightRef.current, 300);
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [isOpen]);

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedPieceMetadataInPieceSelector(null);
  };

  const { platform } = platformHooks.useCurrentPlatform();
  const tabsList = useMemo(
    () => getTabsList(operation.type, platform?.plan.embeddingEnabled ?? false),
    [operation.type, platform?.plan.embeddingEnabled],
  );

  return (
    <Popover
      open={isOpen}
      modal={true}
      onOpenChange={(open) => {
        if (!open) {
          clearSearch();
          setOpenedPieceSelectorStepNameOrAddButtonId(null);
          if (isForEmptyTrigger) {
            deselectStep();
          }
        }
      }}
    >
      <PopoverTrigger
        ref={popoverTriggerRef}
        asChild={true}
        onClick={() => {
          if (openSelectorOnClick) {
            setOpenedPieceSelectorStepNameOrAddButtonId(id);
          }
        }}
      >
        {children}
      </PopoverTrigger>

      <PieceSelectorTabsProvider
        initiallySelectedTab={
          isForReplace || isMobile
            ? PieceSelectorTabType.NONE
            : PieceSelectorTabType.EXPLORE
        }
        onTabChange={clearSearch}
        key={isOpen ? 'open' : 'closed'}
      >
        <PopoverContent
          onContextMenu={(e) => {
            e.stopPropagation();
          }}
          className="w-[340px] md:w-[600px] p-0 shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <>
            <div>
              <PiecesSearchInput
                searchInputRef={searchInputRef}
                onSearchChange={(e) => {
                  setSelectedPieceMetadataInPieceSelector(null);
                  if (e === '') {
                    clearSearch();
                  }
                }}
              />
              {!isMobile && <PieceSelectorTabs tabs={tabsList} />}
              <Separator orientation="horizontal" className="mt-1" />
            </div>
            <div
              className=" flex flex-row max-h-[300px]"
              style={{
                height: listHeight + 'px',
              }}
            >
              <ExploreTabContent operation={operation} />
              <AITabContent operation={operation} />

              <PiecesCardList
                //this is done to avoid debounced results when user clears search
                searchQuery={searchQuery === '' ? '' : debouncedQuery}
                operation={operation}
                stepToReplacePieceDisplayName={
                  isMobile ? undefined : stepToReplacePieceDisplayName
                }
              />
            </div>
          </>
        </PopoverContent>
      </PieceSelectorTabsProvider>
    </Popover>
  );
};

export { PieceSelectorWrapper as PieceSelector };
