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

type UseMultiplePiecesProps = {
  names: string[];
};

type UsePieceMetadata = {
  step: Action | Trigger;
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
    return useQuery<PieceMetadataModel, Error>({
      queryKey: ['piece', name, version],
      queryFn: () => piecesApi.get({ name, version }),
      staleTime: Infinity,
    });
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
  usePieceMetadata: ({ step }: UsePieceMetadata) => {
    const { type } = step;
    const pieceName = step.settings?.pieceName;
    const pieceVersion = step.settings?.pieceVersion;
    return useQuery<StepMetadata, Error>({
      queryKey: ['piece', type, pieceName, pieceVersion],
      queryFn: async () => {
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
      },
      staleTime: Infinity,
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
