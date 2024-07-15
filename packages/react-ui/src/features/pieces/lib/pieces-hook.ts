import { useQuery } from '@tanstack/react-query';

import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';

import { piecesApi } from './pieces-api';

type UsePieceProps = {
  name: string;
  version?: string;
};

type UsePiecesProps = {
  searchQuery?: string;
};

export const piecesHooks = {
  usePiece: ({ name, version }: UsePieceProps) => {
    return useQuery<PieceMetadataModelSummary, Error>({
      queryKey: ['piece', name, version],
      queryFn: () => piecesApi.get({ name, version }),
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
