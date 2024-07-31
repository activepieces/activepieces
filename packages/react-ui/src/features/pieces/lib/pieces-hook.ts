import {
  PieceMetadataModel,
  PieceMetadataModelSummary,
} from '@activepieces/pieces-framework';
import { Action, ActionType, Trigger, TriggerType } from '@activepieces/shared';
import { useQueries, useQuery } from '@tanstack/react-query';

import { piecesApi } from './pieces-api';

type UsePieceProps = {
  name: string;
  version?: string;
};
type Step = Action | Trigger;
type UseStepMetadata = {
  step: Action | Trigger;
};
type UseStepsMetadata = Step[];

type UseMultiplePiecesProps = {
  names: string[];
};

type UsePiecesProps = {
  searchQuery?: string;
};

export type StepMetadata = {
  displayName: string;
  logoUrl: string;
  description: string;
  pieceName: string;
  pieceVersion: string;
  type: ActionType | TriggerType;
};
export const piecesHooks = {
  usePiece: ({ name, version }: UsePieceProps) => {
    return useQuery<PieceMetadataModel, Error>({
      queryKey: ['piece', name, version],
      queryFn: () => piecesApi.get({ name, version }),
      staleTime: Infinity,
    });
  },
  useStepMetadata: ({ step }: UseStepMetadata) => {
    return useQuery<StepMetadata, Error>(stepMetadataQueryBuilder({ step }));
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
    const queries = props.map((step) => stepMetadataQueryBuilder({ step }));
    return useQueries({
      queries,
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

function stepMetadataQueryBuilder({ step }: { step: Action | Trigger }) {
  const isPieceStep =
    step.type === ActionType.PIECE || step.type === TriggerType.PIECE;
  const pieceName = isPieceStep ? step.settings.pieceName : `${step.type}`;
  const pieceVersion = isPieceStep ? step.settings.pieceVersion : ``;
  const type = step.type;
  return {
    queryKey: ['piece', type, pieceName, pieceVersion],
    queryFn: async () => {
      const metadata = await getStepMetadata(type, pieceName, pieceVersion);
      return {
        ...metadata,
        type,
        pieceName,
        pieceVersion,
      };
    },
    staleTime: Infinity,
  };
}

async function getStepMetadata(
  type: ActionType | TriggerType,
  pieceName: string,
  pieceVersion: string,
): Promise<StepMetadata> {
  const metadataExtractor = async () => {
    switch (type) {
      case ActionType.BRANCH:
        return {
          displayName: 'Branch',
          logoUrl: 'https://cdn.activepieces.com/pieces/branch.svg',
          description: 'Branch',
        };
      case ActionType.CODE:
        return {
          displayName: 'Code',
          logoUrl: 'https://cdn.activepieces.com/pieces/code.svg',
          description: 'Powerful nodejs & typescript code with npm',
        };
      case ActionType.LOOP_ON_ITEMS:
        return {
          displayName: 'Loop on Items',
          logoUrl: 'https://cdn.activepieces.com/pieces/loop.svg',
          description: 'Iterate over a list of items',
        };
      case TriggerType.EMPTY:
        return {
          displayName: 'Empty Trigger',
          logoUrl: 'https://cdn.activepieces.com/pieces/empty-trigger.svg',
          description: 'Empty Trigger',
        };
      case ActionType.PIECE:
      case TriggerType.PIECE: {
        // TODO optmize the query and use cached version
        const piece = await piecesApi.get({
          name: pieceName,
          version: pieceVersion,
        });
        return {
          displayName: piece.displayName,
          logoUrl: piece.logoUrl,
          description: piece.description,
        };
      }
    }
  };
  return { ...(await metadataExtractor()), pieceName, pieceVersion, type };
}
