import {
  AI_PIECE_NAME,
  ApEnvironment,
  FlowActionType,
  FlowTriggerType,
  PieceCategory,
  PieceSelectorConfig,
  PieceSelectorTabConfig,
} from '@activepieces/shared';
import { t } from 'i18next';

import { PieceSelectorTabType } from '@/features/pieces/stores/piece-selector-tabs-provider';
import {
  CategorizedStepMetadataWithSuggestions,
  PieceStepMetadataWithSuggestions,
  StepMetadata,
  StepMetadataWithSuggestions,
} from '@/features/pieces/types';

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
      const customTab = getCustomTab({
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

const isFlowController = (stepMetadata: StepMetadata) => {
  if (
    stepMetadata.type === FlowActionType.PIECE ||
    stepMetadata.type === FlowTriggerType.PIECE
  ) {
    return stepMetadata.categories.includes(PieceCategory.FLOW_CONTROL);
  }
  return (
    stepMetadata.type === FlowActionType.LOOP_ON_ITEMS ||
    stepMetadata.type === FlowActionType.ROUTER ||
    stepMetadata.type === FlowActionType.AI_ROUTER
  );
};

const getAiAndAgentsPieces = (queryResult: StepMetadataWithSuggestions[]) => {
  const res: CategorizedStepMetadataWithSuggestions[] = [];
  const pieces = filterResultByPieceType(queryResult);
  const aiAndAgentsPieces = pieces.filter(isAiAndAgentPiece);
  const recommendedCategory: CategorizedStepMetadataWithSuggestions = {
    title: t('Recommended'),
    metadata: [],
  };
  const othersCategory: CategorizedStepMetadataWithSuggestions = {
    title: t('Others'),
    metadata: [],
  };
  const recommendedPieces = aiAndAgentsPieces.filter((piece) =>
    piece.categories.includes(PieceCategory.UNIVERSAL_AI),
  );
  if (recommendedPieces.length > 0) {
    recommendedCategory.metadata = recommendedPieces;
    res.push(recommendedCategory);
  }
  const otherPieces = aiAndAgentsPieces.filter(
    (piece) => !recommendedPieces.includes(piece),
  );
  if (otherPieces.length > 0) {
    othersCategory.metadata = otherPieces;
    res.push(othersCategory);
  }
  return res;
};

const isAiAndAgentPiece = (stepMetadata: StepMetadata) => {
  if (
    stepMetadata.type === FlowActionType.PIECE ||
    stepMetadata.type === FlowTriggerType.PIECE
  ) {
    return stepMetadata.categories.some((category) =>
      [
        PieceCategory.UNIVERSAL_AI,
        PieceCategory.ARTIFICIAL_INTELLIGENCE,
      ].includes(category as PieceCategory),
    );
  }
  return false;
};

const isUtilityPiece = (metadata: StepMetadata) =>
  metadata.type !== FlowTriggerType.PIECE &&
  metadata.type !== FlowActionType.PIECE
    ? !isFlowController(metadata)
    : metadata.categories.includes(PieceCategory.CORE) &&
      !isFlowController(metadata);

const isAppPiece = (metadata: StepMetadata) => {
  return (
    !isUtilityPiece(metadata) &&
    !isAiAndAgentPiece(metadata) &&
    !isFlowController(metadata)
  );
};

const getPinnedPieces = (
  queryResult: StepMetadataWithSuggestions[],
  pinnedPiecesNames: string[],
) => {
  const pieces = filterResultByPieceType(queryResult);
  const pinnedPieces = pieces.filter((piece) =>
    pinnedPiecesNames.includes(piece.pieceName),
  );
  return sortByPieceNameOrder(pinnedPieces, pinnedPiecesNames);
};

const POPULAR_PIECES_NAMES = [
  '@activepieces/piece-google-sheets',
  '@activepieces/piece-slack',
  '@activepieces/piece-notion',
  '@activepieces/piece-gmail',
  '@activepieces/piece-hubspot',
  '@activepieces/piece-openai',
  '@activepieces/piece-google-forms',
  '@activepieces/piece-google-drive',
  '@activepieces/piece-google-docs',
];
const getPopularPieces = (
  queryResult: StepMetadataWithSuggestions[],
  pinnedPiecesNames: string[],
) => {
  const pieces = filterResultByPieceType(queryResult);
  const popularPieces = pieces.filter(
    (piece) =>
      POPULAR_PIECES_NAMES.includes(piece.pieceName) &&
      !pinnedPiecesNames.includes(piece.pieceName),
  );
  return sortByPieceNameOrder(popularPieces, POPULAR_PIECES_NAMES);
};

const filterResultByPieceType = (
  queryResult: StepMetadataWithSuggestions[],
) => {
  return queryResult.filter(
    (piece): piece is PieceStepMetadataWithSuggestions =>
      piece.type === FlowActionType.PIECE ||
      piece.type === FlowTriggerType.PIECE,
  );
};

const getHighlightedPieces = (
  queryResult: StepMetadataWithSuggestions[],
  type: 'action' | 'trigger',
) => {
  const pieces = filterResultByPieceType(queryResult);
  const highlightedPiecesNames =
    type === 'action'
      ? HIGHLIGHTED_PIECES_NAMES_FOR_ACTIONS
      : HIGHLIGHTED_PIECES_NAMES_FOR_TRIGGERS;
  const highlightedPieces = pieces.filter((piece) =>
    highlightedPiecesNames.includes(piece.pieceName),
  );
  return sortByPieceNameOrder(
    highlightedPieces,
    type === 'action'
      ? HIGHLIGHTED_PIECES_NAMES_FOR_ACTIONS
      : HIGHLIGHTED_PIECES_NAMES_FOR_TRIGGERS,
  );
};
const sortByPieceNameOrder = (
  searchResult: StepMetadataWithSuggestions[],
  orderNames: string[],
): StepMetadataWithSuggestions[] => {
  const pieces = filterResultByPieceType(searchResult);
  return pieces.sort((a, b) => {
    return orderNames.indexOf(a.pieceName) - orderNames.indexOf(b.pieceName);
  });
};
const HIGHLIGHTED_PIECES_NAMES_FOR_TRIGGERS = [
  '@activepieces/piece-webhook',
  '@activepieces/piece-schedule',
  '@activepieces/piece-manual-trigger',
  '@activepieces/piece-forms',
  '@activepieces/piece-tables',
];

const HIGHLIGHTED_PIECES_NAMES_FOR_ACTIONS = [
  AI_PIECE_NAME,
  '@activepieces/piece-http',
  '@activepieces/piece-tables',
  '@activepieces/piece-forms',
  '@activepieces/piece-webhook',
  '@activepieces/piece-text-helper',
  '@activepieces/piece-date-helper',
];

const getCustomTab = ({
  config,
  customTabId,
}: {
  config: PieceSelectorConfig | null | undefined;
  customTabId: string | null;
}): PieceSelectorTabConfig | null => {
  if (!config || !customTabId) {
    return null;
  }
  return (
    config.tabs.find(
      (candidate) =>
        candidate.id === customTabId && candidate.kind === 'CUSTOM',
    ) ?? null
  );
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
