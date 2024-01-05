import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { ALL_PRINICPAL_TYPES, ActivepiecesError, ApEdition, ErrorCode, GetPieceRequestParams, GetPieceRequestQuery, GetPieceRequestWithScopeParams, ListPiecesRequestQuery, PieceOptionRequest, PrincipalType } from '@activepieces/shared'
import { engineHelper } from '../helper/engine-helper'
import { system } from '../helper/system/system'
import { SystemProp } from '../helper/system/system-prop'
import { pieceMetadataService } from './piece-metadata-service'
import { PieceMetadata } from '@activepieces/pieces-framework'
import { flagService } from '../flags/flag.service'
import { PieceMetadataModel, PieceMetadataModelSummary } from './piece-metadata-entity'

export const pieceModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(basePiecesController, { prefix: '/v1/pieces' })
}

const statsEnabled = system.getBoolean(SystemProp.STATS_ENABLED)

const basePiecesController: FastifyPluginAsyncTypebox = async (app) => {

    app.get('/', {
        config: {
            allowedPrincipals: ALL_PRINICPAL_TYPES,
        },
        schema: {
            querystring: ListPiecesRequestQuery,
        },
    }, async (req): Promise<PieceMetadataModelSummary[]> => {
        const latestRelease = await flagService.getCurrentRelease()
        const release = req.query.release ?? latestRelease
        const edition = req.query.edition ?? ApEdition.COMMUNITY
        const pieceMetadataSummary = await pieceMetadataService.list({
            release,
            includeHidden: req.query.includeHidden ?? false,
            projectId: req.principal.projectId,
            platformId: req.principal.platform?.id,
            edition,
        })
        return pieceMetadataSummary
    })

    app.get('/:scope/:name', {
        config: {
            allowedPrincipals: ALL_PRINICPAL_TYPES,
        },
        schema: {
            params: GetPieceRequestWithScopeParams,
            querystring: GetPieceRequestQuery,
        },
    }, async (req): Promise<PieceMetadata> => {
        const { name, scope } = req.params
        const { version } = req.query

        const decodeScope = decodeURIComponent(scope)
        const decodedName = decodeURIComponent(name)
        return pieceMetadataService.getOrThrow({
            projectId: req.principal.type === PrincipalType.UNKNOWN ? undefined : req.principal.projectId,
            name: `${decodeScope}/${decodedName}`,
            version,
        })
    })

    app.get('/:name', {
        config: {
            allowedPrincipals: ALL_PRINICPAL_TYPES,
        },
        schema: {
            params: GetPieceRequestParams,
            querystring: GetPieceRequestQuery,
        },
    }, async (req): Promise<PieceMetadataModel> => {
        const { name } = req.params
        const { version } = req.query

        const decodedName = decodeURIComponent(name)
        return pieceMetadataService.getOrThrow({
            projectId: req.principal.projectId,
            name: decodedName,
            version,
        })
    })

    app.post('/options', {
        schema: {
            body: PieceOptionRequest,
        },
    }, async (req) => {
        const { packageType, pieceType, pieceName, pieceVersion, propertyName, stepName, input } = req.body
        const { projectId } = req.principal

        const { result } = await engineHelper.executeProp({
            piece: {
                packageType,
                pieceType,
                pieceName,
                pieceVersion,
            },
            propertyName,
            stepName,
            input,
            projectId,
        })

        return result
    })

    app.get('/stats', {
        config: {
            allowedPrincipals: ALL_PRINICPAL_TYPES,
        },
    }, async () => {
        if (!statsEnabled) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: 'not found',
                },
            })
        }

        return pieceMetadataService.stats()
    })

    app.delete('/:id', {
        schema: {
            params: Type.Object({
                id: Type.String(),
            }),
        },
    }, async (req): Promise<void> => {
        return pieceMetadataService.delete({
            projectId: req.principal.projectId,
            id: req.params.id,
        })
    })
}
