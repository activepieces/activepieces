import { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { GetPieceRequestParams, GetPieceRequestQuery, PieceOptionRequest } from '@activepieces/shared'
import { engineHelper } from '../helper/engine-helper'
import { pieceMetadataLoader } from './piece-metadata-loader'
import { pieceMetadataService } from '../../../../ee/private-pieces/piece-metadata.service'
import { PieceMetadata, PieceMetadataSummary, PublishPieceRequest } from '@activepieces/pieces-framework'
import { Type } from '@sinclair/typebox'

export const piecesController: FastifyPluginAsync = async (app) => {
    app.post(
        '/v1/pieces/:pieceName/options',
        {
            schema: {
                body: PieceOptionRequest,
            },
        },
        async (
            request: FastifyRequest<{
                Params: { pieceName: string }
                Body: PieceOptionRequest
            }>,
        ) => {
            return engineHelper.executeProp({
                pieceName: request.params.pieceName,
                pieceVersion: request.body.pieceVersion,
                propertyName: request.body.propertyName,
                stepName: request.body.stepName,
                input: request.body.input,
                projectId: request.principal.projectId,
            })
        },
    )

    app.get('/v1/pieces',
        {
            schema: {
                response: {
                    200: Type.Array(PieceMetadataSummary),
                },
            },
        }, async (request) => {
            return pieceMetadataLoader.manifest({ projectId: request.principal.projectId })
        })

    app.get(
        '/v1/pieces/:name',
        {
            schema: {
                params: GetPieceRequestParams,
                querystring: GetPieceRequestQuery,
                response: {
                    200: PieceMetadata,
                },
            },
        },
        async (
            request: FastifyRequest<{
                Params: GetPieceRequestParams
                Querystring: GetPieceRequestQuery
            }>,
        ) => {
            const { name } = request.params
            const { version } = request.query
            return pieceMetadataLoader.pieceMetadata(request.principal.projectId, name, version)
        },
    )

    app.post('/v1/pieces', {
        schema: {
            body: PublishPieceRequest,
        },
    }, async (request: FastifyRequest<{
        Body: PublishPieceRequest
    }>) => {
        return pieceMetadataService.save(request.principal.projectId, {
            metadata: JSON.parse(request.body.metadata),
            tarFile: request.body.tarFile[0],
        })
    })

    app.delete('/v1/pieces/:name', {
        schema: {
            params: GetPieceRequestParams,
        },
    }, async (request: FastifyRequest<{
        Params: GetPieceRequestParams
    }>) => {
        return pieceMetadataService.delete({
            projectId: request.principal.projectId,
            name: request.params.name,
        })
    })


}
