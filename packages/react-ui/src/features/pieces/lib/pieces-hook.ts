import { useQueries, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  PieceMetadataModel,
  PieceMetadataModelSummary,
} from '@activepieces/pieces-framework';
import { flowPieceUtil, LocalesEnum } from '@activepieces/shared';

import { piecesApi } from './pieces-api';

export const piecesHooks = {
  usePiece: ({ name, version, enabled = true }: UsePieceProps) => {
    const { i18n } = useTranslation();
    const query = useQuery<PieceMetadataModel, Error>({
      queryKey: ['piece', name, version],
      queryFn: () =>
        piecesApi.get({ name, version, locale: i18n.language as LocalesEnum }),
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
  useMostRecentAndExactPieceVersion: ({
    name,
    version,
    enabled = true,
  }: UsePieceAndMostRecentPatchProps) => {
    const exactVersion = version
      ? flowPieceUtil.getExactVersion(version)
      : undefined;
    const latestPatchVersion = exactVersion
      ? flowPieceUtil.getNextVersion(exactVersion)
      : undefined;
    const pieceQuery = piecesHooks.usePiece({
      name,
      version: exactVersion,
      enabled,
    });
    const latestPatchQuery = piecesHooks.usePiece({
      name,
      version: latestPatchVersion,
      enabled,
    });
    return {
      pieceModel: pieceQuery.pieceModel,
      isLoading: pieceQuery.isLoading || latestPatchQuery.isLoading,
      isSuccess: pieceQuery.isSuccess && latestPatchQuery.isSuccess,
      refetch: () => {
        pieceQuery.refetch();
        latestPatchQuery.refetch();
      },
    };
  },
  useMultiplePieces: ({ names }: UseMultiplePiecesProps) => {
    const { i18n } = useTranslation();
    return useQueries({
      queries: names.map((name) => ({
        queryKey: ['piece', name, undefined],
        queryFn: () =>
          piecesApi.get({
            name,
            version: undefined,
            locale: i18n.language as LocalesEnum,
          }),
        staleTime: Infinity,
      })),
    });
  },
  usePieces: ({
    searchQuery,
    includeHidden = false,
    includeTags = false,
  }: UsePiecesProps) => {
    const { i18n } = useTranslation();
    const query = useQuery<PieceMetadataModelSummary[], Error>({
      queryKey: ['pieces', searchQuery, includeHidden],
      queryFn: () =>
        piecesApi.list({
          searchQuery,
          includeHidden,
          includeTags,
          locale: i18n.language as LocalesEnum,
        }),
      staleTime: searchQuery ? 0 : Infinity,
    });
    return {
      pieces: query.data,
      isLoading: query.isLoading,
      refetch: query.refetch,
    };
  },
};

type UsePieceAndMostRecentPatchProps = {
  name: string;
  version: string | undefined;
  enabled?: boolean;
};

type UsePieceProps = {
  name: string;
  version?: string;
  enabled?: boolean;
};

type UseMultiplePiecesProps = {
  names: string[];
};

type UsePiecesProps = {
  searchQuery?: string;
  includeHidden?: boolean;
  includeTags?: boolean;
};
