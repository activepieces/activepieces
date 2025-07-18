import { useMutation, useQueries, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useTranslation } from 'react-i18next';

import { platformHooks } from '@/hooks/platform-hooks';
import {
  StepMetadataWithSuggestions,
  CategorizedStepMetadataWithSuggestions,
} from '@/lib/types';
import {
  PieceMetadataModel,
  PieceMetadataModelSummary,
  PropertyType,
  ExecutePropsResult,
} from '@activepieces/pieces-framework';
import {
  ActionType,
  flowPieceUtil,
  LocalesEnum,
  PieceOptionRequest,
  PlatformWithoutSensitiveData,
  TriggerType,
} from '@activepieces/shared';

import { pieceSearchUtils } from './piece-search-utils';
import {
  PieceSelectorTabType,
  usePieceSelectorTabs,
} from './piece-selector-tabs-provider';
import { piecesApi } from './pieces-api';
import { stepsHooks } from './steps-hooks';

const {
  getPinnedPieces,
  getPopularPieces,
  getAiAndAgentsPieces,
  isUtilityPiece,
  isAppPiece,
  getHighlightedPieces,
  isFlowController,
} = pieceSearchUtils;

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
        return {
          isLoading: false,
          data: getExploreTabContent(
            piecesMetadataWithoutEmptySuggestions,
            platform,
            props.type,
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
          data: getAiAndAgentsPieces(piecesMetadataWithoutEmptySuggestions),
        };
      case PieceSelectorTabType.APPS: {
        const popularAppsCategory = {
          ...popularCategory,
          metadata: popularCategory.metadata.filter(isAppPiece),
        };
        return {
          isLoading: false,
          data: [popularAppsCategory, appsCategory],
        };
      }

      case PieceSelectorTabType.NONE:
        return {
          isLoading: false,
          data: allCategory.metadata.length > 0 ? [allCategory] : [],
        };
    }
  },
  usePieceOptions: <
    T extends
      | PropertyType.DYNAMIC
      | PropertyType.DROPDOWN
      | PropertyType.MULTI_SELECT_DROPDOWN,
  >({
    onSuccess,
    onError,
    onMutate,
  }: {
    onSuccess: (data: ExecutePropsResult<T>) => void;
    onError: (error: Error) => void;
    onMutate: () => void;
  }) => {
    return useMutation<
      ExecutePropsResult<T>,
      Error,
      { request: PieceOptionRequest; propertyType: T }
    >({
      mutationFn: async ({ request, propertyType }) => {
        onMutate();
        return piecesApi.options(request, propertyType);
      },
      onSuccess,
      onError,
      retry: 1,
      retryDelay: 1000,
    });
  },
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

const getExploreTabContent = (
  queryResult: StepMetadataWithSuggestions[],
  platform: PlatformWithoutSensitiveData,
  type: 'action' | 'trigger',
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
    title: t('Highlights'),
    metadata: [],
  };
  const highlightedPieces = getHighlightedPieces(queryResult, type);
  const codePiece = queryResult.find((piece) => piece.type === ActionType.CODE);
  const branchPiece = queryResult.find(
    (piece) => piece.type === ActionType.ROUTER,
  );
  const loopPiece = queryResult.find(
    (piece) => piece.type === ActionType.LOOP_ON_ITEMS,
  );

  if (pinnedPieces.length > 0) {
    hightlightedPiecesCategory.metadata = [
      ...pinnedPieces,
      ...hightlightedPiecesCategory.metadata,
    ];
  }

  if (highlightedPieces.length > 0) {
    hightlightedPiecesCategory.metadata.push(...highlightedPieces);
  }

  if (branchPiece) {
    hightlightedPiecesCategory.metadata.splice(0, 0, branchPiece);
  }

  if (codePiece) {
    hightlightedPiecesCategory.metadata.splice(3, 0, codePiece);
  }
  if (loopPiece) {
    hightlightedPiecesCategory.metadata.splice(5, 0, loopPiece);
  }

  return [popularCategory, hightlightedPiecesCategory];
};
