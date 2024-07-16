import { api } from '@/lib/api';
import {
  PieceMetadataModel,
  PieceMetadataModelSummary,
} from '@activepieces/pieces-framework';
import {
  GetPieceRequestParams,
  GetPieceRequestQuery,
  ListPiecesRequestQuery,
} from '@activepieces/shared';

export const piecesApi = {
  list(request: ListPiecesRequestQuery): Promise<PieceMetadataModelSummary[]> {
    return api.get<PieceMetadataModelSummary[]>('/v1/pieces', request);
  },
  get(
    request: GetPieceRequestParams & GetPieceRequestQuery,
  ): Promise<PieceMetadataModel> {
    return api.get<PieceMetadataModel>(`/v1/pieces/${request.name}`, {
      version: request.version ?? undefined,
    });
  },
};
