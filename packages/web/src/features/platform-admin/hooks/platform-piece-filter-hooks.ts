import {
  FilteredPieceBehavior,
  PlatformPieceFilter,
} from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';

import { platformPieceFilterApi } from '../api/platform-piece-filter-api';

const EMPTY_PIECE_FILTER: PlatformPieceFilter = {
  filteredPieceNames: [],
  filteredPieceBehavior: FilteredPieceBehavior.BLOCKED,
  filteredActionNames: {},
  filteredTriggerNames: {},
};

export const platformPieceFilterKeys = {
  all: ['platform-piece-filter'] as const,
};

export const platformPieceFilterQueries = {
  usePlatformPieceFilter: () => {
    const query = useQuery({
      queryKey: platformPieceFilterKeys.all,
      queryFn: () => platformPieceFilterApi.get(),
    });
    return {
      pieceFilter: query.data ?? EMPTY_PIECE_FILTER,
      isLoading: query.isLoading,
      refetch: query.refetch,
    };
  },
};
