import { useQueries, useQuery } from '@tanstack/react-query';

import {
  PieceMetadataModel,
  PieceMetadataModelSummary,
} from '@activepieces/pieces-framework';
import { Action, ActionType, Trigger, TriggerType } from '@activepieces/shared';

import { piecesApi } from './pieces-api';

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

type UsePieceMetadata = {
  step: Action | Trigger;
  enabled?: boolean;
};

type UsePiecesProps = {
  searchQuery?: string;
};

export type StepMetadata = {
  displayName: string;
  logoUrl: string;
  description: string;
};

export const piecesHooks = {
  usePiece: ({ name, version }: UsePieceProps) => {
    const query = useQuery<PieceMetadataModel, Error>({
      queryKey: ['piece', name, version],
      queryFn: () => piecesApi.get({ name, version }),
      staleTime: Infinity,
    });
    return {
      pieceModel: query.data,
      isLoading: query.isLoading,
      isSuccess: query.isSuccess,
    };
  },
  useMultiplePieces: ({ names }: UseMultiplePiecesProps) => {
    return useQueries({
      queries: names.map((name) => ({
        queryKey: ['piece', name, undefined],
        queryFn: () => piecesApi.get({ name, version: undefined }),
        staleTime: Infinity,
      })),
    });
  },
  useStepMetadata: ({ step, enabled = true }: UsePieceMetadata) => {
    const { type } = step;
    const pieceName = step.settings?.pieceName;
    const pieceVersion = step.settings?.pieceVersion;
    const query = useQuery<StepMetadata, Error>({
      queryKey: ['piece', type, pieceName, pieceVersion],
      queryFn: () => piecesApi.getMetadata(step),
      staleTime: Infinity,
      enabled,
    });
    return {
      stepMetadata: query.data,
      isLoading: query.isLoading,
    };
  },
  useStepsMetadata: (props: UseStepsMetadata) => {
    return useQueries({
      queries: props.map((step) => stepMetadataQueryBuilder(step)),
    });
  },
  usePieces: ({ searchQuery }: UsePiecesProps) => {
    return useQuery<PieceMetadataModelSummary[], Error>({
      queryKey: ['pieces', searchQuery],
      queryFn: () => piecesApi.list({ searchQuery }),
      staleTime: searchQuery ? 0 : Infinity,
    });
  },
};

function stepMetadataQueryBuilder(step: Step) {
  const isPieceStep =
    step.type === ActionType.PIECE || step.type === TriggerType.PIECE;
  const pieceName = isPieceStep ? step.settings.pieceName : undefined;
  const pieceVersion = isPieceStep ? step.settings.pieceVersion : undefined;
  return {
    queryKey: ['piece', step.type, pieceName, pieceVersion],
    queryFn: () => piecesApi.getMetadata(step),
    staleTime: Infinity,
  };
}
