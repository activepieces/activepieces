import { useQueries, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useTranslation } from 'react-i18next';

import {
  PieceMetadataModel,
  PieceMetadataModelSummary,
} from '@activepieces/pieces-framework';
import {
  Action,
  ActionType,
  flowPieceUtil,
  LocalesEnum,
  SuggestionType,
  Trigger,
  TriggerType,
} from '@activepieces/shared';

import { INTERNAL_ERROR_TOAST, toast } from '../../../components/ui/use-toast';

import { CORE_STEP_METADATA, piecesApi } from './pieces-api';
import {
  PieceSelectorItem,
  StepMetadata,
  StepMetadataWithSuggestions,
} from './types';

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
type Step = Action | Trigger;

type UseStepsMetadata = Step[];

type UseMultiplePiecesProps = {
  names: string[];
};

type UseStepMetadata = {
  step: Action | Trigger;
  enabled?: boolean;
};

type UsePiecesProps = {
  searchQuery?: string;
  includeHidden?: boolean;
  includeTags?: boolean;
};

type UseMetadataProps = {
  searchQuery?: string;
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
      versions: {
        [exactVersion as string]: pieceQuery.pieceModel,
        [latestPatchVersion as string]: latestPatchQuery.pieceModel,
      },
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
  useStepMetadata: ({ step, enabled = true }: UseStepMetadata) => {
    const { i18n } = useTranslation();
    const query = useQuery<StepMetadata, Error>({
      ...stepMetadataQueryBuilder(step, i18n.language as LocalesEnum),
      enabled,
    });
    return {
      stepMetadata: query.data,
      isLoading: query.isLoading,
    };
  },
  useStepsMetadata: (props: UseStepsMetadata) => {
    const { i18n } = useTranslation();
    return useQueries({
      queries: props.map((step) =>
        stepMetadataQueryBuilder(step, i18n.language as LocalesEnum),
      ),
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
        const piecesMetadata = pieces
          .filter(
            (piece) =>
              (type === 'action' && piece.actions > 0) ||
              (type === 'trigger' && piece.triggers > 0),
          )
          .map((piece) => {
            const metadata = piecesApi.mapToMetadata(type, piece);

            const res: StepMetadataWithSuggestions = {
              ...metadata,
              suggestedActions: piece.suggestedActions,
              suggestedTriggers: piece.suggestedTriggers,
            };
            return res;
          });
        switch (type) {
          case 'action': {
            const filtersPrimitive: StepMetadataWithSuggestions[] = [
              CORE_STEP_METADATA[ActionType.CODE],
              CORE_STEP_METADATA[ActionType.LOOP_ON_ITEMS],
              CORE_STEP_METADATA[ActionType.ROUTER],
            ].filter((step) => passSearch(searchQuery, step));
            return [...filtersPrimitive, ...piecesMetadata];
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
  usePieceActionsOrTriggers: ({
    stepMetadata,
  }: {
    stepMetadata?: StepMetadata;
  }) => {
    const { i18n } = useTranslation();
    return useQuery<PieceSelectorItem[], Error>({
      queryKey: [
        'pieceMetadata',
        stepMetadata?.type,
        stepMetadata?.displayName,
      ],
      queryFn: async (): Promise<PieceSelectorItem[]> => {
        try {
          if (!stepMetadata) {
            return [];
          }
          switch (stepMetadata.type) {
            case TriggerType.PIECE:
            case ActionType.PIECE: {
              const pieceMetadata = await piecesApi.get({
                name: stepMetadata.pieceName,
                locale: i18n.language as LocalesEnum,
              });
              return Object.values(
                stepMetadata.type === TriggerType.PIECE
                  ? pieceMetadata.triggers
                  : pieceMetadata.actions,
              );
            }
            case ActionType.CODE:
            case ActionType.LOOP_ON_ITEMS:
            case ActionType.ROUTER:
              return getCoreActions(stepMetadata.type);
            default:
              return [];
          }
        } catch (e) {
          console.error(e);
          toast(INTERNAL_ERROR_TOAST);
          return [];
        }
      },
    });
  },
};
function stepMetadataQueryBuilder(step: Step, locale: LocalesEnum) {
  const isPieceStep =
    step.type === ActionType.PIECE || step.type === TriggerType.PIECE;
  const pieceName = isPieceStep ? step.settings.pieceName : undefined;
  const pieceVersion = isPieceStep ? step.settings.pieceVersion : undefined;
  const customLogoUrl =
    'customLogoUrl' in step ? step.customLogoUrl : undefined;
  return {
    queryKey: ['piece', step.type, pieceName, pieceVersion, customLogoUrl],
    queryFn: () => piecesApi.getMetadata(step, locale),
    staleTime: Infinity,
  };
}

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

export function getCoreActions(
  type: ActionType.LOOP_ON_ITEMS | ActionType.CODE | ActionType.ROUTER,
): PieceSelectorItem[] {
  switch (type) {
    case ActionType.CODE:
      return [
        {
          name: 'code',
          displayName: t('Custom Javascript Code'),
          description: CORE_STEP_METADATA.CODE.description,
          type: ActionType.CODE as const,
        },
      ];
    case ActionType.LOOP_ON_ITEMS:
      return [
        {
          name: 'loop',
          displayName: t('Loop on Items'),
          description: CORE_STEP_METADATA.LOOP_ON_ITEMS.description,
          type: ActionType.LOOP_ON_ITEMS as const,
        },
      ];

    case ActionType.ROUTER:
      return [
        {
          name: 'router',
          displayName: t('Router'),
          description: t(
            'Split your flow into branches depending on condition(s)',
          ),
          type: ActionType.ROUTER as const,
        },
      ];
  }
}
