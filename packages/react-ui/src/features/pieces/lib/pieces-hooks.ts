import { useQueries, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useTranslation } from 'react-i18next';

import { platformHooks } from '@/hooks/platform-hooks';
import {
  StepMetadata,
  StepMetadataWithSuggestions,
  CategorizedStepMetadataWithSuggestions,
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
  useMostRecentAndExactPieceVersion: ({
    name,
    version,
    enabled = true,
  }: UsePieceAndMostRecentPatchProps) => {
    const exactVersion = version
      ? flowPieceUtil.getExactVersion(version)
      : undefined;
    const latestPatchVersion = exactVersion
      ? flowPieceUtil.getNextVersion(exactVersion)
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
      pieceModel: pieceQuery.pieceModel,
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
    const popularPieces = piecesMetadataWithoutEmptySuggestions.filter((p) =>
      isPopularPieces(p, platform),
    );

    const pieceMetadataWithoutPopularPieces =
      piecesMetadataWithoutEmptySuggestions.filter(
        (p) => !popularPieces.includes(p),
      );
    const flowControllerPieces =
      pieceMetadataWithoutPopularPieces.filter(isFlowController);
    const utilityPieces =
      pieceMetadataWithoutPopularPieces.filter(isUtilityPiece);
    const universalAiPieces =
      pieceMetadataWithoutPopularPieces.filter(isUniversalAiPiece);
    const appPieces = pieceMetadataWithoutPopularPieces.filter(isAppPiece);
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
      metadata: popularPieces,
    };

    const showCoreCategories =
      selectedTab === PieceSelectorTabType.UTILITY ||
      selectedTab === PieceSelectorTabType.NONE;
    if (utilityPieces.length > 0 && showCoreCategories) {
      categorizedStepsMetadata.push(utilitiesCategory);
    }
    if (flowControllerPieces.length > 0 && showCoreCategories) {
      categorizedStepsMetadata.push(flowControllerCategory);
    }
    const showAiAndAgents =
      selectedTab === PieceSelectorTabType.AI_AND_AGENTS ||
      selectedTab === PieceSelectorTabType.NONE;
    if (universalAiPieces.length > 0 && showAiAndAgents) {
      categorizedStepsMetadata.push(universalAiCategory);
    }
    const showApps =
      selectedTab === PieceSelectorTabType.APPS ||
      selectedTab === PieceSelectorTabType.NONE;
    if (popularPieces.length > 0 && showApps) {
      categorizedStepsMetadata.push(popularCategory);
    }
    if (appPieces.length > 0 && showApps) {
      categorizedStepsMetadata.push(appsCategory);
    }

    return {
      isLoading: false,
      data: categorizedStepsMetadata,
    };
  },
};

type UsePieceAndMostRecentPatchProps = {
  name: string;
  version: string | undefined;
  enabled?: boolean;
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
const isPopularPieces = (
  stepMetadata: StepMetadataWithSuggestions,
  platform: PlatformWithoutSensitiveData,
) => {
  if (
    stepMetadata.type !== TriggerType.PIECE &&
    stepMetadata.type !== ActionType.PIECE
  ) {
    return false;
  }
  if (stepMetadata.categories.includes(PieceCategory.CORE)) {
    return false;
  }
  const popularPiecesNames = [
    '@activepieces/piece-gmail',
    '@activepieces/piece-google-sheets',
    '@activepieces/piece-openai',
    '@activepieces/piece-schedule',
    '@activepieces/piece-forms',
    '@activepieces/piece-slack',
  ];
  const pinnedPiecesNames = platform.pinnedPieces ?? [];
  return [...pinnedPiecesNames, ...popularPiecesNames].includes(
    stepMetadata.pieceName,
  );
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
