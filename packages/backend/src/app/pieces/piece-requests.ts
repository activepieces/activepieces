import { Type } from '@fastify/type-provider-typebox'
import { GetPieceRequestParams, GetPieceRequestQuery, PieceOptionRequest, SemVerType } from '@activepieces/shared'

export const ListPiecesRequest = {
    schema: {
        querystring: Type.Object({
            release: SemVerType,
        }),
    },
}

export const GetPieceRequest = {
    schema: {
        params: GetPieceRequestParams,
        querystring: GetPieceRequestQuery,
    },
}

export const PieceOptionsRequest = {
    schema: {
        params: Type.Object({
            pieceName: Type.String(),
        }),
        body: PieceOptionRequest,
    },
}
