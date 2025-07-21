import { useQueries, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useTranslation } from 'react-i18next';

import { platformHooks } from '@/hooks/platform-hooks';
import {
  PieceTagType,
  StepMetadata,
  StepMetadataWithSuggestions,
  CategorizedStepMetadataWithSuggestions,
  tagCategoryName,
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
    const corePieces = pieceMetadataWithoutPopularPieces.filter(isCorePiece);
    const universalAiPieces =
      pieceMetadataWithoutPopularPieces.filter(isUniversalAiPiece);
    const appPieces = pieceMetadataWithoutPopularPieces.filter(isAppPiece);
    const categorizedStepsMetadata: CategorizedStepMetadataWithSuggestions[] =
      [];
    if (corePieces.length > 0) {
      categorizedStepsMetadata.push({
        title: tagCategoryName[PieceTagType.CORE],
        metadata: corePieces,
      });
    }
    if (flowControllerPieces.length > 0) {
      categorizedStepsMetadata.push({
        title: t('Flow Controller'),
        metadata: flowControllerPieces,
      });
    }
    if (universalAiPieces.length > 0) {
      categorizedStepsMetadata.push({
        title: tagCategoryName[PieceTagType.AI_AND_AGENTS],
        metadata: universalAiPieces,
      });
    }
    if (popularPieces.length > 0) {
      categorizedStepsMetadata.push({
        title: tagCategoryName[PieceTagType.APPS],
        metadata: popularPieces,
      });
    }
    if (appPieces.length > 0) {
      categorizedStepsMetadata.push({
        title: t('Apps'),
        metadata: appPieces,
      });
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

const isCorePiece = (metadata: StepMetadata) =>
  metadata.type !== TriggerType.PIECE && metadata.type !== ActionType.PIECE
    ? !isFlowController(metadata)
    : metadata.categories.includes(PieceCategory.CORE) &&
      !isFlowController(metadata);

const isAppPiece = (metadata: StepMetadata) => {
  return (
    !isCorePiece(metadata) &&
    !isUniversalAiPiece(metadata) &&
    !isFlowController(metadata)
  );
};
