import {
  ApEnvironment,
  FlowActionType,
  FlowTriggerType,
  PieceSelectorConfig,
} from '@activepieces/shared';
import { t } from 'i18next';

import { PieceSelectorTabType } from '@/features/pieces/stores/piece-selector-tabs-provider';
import {
  CategorizedStepMetadataWithSuggestions,
  StepMetadataWithSuggestions,
} from '@/features/pieces/types';
import { pieceSearchUtils } from '@/features/pieces/utils/piece-search-utils';
import { pieceSelectorCustomization } from '@/features/pieces/utils/piece-selector-customization';

const {
  getPinnedPieces,
  getPopularPieces,
  getAiAndAgentsPieces,
  isUtilityPiece,
  isAppPiece,
  getHighlightedPieces,
  isFlowController,
} = pieceSearchUtils;

export function legacyPieceSelectorGrouping({
  metadata,
  platform,
  selectedTab,
  selectedCustomTabId,
  type,
  environment,
}: LegacyGroupingInput): CategorizedStepMetadataWithSuggestions[] {
  const piecesMetadataWithoutEmptySuggestions =
    filterOutPiecesWithNoSuggestions(metadata);

  const pinnedPieces = getPinnedPieces(
    piecesMetadataWithoutEmptySuggestions,
    platform.pinnedPieces ?? [],
  );

  const popularPieces = getPopularPieces(
    piecesMetadataWithoutEmptySuggestions,
    platform.pinnedPieces ?? [],
  );

  const flowControllerPieces =
    piecesMetadataWithoutEmptySuggestions.filter(isFlowController);

  const utilityPieces =
    piecesMetadataWithoutEmptySuggestions.filter(isUtilityPiece);

  const pieceMetadataWithoutPopularOrPinnedPieces =
    piecesMetadataWithoutEmptySuggestions.filter(
      (p) => !popularPieces.includes(p) && !pinnedPieces.includes(p),
    );

  const appPieces =
    pieceMetadataWithoutPopularOrPinnedPieces.filter(isAppPiece);

  const utilitiesCategory = {
    title: t('Utility'),
    metadata: utilityPieces,
  };
  const flowControllerCategory = {
    title: t('Flow Controller'),
    metadata: flowControllerPieces,
  };
  const appsCategory = {
    title: t('Apps'),
    metadata: appPieces,
  };
  const popularCategory = {
    title: t('Popular'),
    metadata: popularPieces,
  };
  const allCategory = {
    title: t('All'),
    metadata: piecesMetadataWithoutEmptySuggestions,
  };

  switch (selectedTab) {
    case PieceSelectorTabType.EXPLORE:
      return getExploreTabContent(
        piecesMetadataWithoutEmptySuggestions,
        platform,
        type,
        environment,
      );
    case PieceSelectorTabType.UTILITY:
      return [utilitiesCategory, flowControllerCategory];
    case PieceSelectorTabType.AI_AND_AGENTS:
      return getAiAndAgentsPieces(piecesMetadataWithoutEmptySuggestions);
    case PieceSelectorTabType.APPROVALS:
      return [];
    case PieceSelectorTabType.CUSTOM: {
      const customTab = pieceSelectorCustomization.getCustomTab({
        config: platform.pieceSelectorConfig,
        customTabId: selectedCustomTabId,
      });
      const categories: CategorizedStepMetadataWithSuggestions[] = [];
      const flatPieces = getPinnedPieces(
        piecesMetadataWithoutEmptySuggestions,
        customTab?.pieceNames ?? [],
      );
      if (flatPieces.length > 0) {
        categories.push({
          title: customTab?.title ?? t('All'),
          metadata: flatPieces,
        });
      }
      for (const section of customTab?.sections ?? []) {
        const sectionPieces = getPinnedPieces(
          piecesMetadataWithoutEmptySuggestions,
          section.pieceNames,
        );
        if (sectionPieces.length > 0) {
          categories.push({
            title: section.title,
            metadata: sectionPieces,
          });
        }
      }
      return categories;
    }
    case PieceSelectorTabType.APPS: {
      const popularAppsCategory = {
        ...popularCategory,
        metadata: popularCategory.metadata.filter(isAppPiece),
      };
      const data = [popularAppsCategory, appsCategory];
      if (pinnedPieces.length > 0) {
        data.unshift({
          title: t('Highlights'),
          metadata: pinnedPieces,
        });
      }
      return data;
    }
    case PieceSelectorTabType.NONE:
      return allCategory.metadata.length > 0 ? [allCategory] : [];
  }
}

