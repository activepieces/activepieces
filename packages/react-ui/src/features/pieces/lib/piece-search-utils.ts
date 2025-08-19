import { t } from 'i18next';

import {
  CategorizedStepMetadataWithSuggestions,
  PieceStepMetadataWithSuggestions,
  StepMetadata,
  StepMetadataWithSuggestions,
} from '@/lib/types';
import {
  PieceCategory,
  FlowTriggerType,
  FlowActionType,
} from '@activepieces/shared';

const isFlowController = (stepMetadata: StepMetadata) => {
  if (
    stepMetadata.type === FlowActionType.PIECE ||
    stepMetadata.type === FlowTriggerType.PIECE
  ) {
    return stepMetadata.categories.includes(PieceCategory.FLOW_CONTROL);
  }
  return (
    stepMetadata.type === FlowActionType.LOOP_ON_ITEMS ||
    stepMetadata.type === FlowActionType.ROUTER
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
  '@activepieces/piece-forms',
  '@activepieces/piece-tables',
];

const HIGHLIGHTED_PIECES_NAMES_FOR_ACTIONS = [
  '@activepieces/piece-agent',
  '@activepieces/piece-http',
  '@activepieces/piece-tables',
  '@activepieces/piece-todos',
  '@activepieces/piece-forms',
  '@activepieces/piece-webhook',
  '@activepieces/piece-text-helper',
  '@activepieces/piece-date-helper',
];

export const pieceSearchUtils = {
  isFlowController,
  getAiAndAgentsPieces,
  isAiAndAgentPiece,
  isUtilityPiece,
  isAppPiece,
  getPinnedPieces,
  getPopularPieces,
  getHighlightedPieces,
};
