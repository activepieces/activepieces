import { useQueries, useQuery } from '@tanstack/react-query';

import {
  PieceMetadataModel,
  PieceMetadataModelSummary,
} from '@activepieces/pieces-framework';
import {
  Action,
  ActionType,
  PackageType,
  PieceType,
  SuggestionType,
  Trigger,
  TriggerType,
  isNil,
} from '@activepieces/shared';

import { PRIMITIVE_STEP_METADATA, piecesApi } from './pieces-api';

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
  step: Action | Trigger | undefined;
  enabled?: boolean;
};

type UsePiecesProps = {
  searchQuery?: string;
  includeHidden?: boolean;
};

type UseMetadataProps = {
  searchQuery?: string;
  enabled?: boolean;
  type: 'action' | 'trigger';
};

type BaseStepMetadata = {
  displayName: string;
  logoUrl: string;
  description: string;
};

export type PieceStepMetadata = BaseStepMetadata & {
  type: ActionType.PIECE | TriggerType.PIECE;
  pieceName: string;
  pieceVersion: string;
  categories: string[];
  packageType: PackageType;
  pieceType: PieceType;
};

export type PrimitiveStepMetadata = BaseStepMetadata & {
  type: Omit<ActionType | TriggerType, ActionType.PIECE | TriggerType.PIECE>;
};

export type StepMetadata = PieceStepMetadata | PrimitiveStepMetadata;

export const piecesHooks = {
  usePiece: ({ name, version, enabled = true }: UsePieceProps) => {
    const query = useQuery<PieceMetadataModel, Error>({
      queryKey: ['piece', name, version],
      queryFn: () => piecesApi.get({ name, version }),
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
    const pieceName = step?.settings?.pieceName;
    const pieceVersion = step?.settings?.pieceVersion;
    const query = useQuery<StepMetadata, Error>({
      queryKey: ['piece', step?.type, pieceName, pieceVersion],
      queryFn: () => piecesApi.getMetadata(step!),
      staleTime: Infinity,
      enabled: enabled && !isNil(step),
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
  usePieces: ({ searchQuery, includeHidden = false }: UsePiecesProps) => {
    const query = useQuery<PieceMetadataModelSummary[], Error>({
      queryKey: ['pieces', searchQuery, includeHidden],
      queryFn: () => piecesApi.list({ searchQuery, includeHidden }),
      staleTime: searchQuery ? 0 : Infinity,
    });
    return {
      pieces: query.data,
      isLoading: query.isLoading,
    };
  },
  useAllStepsMetadata: ({ searchQuery, type, enabled }: UseMetadataProps) => {
    const query = useQuery<StepMetadata[], Error>({
      queryKey: ['pieces-metadata', searchQuery, type],
      queryFn: async () => {
        const pieces = await piecesApi.list({
          searchQuery,
          suggestionType:
            type === 'action' ? SuggestionType.ACTION : SuggestionType.TRIGGER,
        });
        const piecesMetadata = pieces
          .filter(
            (piece) =>
              (type === 'action' && piece.actions > 0) ||
              (type === 'trigger' && piece.triggers > 0),
          )
          .map((piece) => piecesApi.mapToMetadata(type, piece));
        switch (type) {
          case 'action': {
            const filtersPrimitive = [
              PRIMITIVE_STEP_METADATA[ActionType.CODE],
              PRIMITIVE_STEP_METADATA[ActionType.LOOP_ON_ITEMS],
              PRIMITIVE_STEP_METADATA[ActionType.BRANCH],
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

function passSearch(
  searchQuery: string | undefined,
  data: PrimitiveStepMetadata,
) {
  if (!searchQuery) {
    return true;
  }
  return JSON.stringify({ data })
    .toLowerCase()
    .includes(searchQuery?.toLowerCase());
}
