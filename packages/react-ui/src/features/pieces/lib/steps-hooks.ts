import { useQueries, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  Action,
  ActionType,
  LocalesEnum,
  SuggestionType,
  Trigger,
  TriggerType,
} from '@activepieces/shared';

import {
  StepMetadataWithActionOrTriggerOrAgentDisplayName,
  StepMetadataWithSuggestions,
} from '../../../lib/types';

import { piecesApi } from './pieces-api';
import {
  CORE_ACTIONS_METADATA,
  CORE_STEP_METADATA,
  stepUtils,
} from './step-utils';

export const stepsHooks = {
  useStepMetadata: ({ step, enabled = true }: UseStepMetadata) => {
    const { i18n } = useTranslation();
    const query = useQuery<
      StepMetadataWithActionOrTriggerOrAgentDisplayName,
      Error
    >({
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
          const metadata = stepUtils.mapPieceToMetadata({
            piece,
            type,
          });
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
  return [pieceName, pieceVersion, customLogoUrl, agentId, locale, step.type];
};