const filterOutPiecesWithNoSuggestions = (
  stepsMetadata: StepMetadataWithSuggestions[],
) => {
  return stepsMetadata.filter((metadata) => {
    const isActionWithSuggestions =
      metadata.type === FlowActionType.PIECE &&
      metadata.suggestedActions &&
      metadata.suggestedActions.length > 0;

    const isTriggerWithSuggestions =
      metadata.type === FlowTriggerType.PIECE &&
      metadata.suggestedTriggers &&
      metadata.suggestedTriggers.length > 0;

    const isNotPieceType =
      metadata.type !== FlowActionType.PIECE &&
      metadata.type !== FlowTriggerType.PIECE;
    return (
      isActionWithSuggestions || isTriggerWithSuggestions || isNotPieceType
    );
  });
};

const getExploreTabContent = (
  queryResult: StepMetadataWithSuggestions[],
  platform: LegacyGroupingInput['platform'],
  type: 'action' | 'trigger',
  environment: ApEnvironment | null,
) => {
  const popularCategory: CategorizedStepMetadataWithSuggestions = {
    title: t('Popular'),
    metadata: environment === ApEnvironment.DEVELOPMENT ? queryResult : [],
  };
  if (environment === ApEnvironment.DEVELOPMENT) {
    return [popularCategory];
  }
  const pinnedPieces = getPinnedPieces(
    queryResult,
    platform.pinnedPieces ?? [],
  );
  const popularPieces = getPopularPieces(
    queryResult,
    platform.pinnedPieces ?? [],
  );

  if (popularPieces.length > 0) {
    popularCategory.metadata = [...popularCategory.metadata, ...popularPieces];
  }

  const hightlightedPiecesCategory: CategorizedStepMetadataWithSuggestions = {
    title: t('Highlights'),
    metadata: [],
  };
  const highlightedPieces = getHighlightedPieces(queryResult, type);
  const codePiece = queryResult.find(
    (piece) => piece.type === FlowActionType.CODE,
  );
  const branchPiece = queryResult.find(
    (piece) => piece.type === FlowActionType.ROUTER,
  );
  const loopPiece = queryResult.find(
    (piece) => piece.type === FlowActionType.LOOP_ON_ITEMS,
  );
  const aiRouterPiece = queryResult.find(
    (piece) => piece.type === FlowActionType.AI_ROUTER,
  );

  if (highlightedPieces.length > 0) {
    hightlightedPiecesCategory.metadata.push(...highlightedPieces);
  }

  if (branchPiece) {
    hightlightedPiecesCategory.metadata.splice(0, 0, branchPiece);
  }
  if (aiRouterPiece) {
    hightlightedPiecesCategory.metadata.splice(1, 0, aiRouterPiece);
  }

  if (codePiece) {
    hightlightedPiecesCategory.metadata.splice(3, 0, codePiece);
  }
  if (loopPiece) {
    hightlightedPiecesCategory.metadata.splice(5, 0, loopPiece);
  }
  if (pinnedPieces.length > 0) {
    hightlightedPiecesCategory.metadata = [
      ...pinnedPieces,
      ...hightlightedPiecesCategory.metadata,
    ];
  }

  return [popularCategory, hightlightedPiecesCategory];
};

export type LegacyGroupingInput = {
  metadata: StepMetadataWithSuggestions[];
  platform: {
    pinnedPieces?: string[];
    pieceSelectorConfig?: PieceSelectorConfig | null;
  };
  selectedTab: PieceSelectorTabType;
  selectedCustomTabId: string | null;
  type: 'action' | 'trigger';
  environment: ApEnvironment | null;
};
