import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { isNil, LocalesEnum, SuggestionType } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { piecesApi } from '@/features/pieces';

export const reachQueries = {
  useReachablePieces: (projectId: string | null) => {
    const { i18n } = useTranslation();
    const query = useQuery<PieceMetadataModelSummary[], Error>({
      queryKey: ['mcp-reach-pieces', projectId, i18n.language],
      queryFn: () =>
        piecesApi.list({
          projectId: projectId ?? undefined,
          suggestionType: SuggestionType.ACTION,
          locale: i18n.language as LocalesEnum,
        }),
      staleTime: Infinity,
      enabled: !isNil(projectId),
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
    });
    return { pieces: query.data, isLoading: query.isLoading };
  },
};
