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
};
type Step = Action | Trigger;
type UseStepMetadata = {
  step: Step;
};
type UseStepsMetadata = Step[];

type UseMultiplePiecesProps = {
  names: string[];
};

type UsePiecesProps = {
  searchQuery?: string;
};

type PieceStepMetadata = {
  displayName: string;
  logoUrl: string;
  description: string;
  type: ActionType.PIECE | TriggerType.PIECE;
  pieceName: string;
};

type NonPieceStepMetadata = {
  displayName: string;
  logoUrl: string;
  description: string;
  type:
    | ActionType.BRANCH
    | ActionType.CODE
    | ActionType.LOOP_ON_ITEMS
    | TriggerType.EMPTY;
};

export type StepMetadata = NonPieceStepMetadata | PieceStepMetadata;

export const piecesHooks = {
  usePiece: ({ name, version }: UsePieceProps) => {
    return useQuery<PieceMetadataModel, Error>({
      queryKey: ['piece', name, version],
      queryFn: () => piecesApi.get({ name, version }),
      staleTime: Infinity,
    });
  },
  useStepMetadata: ({ step }: UseStepMetadata) => {
    return useQuery<StepMetadata, Error>(stepMetadataQueryBuilder(step));
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
    queryFn: () => getStepMetadata(step),
    staleTime: Infinity,
  };
}

async function getStepMetadata(step: Step): Promise<StepMetadata> {
  switch (step.type) {
    case ActionType.BRANCH:
      return {
        displayName: 'Branch',
        logoUrl: 'https://cdn.activepieces.com/pieces/branch.svg',
        description: 'Branch',
        type: step.type,
      };
    case ActionType.CODE:
      return {
        displayName: 'Code',
        logoUrl: 'https://cdn.activepieces.com/pieces/code.svg',
        description: 'Powerful nodejs & typescript code with npm',
        type: ActionType.CODE,
      };
    case ActionType.LOOP_ON_ITEMS:
      return {
        displayName: 'Loop on Items',
        logoUrl: 'https://cdn.activepieces.com/pieces/loop.svg',
        description: 'Iterate over a list of items',
        type: ActionType.LOOP_ON_ITEMS,
      };
    case TriggerType.EMPTY: {
      return {
        displayName: 'Empty Trigger',
        logoUrl: 'https://cdn.activepieces.com/pieces/empty-trigger.svg',
        description: 'Empty Trigger',
        type: TriggerType.EMPTY,
      };
    }
    case ActionType.PIECE:
    case TriggerType.PIECE: {
      const piece = await piecesApi.get({
        name: step.settings.pieceName,
        version: step.settings.pieceVersion,
      });
      return {
        displayName: piece.displayName,
        logoUrl: piece.logoUrl,
        description: piece.description,
        type: step.type,
        pieceName: step.settings.pieceName,
      };
    }
  }
}
