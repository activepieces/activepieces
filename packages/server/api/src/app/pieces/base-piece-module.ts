import {
    FastifyPluginAsyncTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import {
    ALL_PRINCIPAL_TYPES,
    ApEdition,
    GetPieceRequestParams,
    GetPieceRequestQuery,
    GetPieceRequestWithScopeParams,
    ListPiecesRequestQuery,
    PieceCategory,
    PieceOptionRequest,
    PrincipalType,
} from '@activepieces/shared'
import { engineHelper } from '../helper/engine-helper'
import {
    getPiecePackage,
    pieceMetadataService,
} from './piece-metadata-service'
import { PieceMetadata } from '@activepieces/pieces-framework'
import { flagService } from '../flags/flag.service'
import {
    PieceMetadataModel,
    PieceMetadataModelSummary,
} from './piece-metadata-entity'
import { flowService } from '../flows/flow/flow.service'

export const pieceModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(basePiecesController, { prefix: '/v1/pieces' })
}

const basePiecesController: FastifyPluginAsyncTypebox = async (app) => {
    app.get(
        '/categories',
        {
            config: {
                allowedPrincipals: ALL_PRINCIPAL_TYPES,
            },
            schema: {
                querystring: ListPiecesRequestQuery,
            },
        },
        async (): Promise<PieceCategory[]> => {
            return Object.values(PieceCategory)
        },
    )

    app.get(
        '/',
        {
            config: {
                allowedPrincipals: ALL_PRINCIPAL_TYPES,
            },
            schema: {
                querystring: ListPiecesRequestQuery,

            },
        },
        async (req): Promise<PieceMetadataModelSummary[]> => {
            const latestRelease = await flagService.getCurrentRelease()
            const release = req.query.release ?? latestRelease
            const edition = req.query.edition ?? ApEdition.COMMUNITY
            const platformId = req.principal.type === PrincipalType.UNKNOWN ? undefined : req.principal.platform.id
            const pieceMetadataSummary = await pieceMetadataService.list({
                release,
                includeHidden: req.query.includeHidden ?? false,
                projectId: req.principal.projectId,
                platformId,
                edition,
                categories: req.query.categories,
                searchQuery: req.query.searchQuery,
                sortBy: req.query.sortBy,
                orderBy: req.query.orderBy,
                suggestionType: req.query.suggestionType,
            })
            return pieceMetadataSummary
        },
    )

    app.get(
        '/:scope/:name',
        {
            config: {
                allowedPrincipals: ALL_PRINCIPAL_TYPES,
            },
            schema: {
                params: GetPieceRequestWithScopeParams,
                querystring: GetPieceRequestQuery,
            },
        },
        async (req): Promise<PieceMetadata> => {
            const { name, scope } = req.params
            const { version } = req.query

            const decodeScope = decodeURIComponent(scope)
            const decodedName = decodeURIComponent(name)
            return pieceMetadataService.getOrThrow({
                projectId:
          req.principal.type === PrincipalType.UNKNOWN
              ? undefined
              : req.principal.projectId,
                name: `${decodeScope}/${decodedName}`,
                version,
            })
        },
    )

    app.get(
        '/:name',
        {
            config: {
                allowedPrincipals: ALL_PRINCIPAL_TYPES,
            },
            schema: {
                params: GetPieceRequestParams,
                querystring: GetPieceRequestQuery,
            },
        },
        async (req): Promise<PieceMetadataModel> => {
            const { name } = req.params
            const { version } = req.query

            const decodedName = decodeURIComponent(name)
            return pieceMetadataService.getOrThrow({
                projectId:
          req.principal.type === PrincipalType.UNKNOWN
              ? undefined
              : req.principal.projectId,
                name: decodedName,
                version,
            })
        },
    )

    app.post(
        '/options',
        {
            schema: {
                body: PieceOptionRequest,
            },
        },
        async (req) => {
            const {
                packageType,
                pieceType,
                pieceName,
                pieceVersion,
                propertyName,
                stepName,
                input,
                flowVersionId,
                flowId,
                searchValue,
            } = req.body
            const { projectId } = req.principal
            const flow = await flowService.getOnePopulatedOrThrow({
                projectId,
                id: flowId,
                versionId: flowVersionId,
            })
            const { result } = await engineHelper.executeProp({
                piece: await getPiecePackage(projectId, {
                    packageType,
                    pieceType,
                    pieceName,
                    pieceVersion,
                }),
                flowVersion: flow.version,
                propertyName,
                stepName,
                input,
                projectId,
                searchValue,
            })

            return result
        },
    )

    app.delete(
        '/:id',
        {
            schema: {
                params: Type.Object({
                    id: Type.String(),
                }),
            },
        },
        async (req): Promise<void> => {
            return pieceMetadataService.delete({
                projectId: req.principal.projectId,
                id: req.params.id,
            })
        },
    )
}
