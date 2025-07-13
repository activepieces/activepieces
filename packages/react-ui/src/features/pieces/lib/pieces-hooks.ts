import { useQueries, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useTranslation } from 'react-i18next';

import { platformHooks } from '@/hooks/platform-hooks';
import {
  StepMetadata,
  StepMetadataWithSuggestions,
  CategorizedStepMetadataWithSuggestions,
  PieceStepMetadataWithSuggestions,
} from '@/lib/types';
import {
  PieceMetadataModel,
  PieceMetadataModelSummary,
} from '@activepieces/pieces-framework';
import {
  ActionType,
  flowPieceUtil,
  LocalesEnum,
  PieceCategory,
  PlatformWithoutSensitiveData,
  TriggerType,
} from '@activepieces/shared';

import {
  PieceSelectorTabType,
  usePieceSelectorTabs,
} from './piece-selector-tabs-provider';
import { piecesApi } from './pieces-api';
import { stepsHooks } from './steps-hooks';

export const piecesHooks = {
  usePiece: ({ name, version, enabled = true }: UsePieceProps) => {
    const { i18n } = useTranslation();
    const query = useQuery<PieceMetadataModel, Error>({
      queryKey: ['piece', name, version],
      queryFn: () =>
        piecesApi.get({ name, version, locale: i18n.language as LocalesEnum }),
      staleTime: Infinity,
      enabled,
    });
    return {
      pieceModel: query.data,
      isLoading: query.isLoading,
      isSuccess: query.isSuccess,
      refetch: query.refetch,
    };
  },
  usePieceModelForStepSettings: ({
    name,
    version,
    enabled = true,
    getExactVersion,
  }: UsePieceModelForStepSettings) => {
    const exactVersion = version
      ? flowPieceUtil.getExactVersion(version)
      : undefined;
    const latestPatchVersion = exactVersion
      ? flowPieceUtil.getMostRecentPatchVersion(exactVersion)
      : undefined;
    const pieceQuery = piecesHooks.usePiece({
      name,
      version: exactVersion,
      enabled,
    });
    const latestPatchQuery = piecesHooks.usePiece({
      name,
      version: latestPatchVersion,
      enabled,
    });
    return {
      pieceModel: getExactVersion
        ? pieceQuery.pieceModel
        : latestPatchQuery.pieceModel,
      isLoading: pieceQuery.isLoading || latestPatchQuery.isLoading,
      isSuccess: pieceQuery.isSuccess && latestPatchQuery.isSuccess,
      refetch: () => {
        pieceQuery.refetch();
        latestPatchQuery.refetch();
      },
    };
  },
  useMultiplePieces: ({ names }: UseMultiplePiecesProps) => {
    const { i18n } = useTranslation();
    return useQueries({
      queries: names.map((name) => ({
        queryKey: ['piece', name, undefined],
        queryFn: () =>
          piecesApi.get({
            name,
            version: undefined,
            locale: i18n.language as LocalesEnum,
          }),
        staleTime: Infinity,
      })),
    });
  },
  usePieces: ({
    searchQuery,
    includeHidden = false,
    includeTags = false,
  }: UsePiecesProps) => {
    const { i18n } = useTranslation();
    const query = useQuery<PieceMetadataModelSummary[], Error>({
      queryKey: ['pieces', searchQuery, includeHidden],
      queryFn: () =>
        piecesApi.list({
          searchQuery,
          includeHidden,
          includeTags,
          locale: i18n.language as LocalesEnum,
        }),
      staleTime: searchQuery ? 0 : Infinity,
    });
    return {
      pieces: query.data,
      isLoading: query.isLoading,
      refetch: query.refetch,
    };
  },
  usePiecesSearch: (
    props: UsePiecesSearchProps,
  ): {
    isLoading: boolean;
    data: CategorizedStepMetadataWithSuggestions[];
  } => {
    const { selectedTab } = usePieceSelectorTabs();
    const { metadata, isLoading: isLoadingPieces } =
      stepsHooks.useAllStepsMetadata(props);
    const { platform } = platformHooks.useCurrentPlatform();
    if (!metadata || isLoadingPieces) {
      return {
        isLoading: true,
        data: [],
      };
    }
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

    const universalAiPieces =
      piecesMetadataWithoutEmptySuggestions.filter(isUniversalAiPiece);

    const pieceMetadataWithoutPopularOrPinnedPieces =
      piecesMetadataWithoutEmptySuggestions.filter(
        (p) => !popularPieces.includes(p) && !pinnedPieces.includes(p),
      );

    const appPieces =
      pieceMetadataWithoutPopularOrPinnedPieces.filter(isAppPiece);

    const categorizedStepsMetadata: CategorizedStepMetadataWithSuggestions[] =
      [];

    const utilitiesCategory = {
      title: t('Utility'),
      metadata: utilityPieces,
    };
    const flowControllerCategory = {
      title: t('Flow Controller'),
      metadata: flowControllerPieces,
    };
    const universalAiCategory = {
      title: t('AI and Agents'),
      metadata: universalAiPieces,
    };
    const appsCategory = {
      title: t('Apps'),
      metadata: appPieces,
    };
    const popularCategory = {
      title: t('Popular'),
      metadata: popularPieces
    };
    const allCategory = {
      title: t('All'),
      metadata: piecesMetadataWithoutEmptySuggestions,
    };

    switch (selectedTab) {
      case PieceSelectorTabType.EXPLORE:
        return {
          isLoading: false,
          data: getExploreTabContent(
            piecesMetadataWithoutEmptySuggestions,
            platform,
          ),
        };
      case PieceSelectorTabType.UTILITY:
        return {
          isLoading: false,
          data: [utilitiesCategory, flowControllerCategory],
        };
      case PieceSelectorTabType.AI_AND_AGENTS:
        return {
          isLoading: false,
          data: [universalAiCategory],
        };
      case PieceSelectorTabType.APPS: {
        const popularCategoryWithoutAgent = {
          ...popularCategory,
          metadata: popularCategory.metadata.filter(
            (piece) =>
              piece.type !== ActionType.PIECE ||
              piece.pieceName !== '@activepieces/piece-agent',
          ),
        };
        return {
          isLoading: false,
          data: [popularCategoryWithoutAgent, appsCategory],
        };
      }

      case PieceSelectorTabType.NONE:
        return {
          isLoading: false,
          data: allCategory.metadata.length > 0 ? [allCategory] : [],
        };
    }

    return {
      isLoading: false,
      data: categorizedStepsMetadata,
    };
  },
};

