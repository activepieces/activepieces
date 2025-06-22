import { useQueries, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useTranslation } from 'react-i18next';

import {
  Action,
  ActionType,
  LocalesEnum,
  SuggestionType,
  Trigger,
  TriggerType,
} from '@activepieces/shared';

import { INTERNAL_ERROR_TOAST, toast } from '../../../components/ui/use-toast';

import { piecesApi } from './pieces-api';
import { getCoreActions } from './pieces-hook';
import { stepUtils } from './step-utils';
import {
  PieceSelectorItem,
  PrimitiveStepMetadata,
  StepMetadata,
  StepMetadataWithStepName,
  StepMetadataWithSuggestions,
} from './types';

export const CORE_STEP_METADATA: Record<
  Exclude<ActionType, ActionType.PIECE> | TriggerType.EMPTY,
  PrimitiveStepMetadata
> = {
  [ActionType.CODE]: {
    displayName: t('Code'),
    logoUrl: 'https://cdn.activepieces.com/pieces/code.svg',
    description: t('Powerful Node.js & TypeScript code with npm'),
    type: ActionType.CODE as const,
  },
  [ActionType.LOOP_ON_ITEMS]: {
    displayName: t('Loop on Items'),
    logoUrl: 'https://cdn.activepieces.com/pieces/loop.svg',
    description: 'Iterate over a list of items',
    type: ActionType.LOOP_ON_ITEMS as const,
  },
  [ActionType.ROUTER]: {
    displayName: 'Router',
    logoUrl: 'https://cdn.activepieces.com/pieces/branch.svg',
    description: t('Split your flow into branches depending on condition(s)'),
    type: ActionType.ROUTER,
  },
  [TriggerType.EMPTY]: {
    displayName: t('Empty Trigger'),
    logoUrl: 'https://cdn.activepieces.com/pieces/empty-trigger.svg',
    description: t('Empty Trigger'),
    type: TriggerType.EMPTY as const,
  },
};

export const stepsHooks = {
  useStepMetadata: ({ step, enabled = true }: UseStepMetadata) => {
    const { i18n } = useTranslation();
    const query = useQuery<StepMetadataWithStepName, Error>({
      queryKey: stepUtils.getKeys(step, i18n.language as LocalesEnum),
      queryFn: () => stepUtils.getMetadata(step, i18n.language as LocalesEnum),
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
      queries: props.map((step) => {
        return {
          queryKey: stepUtils.getKeys(step, i18n.language as LocalesEnum),
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
        const piecesMetadata = pieces
          .filter(
            (piece) =>
              (type === 'action' && piece.actions > 0) ||
              (type === 'trigger' && piece.triggers > 0),
          )
          .map((piece) => {
            const metadata = stepUtils.mapPieceToMetadata(piece, type);
            return {
              ...metadata,
              suggestedActions: piece.suggestedActions,
              suggestedTriggers: piece.suggestedTriggers,
            };
          });
        switch (type) {
          case 'action': {
            const filtersPrimitive: Omit<
              PrimitiveStepMetadata,
              'stepDisplayName'
            >[] = [
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

type UseStepsMetadata = (Action | Trigger)[];

type UseStepMetadata = {
  step: Action | Trigger;
  enabled?: boolean;
};

type UseMetadataProps = {
  searchQuery?: string;
  enabled?: boolean;
  type: 'action' | 'trigger';
};
