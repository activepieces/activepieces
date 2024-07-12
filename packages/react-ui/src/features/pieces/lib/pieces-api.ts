import { api } from "@/lib/api";
import { GetPieceRequestParams, GetPieceRequestQuery, ListPiecesRequestQuery } from "@activepieces/shared";
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';

export const piecesApi = {
    list(request: ListPiecesRequestQuery): Promise<PieceMetadataModelSummary[]> {
        return api.get<PieceMetadataModelSummary[]>('/v1/pieces', request);
    },
    get(request: GetPieceRequestParams & GetPieceRequestQuery): Promise<PieceMetadataModelSummary> {
        console.log(request);
        return api.get<PieceMetadataModelSummary>(`/v1/pieces/${request.name}`, {
            version: request.version ?? undefined
        });
    }
}