type UsePieceModelForStepSettings = {
  name: string;
  version: string | undefined;
  enabled?: boolean;
  getExactVersion: boolean;
};

type UsePieceProps = {
  name: string;
  version?: string;
  enabled?: boolean;
};

type UseMultiplePiecesProps = {
  names: string[];
};

type UsePiecesProps = {
  searchQuery?: string;
  includeHidden?: boolean;
  includeTags?: boolean;
};
type UsePiecesSearchProps = {
  searchQuery: string;
  enabled?: boolean;
  type: 'action' | 'trigger';
};

const filterOutPiecesWithNoSuggestions = (
  stepsMetadata: StepMetadataWithSuggestions[],
) => {
  return stepsMetadata.filter((metadata) => {
    const isActionWithSuggestions =
      metadata.type === ActionType.PIECE &&
      metadata.suggestedActions &&
      metadata.suggestedActions.length > 0;

    const isTriggerWithSuggestions =
      metadata.type === TriggerType.PIECE &&
      metadata.suggestedTriggers &&
      metadata.suggestedTriggers.length > 0;

    const isNotPieceType =
      metadata.type !== ActionType.PIECE && metadata.type !== TriggerType.PIECE;
    return (
      isActionWithSuggestions || isTriggerWithSuggestions || isNotPieceType
    );
  });
};

const isFlowController = (stepMetadata: StepMetadata) => {
  if (
    stepMetadata.type === ActionType.PIECE ||
    stepMetadata.type === TriggerType.PIECE
  ) {
    return stepMetadata.categories.includes(PieceCategory.FLOW_CONTROL);
  }
  return (
    stepMetadata.type === ActionType.LOOP_ON_ITEMS ||
    stepMetadata.type === ActionType.ROUTER
  );
};

const isUniversalAiPiece = (stepMetadata: StepMetadata) => {
  if (stepMetadata.type === ActionType.PIECE) {
    return stepMetadata.categories.some((category) =>
      [PieceCategory.UNIVERSAL_AI].includes(category as PieceCategory),
    );
  }
  return false;
};

const isUtilityPiece = (metadata: StepMetadata) =>
  metadata.type !== TriggerType.PIECE && metadata.type !== ActionType.PIECE
    ? !isFlowController(metadata)
    : metadata.categories.includes(PieceCategory.CORE) &&
    !isFlowController(metadata);

const isAppPiece = (metadata: StepMetadata) => {
  return (
    !isUtilityPiece(metadata) &&
    !isUniversalAiPiece(metadata) &&
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

const popularPiecesNames = [
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
      popularPiecesNames.includes(piece.pieceName) &&
      !pinnedPiecesNames.includes(piece.pieceName),
  );
  return sortByPieceNameOrder(popularPieces, popularPiecesNames);
};

const highlightedPiecesNames = [
  '@activepieces/piece-http',
  '@activepieces/piece-schedule',
  '@activepieces/piece-agent',
  '@activepieces/piece-webhook',
  '@activepieces/piece-tables',
  '@activepieces/piece-forms',
  '@activepieces/piece-todos',

];

const getExploreTabContent = (
  queryResult: StepMetadataWithSuggestions[],
  platform: PlatformWithoutSensitiveData,
) => {
  const popularCategory: CategorizedStepMetadataWithSuggestions = {
    title: t('Popular'),
    metadata: [],
  };

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
    title: t('Highlighted'),
    metadata: [],
  };
  const highlightedPieces = getHighlightedPieces(queryResult);
  const codePiece = queryResult.find((piece) => piece.type === ActionType.CODE);
  const branchPiece = queryResult.find((piece) => piece.type === ActionType.ROUTER);

  if (pinnedPieces.length > 0) {
    hightlightedPiecesCategory.metadata = [
      ...pinnedPieces,
      ...hightlightedPiecesCategory.metadata,
    ];
  }

  if (highlightedPieces.length > 0) {
    hightlightedPiecesCategory.metadata.push(
      ...sortByPieceNameOrder(highlightedPieces, highlightedPiecesNames),
    );
  }

  if (branchPiece) {
    hightlightedPiecesCategory.metadata.splice(0, 0, branchPiece);
  }

  if (codePiece) {
    hightlightedPiecesCategory.metadata.splice(4, 0, codePiece);
  }

  return [popularCategory, hightlightedPiecesCategory];
};

const filterResultByPieceType = (
  queryResult: StepMetadataWithSuggestions[],
) => {
  return queryResult.filter(
    (piece): piece is PieceStepMetadataWithSuggestions =>
      piece.type === ActionType.PIECE || piece.type === TriggerType.PIECE,
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

const getHighlightedPieces = (queryResult: StepMetadataWithSuggestions[]) => {
  const pieces = filterResultByPieceType(queryResult);
  return pieces.filter((piece) =>
    highlightedPiecesNames.includes(piece.pieceName),
  );
};
