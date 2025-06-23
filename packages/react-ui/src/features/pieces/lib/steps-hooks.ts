import { useQueries, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useTranslation } from 'react-i18next';

import { platformHooks } from '@/hooks/platform-hooks';
import {
  Action,
  ActionType,
  LocalesEnum,
  PieceCategory,
  PlatformWithoutSensitiveData,
  SuggestionType,
  Trigger,
  TriggerType,
} from '@activepieces/shared';

import {
  PieceGroup,
  PieceStepMetadata,
  StepMetadata,
  StepMetadataWithStepName,
  StepMetadataWithSuggestions,
} from '../../../lib/types';

import { piecesApi } from './pieces-api';
import {
  CORE_ACTIONS_METADATA,
  CORE_STEP_METADATA,
  stepUtils,
} from './step-utils';

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

const getQueryKeyForStepMetadata = (
  step: Action | Trigger,
  locale: LocalesEnum,
): (string | undefined)[] => {
  const isPieceStep =
    step.type === ActionType.PIECE || step.type === TriggerType.PIECE;
  const pieceName = isPieceStep ? step.settings.pieceName : undefined;
  const pieceVersion = isPieceStep ? step.settings.pieceVersion : undefined;
  const customLogoUrl =
    'customLogoUrl' in step ? step.customLogoUrl : undefined;
  const agentId = stepUtils.getAgentId(step);
  return [pieceName, pieceVersion, customLogoUrl, agentId, locale];
};

export const stepsHooks = {
  useStepMetadata: ({ step, enabled = true }: UseStepMetadata) => {
    const { i18n } = useTranslation();
    const query = useQuery<StepMetadataWithStepName, Error>({
      queryKey: getQueryKeyForStepMetadata(step, i18n.language as LocalesEnum),
      queryFn: () => stepUtils.getMetadata(step, i18n.language as LocalesEnum),
      enabled,
    });
    return {
      stepMetadata: query.data,
      isLoading: query.isLoading,
    };
  },
  useStepsMetadata: (props: (Action | Trigger)[]) => {
    const { i18n } = useTranslation();
    return useQueries({
      queries: props.map((step) => {
        return {
          queryKey: getQueryKeyForStepMetadata(
            step,
            i18n.language as LocalesEnum,
          ),
          queryFn: () =>
            stepUtils.getMetadata(step, i18n.language as LocalesEnum),
          staleTime: Infinity,
        };
      }),
    });
  },
  useAllStepsMetadata: ({ searchQuery, type, enabled }: UseMetadataProps) => {
    const { i18n } = useTranslation();
    const query = useQuery<StepMetadataWithSuggestions[], Error>({
      queryKey: ['pieces-metadata', searchQuery, type],
      queryFn: async () => {
        const pieces = await piecesApi.list({
          searchQuery,
          suggestionType:
            type === 'action' ? SuggestionType.ACTION : SuggestionType.TRIGGER,
          locale: i18n.language as LocalesEnum,
        });

        const filteredPiecesBySuggestionType = pieces.filter(
          (piece) =>
            (type === 'action' && piece.actions > 0) ||
            (type === 'trigger' && piece.triggers > 0),
        );

        const piecesMetadata = filteredPiecesBySuggestionType.map((piece) => {
          const metadata = stepUtils.mapPieceToMetadata(piece, type);
          return {
            ...metadata,
            suggestedActions: piece.suggestedActions,
            suggestedTriggers: piece.suggestedTriggers,
          };
        });

        switch (type) {
          case 'action': {
            const filteredCoreActions = CORE_ACTIONS_METADATA.filter((step) =>
              passSearch(searchQuery, step),
            );
            return [...filteredCoreActions, ...piecesMetadata];
          }
          case 'trigger':
            return [...piecesMetadata];
        }
      },
      enabled,
      staleTime: searchQuery ? 0 : Infinity,
    });
    return {
      refetch: query.refetch,
      metadata: query.data,
      isLoading: query.isLoading,
    };
  },
  usePiecesGroups: (
    props: UseMetadataProps,
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
function passSearch(
  searchQuery: string | undefined,
  data: (typeof CORE_STEP_METADATA)[keyof typeof CORE_STEP_METADATA],
) {
  if (!searchQuery) {
    return true;
  }
  return JSON.stringify({ data })
    .toLowerCase()
    .includes(searchQuery?.toLowerCase());
}

type UseStepMetadata = {
  step: Action | Trigger;
  enabled?: boolean;
};

type UseMetadataProps = {
  searchQuery: string;
  enabled?: boolean;
  type: 'action' | 'trigger';
};

export const filterOutPiecesWithNoSuggestions = (
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
