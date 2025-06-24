import { useQueries, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useTranslation } from 'react-i18next';

import { platformHooks } from '@/hooks/platform-hooks';
import {
  PieceGroup,
  PieceStepMetadata,
  StepMetadata,
  StepMetadataWithSuggestions,
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
  usePiecesGroups: (
    props: UsePiecesGroupsProps,
  ): {
    isLoading: boolean;
    data: PieceGroup[];
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
    const { searchQuery, type } = props;
    const isTrigger = type === 'trigger';
    const piecesMetadata =
      searchQuery.length > 0
        ? filterOutPiecesWithNoSuggestions(metadata)
        : metadata;

    if (searchQuery.length > 0 && piecesMetadata.length > 0) {
      return {
        isLoading: false,
        data: [{ title: t('Search Results'), pieces: piecesMetadata }],
      };
    }
    const flowControllerPieces = piecesMetadata.filter(
      (p) => isFlowController(p) && !isTrigger,
    );
    const universalAiPieces = piecesMetadata.filter(
      (p) => isUniversalAiPiece(p) && !isTrigger,
    );
    const popularPieces = piecesMetadata.filter((p) =>
      isPopularPieces(p, platform),
    );
    const other = piecesMetadata.filter((p) => !popularPieces.includes(p));

    const groups: PieceGroup[] = [
      { title: t('Popular'), pieces: popularPieces },
      { title: t('Flow Control'), pieces: flowControllerPieces },
      { title: t('Universal AI'), pieces: universalAiPieces },
      { title: t('Other'), pieces: other },
    ];

    return {
      isLoading: false,
      data: groups.filter((group) => group.pieces.length > 0),
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
type UsePiecesGroupsProps = {
  searchQuery: string;
  enabled?: boolean;
  type: 'action' | 'trigger';
};

const filterOutPiecesWithNoSuggestions = (
  metadata: StepMetadataWithSuggestions[],
) => {
  return metadata.filter((step) => {
    const isActionWithSuggestions =
      step.type === ActionType.PIECE &&
      step.suggestedActions &&
      step.suggestedActions.length > 0;

    const isTriggerWithSuggestions =
      step.type === TriggerType.PIECE &&
      step.suggestedTriggers &&
      step.suggestedTriggers.length > 0;

    const isNotPieceType =
      step.type !== ActionType.PIECE && step.type !== TriggerType.PIECE;

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
  const popularPieces = [
    '@activepieces/piece-gmail',
    '@activepieces/piece-google-sheets',
    '@activepieces/piece-openai',
    '@activepieces/piece-schedule',
    '@activepieces/piece-webhook',
    '@activepieces/piece-http',
    '@activepieces/piece-forms',
    '@activepieces/piece-slack',
  ];
  const pinnedPieces = platform.pinnedPieces ?? [];
  return [...popularPieces, ...pinnedPieces].includes(
    (stepMetadata as PieceStepMetadata).pieceName,
  );
};

const isFlowController = (stepMetadata: StepMetadata) => {
  if (stepMetadata.type === ActionType.PIECE) {
    return stepMetadata.categories.includes(PieceCategory.FLOW_CONTROL);
  }
  return [ActionType.LOOP_ON_ITEMS, ActionType.ROUTER].includes(
    stepMetadata.type as ActionType,
  );
};

const isUniversalAiPiece = (stepMetadata: StepMetadata) => {
  if (stepMetadata.type === ActionType.PIECE) {
    return stepMetadata.categories.includes(PieceCategory.UNIVERSAL_AI);
  }
  return false;
};
